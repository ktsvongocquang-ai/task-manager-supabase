const fs = require('fs');
const path = require('path');

const FILE_PATH = path.join(__dirname, 'src', 'pages', 'construction', 'Construction.tsx');
let content = fs.readFileSync(FILE_PATH, 'utf8');

// 1. Define the DailyLogModal Component
const logModalCode = `
function DailyLogModal({ isOpen, onClose, onSubmit }: { isOpen: boolean, onClose: () => void, onSubmit: (log: any) => Promise<boolean> }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [weatherMorning, setWeatherMorning] = useState('Nắng - Làm bình thường');
  const [weatherAfternoon, setWeatherAfternoon] = useState('Nắng - Làm bình thường');
  const [progress, setProgress] = useState(0);
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Mocking photo upload via Base64 simulation or external URL
  const handlePhotoUpload = () => {
     // Simulated successful photo capture
     setPhotos(prev => [...prev, 'https://images.unsplash.com/photo-1541888081696-6eecac213cc8?w=100&h=100&fit=crop']);
  };

  const handleSave = async () => {
    setLoading(true);
    const success = await onSubmit({
       date,
       weatherMorning,
       weatherAfternoon,
       progress: Number(progress),
       notes,
       photo_urls: photos
    });
    setLoading(false);
    if(success) {
       alert("Đã lưu nhật ký!");
       onClose();
    } else {
       alert("Lỗi khi lưu nhật ký.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center"><h3 className="font-bold">Báo Cáo Nhật Ký Mới</h3><button disabled={loading} onClick={onClose}><X className="w-5 h-5"/></button></div>
            <div className="p-6 space-y-4 overflow-y-auto">
               <div><label className="text-xs font-bold text-gray-500">Ngày</label><input type="date" className="w-full border rounded-xl px-3 py-2 mt-1" value={date} onChange={e=>setDate(e.target.value)} /></div>
               <div><label className="text-xs font-bold text-gray-500">Thời tiết sáng</label><input type="text" className="w-full border rounded-xl px-3 py-2 mt-1" value={weatherMorning} onChange={e=>setWeatherMorning(e.target.value)} /></div>
               <div><label className="text-xs font-bold text-gray-500">Thời tiết chiều</label><input type="text" className="w-full border rounded-xl px-3 py-2 mt-1" value={weatherAfternoon} onChange={e=>setWeatherAfternoon(e.target.value)} /></div>
               <div><label className="text-xs font-bold text-gray-500">% Tiến độ hoàn thành thêm</label><input type="number" className="w-full border rounded-xl px-3 py-2 mt-1" value={progress} onChange={e=>setProgress(e.target.value)} /></div>
               <div><label className="text-xs font-bold text-gray-500">Ghi chú sự cố / phát sinh</label><textarea className="w-full border rounded-xl px-3 py-2 mt-1" value={notes} onChange={e=>setNotes(e.target.value)} /></div>
               
               <div>
                 <label className="text-xs font-bold text-gray-500 mb-2 block">Hình ảnh đính kèm (Mô phỏng)</label>
                 <div className="flex gap-2 flex-wrap">
                   {photos.map((url, idx) => <img key={idx} src={url} className="w-16 h-16 object-cover rounded-lg border"/>)}
                   <button onClick={handlePhotoUpload} className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:border-indigo-600 transition-colors">
                     <Camera className="w-6 h-6"/>
                   </button>
                 </div>
               </div>

               <button disabled={loading} onClick={handleSave} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all mt-6">
                 {loading ? "Đang lưu..." : "Gửi Báo Cáo"}
               </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
`;

if (!content.includes('DailyLogModal')) {
    content = content.replace('export const Construction = () => {', logModalCode + '\nexport const Construction = () => {');
}

// 2. Add state inside Construction
if (!content.includes('isLogModalOpen')) {
    content = content.replace('const [isProjectCreateOpen, setIsProjectCreateOpen] = useState(false);', 'const [isProjectCreateOpen, setIsProjectCreateOpen] = useState(false);\n  const [isLogModalOpen, setIsLogModalOpen] = useState(false);');
}

// 3. Replace the alert for the + button in renderLogsView
const alertRegex = /onClick=\{\(\) => alert\("Tính năng chat AI đang trong giai đoạn thử nghiệm\."\)\}/;
content = content.replace(alertRegex, 'onClick={() => setIsLogModalOpen(true)}');

// 4. Inject <DailyLogModal /> in the root return (usually below Construction > Main Content > Render active tab)
const modalJSX = `
  <DailyLogModal
    isOpen={isLogModalOpen}
    onClose={() => setIsLogModalOpen(false)}
    onSubmit={async (logData) => {
       return await submitDailyLog({ ...logData, project_id: selectedProject?.id });
    }}
  />
`;

if (!content.includes('<DailyLogModal')) {
    // Inject near other modals, like CreateProjectModal
    const createProjectModalRegex = /<CreateProjectModal\s*isOpen=\{isProjectCreateOpen\}[\s\S]*?onCreated=\{[^}]+\}\s*\/>/;
    const match = content.match(createProjectModalRegex);
    if (match) {
        content = content.replace(createProjectModalRegex, match[0] + modalJSX);
    }
}

fs.writeFileSync(FILE_PATH, content, 'utf8');
console.log("Successfully injected Diary Log tools.");
