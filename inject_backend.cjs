const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, 'src', 'pages', 'construction', 'Construction.tsx');
let content = fs.readFileSync(FILE_PATH, 'utf8');

// 1. Add imports at the top
if (!content.includes('useConstructionData')) {
    content = content.replace(
        `import React, { useState, useEffect, useMemo } from 'react';`,
        `import React, { useState, useEffect, useMemo } from 'react';\nimport { useConstructionData } from '../../hooks/useConstructionData';\nimport { aiConstructionService } from '../../services/aiConstructionService';`
    );
}

// 2. Replace ImportQuotationModal
const modalRegex = /function ImportQuotationModal\(\{[^}]+\}\s*:\s*\{[^}]+\}\)\s*\{[\s\S]*?<\/AnimatePresence>\s*\n\);?\n\}/;

const newImportQuotationModal = `function ImportQuotationModal({ isOpen, onClose, onCreateTimeline }: { isOpen: boolean, onClose: () => void, onCreateTimeline: (tasks: any[]) => void }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!text) return alert("Vui lòng nhập nội dung báo giá");
    setLoading(true);
    try {
      const generatedTasks = await aiConstructionService.generateTimelineFromQuotation(text);
      onCreateTimeline(generatedTasks);
      alert("Đã tạo timeline thành công qua AI!");
      onClose();
    } catch (e) {
      console.error(e);
      alert("Lỗi AI. Vui lòng kiểm tra API Key.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6"
        >
          <div className="w-full max-w-lg bg-[#1C1C28] rounded-3xl border border-gray-800 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 flex justify-between items-center border-b border-gray-800">
              <h3 className="font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-400" /> Tạo Tiến Độ Bằng AI
              </h3>
              <button disabled={loading} onClick={onClose} className="p-2 text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <p className="text-xs text-gray-400">Dán nội dung báo giá hoặc mô tả hạng mục thi công vào đây. AI tự động bóc tách thành sơ đồ Gantt.</p>
              <textarea 
                value={text} 
                onChange={(e) => setText(e.target.value)}
                placeholder="Ví dụ: Thi công móng băng 50tr 10 ngày, Điện nước 30tr 5 ngày..."
                className="w-full h-40 bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                disabled={loading}
              />
              <button 
                onClick={handleAnalyze} disabled={loading || !text}
                className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all flex justify-center items-center gap-2"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : "Bắt Đầu Phân Tích (Gemini)"}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}`;

content = content.replace(modalRegex, newImportQuotationModal);

// 3. New CreateProjectModal
const createProjectModalCode = `
function CreateProjectModal({ isOpen, onClose, onCreated }: { isOpen: boolean, onClose: () => void, onCreated: (project: any) => void }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [budget, setBudget] = useState('');
  
  const handleSave = async () => {
    if (!name) return alert("Tên dự án bắt buộc!");
    onCreated({
       name, address, status: 'MỚI', progress: 0, budget: Number(budget) || 0, spent: 0,
       start_date: new Date().toISOString()
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b flex justify-between items-center"><h3 className="font-bold">Tạo Dự Án Mới</h3><button onClick={onClose}><X className="w-5 h-5"/></button></div>
            <div className="p-6 space-y-4">
               <div><label className="text-xs font-bold text-gray-500">Tên dự án</label><input type="text" className="w-full border rounded-xl px-3 py-2 mt-1" value={name} onChange={e=>setName(e.target.value)} /></div>
               <div><label className="text-xs font-bold text-gray-500">Địa chỉ</label><input type="text" className="w-full border rounded-xl px-3 py-2 mt-1" value={address} onChange={e=>setAddress(e.target.value)} /></div>
               <div><label className="text-xs font-bold text-gray-500">Ngân sách dự kiến</label><input type="number" className="w-full border rounded-xl px-3 py-2 mt-1" value={budget} onChange={e=>setBudget(e.target.value)} /></div>
               <button onClick={handleSave} className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl mt-4">Lưu Dự Án</button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
`;

