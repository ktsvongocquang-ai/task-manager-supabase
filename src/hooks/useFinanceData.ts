import { useState, useCallback } from 'react';
import { supabase } from '../services/supabase';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export interface FinanceProject {
  id: string; name: string; status: string; progress: number;
  contract_value: number; customer_id: string | null; owner_name: string;
  accounting_sheet_url?: string | null;
}

export interface Customer {
  id: string; name: string; phone: string | null; address: string | null;
  customer_type: string | null; status: string | null;
  email: string | null; contact_person: string | null;
  note: string | null; created_at: string;
}

export interface Supplier {
  id: string; name: string; phone: string | null; address: string | null;
  supplier_type: string | null; status: string | null;
  note: string | null; created_at: string;
}

export interface Lookup { id: string; list_key: string; label: string; sort_order: number; }

export type PaymentStatus = 'unpaid' | 'partial' | 'paid';
export type LegacyPaymentType = 'payment_out' | 'payment_in';
export type LegacyPaymentStatus = 'confirmed' | 'pending';

export interface Expense {
  id: string; project_id: string; date: string;
  category: string | null; expense_type: string; description: string;
  supplier_id: string | null; supplier_name: string | null;
  amount: number; amount_paid: number; payment_status: PaymentStatus;
  receipt_photos: string[]; note: string | null; created_at: string;
}

export interface Income {
  id: string; project_id: string; customer_id: string | null; date: string;
  description: string | null; amount: number; payment_method: string;
  received_by: string | null; receipt_photos: string[]; note: string | null; created_at: string;
}

export interface FinanceMilestone {
  id: string; project_id: string; name: string; status: string;
  approved_date: string | null; payment_amount: number;
  payment_status: PaymentStatus | string; sort_order: number; sub_tasks: any[];
}

export interface LegacyPaymentRecord {
  id: string; project_id: string; date: string; description: string;
  amount: number; bill_photos: string[]; type: LegacyPaymentType;
  status: LegacyPaymentStatus | string; category: string | null; created_at: string;
}

export interface FinanceApproval {
  id: string; project_id: string; type: string; title: string;
  detail: string; status: 'pending' | 'approved' | 'rejected' | string;
  approved_by: string | null; created_at: string;
}

export interface ProjectFinance {
  contract: number; cost: number; supplierPaid: number; payable: number;
  income: number; debt: number; over: number; profit: number; cashflow: number;
}

export interface CashflowItem {
  id: string; project_id: string; date: string; desc: string;
  amount: number; type: 'in' | 'out'; source: 'milestone' | 'expense';
}

const EMPTY_FINANCE: ProjectFinance = { contract: 0, cost: 0, supplierPaid: 0, payable: 0, income: 0, debt: 0, over: 0, profit: 0, cashflow: 0 };
const todayStrForData = () => new Date().toISOString().slice(0, 10);

// Số tiền đã thanh toán tự set theo trạng thái — mirror normalizeFinanceRecord50_
// từ app tham khảo: unpaid -> 0, paid -> = amount, partial -> giữ giá trị nhập, clamp [0, amount].
const normalizeAmountPaid = (amount: number, status: PaymentStatus, rawPaid?: number): number => {
  if (status === 'paid') return amount;
  if (status === 'unpaid') return 0;
  const p = rawPaid ?? 0;
  return Math.max(0, Math.min(amount, p));
};

const textOrNull = (value: unknown): string | null => {
  if (typeof value !== 'string') return value == null ? null : String(value);
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const numberOrZero = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const pickDefined = <T extends Record<string, unknown>>(payload: T): Partial<T> =>
  Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined)) as Partial<T>;

const buildExpensePayload = (expense: Partial<Expense>) => {
  const amount = numberOrZero(expense.amount);
  const status = (expense.payment_status || 'unpaid') as PaymentStatus;
  return pickDefined({
    project_id: expense.project_id,
    date: expense.date,
    category: textOrNull(expense.category),
    expense_type: textOrNull(expense.expense_type) || 'Khác',
    description: textOrNull(expense.description) || '',
    supplier_id: textOrNull(expense.supplier_id),
    supplier_name: textOrNull(expense.supplier_name),
    amount,
    amount_paid: normalizeAmountPaid(amount, status, numberOrZero(expense.amount_paid)),
    payment_status: status,
    receipt_photos: expense.receipt_photos,
    note: textOrNull(expense.note),
  });
};

