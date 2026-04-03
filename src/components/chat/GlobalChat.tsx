import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { Send, X, MessageSquare, Loader2, Bot, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { processHRQuestion, getDailyBriefing, type ChatMessage as AIChatMessage } from '../../services/hrAssistantService';

interface Message {
    id: string;
    content: string;
    user_id: string;
    created_at: string;
    profiles?: {
        full_name: string;
        role: string;
    } | null;
}

interface GlobalChatProps {
    isOpen: boolean;
    onClose: () => void;
    currentUserProfile: any;
}

const getQuickQuestions = (role?: string) => {
    if (['Giám Sát', 'Quản lý thi công', 'Kỹ sư'].includes(role || '')) {
        return [
            { icon: '🏗️', text: 'Hôm nay tôi có hạng mục nào?' },
            { icon: '⚠️', text: 'Hạng mục nào đang trễ tiến độ?' },
            { icon: '📋', text: 'Nhật ký công trường gần nhất?' },
            { icon: '🔧', text: 'Tôi đang thi công công trình nào?' },
        ];
    }
    if (['Marketing', 'Sale'].includes(role || '')) {
        return [
            { icon: '📢', text: 'Hôm nay tôi có task marketing nào?' },
            { icon: '📊', text: 'Báo cáo Facebook Ads gần nhất?' },
            { icon: '🚨', text: 'Task nào đang trễ deadline?' },
            { icon: '🎯', text: 'Tôi cần làm gì để đạt KPI?' },
        ];
    }
    return [
        { icon: '📋', text: 'Hôm nay tôi có task nào?' },
        { icon: '🚨', text: 'Task nào đang trễ deadline?' },
        { icon: '💰', text: 'KPI & lương tháng này?' },
        { icon: '📈', text: 'Cách tăng KPI của tôi?' },
    ];
};

export const GlobalChat: React.FC<GlobalChatProps> = ({ isOpen, onClose, currentUserProfile }) => {
    const [activeTab, setActiveTab] = useState<'chat' | 'ai'>('chat');

    // ── Chat Chung state ──
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // ── AI Assistant state ──
    const [aiMessages, setAiMessages] = useState<AIChatMessage[]>([]);
    const [aiInput, setAiInput] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [briefingLoaded, setBriefingLoaded] = useState(false);
    const aiEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (!isOpen) return;

        const fetchMessages = async () => {
            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('global_messages')
                    .select(`
                        id,
                        content,
                        user_id,
                        created_at,
                        profiles:user_id (full_name, role)
                    `)
                    .order('created_at', { ascending: false })
                    .limit(50); // Lấy 50 tin nhắn gần nhất

                if (error) throw error;
                if (data) {
                    // Đảo ngược lại vì order descending để lấy mới nhất, nhưng hiển thị thì mới nhất ở dưới
                    setMessages((data as unknown as Message[]).reverse());
                }
            } catch (error) {
                console.error('Error fetching global messages:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMessages();

        // Subscribe to real-time changes
        const channel = supabase
            .channel('global_chat_channel')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'global_messages'
                },
                async (payload) => {
                    // Cần fetch thông tin profile của người gửi tin nhắn mới
                    const newMsg = payload.new as Message;
                    const { data: profileData } = await supabase
                        .from('profiles')
                        .select('full_name, role')
                        .eq('id', newMsg.user_id)
                        .single();

                    const fullMessage: Message = {
                        ...newMsg,
                        profiles: profileData
                    };

                    setMessages((prev) => [...prev, fullMessage]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen]);

    // Auto-load daily briefing when AI tab first opens
    useEffect(() => {
        if (!isOpen || activeTab !== 'ai' || briefingLoaded || !currentUserProfile?.id) return;
        setBriefingLoaded(true);
        setAiLoading(true);
        getDailyBriefing(
            currentUserProfile.id,
            currentUserProfile.full_name || 'bạn',
            currentUserProfile.role || 'Nhân viên'
        ).then(text => {
            setAiMessages([{ role: 'assistant', content: text, timestamp: new Date() }]);
            setAiLoading(false);
        });
    }, [isOpen, activeTab, briefingLoaded, currentUserProfile]);

    useEffect(() => {
        aiEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [aiMessages, aiLoading]);

    const handleSendAI = async (text?: string) => {
        const question = (text || aiInput).trim();
        if (!question || aiLoading || !currentUserProfile?.id) return;
        const userMsg: AIChatMessage = { role: 'user', content: question, timestamp: new Date() };
        setAiMessages(prev => [...prev, userMsg]);
        setAiInput('');
        setAiLoading(true);
        try {
            const resp = await processHRQuestion(
                question, [...aiMessages, userMsg],
                currentUserProfile.id,
                currentUserProfile.full_name || '',
                currentUserProfile.role || ''
            );
            setAiMessages(prev => [...prev, { role: 'assistant', content: resp, timestamp: new Date() }]);
        } catch {
            setAiMessages(prev => [...prev, { role: 'assistant', content: 'Lỗi kết nối, thử lại sau.', timestamp: new Date() }]);
        } finally {
            setAiLoading(false);
        }
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();

        if (!newMessage.trim() || !currentUserProfile?.id) return;

        const textToSend = newMessage.trim();
        setNewMessage(''); // Clear input ngay lập tức để cảm giác nhanh

        try {
            const { error } = await supabase
                .from('global_messages')
                .insert([
                    {
                        content: textToSend,
                        user_id: currentUserProfile.id
                    }
                ]);

            if (error) {
                console.error('Lỗi khi gửi:', error);
                alert('Không thể gửi tin nhắn.');
            }
            // Không cần setMessages tay ở đây do Realtime subscription sẽ tự append vào list
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const getRoleColor = (role?: string) => {
        if (role === 'Admin') return 'text-orange-600 bg-orange-50';
        if (role === 'Quản lý') return 'text-blue-600 bg-blue-50';
        return 'text-emerald-600 bg-emerald-50';
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60]" onClick={onClose}>
            <div
                className="absolute right-6 top-20 w-[400px] bg-white rounded-2xl shadow-2xl z-[70] animate-in fade-in zoom-in duration-200 origin-top-right overflow-hidden flex flex-col border border-slate-200 h-[600px] max-h-[80vh]"
                onClick={(e) => e.stopPropagation()} // Chống click tạt ra ngoài tắt popup
            >
                {/* Header */}
                <div className="border-b border-slate-100 bg-white shrink-0">
                    <div className="px-4 pt-3 pb-0 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${activeTab === 'ai' ? 'bg-teal-50 text-teal-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                {activeTab === 'ai' ? <Bot size={16} /> : <MessageSquare size={16} />}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-sm">{activeTab === 'ai' ? 'Trợ Lý AI' : 'Chat Chung'}</h3>
                                <p className="text-[10px] text-slate-400">{activeTab === 'ai' ? 'Phân tích công việc & KPI' : 'Kênh thảo luận toàn công ty'}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                            <X size={16} />
                        </button>
                    </div>
                    {/* Tab switcher */}
                    <div className="flex px-4 pb-0 gap-0 mt-2">
                        <button
                            onClick={() => setActiveTab('chat')}
                            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold border-b-2 transition-all ${activeTab === 'chat' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                        >
                            <MessageSquare size={13} /> Chat Chung
                        </button>
                        <button
                            onClick={() => setActiveTab('ai')}
                            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold border-b-2 transition-all ${activeTab === 'ai' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                        >
                            <Sparkles size={13} /> Trợ Lý AI
                        </button>
                    </div>
                </div>

                {/* ── AI Assistant Tab ── */}
                {activeTab === 'ai' && (
                    <>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 custom-scrollbar">
                            {aiLoading && aiMessages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center gap-3 text-teal-600">
                                    <Sparkles size={28} className="animate-spin" />
                                    <p className="text-sm font-medium">Đang phân tích công việc hôm nay...</p>
                                </div>
                            ) : (
                                aiMessages.map((msg, i) => (
                                    <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                        {msg.role === 'assistant' && (
                                            <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center shrink-0 mt-0.5">
                                                <Bot size={14} className="text-teal-600" />
                                            </div>
                                        )}
                                        <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed ${
                                            msg.role === 'user'
                                                ? 'bg-teal-600 text-white rounded-tr-sm'
                                                : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'
                                        }`}>
                                            <p className="whitespace-pre-wrap">{msg.content}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                            {aiLoading && aiMessages.length > 0 && (
                                <div className="flex items-center gap-2 text-teal-600 text-xs font-semibold px-2">
                                    <Sparkles size={12} className="animate-spin" /> AI đang soạn...
                                </div>
                            )}
                            <div ref={aiEndRef} />
                        </div>
                        <div className="p-3 bg-white border-t border-slate-100 shrink-0">
                            <div className="flex flex-wrap gap-1.5 mb-2.5">
                                {getQuickQuestions(currentUserProfile?.role).map((q, i) => (
                                    <button key={i} onClick={() => handleSendAI(q.text)}
                                        className="text-[11px] bg-slate-50 text-slate-600 hover:bg-teal-50 hover:text-teal-700 px-2.5 py-1.5 rounded-full border border-slate-200 transition-colors">
                                        {q.icon} {q.text}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <input value={aiInput} onChange={e => setAiInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSendAI()}
                                    placeholder="Hỏi về task, KPI, lương..."
                                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/10"
                                />
                                <button onClick={() => handleSendAI()} disabled={!aiInput.trim() || aiLoading}
                                    className="w-10 h-10 bg-teal-600 text-white rounded-xl flex items-center justify-center disabled:opacity-50 hover:bg-teal-700 transition-colors">
                                    <Send size={15} />
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* ── Chat Chung Tab ── */}
                {activeTab === 'chat' && <>
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/50 custom-scrollbar">
                    {isLoading ? (
                        <div className="h-full flex items-center justify-center text-slate-400 gap-2">
                            <Loader2 size={16} className="animate-spin" />
                            <span className="text-sm font-medium">Đang tải tin nhắn...</span>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3 opacity-60">
                            <MessageSquare size={40} className="text-slate-200" />
                            <span className="text-sm font-medium">Chưa có tin nhắn nào. Hãy là người đầu tiên!</span>
                        </div>
                    ) : (
                        messages.map((msg, idx) => {
                            const isMe = msg.user_id === currentUserProfile?.id;
                            const showAvatar = idx === 0 || messages[idx - 1].user_id !== msg.user_id;

                            return (
                                <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {/* Avatar */}
                                    <div className="shrink-0 w-8 flex flex-col items-center">
                                        {showAvatar ? (
                                            <div
                                                className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shadow-sm border border-white
                                                ${isMe ? 'bg-indigo-600 text-white' : getRoleColor(msg.profiles?.role).split(' ')[1] + ' ' + getRoleColor(msg.profiles?.role).split(' ')[0]}
                                                `}
                                                title={msg.profiles?.full_name || 'User'}
                                            >
                                                {(msg.profiles?.full_name || '?').charAt(0).toUpperCase()}
                                            </div>
                                        ) : (
                                            <div className="w-8 h-8" />
                                        )}
                                    </div>

                                    {/* Message content */}
                                    <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                                        {showAvatar && (
                                            <div className="flex items-baseline gap-2 mb-1 px-1">
                                                <span className="text-[11px] font-bold text-slate-700">
                                                    {isMe ? 'Bạn' : msg.profiles?.full_name || 'Người dùng'}
                                                </span>
                                                <span className="text-[9px] font-medium text-slate-400">
                                                    {format(new Date(msg.created_at), 'HH:mm')}
                                                </span>
                                            </div>
                                        )}
                                        <div
                                            className={`px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed relative group
                                            ${isMe
                                                    ? 'bg-indigo-600 text-white rounded-tr-sm'
                                                    : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm'
                                                }`}
                                            title={format(new Date(msg.created_at), 'dd/MM/yyyy HH:mm')}
                                        >
                                            <p className="whitespace-pre-wrap word-break-words">{msg.content}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Footer (Input) */}
                <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                    <form onSubmit={handleSendMessage} className="relative flex items-end gap-2">
                        <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder="Nhập tin nhắn... (Enter để gửi)"
                            className="flex-1 max-h-[120px] min-h-[44px] bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 resize-none custom-scrollbar transition-all"
                            rows={1}
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="shrink-0 w-11 h-11 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600"
                        >
                            <Send size={18} className="translate-x-0.5" />
                        </button>
                    </form>
                </div>
                </>}
            </div>
        </div>
    );
};
