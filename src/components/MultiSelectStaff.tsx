import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface StaffOption { id: string; full_name: string; }

interface Props {
  options: StaffOption[];
  value: string; // chuỗi tên nối bởi '; '
  onChange: (value: string) => void;
  placeholder?: string;
}

export function MultiSelectStaff({ options, value, onChange, placeholder = 'Chọn người phụ trách' }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = value ? value.split(';').map(s => s.trim()).filter(Boolean) : [];

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const toggle = (name: string) => {
    const next = selected.includes(name) ? selected.filter(n => n !== name) : [...selected, name];
    onChange(next.join('; '));
  };

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-1 px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-left truncate">
        <span className={selected.length ? 'text-slate-700 truncate' : 'text-slate-400'}>
          {selected.length ? (selected.length === 1 ? selected[0] : `${selected.length} người`) : placeholder}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      </button>
      {open && (
        <div className="absolute z-30 mt-1 w-56 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg py-1 left-0">
          {options.length === 0 && <div className="px-3 py-2 text-xs text-slate-400">Chưa có nhân sự</div>}
          {options.map(o => {
            const checked = selected.includes(o.full_name);
            return (
              <button type="button" key={o.id} onClick={() => toggle(o.full_name)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-slate-50 text-left">
                <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${checked ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                  {checked && <Check className="w-3 h-3 text-white" />}
                </span>
                <span className="truncate text-slate-700">{o.full_name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
