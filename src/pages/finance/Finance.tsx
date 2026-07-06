import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { DollarSign, Users, Plus, Trash2, X, Search, Wallet, TrendingUp, TrendingDown, Truck, Tag, Download, Upload, FileSpreadsheet } from 'lucide-react';
import { useFinanceData, type Customer, type Supplier, type Expense, type Income, type PaymentStatus } from '../../hooks/useFinanceData';
import { fmt } from '../construction/types';
import { Pagination } from '../../components/Pagination';
import { readExcelFile, exportRowsToExcel } from '../../utils/excelIO';

type FinanceTab = 'DASHBOARD' | 'CUSTOMERS' | 'SUPPLIERS' | 'EXPENSES' | 'INCOMES' | 'CATEGORIES';

const PAYMENT_STATUS_LABEL: Record<PaymentStatus, { label: string; bg: string }> = {
  unpaid: { label: 'Chưa thanh toán', bg: 'bg-slate-100 text-slate-600' },
  partial: { label: 'Thanh toán một phần', bg: 'bg-amber-100 text-amber-700' },
  paid: { label: 'Đã thanh toán', bg: 'bg-emerald-100 text-emerald-700' },
};
const STATUS_LABEL_TO_KEY: Record<string, PaymentStatus> = {
  'chưa thanh toán': 'unpaid', 'thanh toán một phần': 'partial', 'đã thanh toán': 'paid',
};

const LOOKUP_KEYS = [
  { key: 'expense_type', label: 'Loại chi phí' },
  { key: 'payment_method', label: 'Phương thức thanh toán' },
  { key: 'customer_type', label: 'Loại khách hàng' },
  { key: 'customer_status', label: 'Trạng thái khách hàng' },
  { key: 'supplier_type', label: 'Loại nhà cung cấp' },
  { key: 'supplier_status', label: 'Trạng thái nhà cung cấp' },
];

const todayStr = () => new Date().toISOString().slice(0, 10);
const inRange = (v: number, from: string, to: string) => (!from || v >= Number(from)) && (!to || v <= Number(to));
const dateInRange = (d: string, from: string, to: string) => (!from || d >= from) && (!to || d <= to);

// ═══════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════

