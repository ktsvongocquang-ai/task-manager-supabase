const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, 'src', 'pages', 'construction', 'Construction.tsx');
let content = fs.readFileSync(FILE_PATH, 'utf8');

// The original SmartTaskBar declaration to replace
const originalComponentRegex = /function SmartTaskBar\(\{ isOpen, onClose \}: \{ isOpen: boolean, onClose: \(\) => void \}\) \{[\s\S]*?className="p-2 bg-indigo-500\/10 text-indigo-400 border border-indigo-500\/20 rounded-xl"[\s\S]*?<\/div>\s*<\/motion.div>\s*\)\}\s*<\/AnimatePresence>\s*<\/div>\s*\);\s*\}/;

const newComponent = `
function SmartTaskBar({ isOpen, onClose, tasks, project }: { isOpen: boolean, onClose: () => void, tasks: any[], project: any }) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && tasks.length > 0) {
       setLoading(true);
       const budget = project?.budget || 0;
       const spent = project?.spent || 0;
       const context = {
          tasks: tasks.map(t => ({ name: t.name, status: t.status, budget: t.budget, spent: t.spent })),
          overallBudget: budget,
          overallSpent: spent
       };
       aiConstructionService.analyzeProjectState(context)
         .then(res => setInsights(res))
         .catch(err => console.error(err))
         .finally(() => setLoading(false));
    }
  }, [isOpen, tasks, project]);

  const activeInsight = insights.length > 0 ? insights[0] : null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
            className="bg-[#1C1C28]/95 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-3 shadow-2xl shadow-indigo-900/40"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900/20">
                  <Smartphone className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Đánh Giá AI Hàng Ngày</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  </div>
                  <p className="text-xs text-white font-medium truncate">
                    {loading ? "Đang phân tích..." : activeInsight ? \`[\${activeInsight.type}] \${activeInsight.message}\` : "Dự án đang diễn ra bình thường. Không có thông báo bất thường."}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsChatOpen(!isChatOpen)}
                  className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
                <button onClick={onClose} className="p-2 text-gray-500">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <AnimatePresence>
              {isChatOpen && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="mt-3 pt-3 border-t border-gray-800 overflow-hidden"
                >
                  <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                    {insights.map((ins, idx) => (
                       <div key={idx} className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3">
                          <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">{ins.type} - {ins.priority}</p>
                          <p className="text-xs text-gray-300 leading-relaxed">{ins.message}</p>
                       </div>
                    ))}
                    {!loading && insights.length === 0 && (
                       <div className="text-xs text-gray-400 text-center py-2">Chưa có đề xuất cụ thể.</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      placeholder="Hỏi AI về công việc..."
                      className="flex-[1] bg-black/50 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                    <button className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}`;

content = content.replace(originalComponentRegex, newComponent);

// 2. Also fix the rendering prop call at the bottom of the component
const smartTaskBarJSXRegex = /<SmartTaskBar\s*isOpen=\{isSmartTaskBarOpen\}\s*onClose=\{\(\) => setIsSmartTaskBarOpen\(false\)\}\s*\/>/;
const newSmartTaskBarJSX = `<SmartTaskBar isOpen={isSmartTaskBarOpen} onClose={() => setIsSmartTaskBarOpen(false)} tasks={tasks} project={selectedProject} />`;

content = content.replace(smartTaskBarJSXRegex, newSmartTaskBarJSX);

fs.writeFileSync(FILE_PATH, content, 'utf8');
console.log("Successfully injected AI Insights into SmartTaskBar.");
