import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { Send, X, MessageSquare, Loader2, Bot, Sparkles, Image as ImageIcon, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { processHRQuestion, getDailyBriefing, type ChatMessage as AIChatMessage } from '../../services/hrAssistantService';
import { createNotification } from '../../services/notifications';

interface Message {
    id: string;
    content: string;
    image_url?: string | null;
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
    profiles?: any[];
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

export const GlobalChat: React.FC<GlobalChatProps> = ({ isOpen, onClose, currentUserProfile, profiles: profilesProp }) => {
    const [activeTab, setActiveTab] = useState<'chat' | 'ai'>('chat');
    const [profiles, setProfiles] = useState<any[]>(profilesProp || []);

    // ── Chat Chung state ──
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [pendingImage, setPendingImage] = useState<File | null>(null);
    const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // @mention state
    const [showMentions, setShowMentions] = useState(false);
    const [mentionFilter, setMentionFilter] = useState('');
    const mentionsRef = useRef<HTMLDivElement>(null);

    // ── AI Assistant state ──
    const [aiMessages, setAiMessages] = useState<AIChatMessage[]>([]);
    const [aiInput, setAiInput] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [briefingLoaded, setBriefingLoaded] = useState(false);
    const aiEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    useEffect(() => {
        if (!profilesProp?.length) {
            supabase.from('profiles').select('id, full_name, role').then(({ data }) => {
                if (data) setProfiles(data);
            });
        }
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        const fetchMessages = async () => {
            setIsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('global_messages')
                    .select(`id, content, image_url, user_id, created_at, profiles:user_id (full_name, role)`)
                    .order('created_at', { ascending: false })
                    .limit(60);

                if (error) throw error;
                if (data) setMessages((data as unknown as Message[]).reverse());
            } catch (error) {
                console.error('Error fetching global messages:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMessages();

        const channel = supabase
            .channel('global_chat_channel')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'global_messages' }, async (payload) => {
                const newMsg = payload.new as Message;
                const { data: profileData } = await supabase.from('profiles').select('full_name, role').eq('id', newMsg.user_id).single();
                setMessages(prev => [...prev, { ...newMsg, profiles: profileData }]);
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && !isLoading) scrollToBottom('instant');
    }, [isOpen, isLoading]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Close @mention dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (mentionsRef.current && !mentionsRef.current.contains(e.target as Node)) {
                setShowMentions(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // AI
    useEffect(() => {
        if (!isOpen || activeTab !== 'ai' || briefingLoaded || !currentUserProfile?.id) return;
        setBriefingLoaded(true);
        setAiLoading(true);
        getDailyBriefing(currentUserProfile.id, currentUserProfile.full_name || 'bạn', currentUserProfile.role || 'Nhân viên').then(text => {
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
            const resp = await processHRQuestion(question, [...aiMessages, userMsg], currentUserProfile.id, currentUserProfile.full_name || '', currentUserProfile.role || '');
            setAiMessages(prev => [...prev, { role: 'assistant', content: resp, timestamp: new Date() }]);
        } catch {
            setAiMessages(prev => [...prev, { role: 'assistant', content: 'Lỗi kết nối, thử lại sau.', timestamp: new Date() }]);
        } finally {
            setAiLoading(false);
        }
    };

    // @mention detection
    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setNewMessage(val);
        const words = val.split(/\s/);
        const lastWord = words[words.length - 1];
        if (lastWord.startsWith('@') && lastWord.length > 0) {
            setShowMentions(true);
            setMentionFilter(lastWord.substring(1).toLowerCase());
        } else {
            setShowMentions(false);
        }
    };

    const insertMention = (profile: any) => {
        const words = newMessage.split(/\s/);
        words[words.length - 1] = `@${profile.full_name.replace(/\s+/g, '')} `;
        setNewMessage(words.join(' '));
        setShowMentions(false);
        textareaRef.current?.focus();
    };

    const detectMentions = (text: string): string[] => {
        return profiles.filter(p => {
            const tag = `@${p.full_name.replace(/\s+/g, '')}`;
            return text.includes(tag);
        }).map(p => p.id);
    };

    const renderContent = (content: string) => {
        if (!profiles.length) return content;
        const tags = profiles.map(p => `@${p.full_name.replace(/\s+/g, '')}`);
        const regex = new RegExp(`(${tags.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
        const parts = content.split(regex);
        return parts.map((part, i) =>
            tags.includes(part)
                ? <span key={i} className="text-blue-600 font-semibold">{part}</span>
                : part
        );
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { alert('Chỉ hỗ trợ file hình ảnh.'); return; }
        if (file.size > 5 * 1024 * 1024) { alert('File quá lớn. Tối đa 5MB.'); return; }
        setPendingImage(file);
        setPendingImagePreview(URL.createObjectURL(file));
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const clearPendingImage = () => {
        if (pendingImagePreview) URL.revokeObjectURL(pendingImagePreview);
        setPendingImage(null);
        setPendingImagePreview(null);
    };

    const uploadImage = async (file: File): Promise<string | null> => {
        const ext = file.name.split('.').pop();
        const path = `chat/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from('chat-images').upload(path, file);
        if (error) { console.error('Upload error:', error); return null; }
        const { data } = supabase.storage.from('chat-images').getPublicUrl(path);
        return data.publicUrl;
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim() && !pendingImage) return;
        if (!currentUserProfile?.id) return;

        const textToSend = newMessage.trim();
        setNewMessage('');
        setShowMentions(false);

        let imageUrl: string | null = null;
        if (pendingImage) {
            setUploadingImage(true);
            imageUrl = await uploadImage(pendingImage);
            clearPendingImage();
            setUploadingImage(false);
        }

        try {
            const { error } = await supabase.from('global_messages').insert([{
                content: textToSend,
                user_id: currentUserProfile.id,
                image_url: imageUrl || null,
            }]);

            if (error) { console.error('Lỗi khi gửi:', error); alert('Không thể gửi tin nhắn.'); return; }

            // Send notifications to @mentioned users
            const mentionedIds = detectMentions(textToSend);
            for (const uid of mentionedIds) {
                if (uid !== currentUserProfile.id) {
                    await createNotification(
                        uid,
                        `${currentUserProfile.full_name} đã nhắc đến bạn trong Chat Chung: "${textToSend.substring(0, 60)}${textToSend.length > 60 ? '...' : ''}"`,
                        'mention',
                        currentUserProfile.id,
                        null, null
                    );
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const getRoleColor = (role?: string) => {
        if (role === 'Admin') return 'text-orange-600 bg-orange-50';
        if (role?.includes('Quản lý')) return 'text-blue-600 bg-blue-50';
        return 'text-emerald-600 bg-emerald-50';
    };

    const filteredProfiles = profiles.filter(p =>
        p.id !== currentUserProfile?.id &&
        p.full_name.toLowerCase().includes(mentionFilter.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60]" onClick={onClose}>
            <div
                className="absolute right-6 top-20 w-[400px] bg-white rounded-2xl shadow-2xl z-[70] animate-in fade-in zoom-in duration-200 origin-top-right overflow-hidden flex flex-col border border-slate-200 h-[600px] max-h-[80vh]"
                onClick={(e) => e.stopPropagation()}
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
                    <div className="flex px-4 pb-0 gap-0 mt-2">
                        <button onClick={() => setActiveTab('chat')} className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold border-b-2 transition-all ${activeTab === 'chat' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                            <MessageSquare size={13} /> Chat Chung
                        </button>
                        <button onClick={() => setActiveTab('ai')} className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold border-b-2 transition-all ${activeTab === 'ai' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                            <Sparkles size={13} /> Trợ Lý AI
                        </button>
                    </div>
                </div>

                {/* ── AI Tab ── */}
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
                                        <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed ${msg.role === 'user' ? 'bg-teal-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'}`}>
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
                                    <button key={i} onClick={() => handleSendAI(q.text)} className="text-[11px] bg-slate-50 text-slate-600 hover:bg-teal-50 hover:text-teal-700 px-2.5 py-1.5 rounded-full border border-slate-200 transition-colors">
                                        {q.icon} {q.text}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <input value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendAI()} placeholder="Hỏi về task, KPI, lương..." className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/10" />
                                <button onClick={() => handleSendAI()} disabled={!aiInput.trim() || aiLoading} className="w-10 h-10 bg-teal-600 text-white rounded-xl flex items-center justify-center disabled:opacity-50 hover:bg-teal-700 transition-colors">
                                    <Send size={15} />
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* ── Chat Tab ── */}
                {activeTab === 'chat' && (
                    <>
                        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/50 custom-scrollbar">
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
                                            <div className="shrink-0 w-8 flex flex-col items-center">
                                                {showAvatar ? (
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shadow-sm border border-white ${isMe ? 'bg-indigo-600 text-white' : 'bg-emerald-100 text-emerald-600'}`} title={msg.profiles?.full_name || 'User'}>
                                                        {(msg.profiles?.full_name || '?').charAt(0).toUpperCase()}
                                                    </div>
                                                ) : (
                                                    <div className="w-8 h-8" />
                                                )}
                                            </div>
                                            <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                                                {showAvatar && (
                                                    <div className="flex items-baseline gap-2 mb-1 px-1">
                                                        <span className="text-[11px] font-bold text-slate-700">{isMe ? 'Bạn' : msg.profiles?.full_name || 'Người dùng'}</span>
                                                        <span className="text-[9px] font-medium text-slate-400">{format(new Date(msg.created_at), 'HH:mm')}</span>
                                                    </div>
                                                )}
                                                {msg.image_url && (
                                                    <div className={`mb-1 rounded-xl overflow-hidden border border-slate-200 shadow-sm max-w-[220px] ${isMe ? 'ml-auto' : ''}`}>
                                                        <img src={msg.image_url} alt="Hình ảnh" className="w-full h-auto object-cover cursor-pointer" onClick={() => window.open(msg.image_url!, '_blank')} />
                                                    </div>
                                                )}
                                                {msg.content && (
                                                    <div className={`px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed ${isMe ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm'}`} title={format(new Date(msg.created_at), 'dd/MM/yyyy HH:mm')}>
                                                        <p className="whitespace-pre-wrap word-break-words">{isMe ? msg.content : renderContent(msg.content)}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input area */}
                        <div className="p-3 bg-white border-t border-slate-100 shrink-0">
                            {/* Pending image preview */}
                            {pendingImagePreview && (
                                <div className="relative inline-block mb-2">
                                    <img src={pendingImagePreview} alt="Preview" className="h-20 rounded-lg border border-slate-200 object-cover" />
                                    <button onClick={clearPendingImage} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                                        <XCircle size={14} />
                                    </button>
                                </div>
                            )}

                            {/* @mention dropdown */}
                            {showMentions && filteredProfiles.length > 0 && (
                                <div ref={mentionsRef} className="mb-2 bg-white border border-slate-200 rounded-lg shadow-xl w-56 max-h-40 overflow-y-auto">
                                    <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Nhắc đến</div>
                                    {filteredProfiles.map(p => (
                                        <div key={p.id} className="px-3 py-2 hover:bg-indigo-50 cursor-pointer flex items-center gap-2 transition-colors" onClick={() => insertMention(p)}>
                                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-600">{p.full_name.charAt(0)}</div>
                                            <span className="text-sm font-medium text-slate-700">@{p.full_name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                                {/* Image button */}
                                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="w-9 h-9 shrink-0 bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 rounded-xl flex items-center justify-center transition-colors" title="Gửi hình ảnh">
                                    <ImageIcon size={16} />
                                </button>

                                <textarea
                                    ref={textareaRef}
                                    value={newMessage}
                                    onChange={handleTextareaChange}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !showMentions) { e.preventDefault(); handleSendMessage(); } }}
                                    placeholder="Nhập tin nhắn... (@ để nhắc ai đó)"
                                    className="flex-1 max-h-[100px] min-h-[40px] bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 resize-none custom-scrollbar transition-all"
                                    rows={1}
                                />
                                <button type="submit" disabled={(!newMessage.trim() && !pendingImage) || uploadingImage} className="shrink-0 w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50">
                                    {uploadingImage ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="translate-x-0.5" />}
                                </button>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
