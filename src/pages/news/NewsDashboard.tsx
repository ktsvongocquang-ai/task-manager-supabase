import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { supabase } from '../../services/supabase';

export const NewsDashboard = () => {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('grok_news_feed')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (data) {
      setNews(data);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
       <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div>
               <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                  <span className="text-3xl">📰</span> Bản Tin Vĩ Mô & Đầu Tư
               </h1>
               <p className="text-sm text-slate-500 font-medium mt-1">Được tổng hợp hoàn toàn tự động bởi xAI (Grok)</p>
            </div>
            
            <button onClick={fetchNews} className="px-4 py-2 bg-indigo-50 text-indigo-600 font-bold rounded-xl hover:bg-indigo-100 transition-colors text-sm border border-indigo-200 shadow-sm">
                Làm mới
            </button>
       </div>

       {loading ? (
           <p className="text-center text-slate-500 py-10 font-medium animate-pulse">Đang tải bản tin từ hệ thống...</p>
       ) : news.length === 0 ? (
           <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-200 border-dashed">
               <p className="text-slate-500 font-medium text-lg">Chưa có bản tin nào.</p>
               <p className="text-sm text-slate-400 mt-2">Hãy chờ hệ thống tự động tải tin mới vào sáng mai hoặc yêu cầu kỹ thuật viên kích hoạt Cron job.</p>
           </div>
       ) : (
           <div className="space-y-6">
               {news.map((item) => (
                   <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 hover:shadow-md transition-shadow">
                       <h2 className="text-xl sm:text-2xl font-black text-[#7A1216] mb-3 leading-tight">{item.title}</h2>
                       <div className="flex items-center gap-3 mb-6">
                           <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-wider">
                               {item.category}
                           </span>
                           <span className="text-xs text-slate-400 font-medium uppercase tracking-wider flex items-center gap-1">
                               ⏱ {new Date(item.created_at).toLocaleString('vi-VN')}
                           </span>
                       </div>
                       <hr className="border-slate-100 mb-6" />
                       <div className="text-slate-700 leading-relaxed">
                           <ReactMarkdown
                               components={{
                                   h1: ({node, ...props}) => <h1 className="text-2xl font-black text-slate-900 mt-8 mb-4 border-b border-slate-100 pb-2" {...props} />,
                                   h2: ({node, ...props}) => <h2 className="text-xl font-bold text-indigo-900 mt-8 mb-4 flex items-center gap-2 before:content-[''] before:w-2 before:h-6 before:bg-indigo-500 before:rounded-full before:inline-block" {...props} />,
                                   h3: ({node, ...props}) => <h3 className="text-lg font-bold text-slate-800 mt-6 mb-3" {...props} />,
                                   ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-5 space-y-2 marker:text-indigo-400" {...props} />,
                                   ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-5 space-y-2 marker:text-indigo-400 font-medium" {...props} />,
                                   li: ({node, ...props}) => <li className="text-slate-700" {...props} />,
                                   p: ({node, ...props}) => <p className="mb-5 text-[15px] text-slate-700 leading-8" {...props} />,
                                   strong: ({node, ...props}) => <strong className="font-bold text-slate-900" {...props} />,
                                   em: ({node, ...props}) => <em className="text-slate-500 italic block mt-8 pt-4 border-t border-slate-100 text-sm text-center" {...props} />
                               }}
                           >
                               {item.content_markdown}
                           </ReactMarkdown>
                       </div>
                   </div>
               ))}
           </div>
       )}
    </div>
  );
};
