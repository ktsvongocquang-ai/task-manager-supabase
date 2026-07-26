import React from 'react'
import { format, parseISO } from 'date-fns'

// Shows only "dd/MM" (no year) while keeping a real native date input underneath
// (invisible) so the browser's own calendar picker, keyboard entry, and paste
// handling all keep working exactly as before - same overlay technique already
// used for assignee <select> pills elsewhere in the app.
//
// This also sidesteps an iOS Safari quirk: native <input type="date"> renders
// as a long localized string ("ngày 22 thg 7, 2026") instead of a compact
// numeric box, which breaks narrow row layouts on mobile.
export const CompactDateInput: React.FC<{
    value?: string | null;
    onChange: (value: string) => void;
    onPaste?: (e: React.ClipboardEvent<HTMLInputElement>) => void;
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
    className?: string;
    labelClassName?: string;
    title?: string;
}> = ({ value, onChange, onPaste, onClick, className, labelClassName, title }) => {
    let display = 'dd/mm';
    if (value) {
        try { display = format(parseISO(value), 'dd/MM'); } catch { display = 'dd/mm'; }
    }
    return (
        <div className={`relative inline-flex items-center justify-center shrink-0 ${className || ''}`} onClick={onClick}>
            <span className={labelClassName || 'text-[9px] font-semibold text-slate-500'}>{display}</span>
            <input
                type="date"
                value={value || ''}
                onChange={e => onChange(e.target.value)}
                onPaste={onPaste}
                title={title}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
        </div>
    );
};