const buildExpenseUpdatePayload = (updates: Partial<Expense>, current?: Expense) => {
  const amount = numberOrZero(updates.amount ?? current?.amount);
  const status = (updates.payment_status ?? current?.payment_status ?? 'unpaid') as PaymentStatus;
  return pickDefined({
    project_id: updates.project_id,
    date: updates.date,
    category: updates.category === undefined ? undefined : textOrNull(updates.category),
    expense_type: updates.expense_type === undefined ? undefined : textOrNull(updates.expense_type) || 'Khác',
    description: updates.description === undefined ? undefined : textOrNull(updates.description) || '',
    supplier_id: updates.supplier_id === undefined ? undefined : textOrNull(updates.supplier_id),
    supplier_name: updates.supplier_name === undefined ? undefined : textOrNull(updates.supplier_name),
    amount: updates.amount === undefined ? undefined : amount,
    amount_paid: normalizeAmountPaid(amount, status, numberOrZero(updates.amount_paid ?? current?.amount_paid)),
    payment_status: status,
    receipt_photos: updates.receipt_photos,
    note: updates.note === undefined ? undefined : textOrNull(updates.note),
  });
};

const buildIncomePayload = (income: Partial<Income>, customerId: string | null) => pickDefined({
  project_id: income.project_id,
  customer_id: customerId,
  date: income.date,
  description: textOrNull(income.description),
  amount: numberOrZero(income.amount),
  payment_method: textOrNull(income.payment_method) || 'Tiền mặt',
  received_by: textOrNull(income.received_by),
  receipt_photos: income.receipt_photos,
  note: textOrNull(income.note),
});

const proposalMeta = (detail: string) => {
  const amountMatch = detail.match(/FINANCE_PROPOSAL_AMOUNT=(\d+)/);
  const categoryMatch = detail.match(/FINANCE_PROPOSAL_CATEGORY=([^\n]+)/);
  const cleanDetail = detail
    .replace(/\n?FINANCE_PROPOSAL_AMOUNT=\d+/g, '')
    .replace(/\n?FINANCE_PROPOSAL_CATEGORY=[^\n]+/g, '')
    .trim();
  return {
    amount: amountMatch ? Number(amountMatch[1]) : 0,
    category: categoryMatch ? categoryMatch[1].trim() : 'Phát sinh',
    detail: cleanDetail,
  };
};