export const Finance = () => {
  const [searchParams] = useSearchParams();
  const projectFilter = searchParams.get('project');
  const db = useFinanceData();
  const [tab, setTab] = useState<FinanceTab>(projectFilter ? 'EXPENSES' : 'DASHBOARD');

  useEffect(() => { db.loadAll(); }, [db.loadAll]);

  const tabs: { id: FinanceTab; label: string; icon: React.ReactNode }[] = [
    { id: 'DASHBOARD', label: 'Tổng quan', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'CUSTOMERS', label: 'Khách hàng', icon: <Users className="w-4 h-4" /> },
    { id: 'SUPPLIERS', label: 'Nhà cung cấp', icon: <Truck className="w-4 h-4" /> },
    { id: 'EXPENSES', label: 'Chi phí', icon: <TrendingDown className="w-4 h-4" /> },
    { id: 'INCOMES', label: 'Thu tiền', icon: <Wallet className="w-4 h-4" /> },
    { id: 'CATEGORIES', label: 'Danh mục', icon: <Tag className="w-4 h-4" /> },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-[1500px] mx-auto">
      <div className="flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-indigo-500" />
        <h1 className="text-lg font-bold text-slate-800">Tài chính</h1>
      </div>

      <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-fit flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg transition-all ${tab === t.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {db.loading && db.projects.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-slate-500">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">Đang tải dữ liệu tài chính...</p>
          </div>
        </div>
      ) : (
        <>
          {tab === 'DASHBOARD' && <Dashboard db={db} />}
          {tab === 'CUSTOMERS' && <CustomersTab db={db} />}
          {tab === 'SUPPLIERS' && <SuppliersTab db={db} />}
          {tab === 'EXPENSES' && <ExpensesTab db={db} projectFilter={projectFilter} />}
          {tab === 'INCOMES' && <IncomesTab db={db} projectFilter={projectFilter} />}
          {tab === 'CATEGORIES' && <CategoriesTab db={db} />}
        </>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════

function Dashboard({ db }: { db: ReturnType<typeof useFinanceData> }) {
  const f = db.getCompanyFinance();

  const kpis = [
    { label: 'Tổng công trình', value: String(db.projects.length), color: 'text-slate-800' },
    { label: 'Tổng hợp đồng', value: fmt(f.contract), color: 'text-slate-800' },
    { label: 'Chi phí phát sinh', value: fmt(f.cost), color: 'text-rose-600' },
    { label: 'Đã thanh toán NCC', value: fmt(f.supplierPaid), color: 'text-indigo-600' },
    { label: 'Còn phải trả NCC', value: fmt(f.payable), color: 'text-amber-600' },
    { label: 'Đã thu', value: fmt(f.income), color: 'text-emerald-600' },
    { label: 'Còn phải thu', value: fmt(f.debt), color: 'text-amber-600' },
    { label: 'Thu vượt', value: fmt(f.over), color: 'text-sky-600' },
    { label: 'Lợi nhuận dự kiến', value: fmt(f.profit), color: f.profit >= 0 ? 'text-emerald-600' : 'text-rose-600' },
    { label: 'Dòng tiền thực', value: fmt(f.cashflow), color: f.cashflow >= 0 ? 'text-emerald-600' : 'text-rose-600' },
  ];

  const expenseByType = useMemo(() => {
    const map = new Map<string, number>();
    db.expenses.forEach(e => map.set(e.expense_type, (map.get(e.expense_type) || 0) + (e.amount || 0)));
    return Array.from(map.entries()).map(([name, v]) => ({ name, 'Chi phí': Math.round(v / 1e6) })).sort((a, b) => b['Chi phí'] - a['Chi phí']);
  }, [db.expenses]);

  const debtByProject = useMemo(() => {
    return [...db.projects]
      .map(p => ({ name: p.name.length > 14 ? p.name.slice(0, 14) + '…' : p.name, 'Còn phải thu': Math.round(db.getProjectFinance(p.id).debt / 1e6) }))
      .filter(d => d['Còn phải thu'] > 0)
      .sort((a, b) => b['Còn phải thu'] - a['Còn phải thu'])
      .slice(0, 10);
  }, [db.projects, db.getProjectFinance]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {kpis.map((k, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide leading-tight">{k.label}</p>
            <p className={`text-base font-bold mt-1 ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Chi phí theo loại (triệu đ)</h4>
          {expenseByType.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={expenseByType}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }} formatter={(v: any) => `${v} tr`} />
                <Bar dataKey="Chi phí" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Còn phải thu theo công trình (triệu đ)</h4>
          {debtByProject.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart layout="vertical" data={debtByProject}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }} formatter={(v: any) => `${v} tr`} />
                <Bar dataKey="Còn phải thu" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyChart() {
  return <div className="h-[220px] flex items-center justify-center text-xs text-slate-400">Chưa có dữ liệu</div>;
}

// ═══════════════════════════════════════════════════════════
// KHÁCH HÀNG
// ═══════════════════════════════════════════════════════════

function CustomersTab({ db }: { db: ReturnType<typeof useFinanceData> }) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [fType, setFType] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [search, setSearch] = useState('');

  const filtered = db.customers.filter(c =>
    (!fType || c.customer_type === fType) &&
    (!fStatus || c.status === fStatus) &&
    (!search || c.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm nhanh theo tên..." className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-xs" />
        </div>
        <select value={fType} onChange={e => setFType(e.target.value)} className="px-2.5 py-2 border border-slate-200 rounded-lg text-xs">
          <option value="">Tất cả loại khách hàng</option>
          {db.getLookupLabels('customer_type').map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        <select value={fStatus} onChange={e => setFStatus(e.target.value)} className="px-2.5 py-2 border border-slate-200 rounded-lg text-xs">
          <option value="">Tất cả trạng thái</option>
          {db.getLookupLabels('customer_status').map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        <button onClick={() => { setEditing(null); setShowModal(true); }}
          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 ml-auto">
          <Plus className="w-3.5 h-3.5" /> Thêm khách hàng
        </button>
      </div>
      <span className="text-xs font-bold text-slate-500">{filtered.length} / {db.customers.length} khách hàng</span>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px]">
            <tr>
              <th className="text-left px-3 py-2.5 font-bold">Tên</th>
              <th className="text-left px-3 py-2.5 font-bold">SĐT</th>
              <th className="text-left px-3 py-2.5 font-bold">Loại</th>
              <th className="text-left px-3 py-2.5 font-bold">Trạng thái</th>
              <th className="text-right px-3 py-2.5 font-bold">Số công trình</th>
              <th className="text-right px-3 py-2.5 font-bold">Tổng HĐ</th>
              <th className="text-right px-3 py-2.5 font-bold">Đã thu</th>
              <th className="text-right px-3 py-2.5 font-bold">Còn phải thu</th>
              <th className="px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(c => {
              const f = db.getCustomerFinance(c.id);
              const projectCount = db.projects.filter(p => p.customer_id === c.id).length;
              return (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2.5 font-bold text-slate-700">{c.name}</td>
                  <td className="px-3 py-2.5 text-slate-500">{c.phone || '--'}</td>
                  <td className="px-3 py-2.5 text-slate-500">{c.customer_type || '--'}</td>
                  <td className="px-3 py-2.5 text-slate-500">{c.status || '--'}</td>
                  <td className="px-3 py-2.5 text-right">{projectCount}</td>
                  <td className="px-3 py-2.5 text-right font-medium">{fmt(f.contract)}</td>
                  <td className="px-3 py-2.5 text-right text-emerald-600 font-medium">{fmt(f.income)}</td>
                  <td className="px-3 py-2.5 text-right text-amber-600 font-medium">{fmt(f.debt)}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => { setEditing(c); setShowModal(true); }} className="text-[10px] font-bold text-indigo-600 hover:underline">Sửa</button>
                      <button onClick={() => { if (confirm(`Xoá khách hàng "${c.name}"?`)) db.deleteCustomer(c.id); }} className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-rose-500"><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="text-center text-slate-400 py-8">Không có dữ liệu phù hợp</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <CustomerModal customer={editing} db={db} onClose={() => setShowModal(false)}
          onSave={async (data) => {
            if (editing) await db.updateCustomer(editing.id, data);
            else await db.createCustomer(data);
            setShowModal(false);
          }} />
      )}
    </div>
  );
}

function CustomerModal({ customer, db, onClose, onSave }: { customer: Customer | null; db: ReturnType<typeof useFinanceData>; onClose: () => void; onSave: (data: Partial<Customer>) => Promise<void> }) {
  const [form, setForm] = useState({
    name: customer?.name || '', phone: customer?.phone || '', address: customer?.address || '',
    customer_type: customer?.customer_type || '', status: customer?.status || '', note: customer?.note || '',
  });
  const [saving, setSaving] = useState(false);

  return (
    <ModalShell title={customer ? 'Sửa khách hàng' : 'Thêm khách hàng'} onClose={onClose}>
      <div className="p-5 space-y-3">
        <Field label="Tên khách hàng *"><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></Field>
        <Field label="Số điện thoại"><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></Field>
        <Field label="Địa chỉ"><input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Loại khách hàng">
            <select value={form.customer_type} onChange={e => setForm(f => ({ ...f, customer_type: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
              <option value="">-- Chọn --</option>
              {db.getLookupLabels('customer_type').map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </Field>
          <Field label="Trạng thái">
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
              <option value="">-- Chọn --</option>
              {db.getLookupLabels('customer_status').map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Ghi chú"><textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></Field>
      </div>
      <ModalFooter onClose={onClose} onSave={async () => { setSaving(true); await onSave(form); setSaving(false); }} saving={saving} disabled={!form.name.trim()} />
    </ModalShell>
  );
}

// ═══════════════════════════════════════════════════════════
// NHÀ CUNG CẤP
// ═══════════════════════════════════════════════════════════

function SuppliersTab({ db }: { db: ReturnType<typeof useFinanceData> }) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [fType, setFType] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [search, setSearch] = useState('');

  const filtered = db.suppliers.filter(s =>
    (!fType || s.supplier_type === fType) &&
    (!fStatus || s.status === fStatus) &&
    (!search || s.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm nhanh theo tên..." className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-xs" />
        </div>
        <select value={fType} onChange={e => setFType(e.target.value)} className="px-2.5 py-2 border border-slate-200 rounded-lg text-xs">
          <option value="">Tất cả loại NCC</option>
          {db.getLookupLabels('supplier_type').map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        <select value={fStatus} onChange={e => setFStatus(e.target.value)} className="px-2.5 py-2 border border-slate-200 rounded-lg text-xs">
          <option value="">Tất cả trạng thái</option>
          {db.getLookupLabels('supplier_status').map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        <button onClick={() => { setEditing(null); setShowModal(true); }}
          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 ml-auto">
          <Plus className="w-3.5 h-3.5" /> Thêm nhà cung cấp
        </button>
      </div>
      <span className="text-xs font-bold text-slate-500">{filtered.length} / {db.suppliers.length} nhà cung cấp</span>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px]">
            <tr>
              <th className="text-left px-3 py-2.5 font-bold">Tên</th>
              <th className="text-left px-3 py-2.5 font-bold">SĐT</th>
              <th className="text-left px-3 py-2.5 font-bold">Loại</th>
              <th className="text-left px-3 py-2.5 font-bold">Trạng thái</th>
              <th className="text-right px-3 py-2.5 font-bold">Tổng chi phí</th>
              <th className="text-right px-3 py-2.5 font-bold">Đã trả</th>
              <th className="text-right px-3 py-2.5 font-bold">Còn phải trả</th>
              <th className="px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(s => {
              const f = db.getSupplierFinance(s.id);
              return (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2.5 font-bold text-slate-700">{s.name}</td>
                  <td className="px-3 py-2.5 text-slate-500">{s.phone || '--'}</td>
                  <td className="px-3 py-2.5 text-slate-500">{s.supplier_type || '--'}</td>
                  <td className="px-3 py-2.5 text-slate-500">{s.status || '--'}</td>
                  <td className="px-3 py-2.5 text-right font-medium">{fmt(f.cost)}</td>
                  <td className="px-3 py-2.5 text-right text-indigo-600 font-medium">{fmt(f.paid)}</td>
                  <td className="px-3 py-2.5 text-right text-amber-600 font-medium">{fmt(f.payable)}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => { setEditing(s); setShowModal(true); }} className="text-[10px] font-bold text-indigo-600 hover:underline">Sửa</button>
                      <button onClick={() => { if (confirm(`Xoá nhà cung cấp "${s.name}"?`)) db.deleteSupplier(s.id); }} className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-rose-500"><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="text-center text-slate-400 py-8">Không có dữ liệu phù hợp</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <SupplierModal supplier={editing} db={db} onClose={() => setShowModal(false)}
          onSave={async (data) => {
            if (editing) await db.updateSupplier(editing.id, data);
            else await db.createSupplier(data);
            setShowModal(false);
          }} />
      )}
    </div>
  );
}

function SupplierModal({ supplier, db, onClose, onSave }: { supplier: Supplier | null; db: ReturnType<typeof useFinanceData>; onClose: () => void; onSave: (data: Partial<Supplier>) => Promise<void> }) {
  const [form, setForm] = useState({
    name: supplier?.name || '', phone: supplier?.phone || '', address: supplier?.address || '',
    supplier_type: supplier?.supplier_type || '', status: supplier?.status || '', note: supplier?.note || '',
  });
  const [saving, setSaving] = useState(false);

  return (
    <ModalShell title={supplier ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp'} onClose={onClose}>
      <div className="p-5 space-y-3">
        <Field label="Tên nhà cung cấp *"><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></Field>
        <Field label="Số điện thoại"><input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></Field>
        <Field label="Địa chỉ"><input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Loại nhà cung cấp">
            <select value={form.supplier_type} onChange={e => setForm(f => ({ ...f, supplier_type: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
              <option value="">-- Chọn --</option>
              {db.getLookupLabels('supplier_type').map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </Field>
          <Field label="Trạng thái">
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
              <option value="">-- Chọn --</option>
              {db.getLookupLabels('supplier_status').map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Ghi chú"><textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></Field>
      </div>
      <ModalFooter onClose={onClose} onSave={async () => { setSaving(true); await onSave(form); setSaving(false); }} saving={saving} disabled={!form.name.trim()} />
    </ModalShell>
  );
}

// ═══════════════════════════════════════════════════════════
// CHI PHÍ
// ═══════════════════════════════════════════════════════════

function ExpensesTab({ db, projectFilter }: { db: ReturnType<typeof useFinanceData>; projectFilter: string | null }) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [fProject, setFProject] = useState(projectFilter || '');
  const [fCategory, setFCategory] = useState('');
  const [fType, setFType] = useState('');
  const [fSupplier, setFSupplier] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [amountFrom, setAmountFrom] = useState('');
  const [amountTo, setAmountTo] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [importMsg, setImportMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = useMemo(() => Array.from(new Set(db.expenses.map(e => e.category).filter(Boolean))) as string[], [db.expenses]);

  const resetFilters = () => {
    setFProject(''); setFCategory(''); setFType(''); setFSupplier(''); setFStatus('');
    setDateFrom(''); setDateTo(''); setAmountFrom(''); setAmountTo(''); setSearch(''); setPage(1);
  };

  const filtered = db.expenses.filter(e =>
    (!fProject || e.project_id === fProject) &&
    (!fCategory || e.category === fCategory) &&
    (!fType || e.expense_type === fType) &&
    (!fSupplier || e.supplier_id === fSupplier) &&
    (!fStatus || e.payment_status === fStatus) &&
    dateInRange(e.date, dateFrom, dateTo) &&
    inRange(e.amount, amountFrom, amountTo) &&
    (!search || e.description.toLowerCase().includes(search.toLowerCase()))
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const projectName = (id: string) => db.projects.find(p => p.id === id)?.name || '--';
  const supplierName = (e: Expense) => e.supplier_id ? (db.suppliers.find(s => s.id === e.supplier_id)?.name || '--') : (e.supplier_name || '--');

  const handleExport = () => {
    const rows = filtered.map(e => ({
      'Ngày chi': e.date, 'Công trình': projectName(e.project_id), 'Hạng mục': e.category || '',
      'Loại chi phí': e.expense_type, 'Nội dung chi': e.description, 'Nhà cung cấp': supplierName(e),
      'Số tiền': e.amount, 'Đã thanh toán': e.amount_paid, 'Trạng thái thanh toán': PAYMENT_STATUS_LABEL[e.payment_status].label,
      'Ghi chú': e.note || '',
    }));
    exportRowsToExcel(rows, `Chi_phi_${todayStr()}.xlsx`, 'Chi phí');
  };

  const handleTemplate = () => {
    exportRowsToExcel([{
      'Ngày chi': todayStr(), 'Tên công trình': db.projects[0]?.name || 'Tên công trình',
      'Hạng mục': '', 'Loại chi phí': db.getLookupLabels('expense_type')[0] || 'Khác',
      'Nội dung chi': 'VD: Mua xi măng, sắt thép', 'Tên nhà cung cấp': '', 'Số tiền': 1000000,
      'Trạng thái thanh toán': 'Chưa thanh toán', 'Ghi chú': '',
    }], 'Mau_Chi_phi.xlsx', 'Mẫu Chi phí');
  };

  const handleImport = async (file: File) => {
    const rows = await readExcelFile(file);
    let skipped = 0;
    const valid: Array<Partial<Expense> & { amount: number; payment_status: PaymentStatus; date: string; project_id: string; description: string }> = [];
    rows.forEach(r => {
      const project = db.projects.find(p => p.name.trim().toLowerCase() === String(r['Tên công trình'] || '').trim().toLowerCase());
      if (!project) { skipped++; return; }
      const statusLabel = String(r['Trạng thái thanh toán'] || '').trim().toLowerCase();
      valid.push({
        project_id: project.id, date: String(r['Ngày chi'] || todayStr()),
        category: r['Hạng mục'] || null, expense_type: String(r['Loại chi phí'] || 'Khác'),
        description: String(r['Nội dung chi'] || ''), supplier_name: r['Tên nhà cung cấp'] || null,
        amount: Number(r['Số tiền']) || 0, payment_status: STATUS_LABEL_TO_KEY[statusLabel] || 'unpaid',
        note: r['Ghi chú'] || null,
      });
    });
    const created = await db.bulkCreateExpenses(valid);
    setImportMsg(`Đã nhập ${created} dòng${skipped > 0 ? `, bỏ qua ${skipped} dòng không khớp công trình` : ''}.`);
    setTimeout(() => setImportMsg(''), 5000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-sm font-bold text-slate-700">Chi phí</h2>
        <div className="flex items-center gap-2">
          {importMsg && <span className="text-xs text-emerald-600 font-medium">{importMsg}</span>}
          <button onClick={handleTemplate} className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg flex items-center gap-1.5"><Download className="w-3.5 h-3.5" /> Mẫu Excel</button>
          <button onClick={() => fileInputRef.current?.click()} className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg flex items-center gap-1.5"><Upload className="w-3.5 h-3.5" /> Nhập từ Excel</button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImport(f); e.target.value = ''; }} />
          <button onClick={handleExport} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"><FileSpreadsheet className="w-3.5 h-3.5" /> Xuất Excel</button>
          <button onClick={() => { setEditing(null); setShowModal(true); }}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Thêm chi phí
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Tìm nhanh theo nội dung..." className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-xs" />
          </div>
          <button onClick={resetFilters} className="text-xs font-bold text-slate-500 hover:text-indigo-600">↺ Đặt lại</button>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={fProject} onChange={e => { setFProject(e.target.value); setPage(1); }} className="px-2.5 py-2 border border-slate-200 rounded-lg text-xs">
            <option value="">Tất cả công trình</option>
            {db.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={fCategory} onChange={e => { setFCategory(e.target.value); setPage(1); }} className="px-2.5 py-2 border border-slate-200 rounded-lg text-xs">
            <option value="">Tất cả hạng mục</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={fType} onChange={e => { setFType(e.target.value); setPage(1); }} className="px-2.5 py-2 border border-slate-200 rounded-lg text-xs">
            <option value="">Tất cả loại chi phí</option>
            {db.getLookupLabels('expense_type').map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={fSupplier} onChange={e => { setFSupplier(e.target.value); setPage(1); }} className="px-2.5 py-2 border border-slate-200 rounded-lg text-xs">
            <option value="">Tất cả nhà cung cấp</option>
            {db.suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={fStatus} onChange={e => { setFStatus(e.target.value); setPage(1); }} className="px-2.5 py-2 border border-slate-200 rounded-lg text-xs">
            <option value="">Tất cả trạng thái</option>
            {(Object.keys(PAYMENT_STATUS_LABEL) as PaymentStatus[]).map(s => <option key={s} value={s}>{PAYMENT_STATUS_LABEL[s].label}</option>)}
          </select>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400">Ngày:</span>
            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} className="px-2 py-1.5 border border-slate-200 rounded-lg" />
            <span className="text-slate-400">-</span>
            <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} className="px-2 py-1.5 border border-slate-200 rounded-lg" />
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400">Số tiền:</span>
            <input type="number" value={amountFrom} onChange={e => { setAmountFrom(e.target.value); setPage(1); }} placeholder="Từ" className="w-24 px-2 py-1.5 border border-slate-200 rounded-lg" />
            <span className="text-slate-400">-</span>
            <input type="number" value={amountTo} onChange={e => { setAmountTo(e.target.value); setPage(1); }} placeholder="Đến" className="w-24 px-2 py-1.5 border border-slate-200 rounded-lg" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <SummaryCard label="Tổng chi phí (đang lọc)" value={fmt(filtered.reduce((s, e) => s + e.amount, 0))} color="text-rose-600" />
        <SummaryCard label="Đã thanh toán" value={fmt(filtered.reduce((s, e) => s + e.amount_paid, 0))} color="text-indigo-600" />
        <SummaryCard label="Còn phải trả" value={fmt(filtered.reduce((s, e) => s + (e.amount - e.amount_paid), 0))} color="text-amber-600" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px]">
            <tr>
              <th className="text-left px-3 py-2.5 font-bold">Ngày</th>
              <th className="text-left px-3 py-2.5 font-bold">Công trình</th>
              <th className="text-left px-3 py-2.5 font-bold">Hạng mục</th>
              <th className="text-left px-3 py-2.5 font-bold">Loại</th>
              <th className="text-left px-3 py-2.5 font-bold">Nội dung</th>
              <th className="text-left px-3 py-2.5 font-bold">NCC</th>
              <th className="text-right px-3 py-2.5 font-bold">Số tiền</th>
              <th className="text-right px-3 py-2.5 font-bold">Đã trả</th>
              <th className="text-left px-3 py-2.5 font-bold">Trạng thái</th>
              <th className="px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paged.map(e => (
              <tr key={e.id} className="hover:bg-slate-50">
                <td className="px-3 py-2.5 whitespace-nowrap">{new Date(e.date).toLocaleDateString('vi-VN')}</td>
                <td className="px-3 py-2.5">{projectName(e.project_id)}</td>
                <td className="px-3 py-2.5 text-slate-500">{e.category || '--'}</td>
                <td className="px-3 py-2.5 text-slate-500">{e.expense_type}</td>
                <td className="px-3 py-2.5 max-w-[200px] truncate">{e.description}</td>
                <td className="px-3 py-2.5 text-slate-500">{supplierName(e)}</td>
                <td className="px-3 py-2.5 text-right font-bold text-rose-600">{fmt(e.amount)}</td>
                <td className="px-3 py-2.5 text-right">{fmt(e.amount_paid)}</td>
                <td className="px-3 py-2.5"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${PAYMENT_STATUS_LABEL[e.payment_status].bg}`}>{PAYMENT_STATUS_LABEL[e.payment_status].label}</span></td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => { setEditing(e); setShowModal(true); }} className="text-[10px] font-bold text-indigo-600 hover:underline">Sửa</button>
                    <button onClick={() => { if (confirm('Xoá chi phí này?')) db.deleteExpense(e.id); }} className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-rose-500"><Trash2 size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {paged.length === 0 && <tr><td colSpan={10} className="text-center text-slate-400 py-8">Không có dữ liệu phù hợp</td></tr>}
          </tbody>
        </table>
      </div>

      <Pagination page={safePage} pageSize={pageSize} total={filtered.length} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />

      {showModal && (
        <ExpenseModal expense={editing} db={db} defaultProjectId={projectFilter || undefined} onClose={() => setShowModal(false)}
          onSave={async (data) => {
            if (editing) await db.updateExpense(editing.id, data);
            else await db.createExpense(data as any);
            setShowModal(false);
          }} />
      )}
    </div>
  );
}

function ExpenseModal({ expense, db, defaultProjectId, onClose, onSave }: {
  expense: Expense | null; db: ReturnType<typeof useFinanceData>; defaultProjectId?: string;
  onClose: () => void; onSave: (data: Partial<Expense>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    project_id: expense?.project_id || defaultProjectId || '',
    date: expense?.date || todayStr(),
    category: expense?.category || '',
    expense_type: expense?.expense_type || '',
    description: expense?.description || '',
    supplier_id: expense?.supplier_id || '',
    supplier_name: expense?.supplier_name || '',
    amount: String(expense?.amount || ''),
    payment_status: (expense?.payment_status || 'unpaid') as PaymentStatus,
    amount_paid: String(expense?.amount_paid || ''),
    note: expense?.note || '',
  });
  const [saving, setSaving] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const categories = db.projectCategories[form.project_id] || [];
  const expenseTypes = db.getLookupLabels('expense_type');
  const canSave = form.project_id && form.date && form.description.trim() && Number(form.amount) > 0;

  return (
    <>
      <ModalShell title={expense ? 'Sửa chi phí' : 'Thêm chi phí'} onClose={onClose}>
        <div className="p-5 space-y-3 max-h-[65vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Công trình *">
              <select value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value, category: '' }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <option value="">-- Chọn --</option>
                {db.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="Ngày chi *"><input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Hạng mục">
              <input list="expense-categories" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Chọn công trình trước" />
              <datalist id="expense-categories">{categories.map(c => <option key={c} value={c} />)}</datalist>
            </Field>
            <Field label="Loại chi phí *">
              <select value={form.expense_type} onChange={e => setForm(f => ({ ...f, expense_type: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <option value="">-- Chọn --</option>
                {expenseTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Nội dung chi *"><input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="VD: Mua xi măng, sắt thép..." /></Field>
          <Field label="Nhà cung cấp">
            <div className="flex gap-2">
              <select value={form.supplier_id} onChange={e => setForm(f => ({ ...f, supplier_id: e.target.value, supplier_name: e.target.value ? '' : f.supplier_name }))} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm">
                <option value="">-- Chọn hoặc gõ tên khác bên dưới --</option>
                {db.suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <button type="button" onClick={() => setShowSupplierModal(true)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 whitespace-nowrap">+ Tạo mới</button>
            </div>
          </Field>
          <Field label="Hoặc tên NCC khác (nếu chưa có trong danh sách)">
            <input value={form.supplier_name} onChange={e => setForm(f => ({ ...f, supplier_name: e.target.value }))} disabled={!!form.supplier_id} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm disabled:bg-slate-50" placeholder="VD: Cửa hàng vật tư ABC" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Số tiền (VNĐ) *"><input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></Field>
            <Field label="Trạng thái thanh toán">
              <select value={form.payment_status} onChange={e => setForm(f => ({ ...f, payment_status: e.target.value as PaymentStatus }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                {(Object.keys(PAYMENT_STATUS_LABEL) as PaymentStatus[]).map(s => <option key={s} value={s}>{PAYMENT_STATUS_LABEL[s].label}</option>)}
              </select>
            </Field>
          </div>
          {form.payment_status === 'partial' && (
            <Field label="Số tiền đã thanh toán">
              <input type="number" value={form.amount_paid} onChange={e => setForm(f => ({ ...f, amount_paid: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              <p className="text-[10px] text-slate-400 mt-1">Đã thanh toán = tự bằng Số tiền; Chưa thanh toán = 0; Thanh toán một phần = nhập số thực tế đã trả.</p>
            </Field>
          )}
          <Field label="Ghi chú"><textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></Field>
        </div>
        <ModalFooter onClose={onClose} disabled={!canSave} saving={saving} onSave={async () => {
          setSaving(true);
          await onSave({
            project_id: form.project_id, date: form.date, category: form.category || null,
            expense_type: form.expense_type, description: form.description,
            supplier_id: form.supplier_id || null, supplier_name: form.supplier_id ? null : (form.supplier_name || null),
            amount: Number(form.amount) || 0, payment_status: form.payment_status,
            amount_paid: Number(form.amount_paid) || 0, note: form.note || null,
          });
          setSaving(false);
        }} />
      </ModalShell>
      {showSupplierModal && (
        <SupplierModal supplier={null} db={db} onClose={() => setShowSupplierModal(false)}
          onSave={async (data) => {
            const id = await db.createSupplier(data);
            if (id) setForm(f => ({ ...f, supplier_id: id, supplier_name: '' }));
            setShowSupplierModal(false);
          }} />
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// THU TIỀN
// ═══════════════════════════════════════════════════════════

function IncomesTab({ db, projectFilter }: { db: ReturnType<typeof useFinanceData>; projectFilter: string | null }) {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Income | null>(null);
  const [fProject, setFProject] = useState(projectFilter || '');
  const [fCustomer, setFCustomer] = useState('');
  const [fMethod, setFMethod] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [amountFrom, setAmountFrom] = useState('');
  const [amountTo, setAmountTo] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [importMsg, setImportMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetFilters = () => {
    setFProject(''); setFCustomer(''); setFMethod(''); setDateFrom(''); setDateTo('');
    setAmountFrom(''); setAmountTo(''); setSearch(''); setPage(1);
  };

  const filtered = db.incomes.filter(i =>
    (!fProject || i.project_id === fProject) &&
    (!fCustomer || i.customer_id === fCustomer) &&
    (!fMethod || i.payment_method === fMethod) &&
    dateInRange(i.date, dateFrom, dateTo) &&
    inRange(i.amount, amountFrom, amountTo) &&
    (!search || (i.description || '').toLowerCase().includes(search.toLowerCase()))
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const projectName = (id: string) => db.projects.find(p => p.id === id)?.name || '--';
  const customerName = (id: string | null) => id ? (db.customers.find(c => c.id === id)?.name || '--') : '--';

  const handleExport = () => {
    const rows = filtered.map(i => ({
      'Ngày thu': i.date, 'Công trình': projectName(i.project_id), 'Khách hàng': customerName(i.customer_id),
      'Nội dung thu': i.description || '', 'Số tiền thu': i.amount, 'Phương thức thanh toán': i.payment_method,
      'Người nhận': i.received_by || '', 'Ghi chú': i.note || '',
    }));
    exportRowsToExcel(rows, `Thu_tien_${todayStr()}.xlsx`, 'Thu tiền');
  };

  const handleTemplate = () => {
    exportRowsToExcel([{
      'Ngày thu': todayStr(), 'Tên công trình': db.projects[0]?.name || 'Tên công trình',
      'Nội dung thu': 'VD: Thanh toán đợt 1', 'Số tiền thu': 1000000,
      'Phương thức thanh toán': db.getLookupLabels('payment_method')[0] || 'Tiền mặt',
      'Người nhận': '', 'Ghi chú': '',
    }], 'Mau_Thu_tien.xlsx', 'Mẫu Thu tiền');
  };

  const handleImport = async (file: File) => {
    const rows = await readExcelFile(file);
    let skipped = 0;
    const valid: Array<Partial<Income> & { amount: number; date: string; project_id: string }> = [];
    rows.forEach(r => {
      const project = db.projects.find(p => p.name.trim().toLowerCase() === String(r['Tên công trình'] || '').trim().toLowerCase());
      if (!project) { skipped++; return; }
      valid.push({
        project_id: project.id, date: String(r['Ngày thu'] || todayStr()),
        description: r['Nội dung thu'] || null, amount: Number(r['Số tiền thu']) || 0,
        payment_method: String(r['Phương thức thanh toán'] || 'Tiền mặt'),
        received_by: r['Người nhận'] || null, note: r['Ghi chú'] || null,
      });
    });
    const created = await db.bulkCreateIncomes(valid);
    setImportMsg(`Đã nhập ${created} dòng${skipped > 0 ? `, bỏ qua ${skipped} dòng không khớp công trình` : ''}.`);
    setTimeout(() => setImportMsg(''), 5000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-sm font-bold text-slate-700">Thu tiền & Công nợ</h2>
        <div className="flex items-center gap-2">
          {importMsg && <span className="text-xs text-emerald-600 font-medium">{importMsg}</span>}
          <button onClick={handleTemplate} className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg flex items-center gap-1.5"><Download className="w-3.5 h-3.5" /> Mẫu Excel</button>
          <button onClick={() => fileInputRef.current?.click()} className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold rounded-lg flex items-center gap-1.5"><Upload className="w-3.5 h-3.5" /> Nhập từ Excel</button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImport(f); e.target.value = ''; }} />
          <button onClick={handleExport} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"><FileSpreadsheet className="w-3.5 h-3.5" /> Xuất Excel</button>
          <button onClick={() => { setEditing(null); setShowModal(true); }}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Thêm phiếu thu
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Tìm nhanh theo nội dung..." className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-xs" />
          </div>
          <button onClick={resetFilters} className="text-xs font-bold text-slate-500 hover:text-indigo-600">↺ Đặt lại</button>
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={fProject} onChange={e => { setFProject(e.target.value); setPage(1); }} className="px-2.5 py-2 border border-slate-200 rounded-lg text-xs">
            <option value="">Tất cả công trình</option>
            {db.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={fCustomer} onChange={e => { setFCustomer(e.target.value); setPage(1); }} className="px-2.5 py-2 border border-slate-200 rounded-lg text-xs">
            <option value="">Tất cả khách hàng</option>
            {db.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={fMethod} onChange={e => { setFMethod(e.target.value); setPage(1); }} className="px-2.5 py-2 border border-slate-200 rounded-lg text-xs">
            <option value="">Tất cả phương thức</option>
            {db.getLookupLabels('payment_method').map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400">Ngày:</span>
            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} className="px-2 py-1.5 border border-slate-200 rounded-lg" />
            <span className="text-slate-400">-</span>
            <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} className="px-2 py-1.5 border border-slate-200 rounded-lg" />
          </div>
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400">Số tiền:</span>
            <input type="number" value={amountFrom} onChange={e => { setAmountFrom(e.target.value); setPage(1); }} placeholder="Từ" className="w-24 px-2 py-1.5 border border-slate-200 rounded-lg" />
            <span className="text-slate-400">-</span>
            <input type="number" value={amountTo} onChange={e => { setAmountTo(e.target.value); setPage(1); }} placeholder="Đến" className="w-24 px-2 py-1.5 border border-slate-200 rounded-lg" />
          </div>
        </div>
      </div>

      <SummaryCard label="Tổng thu (đang lọc)" value={fmt(filtered.reduce((s, i) => s + i.amount, 0))} color="text-emerald-600" />

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px]">
            <tr>
              <th className="text-left px-3 py-2.5 font-bold">Ngày</th>
              <th className="text-left px-3 py-2.5 font-bold">Công trình</th>
              <th className="text-left px-3 py-2.5 font-bold">Khách hàng</th>
              <th className="text-left px-3 py-2.5 font-bold">Nội dung</th>
              <th className="text-right px-3 py-2.5 font-bold">Số tiền</th>
              <th className="text-left px-3 py-2.5 font-bold">Phương thức</th>
              <th className="px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paged.map(i => (
              <tr key={i.id} className="hover:bg-slate-50">
                <td className="px-3 py-2.5 whitespace-nowrap">{new Date(i.date).toLocaleDateString('vi-VN')}</td>
                <td className="px-3 py-2.5">{projectName(i.project_id)}</td>
                <td className="px-3 py-2.5 text-slate-500">{customerName(i.customer_id)}</td>
                <td className="px-3 py-2.5 max-w-[220px] truncate">{i.description || '--'}</td>
                <td className="px-3 py-2.5 text-right font-bold text-emerald-600">+{fmt(i.amount)}</td>
                <td className="px-3 py-2.5 text-slate-500">{i.payment_method}</td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => { setEditing(i); setShowModal(true); }} className="text-[10px] font-bold text-indigo-600 hover:underline">Sửa</button>
                    <button onClick={() => { if (confirm('Xoá phiếu thu này?')) db.deleteIncome(i.id); }} className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-rose-500"><Trash2 size={12} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {paged.length === 0 && <tr><td colSpan={7} className="text-center text-slate-400 py-8">Không có dữ liệu phù hợp</td></tr>}
          </tbody>
        </table>
      </div>

      <Pagination page={safePage} pageSize={pageSize} total={filtered.length} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />

      {showModal && (
        <IncomeModal income={editing} db={db} defaultProjectId={projectFilter || undefined} onClose={() => setShowModal(false)}
          onSave={async (data) => {
            if (editing) await db.updateIncome(editing.id, data);
            else await db.createIncome(data as any);
            setShowModal(false);
          }} />
      )}
    </div>
  );
}

function IncomeModal({ income, db, defaultProjectId, onClose, onSave }: {
  income: Income | null; db: ReturnType<typeof useFinanceData>; defaultProjectId?: string;
  onClose: () => void; onSave: (data: Partial<Income>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    project_id: income?.project_id || defaultProjectId || '',
    customer_id: income?.customer_id || '',
    date: income?.date || todayStr(),
    description: income?.description || '',
    amount: String(income?.amount || ''),
    payment_method: income?.payment_method || '',
    received_by: income?.received_by || '',
    note: income?.note || '',
  });
  const [saving, setSaving] = useState(false);
  const paymentMethods = db.getLookupLabels('payment_method');
  const canSave = form.project_id && form.date && Number(form.amount) > 0;

  const handleProjectChange = (projectId: string) => {
    const project = db.projects.find(p => p.id === projectId);
    setForm(f => ({ ...f, project_id: projectId, customer_id: project?.customer_id || f.customer_id }));
  };

  return (
    <ModalShell title={income ? 'Sửa phiếu thu' : 'Thêm phiếu thu'} onClose={onClose}>
      <div className="p-5 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Công trình *">
            <select value={form.project_id} onChange={e => handleProjectChange(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
              <option value="">-- Chọn --</option>
              {db.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Ngày thu *"><input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></Field>
        </div>
        <Field label="Khách hàng">
          <select value={form.customer_id} onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
            <option value="">-- Tự động theo công trình --</option>
            {db.customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Nội dung thu"><input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="VD: Thanh toán đợt 2 - phần thô" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Số tiền thu (VNĐ) *"><input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></Field>
          <Field label="Phương thức">
            <select value={form.payment_method} onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
              <option value="">-- Chọn --</option>
              {paymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Người nhận"><input value={form.received_by} onChange={e => setForm(f => ({ ...f, received_by: e.target.value }))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></Field>
        <Field label="Ghi chú"><textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" /></Field>
      </div>
      <ModalFooter onClose={onClose} disabled={!canSave} saving={saving} onSave={async () => {
        setSaving(true);
        await onSave({
          project_id: form.project_id, customer_id: form.customer_id || null, date: form.date,
          description: form.description || null, amount: Number(form.amount) || 0,
          payment_method: form.payment_method, received_by: form.received_by || null, note: form.note || null,
        });
        setSaving(false);
      }} />
    </ModalShell>
  );
}

// ═══════════════════════════════════════════════════════════
// DANH MỤC
// ═══════════════════════════════════════════════════════════

function CategoriesTab({ db }: { db: ReturnType<typeof useFinanceData> }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {LOOKUP_KEYS.map(({ key, label }) => <LookupCard key={key} listKey={key} title={label} db={db} />)}
    </div>
  );
}

function LookupCard({ listKey, title, db }: { listKey: string; title: string; db: ReturnType<typeof useFinanceData> }) {
  const [newLabel, setNewLabel] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const items = db.lookups.filter(l => l.list_key === listKey).sort((a, b) => a.sort_order - b.sort_order);

  const submitAdd = () => {
    if (!newLabel.trim()) return;
    db.createLookup(listKey, newLabel.trim());
    setNewLabel('');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <h4 className="text-sm font-bold text-slate-700 mb-3">{title} <span className="text-slate-400 font-normal">({items.length})</span></h4>
      <div className="space-y-1 mb-3">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-2 group py-1 border-b border-dashed border-slate-100 last:border-0">
            {editingId === item.id ? (
              <>
                <input value={editValue} onChange={e => setEditValue(e.target.value)} autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') { db.updateLookup(item.id, editValue); setEditingId(null); } }}
                  className="flex-1 px-2 py-1 border border-indigo-300 rounded text-xs" />
                <button onClick={async () => { await db.updateLookup(item.id, editValue); setEditingId(null); }} className="text-[10px] font-bold text-emerald-600">Lưu</button>
                <button onClick={() => setEditingId(null)} className="text-[10px] text-slate-400">Hủy</button>
              </>
            ) : (
              <>
                <span className="flex-1 text-xs text-slate-700">{item.label}</span>
                <button onClick={() => { setEditingId(item.id); setEditValue(item.label); }} className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-indigo-600 transition-opacity">Sửa</button>
                <button onClick={() => { if (confirm(`Xoá "${item.label}"?`)) db.deleteLookup(item.id); }} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-opacity"><Trash2 size={12} /></button>
              </>
            )}
          </div>
        ))}
        {items.length === 0 && <p className="text-xs text-slate-400 italic">Chưa có giá trị nào</p>}
      </div>
      <div className="flex gap-2 pt-2 border-t border-dashed border-slate-200">
        <input value={newLabel} onChange={e => setNewLabel(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitAdd()}
          placeholder="+ Thêm giá trị..." className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs" />
        <button onClick={submitAdd} className="px-2.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700">+</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SHARED UI PIECES
// ═══════════════════════════════════════════════════════════

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{label}</p>
      <p className={`text-base font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-slate-500">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4 text-slate-500" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalFooter({ onClose, onSave, saving, disabled }: { onClose: () => void; onSave: () => void; saving: boolean; disabled: boolean }) {
  return (
    <div className="p-5 border-t border-slate-100 flex justify-end gap-2">
      <button onClick={onClose} className="px-4 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700">Hủy</button>
      <button onClick={onSave} disabled={saving || disabled}
        className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-40 active:scale-[0.98] transition-all">
        {saving ? 'Đang lưu...' : 'Lưu'}
      </button>
    </div>
  );
}
