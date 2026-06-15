import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabase';
import {
    Send, X, MessageSquare, Loader2, Bot, Sparkles,
    Image as ImageIcon, XCircle, CornerUpLeft, Pencil,
    Trash2, Check, ChevronLeft, MessageCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { processHRQuestion, getDailyBriefing, type ChatMessage as AIChatMessage } from '../../services/hrAssistantService';
import { createNotification } from '../../services/notifications';

interface Message {
    id: string;
    content: string;
    image_url?: string | null;
    reply_to_id?: string | null;
    is_edited?: boolean;
    user_id: string;
    created_at: string;
    profiles?: { full_name: string; role: string } | null;
}

interface DirectMessage {
    id: string;
    content: string;
    image_url?: string | null;
    is_read?: boolean;
    sender_id: string;
    receiver_id: string;
    created_at: string;
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
    const isAdmin = currentUserProfile?.role === 'Admin';
    const [activeTab, setActiveTab] = useState<'chat' | 'dm' | 'ai'>('chat');
    const [profiles, setProfiles] = useState<any[]>(profilesProp || []);

    // ── Chat Chung ──
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [pendingImage, setPendingImage] = useState<File | null>(null);
    const [pendingImagePreview, setPendingImagePreview] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // @mention
    const [showMentions, setShowMentions] = useState(false);
    const [mentionFilter, setMentionFilter] = useState('');
    const mentionsRef = useRef<HTMLDivElement>(null);

    // ── DM ──
    const [dmPartner, setDmPartner] = useState<any | null>(null);
    const [dmMessages, setDmMessages] = useState<DirectMessage[]>([]);
    const [dmNewMsg, setDmNewMsg] = useState('');
    const [dmLoading, setDmLoading] = useState(false);
    const [dmPendingImage, setDmPendingImage] = useState<File | null>(null);
    const [dmPendingPreview, setDmPendingPreview] = useState<string | null>(null);
    const [dmUploading, setDmUploading] = useState(false);
    const [unreadByUser, setUnreadByUser] = useState<Record<string, number>>({});
    const dmEndRef = useRef<HTMLDivElement>(null);
    const dmFileRef = useRef<HTMLInputElement>(null);

    // ── AI ──
    const [aiMessages, setAiMessages] = useState<AIChatMessage[]>([]);
    const [aiInput, setAiInput] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [briefingLoaded, setBriefingLoaded] = useState(false);
    const aiEndRef = useRef<HTMLDivElement>(null);

    // Fetch profiles if not provided
    useEffect(() => {
        if (!profilesProp?.length) {
            supabase.from('profiles').select('id, full_name, role').then(({ data }) => {
                if (data) setProfiles(data);
            });
        }
    }, []);

    // Chat Chung - fetch + real-time
    useEffect(() => {
        if (!isOpen || activeTab !== 'chat') return;

        const fetchMessages = async () => {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('global_messages')
                .select('id, content, image_url, reply_to_id, is_edited, user_id, created_at, profiles:user_id (full_name, role)')
                .order('created_at', { ascending: false })
                .limit(80);
            if (!error && data) setMessages((data as unknown as Message[]).reverse());
            setIsLoading(false);
        };

        fetchMessages();

        const channel = supabase.channel('global_chat_v2')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'global_messages' }, async (payload) => {
                const newMsg = payload.new as Message;
                const { data: profileData } = await supabase.from('profiles').select('full_name, role').eq('id', newMsg.user_id).single();
                setMessages(prev => [...prev, { ...newMsg, profiles: profileData }]);
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'global_messages' }, (payload) => {
                setMessages(prev => prev.map(m => m.id === payload.new.id ? { ...m, ...(payload.new as Message) } : m));
            })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'global_messages' }, (payload) => {
                setMessages(prev => prev.filter(m => m.id !== (payload.old as any).id));
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [isOpen, activeTab]);

    useEffect(() => {
        if (isOpen && !isLoading) messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
    }, [isOpen, isLoading]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // @mention outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (mentionsRef.current && !mentionsRef.current.contains(e.target as Node)) setShowMentions(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Unread DM counts
    useEffect(() => {
        if (!isOpen || !currentUserProfile?.id) return;
        supabase
            .from('direct_messages')
            .select('sender_id')
            .eq('receiver_id', currentUserProfile.id)
            .eq('is_read', false)
            .then(({ data }) => {
                if (!data) return;
                const counts: Record<string, number> = {};
                data.forEach((m: any) => { counts[m.sender_id] = (counts[m.sender_id] || 0) + 1; });
                setUnreadByUser(counts);
            });
    }, [isOpen, currentUserProfile?.id, activeTab]);

    // DM conversation
    useEffect(() => {
        if (!dmPartner || !currentUserProfile?.id) return;

        const fetchDMs = async () => {
            setDmLoading(true);
            const { data } = await supabase
                .from('direct_messages')
                .select('*')
                .or(`and(sender_id.eq.${currentUserProfile.id},receiver_id.eq.${dmPartner.id}),and(sender_id.eq.${dmPartner.id},receiver_id.eq.${currentUserProfile.id})`)
                .order('created_at', { ascending: true });
            if (data) setDmMessages(data as DirectMessage[]);
            setDmLoading(false);

            await supabase.from('direct_messages')
                .update({ is_read: true })
                .eq('sender_id', dmPartner.id)
                .eq('receiver_id', currentUserProfile.id)
                .eq('is_read', false);
            setUnreadByUser(prev => ({ ...prev, [dmPartner.id]: 0 }));
        };
        fetchDMs();

        const chanName = `dm_${[currentUserProfile.id, dmPartner.id].sort().join('_')}`;
        const channel = supabase.channel(chanName)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' }, async (payload) => {
                const msg = payload.new as DirectMessage;
                const isMine = msg.sender_id === currentUserProfile.id && msg.receiver_id === dmPartner.id;
                const isFromPartner = msg.sender_id === dmPartner.id && msg.receiver_id === currentUserProfile.id;
                if (isMine || isFromPartner) {
                    setDmMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
                    if (isFromPartner) {
                        await supabase.from('direct_messages').update({ is_read: true }).eq('id', msg.id);
                    }
                    setTimeout(() => dmEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [dmPartner?.id]);

    useEffect(() => {
        if (dmMessages.length > 0) setTimeout(() => dmEndRef.current?.scrollIntoView({ behavior: 'instant' }), 80);
    }, [dmPartner?.id]);

    // AI
    useEffect(() => {
        if (!isOpen || activeTab !== 'ai' || briefingLoaded || !currentUserProfile?.id) return;
        setBriefingLoaded(true);
        setAiLoading(true);
        getDailyBriefing(currentUserProfile.id, currentUserProfile.full_name || 'bạn', currentUserProfile.role || 'Thiết kế').then(text => {
            setAiMessages([{ role: 'assistant', content: text, timestamp: new Date() }]);
            setAiLoading(false);
        });
    }, [isOpen, activeTab, briefingLoaded, currentUserProfile]);

    useEffect(() => { aiEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [aiMessages, aiLoading]);

    // ── Helpers ──
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

    const detectMentions = (text: string) =>
        profiles.filter(p => text.includes(`@${p.full_name.replace(/\s+/g, '')}`)).map(p => p.id);

    const renderContent = (content: string) => {
        if (!profiles.length) return content;
        const tags = profiles.map(p => `@${p.full_name.replace(/\s+/g, '')}`);
        const regex = new RegExp(`(${tags.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
        return content.split(regex).map((part, i) =>
            tags.includes(part) ? <span key={i} className="font-semibold text-blue-300">{part}</span> : part
        );
    };

    const makeFileHandler = (setFile: (f: File | null) => void, setPreview: (p: string | null) => void) =>
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (!file.type.startsWith('image/')) { alert('Chỉ hỗ trợ hình ảnh.'); return; }
            if (file.size > 5 * 1024 * 1024) { alert('File quá lớn. Tối đa 5MB.'); return; }
            setFile(file);
            setPreview(URL.createObjectURL(file));
            e.target.value = '';
        };

    const uploadImage = async (file: File): Promise<string | null> => {
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `chat/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from('chat-images').upload(path, file);
        if (error) { console.error('Upload error:', error); return null; }
        return supabase.storage.from('chat-images').getPublicUrl(path).data.publicUrl;
    };

    const clearImage = (setFile: (f: File | null) => void, setPreview: (p: string | null) => void, preview: string | null) => {
        if (preview) URL.revokeObjectURL(preview);
        setFile(null);
        setPreview(null);
    };

    // ── Chat Chung actions ──
    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim() && !pendingImage) return;
        if (!currentUserProfile?.id) return;

        const textToSend = newMessage.trim();
        const replyId = replyingTo?.id || null;
        setNewMessage('');
        setShowMentions(false);
        setReplyingTo(null);

        let imageUrl: string | null = null;
        if (pendingImage) {
            setUploadingImage(true);
            imageUrl = await uploadImage(pendingImage);
            clearImage(setPendingImage, setPendingImagePreview, pendingImagePreview);
            setUploadingImage(false);
        }

        const { error } = await supabase.from('global_messages').insert([{
            content: textToSend,
            user_id: currentUserProfile.id,
            image_url: imageUrl || null,
            reply_to_id: replyId,
        }]);
        if (error) { console.error('Send error:', error); return; }

        const mentionedIds = detectMentions(textToSend);
        for (const uid of mentionedIds) {
            if (uid !== currentUserProfile.id) {
                await createNotification(uid,
                    `${currentUserProfile.full_name} đã nhắc đến bạn trong Chat Chung: "${textToSend.substring(0, 60)}${textToSend.length > 60 ? '...' : ''}"`,
                    'mention', currentUserProfile.id, null, null
                );
            }
        }
    };

    const handleStartEdit = (msg: Message) => { setEditingMsgId(msg.id); setEditContent(msg.content); };

    const handleSaveEdit = async () => {
        if (!editingMsgId || !editContent.trim()) return;
        const { error } = await supabase.from('global_messages')
            .update({ content: editContent.trim(), is_edited: true })
            .eq('id', editingMsgId);
        if (!error) setMessages(prev => prev.map(m => m.id === editingMsgId ? { ...m, content: editContent.trim(), is_edited: true } : m));
        setEditingMsgId(null);
        setEditContent('');
    };

    const handleDeleteMsg = async (msgId: string) => {
        if (!confirm('Xóa tin nhắn này?')) return;
        await supabase.from('global_messages').delete().eq('id', msgId);
        setMessages(prev => prev.filter(m => m.id !== msgId));
    };

    // ── DM actions ──
    const handleSendDM = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!dmNewMsg.trim() && !dmPendingImage) return;
        if (!currentUserProfile?.id || !dmPartner) return;

        const textToSend = dmNewMsg.trim();

        let imageUrl: string | null = null;
        if (dmPendingImage) {
            setDmUploading(true);
            imageUrl = await uploadImage(dmPendingImage);
            clearImage(setDmPendingImage, setDmPendingPreview, dmPendingPreview);
            setDmUploading(false);
        }

        const { data, error } = await supabase.from('direct_messages').insert([{
            content: textToSend,
            sender_id: currentUserProfile.id,
            receiver_id: dmPartner.id,
            image_url: imageUrl || null,
            is_read: false,
        }]).select().single();

        if (error) {
            console.error('DM send error:', error);
            return;
        }

        setDmNewMsg('');
        if (data) {
            setDmMessages(prev => prev.some(m => m.id === (data as DirectMessage).id) ? prev : [...prev, data as DirectMessage]);
            setTimeout(() => dmEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        }
    };

    // ── AI ──
    const handleSendAI = async (text?: string) => {
        const question = (text || aiInput).trim();
        if (!question || aiLoading) return;
        const userMsg: AIChatMessage = { role: 'user', content: question, timestamp: new Date() };
        setAiMessages(prev => [...prev, userMsg]);
        setAiInput('');
        setAiLoading(true);
        try {
            const resp = await processHRQuestion(question, [...aiMessages, userMsg], currentUserProfile.id, currentUserProfile.full_name || '', currentUserProfile.role || '');
            setAiMessages(prev => [...prev, { role: 'assistant', content: resp, timestamp: new Date() }]);
        } catch {
            setAiMessages(prev => [...prev, { role: 'assistant', content: 'Lỗi kết nối, thử lại sau.', timestamp: new Date() }]);
        } finally { setAiLoading(false); }
    };

    const filteredMentionProfiles = profiles.filter(p =>
        p.id !== currentUserProfile?.id && p.full_name.toLowerCase().includes(mentionFilter.toLowerCase())
    );
    const totalUnread = Object.values(unreadByUser).reduce((a, b) => a + b, 0);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60]" onClick={onClose}>
            <div
                className="absolute right-6 top-20 w-[390px] bg-white rounded-2xl shadow-2xl z-[70] animate-in fade-in zoom-in duration-200 origin-top-right overflow-hidden flex flex-col border border-slate-200 h-[600px] max-h-[82vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* ── Header ── */}
                <div className="border-b border-slate-100 bg-white shrink-0">
                    <div className="px-4 pt-3 pb-0 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${activeTab === 'ai' ? 'bg-teal-50 text-teal-600' : activeTab === 'dm' ? 'bg-purple-50 text-purple-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                {activeTab === 'ai' ? <Bot size={16} /> : activeTab === 'dm' ? <MessageCircle size={16} /> : <MessageSquare size={16} />}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-sm">
                                    {activeTab === 'ai' ? 'Trợ Lý AI' : activeTab === 'dm' ? (dmPartner ? dmPartner.full_name : 'Tin Nhắn Riêng') : 'Chat Chung'}
                                </h3>
                                <p className="text-[10px] text-slate-400">
                                    {activeTab === 'ai' ? 'Phân tích công việc & KPI' : activeTab === 'dm' ? (dmPartner ? dmPartner.role : 'Nhắn tin 1-1') : 'Kênh thảo luận toàn công ty'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            {activeTab === 'dm' && dmPartner && (
                                <button onClick={() => { setDmPartner(null); setDmMessages([]); }} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-colors">
                                    <ChevronLeft size={16} />
                                </button>
                            )}
                            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                    <div className="flex px-4 pb-0 mt-2">
                        <button onClick={() => setActiveTab('chat')} className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all ${activeTab === 'chat' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                            <MessageSquare size={12} /> Chung
                        </button>
                        <button onClick={() => setActiveTab('dm')} className={`relative flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all ${activeTab === 'dm' ? 'border-purple-500 text-purple-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                            <MessageCircle size={12} /> Riêng
                            {totalUnread > 0 && <span className="absolute -top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-black">{totalUnread}</span>}
                        </button>
                        <button onClick={() => setActiveTab('ai')} className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all ${activeTab === 'ai' ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                            <Sparkles size={12} /> AI
                        </button>
                    </div>
                </div>

                {/* ── CHAT CHUNG ── */}
                {activeTab === 'chat' && (
                    <>
                        <div className="flex-1 overflow-y-auto px-3 py-2 bg-[#f8f9fb] custom-scrollbar">
                            {isLoading ? (
                                <div className="h-full flex items-center justify-center"><Loader2 size={16} className="animate-spin text-slate-400" /></div>
                            ) : messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                                    <MessageSquare size={36} />
                                    <span className="text-sm font-medium">Chưa có tin nhắn nào</span>
                                </div>
                            ) : (
                                messages.map((msg, idx) => {
                                    const isMe = msg.user_id === currentUserProfile?.id;
                                    const prevMsg = idx > 0 ? messages[idx - 1] : null;
                                    const isGrouped = prevMsg?.user_id === msg.user_id;
                                    const repliedMsg = msg.reply_to_id ? messages.find(m => m.id === msg.reply_to_id) : null;
                                    const canEdit = isMe;
                                    const canDelete = isMe || isAdmin;

                                    return (
                                        <div key={msg.id} className={`flex gap-2 group/msg ${isMe ? 'flex-row-reverse' : ''} ${isGrouped ? 'mt-[3px]' : 'mt-4'}`}>
                                            {/* Avatar */}
                                            <div className="shrink-0 w-7 mt-0.5">
                                                {!isGrouped ? (
                                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${isMe ? 'bg-indigo-500 text-white' : 'bg-slate-300 text-slate-700'}`}>
                                                        {(msg.profiles?.full_name || '?').charAt(0).toUpperCase()}
                                                    </div>
                                                ) : <div className="w-7" />}
                                            </div>

                                            <div className={`flex flex-col max-w-[76%] ${isMe ? 'items-end' : 'items-start'}`}>
                                                {/* Name + time */}
                                                {!isGrouped && (
                                                    <div className={`flex items-baseline gap-1.5 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                                                        <span className="text-[11px] font-bold text-slate-600">{isMe ? 'Bạn' : msg.profiles?.full_name || 'Người dùng'}</span>
                                                        <span className="text-[10px] text-slate-400">{format(new Date(msg.created_at), 'HH:mm')}</span>
                                                    </div>
                                                )}

                                                {/* Reply quote */}
                                                {repliedMsg && (
                                                    <div className="mb-1 px-2.5 py-1.5 rounded-xl border-l-[3px] border-indigo-400 bg-white shadow-sm max-w-full">
                                                        <span className="text-[10px] font-bold text-indigo-500 block">{repliedMsg.user_id === currentUserProfile?.id ? 'Bạn' : repliedMsg.profiles?.full_name}</span>
                                                        <span className="text-[11px] text-slate-500 line-clamp-1">{repliedMsg.image_url && !repliedMsg.content ? '📷 Hình ảnh' : repliedMsg.content}</span>
                                                    </div>
                                                )}

                                                {/* Image */}
                                                {msg.image_url && (
                                                    <div className={`mb-1 rounded-xl overflow-hidden border border-slate-200 shadow-sm max-w-[200px] ${isMe ? 'ml-auto' : ''}`}>
                                                        <img src={msg.image_url} alt="" className="w-full h-auto cursor-pointer hover:opacity-95" onClick={() => window.open(msg.image_url!, '_blank')} />
                                                    </div>
                                                )}

                                                {/* Content + action buttons */}
                                                <div className={`flex items-center gap-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                                                    {editingMsgId === msg.id ? (
                                                        <div className="flex items-center gap-1.5 min-w-[200px]">
                                                            <input
                                                                autoFocus
                                                                value={editContent}
                                                                onChange={e => setEditContent(e.target.value)}
                                                                onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') { setEditingMsgId(null); } }}
                                                                className="flex-1 bg-white border border-indigo-300 rounded-xl px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                                                            />
                                                            <button onClick={handleSaveEdit} className="p-1.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 shrink-0"><Check size={12} /></button>
                                                            <button onClick={() => setEditingMsgId(null)} className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 shrink-0"><X size={12} /></button>
                                                        </div>
                                                    ) : msg.content ? (
                                                        <>
                                                            <div className={`px-3.5 py-2 rounded-2xl text-[13px] leading-relaxed ${isMe ? 'bg-indigo-500 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'}`}>
                                                                <p className="whitespace-pre-wrap break-words">{isMe ? msg.content : renderContent(msg.content)}</p>
                                                                {msg.is_edited && <span className={`text-[10px] ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}> · đã sửa</span>}
                                                            </div>
                                                            <div className="flex items-center gap-0.5 opacity-0 group-hover/msg:opacity-100 transition-opacity shrink-0">
                                                                <button onClick={() => { setReplyingTo(msg); setTimeout(() => textareaRef.current?.focus(), 50); }} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-indigo-500" title="Trả lời"><CornerUpLeft size={13} /></button>
                                                                {canEdit && <button onClick={() => handleStartEdit(msg)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-amber-500" title="Sửa"><Pencil size={13} /></button>}
                                                                {canDelete && <button onClick={() => handleDeleteMsg(msg.id)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-red-500" title="Xóa"><Trash2 size={13} /></button>}
                                                            </div>
                                                        </>
                                                    ) : null}
                                                    {/* Image-only: reply + delete */}
                                                    {msg.image_url && !msg.content && editingMsgId !== msg.id && (
                                                        <div className="flex items-center gap-0.5 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                                                            <button onClick={() => { setReplyingTo(msg); setTimeout(() => textareaRef.current?.focus(), 50); }} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-indigo-500"><CornerUpLeft size={13} /></button>
                                                            {canDelete && <button onClick={() => handleDeleteMsg(msg.id)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-red-500"><Trash2 size={13} /></button>}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="px-3 py-3 bg-white border-t border-slate-100 shrink-0">
                            {replyingTo && (
                                <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2 mb-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <CornerUpLeft size={12} className="text-indigo-400 shrink-0" />
                                        <div className="min-w-0">
                                            <span className="text-[10px] font-bold text-indigo-500">Trả lời {replyingTo.user_id === currentUserProfile?.id ? 'chính mình' : replyingTo.profiles?.full_name}</span>
                                            <p className="text-[11px] text-slate-500 truncate">{replyingTo.image_url && !replyingTo.content ? '📷 Hình ảnh' : replyingTo.content}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setReplyingTo(null)} className="p-1 text-slate-400 hover:text-slate-600 shrink-0"><X size={12} /></button>
                                </div>
                            )}
                            {pendingImagePreview && (
                                <div className="relative inline-block mb-2">
                                    <img src={pendingImagePreview} alt="" className="h-14 rounded-lg border border-slate-200 object-cover" />
                                    <button onClick={() => clearImage(setPendingImage, setPendingImagePreview, pendingImagePreview)} className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center"><XCircle size={10} /></button>
                                </div>
                            )}
                            {showMentions && filteredMentionProfiles.length > 0 && (
                                <div ref={mentionsRef} className="mb-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-32 overflow-y-auto">
                                    {filteredMentionProfiles.map(p => (
                                        <div key={p.id} className="px-3 py-2 hover:bg-indigo-50 cursor-pointer flex items-center gap-2 text-sm transition-colors" onClick={() => insertMention(p)}>
                                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-bold">{p.full_name.charAt(0)}</div>
                                            <span className="font-medium text-slate-700">@{p.full_name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={makeFileHandler(setPendingImage, setPendingImagePreview)} />
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="w-8 h-8 shrink-0 bg-slate-50 border border-slate-200 text-slate-400 hover:text-indigo-600 rounded-xl flex items-center justify-center transition-colors">
                                    <ImageIcon size={15} />
                                </button>
                                <textarea
                                    ref={textareaRef}
                                    value={newMessage}
                                    onChange={handleTextareaChange}
                                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !showMentions) { e.preventDefault(); handleSendMessage(); } }}
                                    placeholder="Nhập tin nhắn... (@ để tag)"
                                    className="flex-1 max-h-[80px] min-h-[36px] bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-400 focus:bg-white resize-none custom-scrollbar"
                                    rows={1}
                                />
                                <button type="submit" disabled={(!newMessage.trim() && !pendingImage) || uploadingImage} className="w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 disabled:opacity-40 transition-all shrink-0">
                                    {uploadingImage ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                </button>
                            </form>
                        </div>
                    </>
                )}

                {/* ── DM – USER LIST ── */}
                {activeTab === 'dm' && !dmPartner && (
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                        <div className="px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50">Thành viên</div>
                        {profiles.filter(p => p.id !== currentUserProfile?.id).map(p => {
                            const unread = unreadByUser[p.id] || 0;
                            return (
                                <div key={p.id} onClick={() => { setDmPartner(p); setDmMessages([]); }}
                                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-50/80">
                                    <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold shrink-0">
                                        {p.full_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className={`text-sm ${unread > 0 ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>{p.full_name}</span>
                                            {unread > 0 && <span className="w-5 h-5 bg-indigo-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">{unread}</span>}
                                        </div>
                                        <span className="text-xs text-slate-400">{p.role}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ── DM – CONVERSATION ── */}
                {activeTab === 'dm' && dmPartner && (
                    <>
                        <div className="flex-1 overflow-y-auto px-3 py-2 bg-[#f8f9fb] custom-scrollbar">
                            {dmLoading ? (
                                <div className="h-full flex items-center justify-center"><Loader2 size={16} className="animate-spin text-slate-400" /></div>
                            ) : dmMessages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-300">
                                    <MessageCircle size={36} />
                                    <span className="text-sm">Hãy bắt đầu cuộc trò chuyện!</span>
                                </div>
                            ) : (
                                dmMessages.map((msg, idx) => {
                                    const isMe = msg.sender_id === currentUserProfile?.id;
                                    const prevMsg = idx > 0 ? dmMessages[idx - 1] : null;
                                    const isGrouped = prevMsg?.sender_id === msg.sender_id;
                                    return (
                                        <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''} ${isGrouped ? 'mt-[3px]' : 'mt-4'}`}>
                                            <div className="shrink-0 w-7 mt-0.5">
                                                {!isGrouped ? (
                                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${isMe ? 'bg-purple-500 text-white' : 'bg-slate-300 text-slate-700'}`}>
                                                        {isMe ? (currentUserProfile.full_name || '?').charAt(0).toUpperCase() : dmPartner.full_name.charAt(0).toUpperCase()}
                                                    </div>
                                                ) : <div className="w-7" />}
                                            </div>
                                            <div className={`flex flex-col max-w-[76%] ${isMe ? 'items-end' : 'items-start'}`}>
                                                {!isGrouped && (
                                                    <div className={`flex items-baseline gap-1.5 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                                                        <span className="text-[11px] font-bold text-slate-600">{isMe ? 'Bạn' : dmPartner.full_name}</span>
                                                        <span className="text-[10px] text-slate-400">{format(new Date(msg.created_at), 'HH:mm')}</span>
                                                    </div>
                                                )}
                                                {msg.image_url && (
                                                    <div className="mb-1 rounded-xl overflow-hidden border border-slate-200 shadow-sm max-w-[200px]">
                                                        <img src={msg.image_url} alt="" className="w-full h-auto cursor-pointer" onClick={() => window.open(msg.image_url!, '_blank')} />
                                                    </div>
                                                )}
                                                {msg.content && (
                                                    <div className={`px-3.5 py-2 rounded-2xl text-[13px] leading-relaxed ${isMe ? 'bg-purple-500 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'}`}>
                                                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={dmEndRef} />
                        </div>
                        <div className="px-3 py-3 bg-white border-t border-slate-100 shrink-0">
                            {dmPendingPreview && (
                                <div className="relative inline-block mb-2">
                                    <img src={dmPendingPreview} alt="" className="h-14 rounded-lg border border-slate-200 object-cover" />
                                    <button onClick={() => clearImage(setDmPendingImage, setDmPendingPreview, dmPendingPreview)} className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center"><XCircle size={10} /></button>
                                </div>
                            )}
                            <form onSubmit={handleSendDM} className="flex items-center gap-2">
                                <input ref={dmFileRef} type="file" accept="image/*" className="hidden" onChange={makeFileHandler(setDmPendingImage, setDmPendingPreview)} />
                                <button type="button" onClick={() => dmFileRef.current?.click()} className="w-8 h-8 shrink-0 bg-slate-50 border border-slate-200 text-slate-400 hover:text-purple-600 rounded-xl flex items-center justify-center">
                                    <ImageIcon size={15} />
                                </button>
                                <input
                                    value={dmNewMsg}
                                    onChange={e => setDmNewMsg(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSendDM(); } }}
                                    placeholder={`Nhắn tin cho ${dmPartner.full_name}...`}
                                    className="flex-1 bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-purple-400 focus:bg-white"
                                />
                                <button type="submit" disabled={(!dmNewMsg.trim() && !dmPendingImage) || dmUploading} className="w-8 h-8 bg-purple-600 text-white rounded-xl flex items-center justify-center hover:bg-purple-700 disabled:opacity-40 shrink-0">
                                    {dmUploading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                </button>
                            </form>
                        </div>
                    </>
                )}

                {/* ── AI ── */}
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
                                    <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                        {msg.role === 'assistant' && <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center shrink-0 mt-0.5"><Bot size={14} className="text-teal-600" /></div>}
                                        <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed ${msg.role === 'user' ? 'bg-teal-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'}`}>
                                            <p className="whitespace-pre-wrap">{msg.content}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                            {aiLoading && aiMessages.length > 0 && <div className="flex items-center gap-2 text-teal-600 text-xs font-semibold"><Sparkles size={12} className="animate-spin" /> AI đang soạn...</div>}
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
                                <input value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendAI()} placeholder="Hỏi về task, KPI, lương..." className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-400" />
                                <button onClick={() => handleSendAI()} disabled={!aiInput.trim() || aiLoading} className="w-10 h-10 bg-teal-600 text-white rounded-xl flex items-center justify-center disabled:opacity-50 hover:bg-teal-700">
                                    <Send size={15} />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
