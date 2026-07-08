import { useState, useEffect, useRef } from 'react';
import { X, Camera, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../services/supabase';
import { useBoqData } from '../../hooks/useBoqData';
import { compressImageToBlob } from '../../utils/imageCompress';
import { uploadFile } from '../../utils/uploadUtils';

const todayStr = () => new Date().toISOString().slice(0, 10);

interface Props {
  projectId: string;
  onClose: () => void;
  onSaved: (message: string) => void;
}

// Ghi chi phí nhanh cho Quản lý thi công/Giám Sát ngay tại công trường — cố
// tình gọn (6 trường), không dùng useFinanceData() (hook đầy, tải ~10 bảng
// company-wide) vì chỉ cần 1 lệnh insert. Luôn lưu payment_status='unpaid'
// vì PM không biết đã trả tiền hay chưa — kế toán xác nhận sau trong tab
// Chi phí của Tài chính (cùng 1 bảng construction_expenses, tự xuất hiện).
export function QuickExpenseModal({ projectId, onClose, onSaved }: Props) {
  const boq = useBoqData();
  const [boqItemId, setBoqItemId] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [receiver, setReceiver] = useState('');
  const [note, setNote] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { boq.loadBoqItems(projectId); }, [projectId]);

  const boqItemOptions = boq.boqItems.filter(b => b.project_id === projectId && b.row_type === 'item');
  const canSave = description.trim() && Number(amount) > 0 && !saving;

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Chỉ hỗ trợ hình ảnh.'); return; }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setError('');
  };

  const clearPhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError('');
    try {
      let receiptPhotos: string[] = [];
      if (photoFile) {
        const blob = await compressImageToBlob(photoFile, 2048, 0.85);
        const url = await uploadFile(blob, 'project-media', `expenses/${projectId}/${Date.now()}.webp`);
        if (url) receiptPhotos = [url];
      }
      const { error: insertErr } = await supabase.from('construction_expenses').insert([{
        project_id: projectId,
        date: todayStr(),
        category: null,
        expense_type: 'Khác',
        description: description.trim(),
        supplier_id: null,
        supplier_name: receiver.trim() || null,
        amount: Number(amount) || 0,
        amount_paid: 0,
        payment_status: 'unpaid',
        receipt_photos: receiptPhotos,
        note: note.trim() || null,
        boq_item_id: boqItemId || null,
      }]);
      if (insertErr) { setError(insertErr.message || 'Lỗi khi lưu chi phí'); setSaving(false); return; }
      onSaved('Đã ghi chi phí');
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Lỗi khi lưu chi phí');
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md overflow-hidden flex flex-col max-h-[92vh]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
            <p className="text-sm font-bold text-slate-800">Ghi chi phí nhanh</p>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-4 h-4" /></button>
          </div>

          <div className="p-5 space-y-3 overflow-y-auto flex-1">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Hạng mục BOQ</label>
              <select value={boqItemId} onChange={e => setBoqItemId(e.target.value)} className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm">
                <option value="">-- Chưa gắn hạng mục --</option>
                {boqItemOptions.map(b => <option key={b.id} value={b.id}>{b.item_code} — {b.item_name || '(chưa đặt tên)'}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Nội dung chi *</label>
              <input value={description} onChange={e => setDescription(e.target.value)} placeholder="VD: Mua xi măng, sắt thép..." className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Số tiền (VNĐ) *</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Người nhận / NCC</label>
              <input value={receiver} onChange={e => setReceiver(e.target.value)} placeholder="VD: Cửa hàng vật tư ABC" className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Ảnh chứng từ</label>
              {photoPreview ? (
                <div className="mt-1 relative w-24 h-24">
                  <img src={photoPreview} className="w-24 h-24 object-cover rounded-xl border border-slate-200" />
                  <button onClick={clearPhoto} className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow"><X className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <button type="button" onClick={() => fileInputRef.current?.click()} className="mt-1 w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-sm flex items-center justify-center gap-2 hover:bg-slate-50">
                  <Camera className="w-4 h-4" /> Chụp ảnh chứng từ
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoSelect} className="hidden" />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Ghi chú</label>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} className="mt-1 w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm" />
            </div>
            {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
          </div>

          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-100 shrink-0">
            <button onClick={onClose} className="px-4 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl">Huỷ</button>
            <button onClick={handleSave} disabled={!canSave} className="px-4 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-40 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Lưu chi phí
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
