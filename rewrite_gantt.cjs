const fs = require('fs');
const path = require('path');

const ganttPath = path.join(__dirname, 'src/pages/gantt/Gantt.tsx');
let content = fs.readFileSync(ganttPath, 'utf8');

const startMarker = '{/* Desktop Gantt Grid Container */}';
const endMarker = '{/* Mobile List Timeline View */}';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
    console.error('Markers not found');
    process.exit(1);
}

// I will construct the new layout
const newLayout = `
            {/* Desktop Gantt Grid Container (Dual-Pane) */}
            <div className="hidden md:flex bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden relative">
                {/* Left Pane - Fixed Width, Vertical Scroll (hidden scrollbar but synced) */}
                <div 
                    className="w-[600px] flex-shrink-0 bg-white z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] flex flex-col overflow-y-auto" 
                    style={{ maxHeight: '600px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    ref={leftPaneRef}
                    onScroll={handleLeftScroll}
                >
                    {/* CSS to hide scrollbar for webkit */}
                    <style>{\`
                        .no-scrollbar::-webkit-scrollbar {
                            display: none;
                        }
                    \`}</style>
                    <div className="no-scrollbar"></div>
                    
                    {/* Left Header */}
                    <div className="flex sticky top-0 z-30 bg-slate-50 border-b border-r border-slate-200 shadow-sm min-h-[57px]">
                        <div className="w-[300px] px-3 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex-shrink-0 border-r border-slate-200 flex items-center bg-slate-50">
                            MÔ TẢ
                        </div>
                        <div className="w-[100px] px-2 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex-shrink-0 border-r border-slate-200 flex items-center justify-center text-center bg-slate-50">
                            BẮT ĐẦU
                        </div>
                        <div className="w-[100px] px-2 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex-shrink-0 border-r border-slate-200 flex items-center justify-center text-center bg-slate-50">
                            KẾT THÚC
                        </div>
                        <div className="w-[50px] px-2 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex-shrink-0 border-r border-slate-200 flex items-center justify-center bg-slate-50">
                            NGÀY
                        </div>
                        <div className="w-[50px] px-2 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex-shrink-0 flex items-center justify-center bg-slate-50">
                            TIẾN %
                        </div>
                    </div>

                    {/* Left Chart Rows */}
                    <div className="">
                        {ganttItems.length === 0 ? (
                            <div className="py-24 text-center bg-slate-50/30">
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                                    <Calendar size={32} className="text-slate-300" />
                                </div>
                                <p className="text-sm font-bold text-slate-400">Không có dữ liệu hiển thị</p>
                            </div>
                        ) : (
                            ganttItems.map((item) => {
                                const formattedStart = item.startDate ? format(new Date(item.startDate), 'dd/MM/yyyy') : '';
                                const formattedEnd = item.endDate ? format(new Date(item.endDate), 'dd/MM/yyyy') : '';
                                const totalDays = (item.startDate && item.endDate) ? Math.max(1, Math.round((new Date(item.endDate).getTime() - new Date(item.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1) : 0;
                                const progressAmount = item.task?.completion_pct || 0;

                                return (
                                    <div key={item.id} className={\`flex border-b border-slate-200 hover:bg-slate-50 transition-colors group/row h-14 \${item.type === 'project' ? 'bg-[#e0e4db] hover:bg-[#d4d9ce]' : item.type === 'phase' ? 'bg-slate-100 hover:bg-slate-200' : 'bg-white'}\`}>
                                        {/* Tên Mô Tả */}
                                        <div className="w-[300px] px-3 py-2 border-r border-slate-200 flex-shrink-0 flex flex-col justify-center relative">
                                            {item.type === 'project' ? (
                                                <div
                                                    className="flex items-center gap-2 cursor-pointer w-full select-none"
                                                    onClick={() => toggleProject(item.id)}
                                                >
                                                    {item.isExpanded ? <ChevronDown size={14} className="text-slate-800 shrink-0" /> : <ChevronRight size={14} className="text-slate-800 shrink-0" />}
                                                    <span className="text-xs font-bold text-slate-800 truncate uppercase">{item.name}</span>
                                                </div>
                                            ) : item.type === 'phase' ? (
                                                <div
                                                    className="flex items-center justify-between cursor-pointer w-full select-none pl-4 pr-2"
                                                >
                                                    <div className="flex items-center gap-2 flex-1 min-w-0" onClick={() => togglePhase(item.id)}>
                                                        {item.isExpanded ? <ChevronDown size={14} className="text-slate-700 shrink-0" /> : <ChevronRight size={14} className="text-slate-700 shrink-0" />}
                                                        <span className="text-xs font-bold text-slate-800 truncate uppercase">{item.name}</span>
                                                    </div>
                                                    <button 
                                                        onClick={(e) => handleQuickAdd(null, item.task.project_id, item.phaseKey, e)}
                                                        className="opacity-0 group-hover/row:opacity-100 hover:bg-slate-200 p-1 rounded-md transition-all text-slate-500 hover:text-blue-600"
                                                        title="Thêm nhiệm vụ mới vào giai đoạn này"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-start gap-3 w-full pl-10 pr-6 relative group/task h-full flex-col justify-center">
                                                    <div className="min-w-0 flex-1 w-full flex flex-col justify-center">
                                                        <div className="text-[11px] text-slate-700 cursor-pointer hover:text-blue-600 transition-colors truncate w-full" title={item.name} onClick={() => { setEditingTask(item.task); setIsEditModalOpen(true); }}>
                                                            {item.name}
                                                        </div>
                                                        {/* Assignee if any */}
                                                        <div 
                                                            className="text-[9px] text-slate-500 mt-0.5 flex items-center gap-1 cursor-pointer hover:bg-slate-100 px-1 -ml-1 rounded transition-colors"
                                                            onDoubleClick={(e) => handleCellClick(item, 'assignee_id', item.task.assignee_id || '', e)}
                                                        >
                                                            <User size={10} /> 
                                                            {editingCell?.id === item.id && editingCell?.field === 'assignee_id' ? (
                                                                <select
                                                                    value={editValue}
                                                                    onChange={(e) => setEditValue(e.target.value)}
                                                                    onBlur={() => saveCellEdit(item)}
                                                                    onKeyDown={(e) => { if (e.key === 'Enter') saveCellEdit(item); if (e.key === 'Escape') setEditingCell(null); }}
                                                                    autoFocus
                                                                    className="text-[9px] py-0 px-1 h-5 bg-white border border-blue-400 rounded outline-none"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <option value="">Chọn người gán</option>
                                                                    {profiles.map(p => (
                                                                        <option key={p.id} value={p.id}>{p.full_name}</option>
                                                                    ))}
                                                                </select>
                                                            ) : (
                                                                <span className="truncate max-w-[150px]">{getAssigneeName(item.task.assignee_id)}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/task:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={(e) => handleQuickAdd(item.task.parent_id, item.task.project_id, item.task.target || null, e)}
                                                            className="hover:bg-blue-100 p-1 rounded-md transition-all text-blue-500 hover:text-blue-600 bg-white shadow-sm"
                                                            title="Chèn nhiệm vụ mới"
                                                        >
                                                            <Plus size={12} />
                                                        </button>
                                                        <button 
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                if (confirm('Bạn có chắc chắn muốn xóa tác vụ này?')) {
                                                                    await supabase.from('tasks').delete().eq('id', item.id);
                                                                    setTasks(prev => prev.filter(t => t.id !== item.id));
                                                                }
                                                            }}
                                                            className="hover:bg-red-100 p-1 rounded-md transition-all text-red-500 hover:text-red-600 bg-white shadow-sm"
                                                            title="Xóa nhiệm vụ"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </div>                                                    
                                            )}
                                        </div>

                                        {/* Bắt Đầu */}
                                        <div 
                                            className={\`w-[100px] px-2 py-2 border-r border-slate-200 flex-shrink-0 flex items-center justify-center text-center text-[10px] \${item.type === 'project' ? 'font-bold text-slate-800' : 'text-slate-600 hover:bg-slate-100/50 cursor-pointer'}\`}
                                            onDoubleClick={(e) => handleCellClick(item, 'start_date', item.startDate ? new Date(item.startDate).toISOString().split('T')[0] : '', e)}
                                        >
                                            {editingCell?.id === item.id && editingCell?.field === 'start_date' ? (
                                                <input 
                                                    type="date"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onBlur={() => saveCellEdit(item)}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') saveCellEdit(item); if (e.key === 'Escape') setEditingCell(null); }}
                                                    autoFocus
                                                    className="w-full text-[10px] bg-white border border-blue-400 rounded px-1 outline-none text-center"
                                                    onClick={e => e.stopPropagation()}
                                                />
                                            ) : (
                                                <span className={item.type !== 'project' && !formattedStart ? 'text-slate-300 italic' : ''}>
                                                    {formattedStart || '—'}
                                                </span>
                                            )}
                                        </div>

                                        {/* Kết Thúc */}
                                        <div 
                                            className={\`w-[100px] px-2 py-2 border-r border-slate-200 flex-shrink-0 flex items-center justify-center text-center text-[10px] \${item.type === 'project' ? 'font-bold text-slate-800' : 'text-slate-600 hover:bg-slate-100/50 cursor-pointer'}\`}
                                            onDoubleClick={(e) => handleCellClick(item, 'end_date', item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : '', e)}
                                        >
                                            {editingCell?.id === item.id && editingCell?.field === 'end_date' ? (
                                                <input 
                                                    type="date"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onBlur={() => saveCellEdit(item)}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') saveCellEdit(item); if (e.key === 'Escape') setEditingCell(null); }}
                                                    autoFocus
                                                    className="w-full text-[10px] bg-white border border-blue-400 rounded px-1 outline-none text-center"
                                                    onClick={e => e.stopPropagation()}
                                                />
                                            ) : (
                                                <span className={item.type !== 'project' && !formattedEnd ? 'text-slate-300 italic' : ''}>
                                                    {formattedEnd || '—'}
                                                </span>
                                            )}
                                        </div>

                                        {/* Số Lượng Ngày */}
                                        <div 
                                            className={\`w-[50px] px-2 py-2 border-r border-slate-200 flex-shrink-0 flex items-center justify-center text-[10px] \${item.type === 'project' ? 'font-bold text-slate-800' : 'text-slate-600 hover:bg-slate-100/50 cursor-pointer'}\`}
                                            onDoubleClick={(e) => handleCellClick(item, 'duration', totalDays.toString(), e)}
                                        >
                                            {editingCell?.id === item.id && editingCell?.field === 'duration' ? (
                                                <input 
                                                    type="number"
                                                    min="1"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onBlur={() => saveCellEdit(item)}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') saveCellEdit(item); if (e.key === 'Escape') setEditingCell(null); }}
                                                    autoFocus
                                                    className="w-full text-[10px] bg-white border border-blue-400 rounded px-1 outline-none text-center"
                                                    onClick={e => e.stopPropagation()}
                                                />
                                            ) : (
                                                totalDays > 0 ? totalDays : '-'
                                            )}
                                        </div>

                                        {/* Tiến Độ % */}
                                        <div className={\`w-[50px] px-2 py-2 flex-shrink-0 flex items-center justify-center text-[10px] \${item.type === 'project' ? 'font-bold text-slate-800' : 'text-slate-600'}\`}>
                                            {item.type !== 'project' ? \`\${progressAmount}%\` : \`\${item.projectPct || 0}%\`}
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* Right Pane - Horizontal and Vertical Scroll */}
                <div 
                    className="flex-1 overflow-auto min-w-0" 
                    style={{ maxHeight: '600px' }}
                    ref={rightPaneRef}
                    onScroll={handleRightScroll}
                >
                    <div className="min-w-max relative">
                        {/* Right Header */}
                        <div className="flex border-b border-slate-200 sticky top-0 z-30 bg-white shadow-sm min-h-[57px]">
                            {days.map(day => (
                                <div
                                    key={day}
                                    style={{ width: \`\${cellWidth}px\`, minWidth: \`\${cellWidth}px\` }}
                                    className={\`text-center flex flex-col items-center justify-center py-2 border-r border-slate-100 transition-colors \${isToday(day) ? 'bg-orange-500' :
                                        isWeekend(day) ? 'bg-slate-100/50' : 'bg-blue-50/50'
                                        }\`}
                                >
                                    <div className={\`text-[11px] font-bold \${isToday(day) ? 'text-white' : 'text-slate-700'}\`}>{day}</div>
                                    <div className={\`text-[8px] font-bold uppercase tracking-tighter \${isToday(day) ? 'text-white/80' :
                                        isWeekend(day) ? 'text-red-400' : 'text-blue-400'
                                        }\`}>
                                        {getDayName(day)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Right Chart Rows */}
                        <div className="">
                            {ganttItems.length === 0 ? (
                                <div className="h-[200px]"></div> // Empty placeholder to align with left pane's 24 padding
                            ) : (
                                ganttItems.map((item) => {
                                    // Calculate total days including weekends (just for passing to right pane if needed)
                                    const progressAmount = item.task?.completion_pct || 0;

                                    return (
                                        <div key={item.id} className={\`flex border-b border-slate-200 hover:bg-slate-50 transition-colors h-14 group/row \${item.type === 'project' ? 'bg-[#e0e4db] hover:bg-[#d4d9ce]' : item.type === 'phase' ? 'bg-slate-100 hover:bg-slate-200' : 'bg-white'}\`}>
                                            
                                            {/* Timeline Grid (Right Side) */}
                                            <div className="flex-1 flex relative w-full h-full">
                                                {Array.from({ length: daysInMonth }).map((_, index) => {
                                                    const day = index + 1;
                                                    // Determine if this day falls within the item's duration
                                                    let isWithinRange = false;
                                                    
                                                    // Determine logical range limits based on dragging
                                                    let logicalStartDay = item.startDay;
                                                    let logicalDuration = item.duration;
                                                    
                                                    if (draggingItem && draggingItem.id === item.id && draggingItem.type === item.type) {
                                                        if (draggingItem.action === 'move') {
                                                            logicalStartDay += draggingItem.deltaDays;
                                                        } else if (draggingItem.action === 'resize-left') {
                                                            const maxDelta = item.duration - 1;
                                                            const delta = Math.min(draggingItem.deltaDays, maxDelta);
                                                            logicalStartDay += delta;
                                                            logicalDuration -= delta;
                                                        } else if (draggingItem.action === 'resize-right') {
                                                            const minDelta = -(item.duration - 1);
                                                            const delta = Math.max(draggingItem.deltaDays, minDelta);
                                                            logicalDuration += delta;
                                                        }
                                                    }
                                                    
                                                    const logicalEndDay = logicalStartDay + logicalDuration - 1;

                                                    if (day >= logicalStartDay && day <= logicalEndDay) {
                                                        isWithinRange = true;
                                                    }

                                                    // Cell Background Color Logic
                                                    let cellBgClass = "";
                                                    if (isWithinRange) {
                                                        if (item.type === 'project') cellBgClass = "bg-[#4a80bc]"; // Xanh biển đậm
                                                        else if (item.type === 'phase') cellBgClass = "bg-[#4a80bc]"; // Xanh biển
                                                        else cellBgClass = "bg-[#71d9a2]"; // Xanh lá mạ
                                                    } else {
                                                        if (isWeekend(day)) cellBgClass = "bg-slate-100/50";
                                                    }
                                                    
                                                    return (
                                                        <div
                                                            key={day}
                                                            style={{ 
                                                                width: \`\${cellWidth}px\`, 
                                                                minWidth: \`\${cellWidth}px\`,
                                                                left: \`\${(day - 1) * cellWidth}px\`
                                                            }}
                                                            className={\`absolute top-0 bottom-0 border-r border-slate-200/50 flex flex-col justify-center items-center transition-colors group/cell \${cellBgClass}
                                                                \${isWithinRange && item.type !== 'project' ? 'hover:brightness-95 cursor-grab active:cursor-grabbing' : ''}
                                                            \`}
                                                            onMouseDown={(e) => {
                                                                if (isWithinRange && item.type !== 'project') {
                                                                    e.stopPropagation();
                                                                    e.preventDefault();
                                                                    
                                                                    // Determine action (resize if near edges)
                                                                    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                                                    const clickX = e.clientX - rect.left;
                                                                    let action: 'move' | 'resize-left' | 'resize-right' = 'move';
                                                                    
                                                                    if (day === logicalStartDay && clickX < 10) action = 'resize-left';
                                                                    else if (day === logicalEndDay && clickX > rect.width - 10) action = 'resize-right';
                                                                    
                                                                    setDraggingItem({ id: item.id, type: item.type, startX: e.clientX, deltaDays: 0, action });
                                                                }
                                                            }}
                                                            onDoubleClick={() => {
                                                                if (item.type === 'task') {
                                                                    setEditingTask(item.task);
                                                                    setIsEditModalOpen(true);
                                                                }
                                                            }}
                                                        >
                                                            {/* If it's the first day of the range, we can optionally show progress text */}
                                                            {day === logicalStartDay && isWithinRange && item.type !== 'project' && (
                                                                <span className="text-[8px] font-bold text-slate-800 whitespace-nowrap z-10 select-none px-1 block truncate w-full text-center">
                                                                    {progressAmount > 0 ? \`\${progressAmount}%\` : ''}
                                                                </span>
                                                            )}
                                                            
                                                            {/* Resize handle visuals (optional tooltip for edges) */}
                                                            {isWithinRange && day === logicalStartDay && item.type !== 'project' && (
                                                                <div className="absolute left-0 top-0 bottom-0 w-1 hover:cursor-col-resize z-20"></div>
                                                            )}
                                                            {isWithinRange && day === logicalEndDay && item.type !== 'project' && (
                                                                <div className="absolute right-0 top-0 bottom-0 w-1 hover:cursor-col-resize z-20"></div>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
`;

const newContent = content.substring(0, startIndex) + newLayout + '\n            ' + endMarker + content.substring(endIndex + endMarker.length);
fs.writeFileSync(ganttPath, newContent);
console.log('Successfully rewrote Gantt.tsx');
