import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { Send, X, MessageSquare, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

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

export const GlobalChat: React.FC<GlobalChatProps> = ({ isOpen, onClose, currentUserProfile }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

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
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

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
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                            <MessageSquare size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-sm">Chat Chung</h3>
                            <p className="text-[11px] text-slate-500 font-medium">Kênh thảo luận toàn công ty</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Body (Messages) */}
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
            </div>
        </div>
    );
};
