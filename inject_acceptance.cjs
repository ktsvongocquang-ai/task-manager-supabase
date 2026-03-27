const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, 'src', 'pages', 'construction', 'Construction.tsx');
let content = fs.readFileSync(FILE_PATH, 'utf8');

// Use a splitting method instead of pure regex if it's too complex.
const startStr = 'function AcceptanceModal({ isOpen, onClose, task, onSave }';
const endStr = 'function ImportQuotationModal({ isOpen, onClose }';

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  const before = content.substring(0, startIndex);
  const after = content.substring(endIndex);
  
  const newModalCode = `function AcceptanceModal({ isOpen, onClose, task, onSave }: { isOpen: boolean, onClose: () => void, task: any, onSave?: (taskId: string, checklist: any[], issues: any[]) => void }) {
  const [localChecklist, setLocalChecklist] = useState<any[]>([]);
  const [localIssues, setLocalIssues] = useState<any[]>([]);
  const [newIssueTitle, setNewIssueTitle] = useState('');
  const [isAddingIssue, setIsAddingIssue] = useState(false);

  useEffect(() => {
    if (task) {
      setLocalChecklist([...(task.checklist || [])]);
      setLocalIssues([...(task.issues || [])]);
    }
  }, [task]);

  const addIssue = () => {
    if (!newIssueTitle) return;
    setLocalIssues([...localIssues, { title: newIssueTitle, status: 'OPEN' }]);
    setNewIssueTitle('');
    setIsAddingIssue(false);
  };

  if (!task) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6"
        >
          <div className="w-full max-w-5xl bg-[#1C1C28] rounded-3xl border border-gray-800 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Header matching Screenshot 1 */}
            <div className="p-4 flex justify-between items-center border-b border-gray-800 bg-[#15151e]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shadow-lg">
                  <ListTodo className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">{task.name}</h3>
                  <div className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mt-0.5">MEP</div>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-8 overflow-y-auto no-scrollbar">
              
              {/* SMART CHECKLIST - Wide, Read-Only Structure */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2 border-b border-gray-800 pb-2">
                  <CheckCircle2 className="w-4 h-4 text-gray-500" />
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">SMART CHECKLIST</h4>
                </div>
                
                <div className="space-y-3">
                  {localChecklist.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 bg-[#1C1C28] rounded-xl border border-gray-800 group hover:border-gray-700 transition-colors">
                      <div 
                        onClick={() => {
                          setLocalChecklist(prev => prev.map((c, i) => i === idx ? { ...c, completed: !c.completed } : c));
                        }}
                        className={\`w-6 h-6 rounded-md flex items-center justify-center cursor-pointer transition-all border \${item.completed ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-transparent border-gray-700'}\`}
                      >
                        {item.completed && <Check className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <div className={\`text-sm \${item.completed ? 'text-gray-500 line-through' : 'text-gray-200 font-medium'}\`}>
                          {item.label} {item.required && <span className="text-rose-500 ml-1">*</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PUNCHLIST (LỖI) */}
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2 border-b border-gray-800 pb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-gray-500" />
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">PUNCHLIST (LỖI)</h4>
                  </div>
                  <button 
                    onClick={() => setIsAddingIssue(true)}
                    className="bg-gray-800/50 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-gray-700 transition-colors"
                  >
                    + Báo lỗi mới
                  </button>
                </div>

                {isAddingIssue && (
                  <div className="flex gap-3 p-4 bg-[#15151e] border border-gray-800 rounded-xl">
                    <input 
                      type="text" 
                      placeholder="Mô tả lỗi phát hiện..." 
                      autoFocus
                      value={newIssueTitle}
                      onChange={(e) => setNewIssueTitle(e.target.value)}
                      className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-white"
                    />
                    <button onClick={addIssue} className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-lg font-bold text-xs uppercase">Lưu</button>
                    <button onClick={() => setIsAddingIssue(false)} className="bg-gray-800 text-gray-400 border border-gray-700 px-4 py-2 rounded-lg font-bold text-xs uppercase">Hủy</button>
                  </div>
                )}
                
                <div className="space-y-3">
                  {localIssues.length === 0 ? (
                    <div className="bg-[#0A1A14] border border-[#103A25] rounded-xl p-8 flex flex-col items-center justify-center text-center">
                      <ShieldCheck className="w-8 h-8 text-emerald-500 mb-2" />
                      <p className="text-xs text-emerald-500/80 font-medium tracking-wide">Không có lỗi nào được ghi nhận.</p>
                    </div>
                  ) : (
                    localIssues.map((issue, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-4 bg-[#1A0F14] rounded-xl border border-[#3A101C]">
                        <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        <div className="flex-1">
                          <div className="text-sm text-gray-200 font-medium">{issue.title}</div>
                        </div>
                        <div className="text-[9px] text-rose-400 uppercase font-bold border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 rounded">
                          {issue.status}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* TÀI CHÍNH HẠNG MỤC - Wide row layout */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2 border-b border-gray-800 pb-2">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">$ TÀI CHÍNH HẠNG MỤC</h4>
                </div>
                <div className="bg-[#1C1C28] rounded-2xl p-6 border border-gray-800 flex flex-col gap-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Ngân sách</div>
                      <div className="text-lg font-bold text-white">{task.budget.toLocaleString('vi-VN')} đ</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Đã chi</div>
                      <div className="text-lg font-bold text-gray-400">{task.spent.toLocaleString('vi-VN')} đ</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <button 
                      onClick={() => {
                        if (task && onSave) onSave(task.id, localChecklist, localIssues);
                        alert("Hạng mục đã được nghiệm thu thành công.");
                        onClose();
                      }}
                      className="flex-1 bg-[#10b981] hover:bg-[#059669] text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5" /> Nghiệm thu
                    </button>
                    <button onClick={() => alert("Đã gửi yêu cầu thanh toán.")} className="flex-1 bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-900/20 active:scale-95 transition-all">
                      Yêu cầu thanh toán
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

`;
  
  content = before + newModalCode + after;

  if (!content.includes('ListTodo')) {
      content = content.replace('import { ', 'import { ListTodo, ');
  }

  fs.writeFileSync(FILE_PATH, content, 'utf8');
  console.log('Successfully injected wide AcceptanceModal via index splice.');
} else {
  console.log('Could not find start or end index.');
}
