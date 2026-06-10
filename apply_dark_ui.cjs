const fs = require('fs');

const target = 'c:/Users/DELL/.gemini/antigravity/scratch/dqh/task-manager-supabase/src/pages/projects/Projects.tsx';
let content = fs.readFileSync(target, 'utf8');

// Replace the render return with the new mockup style
// We'll keep the logic, but replace the JSX returned.

const newReturn = `
    if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3FD07E]"></div></div>

    return (
        <div className="space-y-6 max-w-[1400px] mx-auto min-h-screen text-[#F4F4F5] bg-[#0A0A0B] pb-24" style={{
            '--bg': '#0A0A0B',
            '--card': '#161619',
            '--card2': '#1F1F24',
            '--bd': 'rgba(255,255,255,0.09)',
            '--tx': '#F4F4F5',
            '--tx2': '#9B9BA1',
            '--tx3': '#646469',
            '--grn': '#3FD07E',
            '--grnb': 'rgba(63,208,126,0.13)',
            '--red': '#FF5C6C',
            '--redb': 'rgba(255,92,108,0.13)',
            '--amb': '#E7A33C',
            '--ambb': 'rgba(231,163,60,0.13)'
        } as React.CSSProperties}>
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-4 pt-4">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="w-10 h-10 rounded-xl bg-[var(--card2)] flex items-center justify-center border border-[var(--bd)] shadow-sm">
                        <LayoutGrid size={20} className="text-[var(--tx)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg font-bold text-[var(--tx)] leading-tight">Site Board</h1>
                        <div className="text-[10px] tracking-widest text-[var(--tx3)] uppercase font-semibold mt-0.5">DQH Architects</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 border border-[var(--bd)] rounded-full px-3 py-1.5 text-[var(--tx2)] text-xs font-medium bg-[var(--card)]">
                            <BookOpen size={14} /> Mẫu lỗi
                        </div>
                        <div className="flex items-center gap-1.5 border border-[var(--bd)] rounded-full px-3 py-1.5 text-[var(--tx2)] text-xs font-medium bg-[var(--card)]">
                            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} onClick={() => fetchProjects()} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-4 mt-2">
                {/* Global Notification (Mock) */}
                <div className="flex items-center gap-3 bg-[var(--card)] border border-[var(--bd)] rounded-xl p-3 mb-6 shadow-sm">
                    <div className="w-8 h-8 rounded-full bg-[var(--redb)] flex items-center justify-center shrink-0">
                        <X size={16} className="text-[var(--red)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm text-[var(--tx)] font-semibold truncate">Cập nhật hệ thống</div>
                        <div className="text-[11px] text-[var(--tx2)] mt-0.5">Vừa đồng bộ dữ liệu mới nhất</div>
                    </div>
                </div>

                <div className="text-[11px] font-bold text-[var(--tx3)] tracking-wider mb-2 px-1">HOẠT ĐỘNG NHÓM</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <div className="bg-[var(--card)] border border-[var(--bd)] rounded-xl p-3 shadow-sm hover:border-[var(--grn)] transition-colors cursor-pointer" onClick={() => setStatusFilter('')}>
                        <div className="flex items-center gap-2">
                            <LayoutGrid size={16} className="text-[var(--tx2)]" />
                            <span className="text-xl font-bold text-[var(--tx)]">{projects.length}</span>
                        </div>
                        <div className="text-xs text-[var(--tx2)] mt-1 font-medium">Tổng dự án</div>
                    </div>
                    <div className="bg-[var(--card)] border border-[var(--bd)] rounded-xl p-3 shadow-sm hover:border-[var(--amb)] transition-colors cursor-pointer" onClick={() => setStatusFilter('Thi công')}>
                        <div className="flex items-center gap-2">
                            <HardHat size={16} className="text-[var(--amb)]" />
                            <span className="text-xl font-bold text-[var(--amb)]">{statusCounts['Thi công']}</span>
                        </div>
                        <div className="text-xs text-[var(--tx2)] mt-1 font-medium">Đang thi công</div>
                    </div>
                    <div className="bg-[var(--card)] border border-[var(--bd)] rounded-xl p-3 shadow-sm hover:border-[var(--grn)] transition-colors cursor-pointer" onClick={() => setStatusFilter('Hoàn thành')}>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-[var(--grn)]" />
                            <span className="text-xl font-bold text-[var(--tx)]">{statusCounts['Hoàn thành']}</span>
                        </div>
                        <div className="text-xs text-[var(--tx2)] mt-1 font-medium">Đã hoàn thành</div>
                    </div>
                    <div className="bg-[var(--card)] border border-[var(--bd)] rounded-xl p-3 shadow-sm">
                        <div className="flex items-center gap-2">
                            <Bell size={16} className="text-[var(--tx2)]" />
                            <span className="text-xl font-bold text-[var(--tx)]">0</span>
                        </div>
                        <div className="text-xs text-[var(--tx2)] mt-1 font-medium">Thông báo chưa đọc</div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-2 bg-[var(--card)] border border-[var(--bd)] rounded-xl px-3 py-2.5 mb-3 shadow-sm focus-within:border-[var(--grn)] transition-colors">
                    <Search size={16} className="text-[var(--tx3)]" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Tìm dự án, mã dự án..."
                        className="bg-transparent border-none outline-none text-sm text-[var(--tx)] w-full placeholder-[var(--tx3)] font-medium"
                    />
                </div>
                
                <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-1.5 bg-[var(--card)] border border-[var(--bd)] rounded-lg px-3 py-2 text-xs text-[var(--tx2)] font-medium cursor-pointer hover:bg-[var(--card2)] transition-colors">
                        Mới nhất <ChevronDown size={14} className="text-[var(--tx3)]" />
                    </div>
                    <div className="flex border border-[var(--bd)] rounded-lg overflow-hidden shrink-0">
                        <div className={\`p-2 cursor-pointer transition-colors \${projectViewMode === 'cards' ? 'bg-[var(--card2)]' : 'bg-[var(--card)] hover:bg-[var(--card2)]'}\`} onClick={() => setProjectViewMode('cards')}>
                            <LayoutGrid size={16} className={projectViewMode === 'cards' ? 'text-[var(--tx)]' : 'text-[var(--tx3)]'} />
                        </div>
                        <div className={\`p-2 cursor-pointer transition-colors \${projectViewMode === 'list' ? 'bg-[var(--card2)]' : 'bg-[var(--card)] hover:bg-[var(--card2)]'}\`} onClick={() => setProjectViewMode('list')}>
                            <List size={16} className={projectViewMode === 'list' ? 'text-[var(--tx)]' : 'text-[var(--tx3)]'} />
                        </div>
                    </div>
                    <div className="flex-1"></div>
                    <button onClick={openAddModal} className="flex items-center gap-1.5 bg-[var(--tx)] text-[#0A0A0B] rounded-full px-4 py-2 text-sm font-bold hover:opacity-90 transition-opacity shadow-sm whitespace-nowrap">
                        <Plus size={16} /> Tạo dự án
                    </button>
                </div>

                <div className="h-px bg-[var(--bd)] my-4 w-full"></div>

                {/* Project Cards View */}
                {projectViewMode === 'cards' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredProjects.map(project => {
                            const progress = getProjectProgress(project.id);
                            const managerName = getManagerName(project.manager_id || '');
                            
                            // Calculate task stats
                            const projTasks = allTasks.filter(t => t.project_id === project.id && !t.parent_id);
                            const activeTasks = projTasks.filter(t => t.status !== 'Hoàn thành' && t.status !== 'Hủy bỏ').length;
                            const doneTasks = projTasks.filter(t => t.status === 'Hoàn thành').length;

                            return (
                                <div key={project.id} className="bg-[var(--card)] border border-[var(--bd)] rounded-xl p-4 flex flex-col shadow-sm hover:border-[var(--tx3)] transition-colors relative group">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="text-[10px] tracking-widest uppercase text-[var(--tx3)] font-bold flex items-center gap-2">
                                            {project.project_code} • {managerName}
                                        </div>
                                        {/* Star indicator could be based on something, we use a static icon for now but it can be active if manager is current user */}
                                        <Star size={16} className={project.manager_id === profile?.id ? "text-[var(--amb)] fill-[var(--amb)]" : "text-[var(--tx3)]"} />
                                    </div>
                                    
                                    <div className="text-base font-bold text-[var(--tx)] mb-3 leading-snug">{project.name}</div>
                                    
                                    {/* Badges */}
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {activeTasks > 0 ? (
                                            <span className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-[var(--ambb)] text-[var(--amb)] font-semibold border border-[var(--ambb)]">
                                                <AlertCircle size={12} /> {activeTasks} việc đang chờ
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-[var(--card2)] text-[var(--tx2)] font-semibold border border-[var(--bd)]">
                                                <CheckCircle2 size={12} /> Đã cập nhật
                                            </span>
                                        )}
                                        {doneTasks > 0 && (
                                            <span className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-[var(--grnb)] text-[var(--grn)] font-semibold border border-[var(--grnb)]">
                                                <Check size={12} /> Hoàn thành {doneTasks}
                                            </span>
                                        )}
                                        <span className={\`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold border uppercase \${
                                            project.status === 'Hoàn thành' ? 'bg-[var(--grnb)] text-[var(--grn)] border-[var(--grnb)]' :
                                            project.status === 'Đang thực hiện' ? 'bg-[rgba(59,130,246,0.1)] text-blue-400 border-[rgba(59,130,246,0.2)]' :
                                            project.status === 'Thi công' ? 'bg-[rgba(168,85,247,0.1)] text-purple-400 border-[rgba(168,85,247,0.2)]' :
                                            project.status === 'Tạm dừng' ? 'bg-[var(--ambb)] text-[var(--amb)] border-[var(--ambb)]' :
                                            'bg-[var(--card2)] text-[var(--tx2)] border-[var(--bd)]'
                                        }\`}>
                                            {project.status}
                                        </span>
                                    </div>
                                    
                                    {/* Progress */}
                                    <div className="flex items-center gap-3 mb-5">
                                        <span className="text-[11px] text-[var(--tx2)] font-medium w-12">Tiến độ</span>
                                        <div className="flex-1 h-1.5 bg-[var(--card2)] rounded-full overflow-hidden">
                                            <div className="h-full bg-[var(--tx)] rounded-full transition-all duration-500" style={{ width: \`\${progress}%\` }}></div>
                                        </div>
                                        <span className="text-xs font-bold text-[var(--tx)] w-8 text-right">{progress}%</span>
                                    </div>
                                    
                                    <div className="mt-auto pt-2 flex items-center gap-2">
                                        <button 
                                            onClick={() => navigate(\`/projects/\${project.id}/board\`)}
                                            className="flex-1 bg-[var(--card2)] border border-[var(--bd)] hover:bg-[var(--bd)] hover:text-white transition-colors text-[var(--tx)] rounded-full py-2.5 text-sm font-semibold flex items-center justify-center gap-2"
                                        >
                                            <LayoutGrid size={16} /> Vào Board
                                        </button>
                                        
                                        {/* Dropdown for other actions like Edit, KPI, Tasks */}
                                        <div className="relative group">
                                            <button className="w-10 h-10 border border-[var(--bd)] rounded-full flex items-center justify-center text-[var(--tx3)] hover:text-[var(--tx)] hover:bg-[var(--card2)] transition-colors">
                                                <MoreVertical size={16} />
                                            </button>
                                            <div className="absolute bottom-full right-0 mb-2 w-40 bg-[var(--card2)] border border-[var(--bd)] rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20 overflow-hidden flex flex-col">
                                                <button onClick={(e) => { e.stopPropagation(); openEditModal(project) }} className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-[var(--tx)] hover:bg-[var(--bd)] text-left"><Edit3 size={14}/> Chỉnh sửa</button>
                                                <button onClick={(e) => { e.stopPropagation(); setKpiProject(project); }} className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-[var(--tx)] hover:bg-[var(--bd)] text-left"><Eye size={14}/> Xem KPI</button>
                                                <button onClick={(e) => { e.stopPropagation(); setSelectedProjectForDetails(project); }} className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-[var(--tx)] hover:bg-[var(--bd)] text-left"><List size={14}/> Giao việc</button>
                                                <div className="h-px bg-[var(--bd)] my-1"></div>
                                                <button onClick={(e) => { e.stopPropagation(); handleDelete(project.id) }} className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-[var(--red)] hover:bg-[var(--redb)] text-left"><Trash2 size={14}/> Xóa dự án</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* List View - Re-using the same dark theme approach */}
                {projectViewMode === 'list' && (
                    <div className="bg-[var(--card)] rounded-xl border border-[var(--bd)] overflow-hidden shadow-sm">
                        {filteredProjects.length === 0 ? (
                            <div className="p-8 text-center text-[var(--tx3)] text-sm">Không tìm thấy dự án nào</div>
                        ) : filteredProjects.map(project => {
                            const progress = getProjectProgress(project.id);
                            return (
                                <div key={project.id} className="border-b border-[var(--bd)] last:border-0 p-4 hover:bg-[var(--card2)] transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-[var(--card2)] border border-[var(--bd)] flex items-center justify-center shrink-0">
                                            <Folder size={18} className="text-[var(--tx2)]" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-[var(--tx)] mb-1 flex items-center gap-2">
                                                {project.name}
                                                <span className="text-[9px] px-2 py-0.5 rounded-full bg-[var(--card2)] border border-[var(--bd)] text-[var(--tx2)] uppercase">{project.status}</span>
                                            </div>
                                            <div className="text-xs text-[var(--tx3)] font-medium flex items-center gap-3">
                                                <span>{project.project_code}</span>
                                                <span className="w-1 h-1 rounded-full bg-[var(--tx3)]"></span>
                                                <span>Quản lý: {getManagerName(project.manager_id || '')}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 w-full sm:w-auto">
                                        <div className="flex-1 sm:w-32 flex flex-col gap-1">
                                            <div className="flex justify-between text-[10px] text-[var(--tx2)] font-semibold">
                                                <span>Tiến độ</span>
                                                <span>{progress}%</span>
                                            </div>
                                            <div className="h-1.5 bg-[var(--card)] border border-[var(--bd)] rounded-full overflow-hidden">
                                                <div className="h-full bg-[var(--tx)]" style={{ width: \`\${progress}%\` }}></div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => navigate(\`/projects/\${project.id}/board\`)}
                                            className="px-4 py-2 bg-[var(--tx)] text-[#0A0A0B] rounded-full text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-1.5 whitespace-nowrap"
                                        >
                                            <LayoutGrid size={14} /> Board
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Modals remain the same */}
            <AddEditProjectModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSave={handleSave}
                editingProject={editingProject}
                form={form}
                setForm={setForm}
                profiles={profiles}
                currentUserProfile={profile}
            />

            <ProjectDetailsModal
                isOpen={!!selectedProjectForDetails}
                onClose={() => setSelectedProjectForDetails(null)}
                project={selectedProjectForDetails}
                tasks={allTasks}
                profiles={profiles}
                currentUserProfile={profile}
                onToggleComplete={handleToggleTaskComplete}
                onDeleteTask={handleDeleteTask}
                onCopyTask={handleCopyTask}
                onEditTask={openEditTaskModal}
                onAddTask={openAddTaskModal}
            />

            <ProjectKPIOverlay
                isOpen={!!kpiProject}
                onClose={() => setKpiProject(null)}
                project={kpiProject}
                tasks={allTasks}
                managerName={kpiProject?.manager_id ? profiles.find(p => p.id === kpiProject?.manager_id)?.full_name : undefined}
                onUpdateProject={fetchProjects}
            />

            <AddEditTaskModal
                isOpen={showTaskModal}
                onClose={() => setShowTaskModal(false)}
                onSaved={() => {
                    setShowTaskModal(false);
                    fetchTasks();
                }}
                editingTask={editingTask}
                initialData={taskModalInitialData}
                projects={projects}
                profiles={profiles}
                currentUserProfile={profile}
                generateNextTaskCode={generateNextTaskCode}
            />
        </div>
    )
`;

content = content.replace(/if \(loading\) return <div className="flex justify-center p-12">[\s\S]*?\n\s*\)\n}/, newReturn + '\n}');

fs.writeFileSync(target, content);
