import React, { useState, useEffect, useRef } from 'react';
import { Send, Settings, Save, BrainCircuit, RefreshCw, X, Check, BarChart3, Clock, Calendar } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer 
} from 'recharts';

interface AdMetrics {
    name: string;
    spend: number;
    impressions: number;
    reach?: number;
    clicks: number;
    ctr: number;
    cpc: number;
    messages?: number;
    leads?: number;
    post_engagements?: number;
}

interface AIReport {
    id?: string;
    created_at?: string;
    report_type: string;
    metrics_json: AdMetrics[];
    ai_advice: string;
    isTemporary?: boolean; // For optimistic UI
}

export default function FacebookAdsAnalyzer() {
    const [reports, setReports] = useState<AIReport[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Settings state
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [fbToken, setFbToken] = useState('');
    const [adAccountId, setAdAccountId] = useState('');
    const [savedStatus, setSavedStatus] = useState(false);

    const reportsEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        reportsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [reports]);

    useEffect(() => {
        const storedToken = localStorage.getItem('fb_ads_token');
        const storedId = localStorage.getItem('fb_ad_account_id');
        if (storedToken) setFbToken(storedToken);
        if (storedId) setAdAccountId(storedId);

        if (storedId && storedToken) {
            fetchHistory(storedId);
        } else {
            // Hiển thị hướg dẫn ban đầu nếu chưa có Token
            setReports([{
                report_type: 'System',
                metrics_json: [],
                ai_advice: '👋 Chào bạn! Tôi là **Giám Đốc Marketing AI** của bạn.\n\n_Vui lòng vào Cài đặt ⚙️ (góc phải trên) để cấu hình Ad Account ID và Access Token trước khi báo cáo nhé!_',
                isTemporary: true
            }]);
        }
    }, []);

    const fetchHistory = async (accountId: string) => {
        try {
            const res = await fetch(`/api/fb-ads-reports?adAccountId=${accountId}`);
            const data = await res.json();
            if (data.reports && data.reports.length > 0) {
                // Đảo ngược để báo cáo cũ ở trên, mới ở dưới
                setReports(data.reports.reverse());
            } else {
                setReports([{
                    report_type: 'System',
                    metrics_json: [],
                    ai_advice: 'Hệ thống đã sẵn sàng! Bạn có thể yêu cầu báo cáo tự động bằng các nút Nhanh ở trên, hoặc nhập yêu cầu cụ thể xuống khung chat bên dưới.',
                    isTemporary: true
                }]);
            }
        } catch (error) {
            console.error('Fetch history error:', error);
        }
    };

    const saveSettings = () => {
        localStorage.setItem('fb_ads_token', fbToken);
        localStorage.setItem('fb_ad_account_id', adAccountId);
        setSavedStatus(true);
        setTimeout(() => setSavedStatus(false), 2000);
        setIsSettingsOpen(false);
        fetchHistory(adAccountId);
    };

    const generateReport = async (promptText: string, reportType: string) => {
        if (!fbToken || !adAccountId) {
            alert('Vui lòng vào Cài đặt ⚙️ để nhập Facebook Access Token và Ad Account ID.');
            setIsSettingsOpen(true);
            return;
        }

        setIsLoading(true);
        
        // Optimistic UI for User Message
        setReports(prev => [...prev, {
            report_type: 'User_Prompt',
            metrics_json: [],
            ai_advice: promptText,
            isTemporary: true
        }]);

        try {
            const response = await fetch('/api/fb-ads-analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    prompt: promptText,
                    fbToken,
                    adAccountId,
                    reportType
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMsg = 'Lỗi máy chủ';
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMsg = errorJson.error || errorJson.message || errorMsg;
                } catch (e) {
                    errorMsg = errorText.substring(0, 100);
                }
                throw new Error(errorMsg);
            }

            // Sau khi backend xử lý và lưu DB thành công, fetch lại lịch sử để lấy biểu đồ mới nhất
            await fetchHistory(adAccountId);

        } catch (error: any) {
            console.error('Lỗi khi phân tích Ads:', error);
            setReports(prev => [...prev, {
                report_type: 'System_Error',
                metrics_json: [],
                ai_advice: `❌ **Lỗi:**\n${error.message}`,
                isTemporary: true
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = () => {
        if (!input.trim()) return;
        const text = input.trim();
        setInput('');
        generateReport(text, 'Tùy chỉnh');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const renderMarkdown = (text: string) => {
        let html = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/_(.*?)_/g, '<em>$1</em>')
            .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-4 mb-2 text-slate-800">$1</h3>')
            .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-5 mb-3 text-indigo-700 border-b pb-1">$1</h2>')
            .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-black mt-6 mb-4 text-indigo-800">$1</h1>')
            .replace(/^\- (.*$)/gim, '<li class="ml-4 list-disc marker:text-indigo-400">$1</li>')
            .replace(/\n/g, '<br />');

        html = html.replace(/(\d{1,3}(,\d{3})*(\.\d+)?(đ|\$| đ|VNĐ))/gi, '<span class="font-bold text-emerald-600">$1</span>');
        return { __html: html };
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] lg:h-[calc(100vh-180px)] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-gradient-to-r from-blue-50 to-indigo-50/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-200">
                        <BrainCircuit className="text-white w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 tracking-tight">Giám Đốc Marketing AI</h2>
                        <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                            <BarChart3 className="w-3 h-3"/> Dashboard Báo cáo Cục bộ
                        </p>
                    </div>
                </div>
                <button 
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    className="p-2.5 bg-white text-slate-600 hover:text-indigo-600 rounded-xl border border-slate-200 hover:border-indigo-200 shadow-sm transition-all focus:outline-none"
                    title="Cấu hình Token"
                >
                    <Settings className="w-5 h-5" />
                </button>
            </div>

            {/* Quick Actions */}
            <div className="px-6 py-3 border-b border-slate-100 bg-white flex flex-wrap gap-3 shrink-0">
                <button 
                    onClick={() => generateReport('Phân tích chi tiết hiệu quả các bài viết quảng cáo trong ngày hôm nay. Trọng tâm vào Chi phí và Tin nhắn/Lead mới.', 'Báo cáo Hôm nay')}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 font-semibold text-sm rounded-lg hover:bg-indigo-100 transition-colors"
                >
                    <Clock size={16} /> Báo cáo Hôm nay
                </button>
                <button 
                    onClick={() => generateReport('Phân tích ngân sách và tỷ lệ chuyển đổi của tất cả các Ads trong 7 ngày qua. Đưa ra lời khuyên tắt camp hay vít ngân sách.', 'Báo cáo Tuần này')}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 font-semibold text-sm rounded-lg hover:bg-purple-100 transition-colors"
                >
                    <Calendar size={16} /> Báo cáo Tuần
                </button>
                <button 
                    onClick={() => generateReport('Tóm tắt tổng quan ngân sách và Top 5 bài viết hiệu quả nhất trong 30 ngày qua.', 'Báo cáo Tháng này')}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 font-semibold text-sm rounded-lg hover:bg-emerald-100 transition-colors"
                >
                    <BarChart3 size={16} /> Báo cáo Tháng
                </button>
            </div>

            {/* Settings Modal */}
            <div className={`absolute top-0 right-0 bottom-0 w-full sm:w-96 bg-white border-l border-slate-200 shadow-2xl z-20 transition-transform duration-300 transform ${isSettingsOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                        <h3 className="font-bold text-slate-800">Cấu hình DB & API</h3>
                        <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-700">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="p-6 flex-1 overflow-y-auto space-y-5">
                        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                            <p className="text-xs text-blue-700 leading-relaxed font-medium">Báo cáo sẽ được gửi vào SQL Supabase của bạn để vẽ Dashboard dài hạn.</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Ad Account ID</label>
                            <input 
                                type="text"
                                value={adAccountId}
                                onChange={(e) => setAdAccountId(e.target.value)}
                                placeholder="act_123456789"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 font-mono"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">User Access Token</label>
                            <textarea 
                                value={fbToken}
                                onChange={(e) => setFbToken(e.target.value)}
                                placeholder="EAAI..."
                                rows={4}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 font-mono resize-none relative"
                                style={{ wordBreak: 'break-all' }}
                            />
                        </div>
                    </div>
                    <div className="p-4 border-t border-slate-100 bg-slate-50">
                        <button 
                            onClick={saveSettings}
                            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-sm active:scale-95"
                        >
                            {savedStatus ? <><Check size={18} /> Đã lưu thành công</> : <><Save size={18} /> Lưu cấu hình</>}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Area: List of Reports */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50" style={{ scrollBehavior: 'smooth' }}>
                <div className="max-w-5xl mx-auto space-y-10">
                    {reports.map((report, idx) => {
                        const isUserPrompt = report.report_type === 'User_Prompt';
                        const isSystem = report.report_type === 'System' || report.report_type === 'System_Error';

                        return (
                            <div key={report.id || idx} className={`flex ${isUserPrompt ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex w-full ${isUserPrompt ? 'max-w-[75%] gap-3 items-end flex-row-reverse' : 'gap-4 items-start flex-col sm:flex-row'}`}>
                                    
                                    {/* Avatar */}
                                    {!isSystem && <div className={`shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm ${isUserPrompt ? 'bg-indigo-100 text-indigo-600' : 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white'}`}>
                                        {isUserPrompt ? <div className="font-bold">U</div> : <BrainCircuit size={20} />}
                                    </div>}

                                    <div className="flex-1 w-full min-w-0">
                                        {/* User Bubble */}
                                        {isUserPrompt && (
                                            <div className="px-5 py-3.5 bg-indigo-600 text-white rounded-2xl rounded-br-sm shadow-md">
                                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{report.ai_advice}</p>
                                            </div>
                                        )}

                                        {/* System / Error Bubble */}
                                        {isSystem && (
                                            <div className="px-5 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl shadow-sm text-center mx-auto max-w-md">
                                                <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={renderMarkdown(report.ai_advice)} />
                                            </div>
                                        )}

                                        {/* AI Report Card with Dashboard Chart */}
                                        {!isUserPrompt && !isSystem && (
                                            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                                
                                                {/* Card Header */}
                                                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg uppercase tracking-wide">
                                                            {report.report_type}
                                                        </span>
                                                        <span className="text-xs text-slate-500 font-medium font-mono">
                                                            Ngày tạo: {new Date(report.created_at || Date.now()).toLocaleString('vi-VN')}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Recharts Dashboard (Chỉ render nếu có dữ liệu metrics) */}
                                                {report.metrics_json && report.metrics_json.length > 0 && (
                                                    <div className="p-6 border-b border-slate-100">
                                                        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                                            <BarChart3 className="w-4 h-4 text-indigo-500"/>
                                                            Chi phí Top Quảng cáo (Spend vs Clicks)
                                                        </h3>
                                                        <div className="h-64 w-full">
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <BarChart data={report.metrics_json} margin={{ top: 5, right: 10, left: 10, bottom: 5 }} barSize={30}>
                                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tickFormatter={(val) => val.substring(0,8) + '...'} tick={{ fill: '#64748b', fontSize: 10 }} />
                                                                    <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tick={{ fill: '#4f46e5', fontSize: 10 }} />
                                                                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#06b6d4', fontSize: 10 }} />
                                                                    <RechartsTooltip 
                                                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                                                        itemStyle={{ fontSize: '13px', fontWeight: 600 }}
                                                                    />
                                                                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}/>
                                                                    <Bar yAxisId="left" dataKey="spend" name="Chi phí (đ/VND)" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                                                                    <Bar yAxisId="right" dataKey="clicks" name="Clicks" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                                                                    <Bar yAxisId="right" dataKey="messages" name="Tin nhắn" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                                                    <Bar yAxisId="right" dataKey="leads" name="Tiềm năng" fill="#10b981" radius={[4, 4, 0, 0]} />
                                                                    <Bar yAxisId="right" dataKey="reach" name="Lượt tiếp cận" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                                                                </BarChart>
                                                            </ResponsiveContainer>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Markdown Advice Content */}
                                                <div className="p-6 lg:p-8">
                                                    <div className="prose prose-sm lg:prose-base prose-indigo max-w-none prose-headings:font-bold prose-p:text-slate-700">
                                                        <div dangerouslySetInnerHTML={renderMarkdown(report.ai_advice)} />
                                                    </div>
                                                </div>

                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Loading Indicator */}
                    {isLoading && (
                        <div className="flex gap-4 items-start">
                            <div className="shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-sm">
                                <BrainCircuit size={20} />
                            </div>
                            <div className="px-5 py-4 rounded-2xl bg-white border border-slate-200 text-slate-700 shadow-sm flex items-center gap-3">
                                <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" />
                                <span className="text-sm font-semibold text-slate-600">Giám đốc AI đang tổng hợp số liệu & viết báo cáo chiến lược...</span>
                            </div>
                        </div>
                    )}
                    <div ref={reportsEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="p-4 sm:p-6 bg-white border-t border-slate-100 shrink-0">
                <div className="max-w-4xl mx-auto relative flex items-end">
                    <textarea 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Có thể yêu cầu thêm: So sánh tương tác giữa 2 video gần nhất, phân tích tại sao giá mess tăng..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-5 pr-14 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 resize-none min-h-[60px] max-h-[150px] transition-all scrollbar-hide text-slate-700"
                        rows={1}
                        onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = 'auto';
                            target.style.height = `${Math.min(target.scrollHeight, 150)}px`;
                        }}
                    />
                    <button 
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className={`absolute right-3 bottom-2.5 p-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center ${
                            input.trim() && !isLoading 
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md hover:scale-105 active:scale-95' 
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                    >
                        <Send size={18} className={input.trim() && !isLoading ? 'translate-x-0.5 -translate-y-0.5' : ''} />
                    </button>
                </div>
            </div>
            
        </div>
    );
}