export const useFinanceData = () => {
  const [projects, setProjects] = useState<FinanceProject[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [lookups, setLookups] = useState<Lookup[]>([]);
  const [projectCategories, setProjectCategories] = useState<Record<string, string[]>>({});
  const [milestones, setMilestones] = useState<FinanceMilestone[]>([]);
  const [paymentRecords, setPaymentRecords] = useState<LegacyPaymentRecord[]>([]);
  const [approvals, setApprovals] = useState<FinanceApproval[]>([]);
  const [loading, setLoading] = useState(false);

  // ── LOAD EVERYTHING (company-wide, no per-project scoping) ──
  const loadAll = useCallback(async () => {
    setLoading(true);
    const [projectsRes, customersRes, expensesRes, incomesRes, tasksRes, suppliersRes, lookupsRes, milestonesRes, paymentRecordsRes, approvalsRes] = await Promise.all([
      supabase.from('construction_projects').select('id,name,status,progress,contract_value,customer_id,owner_name,accounting_sheet_url').order('created_at', { ascending: false }),
      supabase.from('customers').select('*').order('name'),
      supabase.from('construction_expenses').select('*').order('date', { ascending: false }),
      supabase.from('construction_incomes').select('*').order('date', { ascending: false }),
      supabase.from('construction_tasks').select('project_id,category'),
      supabase.from('suppliers').select('*').order('name'),
      supabase.from('finance_lookups').select('*').order('sort_order'),
      supabase.from('construction_milestones').select('*').order('sort_order'),
      supabase.from('construction_payment_records').select('*').order('date', { ascending: false }),
      supabase.from('construction_approvals').select('*').in('type', ['budget_alert', 'variation']).order('created_at', { ascending: false }),
    ]);
    if (projectsRes.data) setProjects(projectsRes.data as FinanceProject[]);
    if (customersRes.data) setCustomers(customersRes.data as Customer[]);
    if (expensesRes.data) setExpenses(expensesRes.data as Expense[]);
    if (incomesRes.data) setIncomes(incomesRes.data as Income[]);
    if (suppliersRes.data) setSuppliers(suppliersRes.data as Supplier[]);
    if (lookupsRes.data) setLookups(lookupsRes.data as Lookup[]);
    if (milestonesRes.data) setMilestones(milestonesRes.data as FinanceMilestone[]);
    if (paymentRecordsRes.data) setPaymentRecords(paymentRecordsRes.data as LegacyPaymentRecord[]);
    if (approvalsRes.data) setApprovals(approvalsRes.data as FinanceApproval[]);
    if (tasksRes.data) {
      const byProject: Record<string, Set<string>> = {};
      tasksRes.data.forEach((t: any) => {
        if (!t.category) return;
        (byProject[t.project_id] ||= new Set()).add(t.category);
      });
      const result: Record<string, string[]> = {};
      Object.entries(byProject).forEach(([pid, cats]) => { result[pid] = Array.from(cats); });
      setProjectCategories(result);
    }
    setLoading(false);
  }, []);

  // ── LOOKUPS (Danh mục cấu hình) ──
  const getLookupLabels = useCallback((listKey: string): string[] =>
    lookups.filter(l => l.list_key === listKey).map(l => l.label)
  , [lookups]);

  const createLookup = async (listKey: string, label: string) => {
    if (!label.trim()) return null;
    const maxOrder = Math.max(0, ...lookups.filter(l => l.list_key === listKey).map(l => l.sort_order));
    const { data, error } = await supabase.from('finance_lookups').insert([{ list_key: listKey, label: label.trim(), sort_order: maxOrder + 1 }]).select().single();
    if (error) { console.error('Create lookup error:', error); return null; }
    if (data) setLookups(prev => [...prev, data as Lookup]);
    return data?.id as string;
  };

  const updateLookup = async (id: string, label: string) => {
    const { error } = await supabase.from('finance_lookups').update({ label }).eq('id', id);
    if (!error) setLookups(prev => prev.map(l => l.id === id ? { ...l, label } : l));
    return !error;
  };

  const deleteLookup = async (id: string) => {
    const { error } = await supabase.from('finance_lookups').delete().eq('id', id);
    if (!error) setLookups(prev => prev.filter(l => l.id !== id));
    return !error;
  };

  // ── CUSTOMERS ──
  const createCustomer = async (customer: Partial<Customer>) => {
    const { data, error } = await supabase.from('customers').insert([customer]).select().single();
    if (error) { console.error('Create customer error:', error); return null; }
    if (data) setCustomers(prev => [...prev, data as Customer].sort((a, b) => a.name.localeCompare(b.name)));
    return data?.id as string;
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    const { error } = await supabase.from('customers').update(updates).eq('id', id);
    if (!error) setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    return !error;
  };

  const deleteCustomer = async (id: string) => {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (!error) setCustomers(prev => prev.filter(c => c.id !== id));
    return !error;
  };

  // ── SUPPLIERS (Nhà cung cấp) ──
  const createSupplier = async (supplier: Partial<Supplier>) => {
    const { data, error } = await supabase.from('suppliers').insert([supplier]).select().single();
    if (error) { console.error('Create supplier error:', error); return null; }
    if (data) setSuppliers(prev => [...prev, data as Supplier].sort((a, b) => a.name.localeCompare(b.name)));
    return data?.id as string;
  };

  const updateSupplier = async (id: string, updates: Partial<Supplier>) => {
    const { error } = await supabase.from('suppliers').update(updates).eq('id', id);
    if (!error) setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    return !error;
  };

  const deleteSupplier = async (id: string) => {
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (!error) setSuppliers(prev => prev.filter(s => s.id !== id));
    return !error;
  };

  // ── EXPENSES (Chi phí) ──
  const createExpense = async (expense: Partial<Expense> & { amount: number; payment_status: PaymentStatus; date: string; project_id: string; description: string }) => {
    const payload = buildExpensePayload(expense);
    const { data, error } = await supabase.from('construction_expenses').insert([payload]).select().single();
    if (error) { console.error('Create expense error:', error); return null; }
    if (data) setExpenses(prev => [data as Expense, ...prev]);
    return data?.id as string;
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    const current = expenses.find(e => e.id === id);
    const payload = buildExpenseUpdatePayload(updates, current);
    const { error } = await supabase.from('construction_expenses').update(payload).eq('id', id);
    if (!error) setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...payload } : e));
    return !error;
  };

  const deleteExpense = async (id: string) => {
    const { error } = await supabase.from('construction_expenses').delete().eq('id', id);
    if (!error) setExpenses(prev => prev.filter(e => e.id !== id));
    return !error;
  };

  const bulkCreateExpenses = async (rows: Array<Partial<Expense> & { amount: number; payment_status: PaymentStatus; date: string; project_id: string; description: string }>) => {
    const payloads = rows.map(buildExpensePayload);
    const { data, error } = await supabase.from('construction_expenses').insert(payloads).select();
    if (error) { console.error('Bulk create expenses error:', error); return 0; }
    if (data) setExpenses(prev => [...(data as Expense[]), ...prev]);
    return data?.length || 0;
  };

  // ── INCOMES (Thu tiền) ──
  const createIncome = async (income: Partial<Income> & { amount: number; date: string; project_id: string }) => {
    let customerId = income.customer_id;
    if (!customerId) {
      const project = projects.find(p => p.id === income.project_id);
      customerId = project?.customer_id ?? null;
    }
    const payload = buildIncomePayload(income, customerId);
    const { data, error } = await supabase.from('construction_incomes').insert([payload]).select().single();
    if (error) { console.error('Create income error:', error); return null; }
    if (data) setIncomes(prev => [data as Income, ...prev]);
    return data?.id as string;
  };

  const updateIncome = async (id: string, updates: Partial<Income>) => {
    const current = incomes.find(i => i.id === id);
    let customerId = updates.customer_id ?? current?.customer_id ?? null;
    if (!customerId && (updates.project_id || current?.project_id)) {
      customerId = projects.find(p => p.id === (updates.project_id || current?.project_id))?.customer_id ?? null;
    }
    const payload = buildIncomePayload({ ...current, ...updates }, customerId);
    const { error } = await supabase.from('construction_incomes').update(payload).eq('id', id);
    if (!error) setIncomes(prev => prev.map(i => i.id === id ? { ...i, ...payload } : i));
    return !error;
  };

  const deleteIncome = async (id: string) => {
    const { error } = await supabase.from('construction_incomes').delete().eq('id', id);
    if (!error) setIncomes(prev => prev.filter(i => i.id !== id));
    return !error;
  };

  const bulkCreateIncomes = async (rows: Array<Partial<Income> & { amount: number; date: string; project_id: string }>) => {
    const payloads = rows.map(r => {
      let customerId = r.customer_id;
      if (!customerId) customerId = projects.find(p => p.id === r.project_id)?.customer_id ?? null;
      return buildIncomePayload(r, customerId);
    });
    const { data, error } = await supabase.from('construction_incomes').insert(payloads).select();
    if (error) { console.error('Bulk create incomes error:', error); return 0; }
    if (data) setIncomes(prev => [...(data as Income[]), ...prev]);
    return data?.length || 0;
  };

  // ── MILESTONE + LEGACY PAYMENT RECORD SYNC ──
  const createIncomeFromMilestone = async (milestoneId: string) => {
    const milestone = milestones.find(m => m.id === milestoneId);
    if (!milestone || !milestone.project_id || !milestone.payment_amount) return null;
    const project = projects.find(p => p.id === milestone.project_id);
    const existing = incomes.find(i =>
      i.project_id === milestone.project_id &&
      i.amount === milestone.payment_amount &&
      (i.description || '').includes(milestone.name)
    );
    let incomeId = existing?.id || null;
    if (!incomeId) {
      incomeId = await createIncome({
        project_id: milestone.project_id,
        customer_id: project?.customer_id ?? null,
        date: milestone.approved_date || todayStrForData(),
        description: `Thu theo mốc: ${milestone.name}`,
        amount: milestone.payment_amount,
        payment_method: 'Chuyển khoản',
        note: 'Tạo từ mốc nghiệm thu trong module Tài chính',
      } as any);
    }
    const { error } = await supabase.from('construction_milestones').update({ payment_status: 'paid' }).eq('id', milestone.id);
    if (!error) setMilestones(prev => prev.map(m => m.id === milestone.id ? { ...m, payment_status: 'paid' } : m));
    return incomeId;
  };

  const syncLegacyPaymentRecords = async () => {
    let createdExpenses = 0;
    let createdIncomes = 0;

    const expenseRows = paymentRecords.filter(r =>
      r.type === 'payment_out' &&
      !expenses.some(e => e.project_id === r.project_id && e.date === r.date && e.amount === r.amount && e.description === r.description)
    );
    const incomeRows = paymentRecords.filter(r =>
      r.type === 'payment_in' &&
      !incomes.some(i => i.project_id === r.project_id && i.date === r.date && i.amount === r.amount && (i.description || '') === r.description)
    );

    if (expenseRows.length > 0) {
      createdExpenses = await bulkCreateExpenses(expenseRows.map(r => ({
        project_id: r.project_id,
        date: r.date,
        category: r.category,
        expense_type: r.category || 'Khác',
        description: r.description,
        amount: r.amount,
        amount_paid: r.status === 'confirmed' ? r.amount : 0,
        payment_status: r.status === 'confirmed' ? 'paid' : 'unpaid',
        receipt_photos: r.bill_photos || [],
        note: `Đồng bộ từ lịch sử thu/chi cũ (${r.id})`,
      } as any)));
    }

    if (incomeRows.length > 0) {
      createdIncomes = await bulkCreateIncomes(incomeRows.map(r => ({
        project_id: r.project_id,
        date: r.date,
        description: r.description,
        amount: r.amount,
        payment_method: 'Chuyển khoản',
        receipt_photos: r.bill_photos || [],
        note: `Đồng bộ từ lịch sử thu/chi cũ (${r.id})`,
      } as any)));
    }

    return { createdExpenses, createdIncomes };
  };

  const updateFinanceApproval = async (approvalId: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('construction_approvals')
      .update({ status })
      .eq('id', approvalId);
    if (!error) setApprovals(prev => prev.map(a => a.id === approvalId ? { ...a, status } : a));
    return !error;
  };

  const approveFinanceProposal = async (approvalId: string) => {
    const approval = approvals.find(a => a.id === approvalId);
    if (!approval) return false;
    const meta = proposalMeta(approval.detail || '');
    const existing = expenses.some(e =>
      e.project_id === approval.project_id &&
      e.description === approval.title &&
      (e.note || '').includes(`Đề xuất ${approval.id}`)
    );
    if (!existing && meta.amount > 0) {
      const created = await createExpense({
        project_id: approval.project_id,
        date: todayStrForData(),
        category: meta.category,
        expense_type: meta.category,
        description: approval.title,
        amount: meta.amount,
        amount_paid: 0,
        payment_status: 'unpaid',
        note: `${meta.detail}\nĐề xuất ${approval.id} đã được duyệt.`,
      } as any);
      if (!created) return false;
    }
    return updateFinanceApproval(approvalId, 'approved');
  };

  const createExpenseProposal = async (projectId: string, title: string, detail: string, amount = 0, category = 'Phát sinh') => {
    const { data, error } = await supabase
      .from('construction_approvals')
      .insert([{
        project_id: projectId,
        type: 'budget_alert',
        title,
        detail: `${detail.trim()}\nFINANCE_PROPOSAL_AMOUNT=${Math.max(0, Math.round(amount))}\nFINANCE_PROPOSAL_CATEGORY=${category}`,
        status: 'pending',
      }])
      .select()
      .single();
    if (!error && data) setApprovals(prev => [data as FinanceApproval, ...prev]);
    return !error;
  };

  // ── ROLLUPS (mirror projectFinance50 from the reference app) ──
  const getProjectFinance = useCallback((projectId: string): ProjectFinance => {
    const project = projects.find(p => p.id === projectId);
    const projExpenses = expenses.filter(e => e.project_id === projectId);
    const projIncomes = incomes.filter(i => i.project_id === projectId);
    const contract = project?.contract_value || 0;
    const cost = projExpenses.reduce((s, e) => s + (e.amount || 0), 0);
    const supplierPaid = projExpenses.reduce((s, e) => s + (e.amount_paid || 0), 0);
    const income = projIncomes.reduce((s, i) => s + (i.amount || 0), 0);
    return {
      contract, cost, supplierPaid,
      payable: Math.max(0, cost - supplierPaid),
      income,
      debt: Math.max(0, contract - income),
      over: Math.max(0, income - contract),
      profit: contract - cost,
      cashflow: income - supplierPaid,
    };
  }, [projects, expenses, incomes]);

  const sumFinance = (list: ProjectFinance[]): ProjectFinance => list.reduce((acc, f) => ({
    contract: acc.contract + f.contract, cost: acc.cost + f.cost,
    supplierPaid: acc.supplierPaid + f.supplierPaid, payable: acc.payable + f.payable,
    income: acc.income + f.income, debt: acc.debt + f.debt, over: acc.over + f.over,
    profit: acc.profit + f.profit, cashflow: acc.cashflow + f.cashflow,
  }), { ...EMPTY_FINANCE });

  const getCustomerFinance = useCallback((customerId: string): ProjectFinance =>
    sumFinance(projects.filter(p => p.customer_id === customerId).map(p => getProjectFinance(p.id)))
  , [projects, getProjectFinance]);

  const getCompanyFinance = useCallback((): ProjectFinance =>
    sumFinance(projects.map(p => getProjectFinance(p.id)))
  , [projects, getProjectFinance]);

  const getSupplierFinance = useCallback((supplierId: string) => {
    const supplierExpenses = expenses.filter(e => e.supplier_id === supplierId);
    const cost = supplierExpenses.reduce((s, e) => s + (e.amount || 0), 0);
    const paid = supplierExpenses.reduce((s, e) => s + (e.amount_paid || 0), 0);
    return { cost, paid, payable: Math.max(0, cost - paid) };
  }, [expenses]);

  const getProjectMilestones = useCallback((projectId: string) =>
    milestones.filter(m => m.project_id === projectId).sort((a, b) => a.sort_order - b.sort_order)
  , [milestones]);

  const getUpcomingCashflow = useCallback((days = 30): CashflowItem[] => {
    const today = todayStrForData();
    const limit = new Date();
    limit.setDate(limit.getDate() + days);
    const limitStr = limit.toISOString().slice(0, 10);

    const milestoneItems = milestones
      .filter(m => m.payment_status !== 'paid' && (m.payment_amount || 0) > 0)
      .map(m => ({
        id: m.id,
        project_id: m.project_id,
        date: m.approved_date || today,
        desc: `Thu mốc nghiệm thu: ${m.name}`,
        amount: m.payment_amount || 0,
        type: 'in' as const,
        source: 'milestone' as const,
      }));

    const payableItems = expenses
      .filter(e => (e.amount || 0) > (e.amount_paid || 0))
      .map(e => ({
        id: e.id,
        project_id: e.project_id,
        date: e.date || today,
        desc: `Phải trả NCC: ${e.description}`,
        amount: Math.max(0, (e.amount || 0) - (e.amount_paid || 0)),
        type: 'out' as const,
        source: 'expense' as const,
      }));

    return [...milestoneItems, ...payableItems]
      .filter(i => i.date <= limitStr)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 20);
  }, [milestones, expenses]);

  const getUnsyncedPaymentRecords = useCallback(() => paymentRecords.filter(r => {
    if (r.type === 'payment_out') {
      return !expenses.some(e => e.project_id === r.project_id && e.date === r.date && e.amount === r.amount && e.description === r.description);
    }
    return !incomes.some(i => i.project_id === r.project_id && i.date === r.date && i.amount === r.amount && (i.description || '') === r.description);
  }), [paymentRecords, expenses, incomes]);

  return {
    projects, customers, expenses, incomes, suppliers, lookups, projectCategories,
    milestones, paymentRecords, approvals, loading,
    loadAll,
    getLookupLabels, createLookup, updateLookup, deleteLookup,
    createCustomer, updateCustomer, deleteCustomer,
    createSupplier, updateSupplier, deleteSupplier,
    createExpense, updateExpense, deleteExpense, bulkCreateExpenses,
    createIncome, updateIncome, deleteIncome, bulkCreateIncomes,
    createIncomeFromMilestone, syncLegacyPaymentRecords,
    updateFinanceApproval, approveFinanceProposal, createExpenseProposal,
    getProjectFinance, getCustomerFinance, getCompanyFinance, getSupplierFinance,
    getProjectMilestones, getUpcomingCashflow, getUnsyncedPaymentRecords,
  };
};
