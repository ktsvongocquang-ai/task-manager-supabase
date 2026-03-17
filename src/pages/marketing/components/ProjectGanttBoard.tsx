import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../../../services/supabase';
import type { Project, DailyLog } from '../../../types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, differenceInDays, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar, ChevronLeft, ChevronRight, Video, Plus, X, Edit2, Trash2 } from 'lucide-react';
import { TimelineUpdateModal } from './TimelineUpdateModal';

interface ProjectGanttBoardProps {}

export const ProjectGanttBoard: React.FC<ProjectGanttBoardProps> = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const fetchConstructionData = async () => {
        try {
            // Fetch projects with their milestones and daily logs
            const { data: projectsData, error: projErr } = await supabase
                .from('marketing_projects')
                .select(`
                    id, project_code, name, status, project_type, address,
                    actual_start_date, design_days, rough_construction_days, finishing_days, interior_days, handover_date
                `)
                .not('status', 'in', '("Hoàn thành", "Hủy bỏ")')
                .order('created_at', { ascending: false });

            if (projErr) throw projErr;

            if (projectsData && projectsData.length > 0) {
                const projectIds = projectsData.map((p: any) => p.id);
                
                const [{ data: milestonesData }, { data: logsData }] = await Promise.all([
                    supabase.from('marketing_shooting_milestones').select('*').in('project_id', projectIds),
                    supabase.from('marketing_daily_logs').select('*').in('project_id', projectIds).order('log_date', { ascending: false })
                ]);

                const combinedProjects = projectsData.map((p: any) => ({
                    ...p,
                    marketing_shooting_milestones: milestonesData?.filter((m: any) => m.project_id === p.id) || [],
                    marketing_daily_logs: logsData?.filter((l: any) => l.project_id === p.id) || []
                })) as Project[];

                setProjects(combinedProjects);
            } else {
                setProjects([]);
            }
        } catch (err: any) {
            console.error("Error fetching construction data:", err);
            if (err.message?.includes('actual_start_date') || err.code === '42703') {
                alert("Thiếu cột trong database! Vui lòng chạy SQL script để bổ sung các cột tiến độ cho marketing_projects.");
            }
        }
    };

    useEffect(() => {
        fetchConstructionData();
    }, []);

    const generateNextProjectCode = async () => {
        try {
            // Fetch all projects to find the true max ID
            const { data } = await supabase
                .from('marketing_projects')
                .select('project_code')
                .order('project_code', { ascending: false });
            
            let maxId = 0;
            if (data) {
                data.forEach(p => {
                    if (p.project_code) {
                        const match = p.project_code.match(/^DA(\d+)$/i);
                        if (match) {
                            const num = parseInt(match[1], 10);
                            if (num > maxId) maxId = num;
                        }
                    }
                });
            }
            return `DA${String(maxId + 1).padStart(3, '0')}`;
        } catch (e) {
            console.error("Error generating code", e);
            return `DA${Math.floor(Math.random() * 900) + 100}`; // Fallback
        }
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newProjectName.trim()) return;
        setIsCreating(true);
        try {
            const nextCode = await generateNextProjectCode();
            const { data, error } = await supabase
                .from('marketing_projects')
                .insert({
                    name: newProjectName,
                    project_code: nextCode,
                    status: 'Chưa bắt đầu',
                    start_date: new Date().toISOString().split('T')[0],
                    end_date: new Date().toISOString().split('T')[0]
                })
                .select()
                .single();
            if (error) throw error;
            if (data) {
                setSelectedProject(data as Project);
                setIsCreateModalOpen(false);
                setNewProjectName('');
                setIsTimelineModalOpen(true);
            }
        } catch (error: any) {
            console.error(error);
            alert(`Lỗi tạo dự án: ${error.message || 'Lỗi không xác định'}. \n\nLưu ý: Bạn có thể cần chạy script bổ sung cột cho marketing_projects.`);
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteProject = async (id: string, name: string) => {
        if (!confirm(`Bạn có chắc chắn muốn xóa dự án "${name}"? Thao tác này không thể hoàn tác.`)) return;
        try {
            const { error } = await supabase.from('marketing_projects').delete().eq('id', id);
            if (error) throw error;
            setProjects(prev => prev.filter(p => p.id !== id));
        } catch (e: any) {
            console.error(e);
            alert(`Lỗi khi xóa dự án: ${e.message}`);
        }
    };

    // Get a 3-month window around the current date to render
    const startDate = startOfMonth(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const endDate = endOfMonth(new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0));
    const daysInterval = useMemo(() => eachDayOfInterval({ start: startDate, end: endDate }), [startDate, endDate]);

    const DAY_WIDTH = 40; // width of a single day column in px

    const handlePrevMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    // Auto scroll to current day on mount
    useEffect(() => {
        if (scrollContainerRef.current) {
            const today = new Date();
            const daysFromStart = differenceInDays(today, startDate);
            const scrollPos = Math.max(0, (daysFromStart * DAY_WIDTH) - (scrollContainerRef.current.clientWidth / 2));
            scrollContainerRef.current.scrollLeft = scrollPos;
        }
    }, [startDate]);

    const renderGanttBar = (project: Project) => {
        if (!project.actual_start_date) return null;

        const start = parseISO(project.actual_start_date);
        const designDays = project.design_days || 0;
        const roughDays = project.rough_construction_days || 0;
        const finishDays = project.finishing_days || 0;
        const interiorDays = project.interior_days || 0;

        const totalDays = designDays + roughDays + finishDays + interiorDays;
        if (totalDays === 0) return null;

        const offsetDays = differenceInDays(start, startDate);
        if (offsetDays + totalDays < 0 || offsetDays > daysInterval.length) return null; // out of view

        const renderSegment = (segmentDays: number, colorClass: string, label: string, offsetProgress: number) => {
            if (segmentDays <= 0) return null;
            const width = segmentDays * DAY_WIDTH;
            const isFullRounded = totalDays === segmentDays;
            const isFirst = offsetProgress === 0;
            const isLast = offsetProgress + segmentDays === totalDays;

            let roundedClass = '';
            if (isFullRounded) roundedClass = 'rounded-full';
            else if (isFirst) roundedClass = 'rounded-l-full';
            else if (isLast) roundedClass = 'rounded-r-full';

            return (
                <div
                    key={label}
                    className={`h-8 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden transition-all hover:brightness-110 ${colorClass} ${roundedClass}`}
                    style={{ width: `${width}px` }}
                    title={`${label} (${segmentDays} ngày)`}
                >
                    {width > 60 ? label : ''}
                </div>
            );
        };

        const segments = [];
        let currOffset = 0;

        if (designDays > 0) {
            segments.push(renderSegment(designDays, 'bg-indigo-500 shadow-indigo-500/30', 'Thiết kế', currOffset));
            currOffset += designDays;
        }
        if (roughDays > 0) {
            segments.push(renderSegment(roughDays, 'bg-orange-500 shadow-orange-500/30', 'Thi công thô', currOffset));
            currOffset += roughDays;
        }
        if (finishDays > 0) {
            segments.push(renderSegment(finishDays, 'bg-blue-500 shadow-blue-500/30', 'Hoàn thiện', currOffset));
            currOffset += finishDays;
        }
        if (interiorDays > 0) {
            segments.push(renderSegment(interiorDays, 'bg-emerald-500 shadow-emerald-500/30', 'Nội thất', currOffset));
        }

        return (
            <div
                className="absolute top-1/2 -translate-y-1/2 flex shadow-sm group cursor-pointer"
                style={{ left: `${offsetDays * DAY_WIDTH}px` }}
                onClick={() => {
                    setSelectedProject(project);
                    setIsTimelineModalOpen(true);
                }}
            >
                {segments}
            </div>
        );
    };

    const renderEmptyTimeline = (project: Project) => {
        // Find a reasonable position for the setup button - maybe today
        const today = new Date();
        const offsetDays = differenceInDays(today, startDate);
        if (offsetDays < 0 || offsetDays > daysInterval.length) return null;

        return (
            <div 
                className="absolute top-1/2 -translate-y-1/2 cursor-pointer flex items-center"
                style={{ left: `${offsetDays * DAY_WIDTH}px` }}
                onClick={() => {
                    setSelectedProject(project);
                    setIsTimelineModalOpen(true);
                }}
            >
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-dashed border-indigo-300 rounded-full text-[10px] font-bold text-indigo-500 hover:bg-indigo-50 hover:border-indigo-500 transition-all shadow-sm">
                    <Plus size={12} />
                    Thiết lập tiến độ
                </div>
            </div>
        );
    };

    const renderMilestones = (project: Project) => {
        const projectMilestones = project.marketing_shooting_milestones || [];
        if (projectMilestones.length === 0) return null;

        return projectMilestones.map((ms: any) => {
            const msDate = parseISO(ms.milestone_date);
            const offsetDays = differenceInDays(msDate, startDate);
            if (offsetDays < 0 || offsetDays > daysInterval.length) return null;

            return (
                <div
                    key={ms.id}
                    className="absolute top-0 bottom-0 flex flex-col items-center justify-center group z-10 cursor-help"
                    style={{ left: `${offsetDays * DAY_WIDTH}px`, width: `${DAY_WIDTH}px` }}
                >
                    <div className="w-[1px] h-full bg-rose-200 group-hover:bg-rose-500 transition-colors absolute left-1/2 -translate-x-1/2 -z-10"></div>
                    <div className="w-6 h-6 rounded-full bg-white border-2 border-rose-500 text-rose-500 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <Video size={12} />
                    </div>
                    {/* Tooltip */}
                    <div className="hidden group-hover:block absolute bottom-full mb-2 w-48 bg-gray-900 text-white text-xs p-2 rounded-lg shadow-xl z-50">
                        <div className="font-bold mb-1 text-rose-300">Mốc quay: {format(msDate, 'dd/MM/yyyy')}</div>
                        <div className="px-1">{ms.content}</div>
                        <div className="mt-1 text-right text-[10px] text-gray-400">Trạng thái: {ms.status}</div>
                    </div>
                </div>
            );
        });
    };

    // Filter projects that have timeline data or we can just show all active ones
    const activeProjects = projects.filter((p: Project) => p.status !== 'Hoàn thành' && p.status !== 'Hủy bỏ');

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Calendar className="text-indigo-500" size={24} />
                        Tiến độ thi công & Lịch quay
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Theo dõi tiến độ thực tế các công trình để lên lịch quay phù hợp.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Dự Án Mới
                    </button>
                    <div className="flex bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-50 text-gray-600 transition-colors">
                            <ChevronLeft size={20} />
                        </button>
                        <div className="px-4 flex items-center font-bold text-sm text-gray-700 border-x border-gray-100 min-w-[140px] justify-center text-center capitalize">
                            {format(currentDate, 'MMMM yyyy', { locale: vi })}
                        </div>
                        <button onClick={handleNextMonth} className="p-2 hover:bg-gray-50 text-gray-600 transition-colors">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Gantt Body */}
            <div className="flex flex-1 overflow-hidden relative">
                {/* Left Column: Project List (30%) */}
                <div className="w-[30%] min-w-[300px] border-r border-gray-100 bg-white z-20 flex flex-col shadow-[4px_0_10px_rgba(0,0,0,0.02)]">
                    <div className="h-16 border-b border-gray-100 flex items-end pb-3 px-6 shrink-0 bg-gray-50/30">
                        <span className="font-bold text-sm text-gray-700 uppercase tracking-wider">Danh sách Dự án</span>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {activeProjects.map(project => (
                            <div 
                                key={project.id} 
                                className="h-20 border-b border-gray-50 px-6 flex flex-col justify-center hover:bg-indigo-50/30 transition-colors cursor-pointer group relative"
                                onClick={() => {
                                    setSelectedProject(project);
                                    setIsTimelineModalOpen(true);
                                }}
                            >
                                <div className="font-bold text-sm text-gray-800 truncate group-hover:text-indigo-600 transition-colors pr-12">{project.name}</div>
                                <div className="font-bold text-sm text-gray-800 truncate group-hover:text-indigo-600 transition-colors pr-12">{project.name}</div>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 bg-opacity-70">
                                        {project.status}
                                    </span>
                                    {project.project_code && (
                                        <span className="text-[10px] text-gray-400 font-mono">{project.project_code}</span>
                                    )}
                                    {project.project_type && (
                                        <span className="text-[10px] font-bold text-indigo-500">{project.project_type}</span>
                                    )}
                                    {project.address && (
                                        <span className="text-[10px] text-gray-500 italic truncate max-w-[150px]">{project.address}</span>
                                    )}
                                    {(() => {
                                        if (!project.actual_start_date) return null;
                                        const start = parseISO(project.actual_start_date);
                                        const today = new Date();
                                        const daysPassed = differenceInDays(today, start);
                                        
                                        if (daysPassed < 0) return <span className="text-[10px] text-orange-500 font-bold">Sắp bắt đầu</span>;
                                        
                                        let current = 0;
                                        if (daysPassed < (current += (project.design_days || 0))) 
                                            return <span className="text-[10px] text-indigo-500 font-bold">GĐ: Thiết kế</span>;
                                        if (daysPassed < (current += (project.rough_construction_days || 0))) 
                                            return <span className="text-[10px] text-orange-500 font-bold">GĐ: Thi công thô</span>;
                                        if (daysPassed < (current += (project.finishing_days || 0))) 
                                            return <span className="text-[10px] text-green-500 font-bold">GĐ: Hoàn thiện</span>;
                                        if (daysPassed < (current += (project.interior_days || 0))) 
                                            return <span className="text-[10px] text-teal-500 font-bold">GĐ: Nội thất</span>;
                                        
                                        return <span className="text-[10px] text-gray-500 font-bold">Đã quá hạn/Bàn giao</span>;
                                    })()}
                                </div>
                                
                                {/* Hover Actions */}
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedProject(project);
                                            setIsTimelineModalOpen(true);
                                        }}
                                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                        title="Chỉnh sửa"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteProject(project.id, project.name);
                                        }}
                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Xóa"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                {project.marketing_daily_logs && project.marketing_daily_logs.length > 0 && (
                                    <div className="flex gap-1 mt-1.5 opacity-50 group-hover:opacity-100 transition-opacity">
                                        {project.marketing_daily_logs.slice(0, 5).map((log: DailyLog) => (
                                            <div key={log.id} className="w-1.5 h-1.5 rounded-full bg-slate-400" title={`Nhật ký: ${format(parseISO(log.log_date), 'dd/MM/yyyy')}`}></div>
                                        ))}
                                        {project.marketing_daily_logs.length > 5 && <span className="text-[8px] text-gray-400">+{project.marketing_daily_logs.length - 5}</span>}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column: Gantt Chart (70%) */}
                <div 
                    className="flex-1 overflow-x-auto overflow-y-hidden bg-gray-50/20 custom-scrollbar relative gantt-scroll-container pb-4"
                    ref={scrollContainerRef}
                >
                    <div className="flex flex-col h-full min-w-max">
                        {/* Timeline Header (Months & Days) */}
                        <div className="h-16 border-b border-gray-100 bg-white sticky top-0 z-30 shrink-0 shadow-[0_4px_10px_rgba(0,0,0,0.01)]">
                            {/* Months Row */}
                            <div className="flex h-8">
                                {useMemo(() => {
                                    const months: React.ReactNode[] = [];
                                    let currentMonthStr = '';
                                    let monthSpan = 0;

                                    daysInterval.forEach((date, i) => {
                                        const monthStr = format(date, 'MM/yyyy');
                                        if (i === 0) {
                                            currentMonthStr = monthStr;
                                            monthSpan = 1;
                                        } else if (monthStr === currentMonthStr) {
                                            monthSpan++;
                                        } else {
                                            months.push(
                                                <div key={`${currentMonthStr}-${i}`} className="border-r border-gray-100 relative bg-gray-50/50" style={{ width: `${monthSpan * DAY_WIDTH}px` }}>
                                                    <div className="sticky left-0 px-4 h-full flex items-center font-bold text-xs text-gray-600 w-max max-w-full truncate">
                                                        Tháng {currentMonthStr}
                                                    </div>
                                                </div>
                                            );
                                            currentMonthStr = monthStr;
                                            monthSpan = 1;
                                        }

                                        if (i === daysInterval.length - 1) {
                                            months.push(
                                                <div key={`${currentMonthStr}-${i}-last`} className="border-r border-gray-100 relative bg-gray-50/50" style={{ width: `${monthSpan * DAY_WIDTH}px` }}>
                                                    <div className="sticky left-0 px-4 h-full flex items-center font-bold text-xs text-gray-600 w-max max-w-full truncate">
                                                        Tháng {currentMonthStr}
                                                    </div>
                                                </div>
                                            );
                                        }
                                    });
                                    return months;
                                }, [daysInterval])}
                            </div>
                            {/* Days Row */}
                            <div className="flex h-8">
                                {daysInterval.map(date => {
                                    const isToday = isSameDay(date, new Date());
                                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                    return (
                                        <div
                                            key={date.toISOString()}
                                            className={`flex flex-col items-center justify-center border-r border-gray-100 shrink-0 relative ${isWeekend ? 'bg-gray-50/80' : ''}`}
                                            style={{ width: `${DAY_WIDTH}px` }}
                                        >
                                            <span className={`text-[10px] font-medium ${isToday ? 'bg-indigo-500 text-white rounded-full w-5 h-5 flex items-center justify-center' : 'text-gray-500'}`}>
                                                {format(date, 'd')}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Timeline Body (Rows) */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar relative min-h-0 bg-dots">
                            {/* Grid vertical lines background */}
                            <div className="absolute inset-0 flex pointer-events-none z-0">
                                {daysInterval.map((date, i) => {
                                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                    return (
                                        <div 
                                            key={`grid-${i}`} 
                                            className={`border-r border-gray-100/50 h-full ${isWeekend ? 'bg-gray-50/30' : ''}`}
                                            style={{ width: `${DAY_WIDTH}px` }}
                                        />
                                    );
                                })}
                            </div>

                            {/* Today vertical line */}
                            <div 
                                className="absolute top-0 bottom-0 border-l-2 border-dashed border-indigo-400 z-50 pointer-events-none"
                                style={{ left: `${Math.max(0, differenceInDays(new Date(), startDate)) * DAY_WIDTH + (DAY_WIDTH/2)}px` }}
                            >
                                <div className="absolute top-2 -translate-x-1/2 bg-indigo-500 text-white text-[8px] font-bold px-1.5 py-1 rounded uppercase tracking-wider shadow-md border border-white">
                                    Hôm nay
                                </div>
                            </div>

                            {/* Rows matching left column */}
                            <div className="relative z-10 h-full">
                                {activeProjects.map(project => (
                                    <div key={project.id} className="h-20 border-b border-gray-50/50 relative hover:bg-indigo-50/10 transition-colors w-full group">
                                        {/* Row background highlight */}
                                        <div className="absolute inset-0 bg-transparent group-hover:bg-black/5 mix-blend-multiply opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        
                                        {project.actual_start_date ? renderGanttBar(project) : renderEmptyTimeline(project)}
                                        {renderMilestones(project)}
                                        
                                        {/* Daily logs indicators on timeline */}
                                        {project.marketing_daily_logs?.map(log => {
                                            const logDate = parseISO(log.log_date);
                                            const offsetDays = differenceInDays(logDate, startDate);
                                            if (offsetDays < 0 || offsetDays > daysInterval.length) return null;
                                            return (
                                                <div 
                                                    key={log.id}
                                                    className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-blue-400/60 z-10"
                                                    style={{ left: `${offsetDays * DAY_WIDTH + (DAY_WIDTH/2) - 3}px` }}
                                                    title={`Nhật ký: ${log.content}`}
                                                />
                                            );
                                        })}
                                        
                                    </div>
                                ))}
                                {/* Empty space at the bottom for scrolling margin */}
                                <div className="h-32"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Create Project Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <form onSubmit={handleCreateSubmit} className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-lg font-bold text-gray-800">Thêm Dự Án Mới</h2>
                            <button type="button" onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-200 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Tên dự án/công trình</label>
                            <input 
                                autoFocus
                                type="text" 
                                value={newProjectName}
                                onChange={e => setNewProjectName(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                placeholder="VD: Landmark 3PN..."
                                required
                            />
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                            <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-200 transition-colors">
                                Hủy
                            </button>
                            <button type="submit" disabled={isCreating || !newProjectName.trim()} className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                                {isCreating ? 'Đang tạo...' : 'Tiếp tục nạp tiến độ'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {selectedProject && isTimelineModalOpen && (
                <TimelineUpdateModal
                    isOpen={isTimelineModalOpen}
                    onClose={() => {
                        setIsTimelineModalOpen(false);
                        setSelectedProject(null);
                    }}
                    project={selectedProject}
                    onSaved={() => {
                        setIsTimelineModalOpen(false);
                        setSelectedProject(null);
                        fetchConstructionData();
                    }}
                />
            )}
        </div>
    );
};
