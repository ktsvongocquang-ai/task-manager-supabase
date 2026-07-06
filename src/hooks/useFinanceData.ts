import { useState, useCallback } from 'react';
import { supabase } from '../services/supabase';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export interface FinanceProject {
  id: string; name: string; status: string; progress: number;
  contract_value: number; customer_id: string | null; owner_name: string;
}

export interface Customer {
  id: string; name: string; phone: string | null; address: string | null;
  customer_type: string | null; status: string | null;
  note: string | null; created_at: string;
}

export interface Supplier {
  id: string; name: string; phone: string | null; address: string | null;
  supplier_type: string | null; status: string | null;
  note: string | null; created_at: string;
}

export interface Lookup { id: string; list_key: string; label: string; sort_order: number; }

export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

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

export interface ProjectFinance {
  contract: number; cost: number; supplierPaid: number; payable: number;
  income: number; debt: number; over: number; profit: number; cashflow: number;
}

const EMPTY_FINANCE: ProjectFinance = { contract: 0, cost: 0, supplierPaid: 0, payable: 0, income: 0, debt: 0, over: 0, profit: 0, cashflow: 0 };

// Số tiền đã thanh toán tự set theo trạng thái — mirror normalizeFinanceRecord50_
// từ app tham khảo: unpaid -> 0, paid -> = amount, partial -> giữ giá trị nhập, clamp [0, amount].
const normalizeAmountPaid = (amount: number, status: PaymentStatus, rawPaid?: number): number => {
  if (status === 'paid') return amount;
  if (status === 'unpaid') return 0;
  const p = rawPaid ?? 0;
  return Math.max(0, Math.min(amount, p));
};

export const useFinanceData = () => {
  const [projects, setProjects] = useState<FinanceProject[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [lookups, setLookups] = useState<Lookup[]>([]);
  const [projectCategories, setProjectCategories] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  // ── LOAD EVERYTHING (company-wide, no per-project scoping) ──
  const loadAll = useCallback(async () => {
    setLoading(true);
    const [projectsRes, customersRes, expensesRes, incomesRes, tasksRes, suppliersRes, lookupsRes] = await Promise.all([
      supabase.from('construction_projects').select('id,name,status,progress,contract_value,customer_id,owner_name').order('created_at', { ascending: false }),
      supabase.from('customers').select('*').order('name'),
      supabase.from('construction_expenses').select('*').order('date', { ascending: false }),
      supabase.from('construction_incomes').select('*').order('date', { ascending: false }),
      supabase.from('construction_tasks').select('project_id,category'),
      supabase.from('suppliers').select('*').order('name'),
      supabase.from('finance_lookups').select('*').order('sort_order'),
    ]);
    if (projectsRes.data) setProjects(projectsRes.data as FinanceProject[]);
    if (customersRes.data) setCustomers(customersRes.data as Customer[]);
    if (expensesRes.data) setExpenses(expensesRes.data as Expense[]);
    if (incomesRes.data) setIncomes(incomesRes.data as Income[]);
    if (suppliersRes.data) setSuppliers(suppliersRes.data as Supplier[]);
    if (lookupsRes.data) setLookups(lookupsRes.data as Lookup[]);
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
    const payload = { ...expense, amount_paid: normalizeAmountPaid(expense.amount, expense.payment_status, expense.amount_paid) };
    const { data, error } = await supabase.from('construction_expenses').insert([payload]).select().single();
    if (error) { console.error('Create expense error:', error); return null; }
    if (data) setExpenses(prev => [data as Expense, ...prev]);
    return data?.id as string;
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    const current = expenses.find(e => e.id === id);
    const amount = updates.amount ?? current?.amount ?? 0;
    const status = (updates.payment_status ?? current?.payment_status ?? 'unpaid') as PaymentStatus;
    const payload = { ...updates, amount_paid: normalizeAmountPaid(amount, status, updates.amount_paid ?? current?.amount_paid) };
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
    const payloads = rows.map(r => ({ ...r, amount_paid: normalizeAmountPaid(r.amount, r.payment_status, r.amount_paid) }));
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
    const payload = { ...income, customer_id: customerId };
    const { data, error } = await supabase.from('construction_incomes').insert([payload]).select().single();
    if (error) { console.error('Create income error:', error); return null; }
    if (data) setIncomes(prev => [data as Income, ...prev]);
    return data?.id as string;
  };

  const updateIncome = async (id: string, updates: Partial<Income>) => {
    const { error } = await supabase.from('construction_incomes').update(updates).eq('id', id);
    if (!error) setIncomes(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
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
      return { ...r, customer_id: customerId };
    });
    const { data, error } = await supabase.from('construction_incomes').insert(payloads).select();
    if (error) { console.error('Bulk create incomes error:', error); return 0; }
    if (data) setIncomes(prev => [...(data as Income[]), ...prev]);
    return data?.length || 0;
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

  return {
    projects, customers, expenses, incomes, suppliers, lookups, projectCategories, loading,
    loadAll,
    getLookupLabels, createLookup, updateLookup, deleteLookup,
    createCustomer, updateCustomer, deleteCustomer,
    createSupplier, updateSupplier, deleteSupplier,
    createExpense, updateExpense, deleteExpense, bulkCreateExpenses,
    createIncome, updateIncome, deleteIncome, bulkCreateIncomes,
    getProjectFinance, getCustomerFinance, getCompanyFinance, getSupplierFinance,
  };
};
