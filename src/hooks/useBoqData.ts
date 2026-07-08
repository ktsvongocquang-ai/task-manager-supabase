import { useState, useCallback } from 'react';
import { supabase } from '../services/supabase';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

export type BoqRowType = 'group' | 'subgroup' | 'item';

export interface BoqItem {
  id: string;
  project_id: string;
  item_code: string;
  parent_item_id: string | null;
  level: number;
  row_type: BoqRowType;
  item_name: string;
  unit: string | null;
  estimated_quantity: number | null;
  quoted_unit_price: number | null;
  supplier_id: string | null;
  document_status: string;
  invoice_status: string;
  note: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// Computed rollup — never stored, always derived from linked construction_expenses
// (contract_amount from estimated_quantity*quoted_unit_price; actual figures summed
// recursively from expenses.boq_item_id, per the "no dead numbers" principle).
export interface BoqNode extends BoqItem {
  children: BoqNode[];
  contractAmount: number;
  actualCostExVat: number;
  vatAmount: number;
  actualCostIncVat: number;
  paidAmount: number;
  payableAmount: number;
  variance: number;
  pctSpent: number;
}

interface LinkedExpense {
  amount: number | null;
  amount_ex_vat: number | null;
  vat_amount: number | null;
  amount_paid: number | null;
}

// ═══════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════

export const useBoqData = () => {
  const [boqItems, setBoqItems] = useState<BoqItem[]>([]);
  const [expensesByBoq, setExpensesByBoq] = useState<Record<string, LinkedExpense[]>>({});
  const [loading, setLoading] = useState(false);

  // This hook instance is shared by both the BOQ tab and the Expense form
  // (so the expense form can offer a per-project BOQ item picker) — loading
  // one project's items must not evict another project's already-loaded rows,
  // or switching projects in one place would make the other place's BOQ tab
  // appear to have lost its data. Merge by project instead of replacing.
  const loadBoqItems = useCallback(async (projectId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('project_boq_items')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order', { ascending: true });
    if (!error && data) {
      setBoqItems(prev => [...prev.filter(b => b.project_id !== projectId), ...(data as BoqItem[])]);
    }

    // Phase 1: construction_expenses.boq_item_id isn't populated by most UI yet
    // (Phase 2's "Chi phí thực tế" flow) — resolves empty until an expense is
    // linked, but the rollup math below is correct and ready for when it isn't.
    const { data: exp } = await supabase
      .from('construction_expenses')
      .select('boq_item_id, amount, amount_ex_vat, vat_amount, amount_paid')
      .eq('project_id', projectId)
      .not('boq_item_id', 'is', null);
    const grouped: Record<string, LinkedExpense[]> = {};
    (exp || []).forEach((e: any) => {
      if (!e.boq_item_id) return;
      (grouped[e.boq_item_id] ||= []).push(e);
    });
    setExpensesByBoq(prev => ({ ...prev, ...grouped }));
    setLoading(false);
  }, []);

  const nextChildCode = (parentCode: string | null, siblingsCount: number) => {
    if (!parentCode) return String.fromCharCode(65 + siblingsCount); // A, B, C...
    return `${parentCode}.${siblingsCount + 1}`;
  };

  const createBoqItem = async (
    payload: Partial<BoqItem> & { project_id: string; row_type: BoqRowType; item_code: string; item_name: string; level: number }
  ): Promise<BoqItem | null> => {
    const { data, error } = await supabase.from('project_boq_items').insert([payload]).select().single();
    if (error) { console.error('[createBoqItem] error:', error); return null; }
    setBoqItems(prev => [...prev, data as BoqItem]);
    return data as BoqItem;
  };

  const createBoqGroup = (projectId: string, name: string) => {
    const groups = boqItems.filter(b => b.project_id === projectId && b.row_type === 'group' && !b.parent_item_id);
    const code = nextChildCode(null, groups.length);
    return createBoqItem({ project_id: projectId, row_type: 'group', level: 0, item_code: code, item_name: name, parent_item_id: null });
  };

  const createBoqSubgroup = (projectId: string, parent: BoqItem, name: string) => {
    const siblings = boqItems.filter(b => b.parent_item_id === parent.id && b.row_type === 'subgroup');
    const code = nextChildCode(parent.item_code, siblings.length);
    return createBoqItem({ project_id: projectId, row_type: 'subgroup', level: parent.level + 1, item_code: code, item_name: name, parent_item_id: parent.id });
  };

  const createBoqItemRow = (projectId: string, parent: BoqItem, fields: Partial<BoqItem> = {}) => {
    const siblings = boqItems.filter(b => b.parent_item_id === parent.id && b.row_type === 'item');
    const code = nextChildCode(parent.item_code, siblings.length);
    return createBoqItem({
      project_id: projectId, row_type: 'item', level: parent.level + 1, item_code: code,
      item_name: '', parent_item_id: parent.id, ...fields,
    });
  };

  const updateBoqItem = async (id: string, updates: Partial<BoqItem>): Promise<boolean> => {
    const payload = { ...updates, updated_at: new Date().toISOString() };
    const { error } = await supabase.from('project_boq_items').update(payload).eq('id', id);
    if (error) { console.error('[updateBoqItem] error:', error); return false; }
    setBoqItems(prev => prev.map(b => b.id === id ? { ...b, ...payload } : b));
    return true;
  };

  const deleteBoqItem = async (id: string): Promise<{ success: boolean; error?: string }> => {
    const hasChildren = boqItems.some(b => b.parent_item_id === id);
    if (hasChildren) return { success: false, error: 'Còn dòng con bên dưới — xoá các dòng con trước.' };
    const { error } = await supabase.from('project_boq_items').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    setBoqItems(prev => prev.filter(b => b.id !== id));
    return { success: true };
  };

  // Builds a nested tree from the flat boqItems list and computes contract/actual
  // rollups recursively — group/subgroup rows always aggregate from their
  // children, never store their own contract/actual figures (matches "dòng
  // group/subgroup tự cộng số tiền từ dòng con, không cho nhập tay").
  const getBoqTree = useCallback((projectId: string): BoqNode[] => {
    const items = boqItems.filter(b => b.project_id === projectId);
    const byParent: Record<string, BoqItem[]> = {};
    items.forEach(it => {
      const key = it.parent_item_id || 'root';
      (byParent[key] ||= []).push(it);
    });
    Object.values(byParent).forEach(list =>
      list.sort((a, b) => a.sort_order - b.sort_order || a.item_code.localeCompare(b.item_code))
    );

    const computeNode = (item: BoqItem): BoqNode => {
      const childItems = byParent[item.id] || [];
      const children = childItems.map(computeNode);
      const linkedExpenses = expensesByBoq[item.id] || [];

      let contractAmount: number;
      let actualCostExVat: number;
      let vatAmount: number;
      let paidAmount: number;

      if (item.row_type === 'item') {
        contractAmount = (item.estimated_quantity || 0) * (item.quoted_unit_price || 0);
        actualCostExVat = linkedExpenses.reduce((s, e) => s + (e.amount_ex_vat ?? e.amount ?? 0), 0);
        vatAmount = linkedExpenses.reduce((s, e) => s + (e.vat_amount || 0), 0);
        paidAmount = linkedExpenses.reduce((s, e) => s + (e.amount_paid || 0), 0);
      } else {
        contractAmount = children.reduce((s, c) => s + c.contractAmount, 0);
        actualCostExVat = children.reduce((s, c) => s + c.actualCostExVat, 0);
        vatAmount = children.reduce((s, c) => s + c.vatAmount, 0);
        paidAmount = children.reduce((s, c) => s + c.paidAmount, 0);
      }

      const actualCostIncVat = actualCostExVat + vatAmount;
      const payableAmount = Math.max(0, actualCostIncVat - paidAmount);
      const variance = contractAmount - actualCostExVat;
      const pctSpent = contractAmount > 0 ? (actualCostExVat / contractAmount) * 100 : 0;

      return {
        ...item, children, contractAmount, actualCostExVat, vatAmount,
        actualCostIncVat, paidAmount, payableAmount, variance, pctSpent,
      };
    };

    return (byParent['root'] || []).map(computeNode);
  }, [boqItems, expensesByBoq]);

  const getProjectBoqSummary = useCallback((projectId: string) => {
    const tree = getBoqTree(projectId);
    const sum = (nodes: BoqNode[]): { contract: number; actualExVat: number; vat: number; paid: number } =>
      nodes.reduce((acc, n) => {
        if (n.row_type === 'item') {
          acc.contract += n.contractAmount;
          acc.actualExVat += n.actualCostExVat;
          acc.vat += n.vatAmount;
          acc.paid += n.paidAmount;
        }
        const childSum = sum(n.children);
        acc.contract += childSum.contract;
        acc.actualExVat += childSum.actualExVat;
        acc.vat += childSum.vat;
        acc.paid += childSum.paid;
        return acc;
      }, { contract: 0, actualExVat: 0, vat: 0, paid: 0 });
    return sum(tree);
  }, [getBoqTree]);

  return {
    boqItems, loading,
    loadBoqItems,
    createBoqGroup, createBoqSubgroup, createBoqItemRow, updateBoqItem, deleteBoqItem,
    getBoqTree, getProjectBoqSummary,
  };
};
