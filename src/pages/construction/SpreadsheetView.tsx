import React, { useState, useRef, useEffect } from 'react';
import { format, addDays, differenceInDays, parseISO } from 'date-fns';
import type { CTask } from './types';
import { Save } from 'lucide-react';

interface SpreadsheetViewProps {
  tasks: CTask[];
  onUpdateTask: (id: string, updates: Partial<CTask>) => void;
  readOnly?: boolean;
}

export function SpreadsheetView({ tasks, onUpdateTask, readOnly = false }: SpreadsheetViewProps) {
  const [focusedCell, setFocusedCell] = useState<{ rowId: string; col: string } | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const COLUMNS = [
    { id: 'stt', label: 'STT', width: 50 },
    { id: 'name', label: 'MÔ TẢ', width: 'auto' },
    { id: 'start', label: 'BẮT ĐẦU', width: 140 },
    { id: 'end', label: 'KẾT THÚC', width: 140 },
    { id: 'days', label: 'NGÀY', width: 80 },
    { id: 'progress', label: 'TIẾN ĐỘ', width: 80 }
  ];

  // Group tasks by category
  const grouped = tasks.reduce((acc, task) => {
    if (!acc[task.category]) acc[task.category] = [];
    acc[task.category].push(task);
    return acc;
  }, {} as Record<string, CTask[]>);

  let globalStt = 0;
  let flatRowIdx = 0;

  const handleKeyDown = (e: React.KeyboardEvent, rowId: string, colId: string, rIdx: number, cIdx: number) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) {
      if (e.key !== 'Enter') e.preventDefault();
      
      let nextRowIdx = rIdx;
      let nextColIdx = cIdx;

      // Extract all task IDs in display order for vertical navigation
      const flatTasks = Object.entries(grouped).flatMap(([cat, catTasks]) => catTasks);
      
      if (e.key === 'ArrowUp') nextRowIdx = Math.max(0, rIdx - 1);
      if (e.key === 'ArrowDown' || e.key === 'Enter') nextRowIdx = Math.min(flatTasks.length - 1, rIdx + 1);
      if (e.key === 'ArrowLeft') nextColIdx = Math.max(1, cIdx - 1); // skip STT
      if (e.key === 'ArrowRight') nextColIdx = Math.min(COLUMNS.length - 1, cIdx + 1);

      const nextTaskId = flatTasks[nextRowIdx]?.id;
      const nextCol = COLUMNS[nextColIdx]?.id;

      if (nextTaskId && nextCol) {
        const key = `${nextTaskId}-${nextCol}`;
        if (inputRefs.current[key]) {
          inputRefs.current[key]?.focus();
          // Select text if it's a text input
          if (inputRefs.current[key]?.type === 'text' || inputRefs.current[key]?.type === 'number') {
            inputRefs.current[key]?.select();
          }
        }
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent, startRowId: string, startColId: string, rIdx: number, cIdx: number) => {
    e.preventDefault();
    const clipboardData = e.clipboardData.getData('Text');
    const rows = clipboardData.split('\n').map(row => row.split('\t'));
    
    const flatTasks = Object.entries(grouped).flatMap(([cat, catTasks]) => catTasks);

    rows.forEach((rowValues, i) => {
      const targetRow = flatTasks[rIdx + i];
      if (!targetRow) return;

      const updates: Partial<CTask> = {};
      rowValues.forEach((val, j) => {
        const targetCol = COLUMNS[cIdx + j];
        if (!targetCol || !val.trim()) return;

        const cleanVal = val.trim();
        switch (targetCol.id) {
          case 'name':
            updates.name = cleanVal;
            break;
          case 'start':
            // Assume format dd/MM/yyyy or yyyy-MM-dd
            if (cleanVal.includes('/')) {
              const [d, m, y] = cleanVal.split('/');
              if (d && m && y) updates.plannedStart = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
            } else {
              updates.plannedStart = cleanVal;
            }
            break;
          case 'days':
            const d = parseInt(cleanVal, 10);
            if (!isNaN(d)) updates.duration = d;
            break;
          case 'progress':
            const p = parseInt(cleanVal.replace('%', ''), 10);
            if (!isNaN(p)) updates.progress = Math.min(100, Math.max(0, p));
            break;
        }
      });
      if (Object.keys(updates).length > 0) {
        onUpdateTask(targetRow.id, updates);
      }
    });
  };

  const handleChange = (task: CTask, colId: string, val: string) => {
    if (readOnly) return;
    const updates: Partial<CTask> = {};
    if (colId === 'name') updates.name = val;
    if (colId === 'start') updates.plannedStart = val;
    if (colId === 'days') updates.duration = parseInt(val) || 1;
    if (colId === 'progress') updates.progress = parseInt(val) || 0;
    
    onUpdateTask(task.id, updates);
  };

  const renderCell = (task: CTask, col: typeof COLUMNS[0], rIdx: number, cIdx: number) => {
    const isMaster = task.category === 'MASTER';
    const cellClass = `border border-slate-200 p-0 m-0 relative ${isMaster ? 'bg-[#d1e7dd]' : 'bg-white'}`;
    const inputClass = `w-full h-full min-h-[36px] px-2 outline-none focus:ring-2 focus:ring-indigo-500 focus:relative focus:z-10 bg-transparent ${isMaster ? 'font-bold text-emerald-800' : 'text-slate-800'} ${readOnly ? 'cursor-default' : ''}`;

    let value = '';
    let type = 'text';
    
    if (col.id === 'stt') {
      return <td key={col.id} className={`${cellClass} text-center text-slate-500 font-bold bg-slate-50`}>{isMaster ? '★' : globalStt}</td>;
    }

    if (col.id === 'name') value = task.name;
    if (col.id === 'start') {
      value = task.plannedStart || task.startDate || '';
      type = 'date';
    }
    if (col.id === 'end') {
      const s = task.plannedStart || task.startDate;
      const d = task.duration || task.days || 1;
      if (s) {
        value = format(addDays(parseISO(s), d - 1), 'yyyy-MM-dd');
      }
      return <td key={col.id} className={`${cellClass} text-center bg-slate-50 px-2 text-slate-600 font-medium`}>{value ? format(parseISO(value), 'dd/MM/yyyy') : ''}</td>;
    }
    if (col.id === 'days') {
      value = (task.duration || task.days || 1).toString();
      type = 'number';
    }
    if (col.id === 'progress') {
      value = (task.progress || 0).toString();
      type = 'number';
    }

    return (
      <td key={col.id} className={cellClass}>
        <input
          ref={el => inputRefs.current[`${task.id}-${col.id}`] = el}
          type={type}
          value={value}
          readOnly={readOnly || (isMaster && col.id === 'name')}
          className={inputClass + (col.id === 'progress' || col.id === 'days' ? ' text-center' : '')}
          onChange={(e) => handleChange(task, col.id, e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, task.id, col.id, rIdx, cIdx)}
          onPaste={(e) => handlePaste(e, task.id, col.id, rIdx, cIdx)}
          onFocus={() => setFocusedCell({ rowId: task.id, col: col.id })}
        />
      </td>
    );
  };

  return (
    <div className="w-full overflow-auto bg-white rounded-xl shadow-sm border border-slate-200 select-none pb-32">
      <table className="w-full border-collapse" style={{ tableLayout: 'auto' }}>
        <thead className="bg-slate-100">
          <tr>
            {COLUMNS.map(c => (
              <th key={c.id} className="border border-slate-200 px-2 py-2 text-sm font-bold text-slate-600" style={{ width: c.width }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Master Row */}
          {grouped['MASTER'] && grouped['MASTER'].map(task => {
            const masterRow = (
              <tr key={task.id} className="h-10 hover:bg-slate-50">
                {COLUMNS.map((col, cIdx) => renderCell(task, col, flatRowIdx, cIdx))}
              </tr>
            );
            flatRowIdx++;
            return masterRow;
          })}

          {/* Categories */}
          {Object.entries(grouped).filter(([cat]) => cat !== 'MASTER').map(([cat, catTasks], ci) => (
            <React.Fragment key={cat}>
              <tr className="bg-slate-200/80">
                <td className="border border-slate-200 text-center font-bold text-slate-700 py-1">{ci + 1}</td>
                <td colSpan={COLUMNS.length - 1} className="border border-slate-200 px-2 py-1 font-bold text-slate-800 uppercase">
                  {cat}
                </td>
              </tr>
              {catTasks.map(task => {
                globalStt++;
                const taskRow = (
                  <tr key={task.id} className="h-9 hover:bg-indigo-50/50">
                    {COLUMNS.map((col, cIdx) => renderCell(task, col, flatRowIdx, cIdx))}
                  </tr>
                );
                flatRowIdx++;
                return taskRow;
              })}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
