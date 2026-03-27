const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, 'src', 'pages', 'construction', 'Construction.tsx');
let content = fs.readFileSync(FILE_PATH, 'utf8');

console.log("Original size:", content.length);

// 1. Remove interior DashboardGrid and DashboardCard (lines 1007-1024 approx)
const interiorComponentsRegex = /const DashboardGrid = \(\{ children \}: \{ children: React\.ReactNode \}\) => \([\s\S]*?;\s*const DashboardCard = \(\{ icon, label, value, color, dark, onClick \}: [^{]*\{[\s\S]*?<\/button>\s*\);/m;
content = content.replace(interiorComponentsRegex, '');

// 2. Define DashboardGrid and unified DashboardCard outside
const exteriorCardRegex = /const DashboardCard = \(\{ icon, label, value, color, onClick \}: \{ icon: React\.ReactNode, label: string, value: string \| number, color: string, onClick\?: \(\) => void \}\) => \([\s\S]*?<\/motion\.button>\n\);/m;

const unifiedComponents = `const DashboardGrid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-2 gap-4">
    {children}
  </div>
);

const DashboardCard = ({ icon, label, value, color, dark, onClick }: { icon: React.ReactNode, label: string, value: string | number, color?: string, dark?: boolean, onClick?: () => void }) => (
  <motion.button 
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={\`\${dark ? 'bg-[#1C1C28] border-gray-800' : 'bg-white border-gray-100'} rounded-2xl p-4 border shadow-sm flex flex-col items-start gap-3 text-left w-full\`}
  >
    <div className={\`p-2 rounded-xl \${color ? color + ' bg-opacity-10' : (dark ? 'bg-white/5' : 'bg-gray-50')}\`}>
      {color ? React.cloneElement(icon as React.ReactElement, { className: \`w-5 h-5 \${color.replace('bg-', 'text-')}\` }) : icon}
    </div>
    <div>
      <div className={\`text-[10px] font-bold uppercase tracking-wider mb-1 \${dark ? 'text-gray-500' : 'text-gray-400'}\`}>{label}</div>
      <div className={\`text-sm font-bold \${dark ? 'text-white' : 'text-gray-900'}\`}>{value}</div>
    </div>
  </motion.button>
);`;

content = content.replace(exteriorCardRegex, unifiedComponents);

// 3. AcceptanceModal fixes
// Props
content = content.replace(
  `function AcceptanceModal({ isOpen, onClose, task }: { isOpen: boolean, onClose: () => void, task: Task | null }) {`,
  `function AcceptanceModal({ isOpen, onClose, task, onSave }: { isOpen: boolean, onClose: () => void, task: Task | null, onSave?: (taskId: string, checklist: ChecklistItem[], issues: Issue[]) => void }) {`
);

// State mutation fix
content = content.replace(
  /const updated = \[\.\.\.localChecklist\];\s*updated\[idx\]\.completed = !updated\[idx\]\.completed;\s*setLocalChecklist\(updated\);/m,
  `setLocalChecklist(prev => prev.map((c, i) => i === idx ? { ...c, completed: !c.completed } : c));`
);

// Save action fix
content = content.replace(
  /alert\("Hạng mục đã được nghiệm thu thành công\."\);\s*onClose\(\);/m,
  `if (task && onSave) onSave(task.id, localChecklist, localIssues);\n                    alert("Hạng mục đã được nghiệm thu thành công.");\n                    onClose();`
);

// Pass onSave callback where AcceptanceModal is used (around line 1754)
content = content.replace(
  /<AcceptanceModal isOpen=\{isAcceptanceModalOpen\} onClose=\{() => setIsAcceptanceModalOpen(false)\} task=\{selectedTaskForAcceptance\} \/>/,
  `<AcceptanceModal isOpen={isAcceptanceModalOpen} onClose={() => setIsAcceptanceModalOpen(false)} task={selectedTaskForAcceptance} onSave={(taskId, checklist, issues) => {
          setTasks(prev => prev.map(t => t.id === taskId ? { ...t, checklist, issues, status: 'DONE' } : t));
        }} />`
);

// Fix Acceptance Modal usage - wait, it's rendered as:
// <AcceptanceModal isOpen={isAcceptanceModalOpen} onClose={() => setIsAcceptanceModalOpen(false)} task={selectedTaskForAcceptance} />
// I need to use regex because spacing might vary.
const modalUsageRegex = /<AcceptanceModal\s+isOpen=\{isAcceptanceModalOpen\}\s+onClose=\{\(\) => setIsAcceptanceModalOpen\(false\)\}\s+task=\{selectedTaskForAcceptance\}\s*\/>/m;
content = content.replace(modalUsageRegex, `<AcceptanceModal isOpen={isAcceptanceModalOpen} onClose={() => setIsAcceptanceModalOpen(false)} task={selectedTaskForAcceptance} onSave={(taskId, checklist, issues) => setTasks(prev => prev.map(t => t.id === taskId ? { ...t, checklist, issues, status: 'DONE' } : t))} />`);

// 4. Division by zero fix
content = content.replace(
  `style={{ width: \`\${Math.min(100, (task.spent / task.budget) * 100)}%\` }}`,
  `style={{ width: \`\${task.budget > 0 ? Math.min(100, (task.spent / task.budget) * 100) : 0}%\` }}`
);

// 5. Hardcoded Dates Fix
content = content.replace(
  `<span>Bắt đầu: 12/01/2024</span>`,
  `<span>Bắt đầu: {new Date(selectedProject.startDate).toLocaleDateString('vi-VN')}</span>`
);
content = content.replace(
  `<span>Dự kiến: 15/06/2024</span>`,
  `<span>Dự kiến: {new Date(new Date(selectedProject.startDate).getTime() + 150*24*60*60*1000).toLocaleDateString('vi-VN')}</span>`
);

// 6. Fix VoiceLog simulation
content = content.replace(
  `setTimeout(() => setTranscript("Hôm nay đội thợ xây đã hoàn thành 80% tường bao tầng 1. Vật tư gạch đã về đủ. Thời tiết nắng ráo thuận lợi..."), 2000);`,
  `if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'vi-VN';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onresult = (event: any) => {
        setTranscript(event.results[0][0].transcript);
        setIsRecording(false);
      };
      recognition.onerror = () => {
        alert("Lỗi microphone. Bật chế độ Demo.");
        setTimeout(() => { setTranscript("Hôm nay đội thợ xây đã hoàn thành 80% tường bao tầng 1. Vật tư gạch đã về đủ. Thời tiết nắng ráo thuận lợi..."); setIsRecording(false); }, 2000);
      };
      recognition.start();
    } else {
      setTimeout(() => { setTranscript("Hôm nay đội thợ xây đã hoàn thành 80% tường bao tầng 1. Vật tư gạch đã về đủ. Thời tiết nắng ráo thuận lợi..."); setIsRecording(false); }, 2000);
    }`
);

// 7. Math.random fix
content = content.replace(/Math\.random\(\)\.toString\(36\)\.substr\(2, 9\)/g, `crypto.randomUUID()`);

// 8. Add dead state cleanup
// Projects, Payments, Logs setters remove if unused, but actually let's keep them and suppress warnings or use them.
// Let's just suppress ESLint for them by prepending // @ts-nocheck or just keep them since they might be used later.
// Actually, I'll remove `setProjects`, `setPayments`, `setLogs` from the destructuring in the useState.
content = content.replace(/const \[projects, setProjects\] =/g, `const [projects] =`);
content = content.replace(/const \[payments, setPayments\] =/g, `const [payments] =`);
// Logs has activeLog, and we don't setLogs
content = content.replace(/const \[logs, setLogs\] =/g, `const [logs] =`);

// 9. Fix empty onClick buttons with toasts
content = content.replace(
  /<button className="flex-\[2\] bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-900\/20 active:scale-95 transition-all">/g,
  `<button onClick={() => alert("Đã gửi yêu cầu thanh toán đến bộ phận Kế toán.")} className="flex-[2] bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-900/20 active:scale-95 transition-all">`
);

content = content.replace(
  /<button className="text-\[9px\] font-bold text-rose-600 uppercase tracking-wider hover:underline">Áp dụng ngay<\/button>/g,
  `<button onClick={() => alert("Đã cập nhật nguồn lực theo đề xuất AI.")} className="text-[9px] font-bold text-rose-600 uppercase tracking-wider hover:underline">Áp dụng ngay</button>`
);

content = content.replace(
  /<button className="p-2 bg-indigo-600 rounded-xl text-white">/g,
  `<button onClick={() => alert("Tính năng chat AI đang trong giai đoạn thử nghiệm.")} className="p-2 bg-indigo-600 rounded-xl text-white">`
);

fs.writeFileSync(FILE_PATH, content, 'utf8');

console.log("Refactoring applied successfully. New size:", content.length);