if (!content.includes('CreateProjectModal')) {
    // Insert before "export const Construction ="
    content = content.replace('export const Construction = () => {', createProjectModalCode + '\nexport const Construction = () => {');
}

// 4. Inject Hooks into Construction component
const stateRegex = /const \[projects\] = useState<Project\[\]>\(INITIAL_PROJECTS\);\s*const \[selectedProject, setSelectedProject\] = useState<Project>\(INITIAL_PROJECTS\[0\]\);\s*const \[tasks, setTasks\] = useState<Task\[\]>\(INITIAL_TASKS\);/;

const hooksReplacement = `
  const { projects: dbProjects, tasks: dbTasks, logs: dbLogs, createProject, createTimelineTasks, updateTaskStatusChecklist, submitDailyLog } = useConstructionData();
  const [isProjectCreateOpen, setIsProjectCreateOpen] = useState(false);
  
  // Tie mock states to DB if available
  const activeProjects = dbProjects.length > 0 ? (dbProjects as any) : INITIAL_PROJECTS;
  const activeTasks = dbTasks.length > 0 ? (dbTasks as any) : INITIAL_TASKS;

  const [projects] = useState<Project[]>(INITIAL_PROJECTS); // Leaving legacy just in case
  const [selectedProject, setSelectedProject] = useState<Project>(INITIAL_PROJECTS[0]);
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);

  useEffect(() => {
     if (dbProjects.length > 0 && (!selectedProject || selectedProject.id === INITIAL_PROJECTS[0].id)) {
        setSelectedProject(dbProjects[0] as any);
     }
  }, [dbProjects]);

  useEffect(() => {
     if (dbTasks.length > 0) setTasks(dbTasks as any);
  }, [dbTasks]);
`;

if (!content.includes('const dbProjects =')) {
    content = content.replace(stateRegex, hooksReplacement);
}

// 5. Update the "Nhập báo giá" button to also show "Tạo dự án"
const headerButtonsRegex = /<button\s*onClick=\{\(\) => setIsQuotationModalOpen\(true\)\}\s*className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-900\/20 active:scale-95 transition-all"\s*>\s*<Plus className="w-4 h-4" \/> Nhập Báo Giá\s*<\/button>/m;

const newHeaderButtons = `
  <div className="flex gap-2">
    <button onClick={() => setIsProjectCreateOpen(true)} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm active:scale-95">
      <Plus className="w-4 h-4" /> Tạo Dự Án
    </button>
    <button onClick={() => setIsQuotationModalOpen(true)} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-sm active:scale-95">
      <FileSpreadsheet className="w-4 h-4" /> AI Tiến Độ
    </button>
  </div>
`;

content = content.replace(headerButtonsRegex, newHeaderButtons);

// 6. Connect `ImportQuotationModal` in JSX and `CreateProjectModal`
const modalsJSXRegex = /<ImportQuotationModal isOpen=\{isQuotationModalOpen\} onClose=\{\(\) => setIsQuotationModalOpen\(false\)\} \/>/;
const newModalsJSX = `
  <ImportQuotationModal 
    isOpen={isQuotationModalOpen} 
    onClose={() => setIsQuotationModalOpen(false)} 
    onCreateTimeline={async (genTasks) => {
      await createTimelineTasks(selectedProject.id, genTasks);
      setTasks(prev => [...prev, ...genTasks] as unknown as Task[]);
    }}
  />
  <CreateProjectModal
    isOpen={isProjectCreateOpen}
    onClose={() => setIsProjectCreateOpen(false)}
    onCreated={async (newProj) => {
       const id = await createProject(newProj);
       if(id) alert("Dự án được tạo thành công vào DB!");
    }}
  />
`;

content = content.replace(modalsJSXRegex, newModalsJSX);


fs.writeFileSync(FILE_PATH, content, 'utf8');
console.log("Successfully injected backend hooks to Construction.tsx");
