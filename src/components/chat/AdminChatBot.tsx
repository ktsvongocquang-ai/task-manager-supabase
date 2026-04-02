import { useState, useRef, useEffect, useCallback } from 'react'
import { Bot, X, Send, Sparkles, ChevronDown, Trash2, Lightbulb } from 'lucide-react'
import { processAdminQuestion, QUICK_QUESTIONS, type ChatMessage } from '../../services/adminChatbotService'

interface AdminChatBotProps {
    userRole?: string
    userName?: string
}

export const AdminChatBot = ({ userRole, userName }: AdminChatBotProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            role: 'assistant',
            content: `Xin chào ${userName || 'Admin'}! 👋\n\nTôi là **DQH Assistant** — Trợ lý AI quản trị.\nBạn có thể hỏi tôi về:\n\n• Tình hình công việc các team\n• Tasks quá hạn, khẩn cấp\n• Hiệu suất sử dụng app\n• Tổng quan dự án\n\nHãy hỏi bất cứ điều gì! 🚀`,
            timestamp: new Date(),
        }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [showScrollBtn, setShowScrollBtn] = useState(false)
    const [showSuggestions, setShowSuggestions] = useState(true)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const chatContainerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)

    // Only show for Admin and Manager roles
    const canAccess = userRole === 'Admin' || userRole === 'Quản lý thiết kế' || userRole === 'Quản lý thi công'
    if (!canAccess) return null

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [])

    useEffect(() => {
        scrollToBottom()
    }, [messages, scrollToBottom])

    // Track scroll position for "scroll to bottom" button
    const handleScroll = useCallback(() => {
        if (!chatContainerRef.current) return
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current
        setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100)
    }, [])

    const handleSend = async (text?: string) => {
        const question = (text || input).trim()
        if (!question || isLoading) return

        const userMessage: ChatMessage = {
            role: 'user',
            content: question,
            timestamp: new Date(),
        }
        setMessages(prev => [...prev, userMessage])
        setInput('')
        setIsLoading(true)

        // Auto-resize textarea back to min
        if (inputRef.current) {
            inputRef.current.style.height = '44px'
        }

        try {
            const response = await processAdminQuestion(question, [...messages, userMessage])
            const botMessage: ChatMessage = {
                role: 'assistant',
                content: response,
                timestamp: new Date(),
            }
            setMessages(prev => [...prev, botMessage])
        } catch (error: any) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `⚠️ Lỗi: ${error.message}`,
                timestamp: new Date(),
            }])
        } finally {
            setIsLoading(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleClearChat = () => {
        setMessages([{
            role: 'assistant',
            content: `Chat đã được xóa. Bạn cần hỏi gì tiếp? 🔄`,
            timestamp: new Date(),
        }])
    }

    // Auto-resize textarea
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value)
        const el = e.target
        el.style.height = '44px'
        el.style.height = Math.min(el.scrollHeight, 120) + 'px'
    }

    // Format markdown-like content
    const formatMessage = (content: string) => {
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code class="bg-slate-100 text-indigo-600 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>')
            .replace(/^• /gm, '<span class="text-indigo-400 mr-1">•</span>')
            .replace(/^- /gm, '<span class="text-indigo-400 mr-1">–</span>')
            .replace(/\n/g, '<br/>')
    }

    return (
        <>
            {/* Floating Action Button */}
            <button
                id="admin-chatbot-fab"
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-20 md:bottom-6 right-4 md:right-6 z-[100] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-500 hover:scale-110 active:scale-95 group ${
                    isOpen
                        ? 'bg-slate-800 rotate-0 shadow-slate-800/30'
                        : 'bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 shadow-indigo-500/40 hover:shadow-indigo-500/60'
                }`}
                title="DQH AI Assistant"
            >
                {isOpen ? (
                    <X size={22} className="text-white" />
                ) : (
                    <>
                        <Bot size={24} className="text-white" />
                        {/* Pulse ring */}
                        <span className="absolute w-full h-full rounded-full bg-indigo-500/30 animate-ping" />
                        {/* Notification dot */}
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
                            <Sparkles size={8} className="text-white" />
                        </span>
                    </>
                )}
            </button>

            {/* Chat Panel */}
            <div
                className={`fixed z-[99] transition-all duration-500 ease-out ${
                    isOpen
                        ? 'opacity-100 translate-y-0 pointer-events-auto'
                        : 'opacity-0 translate-y-8 pointer-events-none'
                } bottom-36 md:bottom-24 right-3 md:right-6 w-[calc(100vw-24px)] md:w-[420px] max-h-[70vh] md:max-h-[600px]`}
            >
                <div className="bg-white rounded-2xl shadow-2xl shadow-slate-900/20 border border-slate-200/80 flex flex-col overflow-hidden h-full max-h-[70vh] md:max-h-[600px]">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 px-5 py-4 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
                                <Bot size={22} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-sm">DQH Assistant</h3>
                                <p className="text-white/70 text-xs flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
                                    AI Trợ lý quản trị
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={handleClearChat}
                                className="p-2 rounded-lg hover:bg-white/15 transition-colors text-white/70 hover:text-white"
                                title="Xóa cuộc trò chuyện"
                            >
                                <Trash2 size={16} />
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 rounded-lg hover:bg-white/15 transition-colors text-white/70 hover:text-white"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div
                        ref={chatContainerRef}
                        onScroll={handleScroll}
                        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-50 to-white custom-scrollbar min-h-0"
                    >
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                            >
                                {/* Avatar */}
                                {msg.role === 'assistant' && (
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shrink-0 shadow-sm">
                                        <Bot size={16} className="text-white" />
                                    </div>
                                )}

                                {/* Bubble */}
                                <div
                                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                                        msg.role === 'user'
                                            ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-br-md shadow-md shadow-indigo-500/20'
                                            : 'bg-white text-slate-700 rounded-bl-md border border-slate-100 shadow-sm'
                                    }`}
                                >
                                    <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }} />
                                    <div className={`text-[10px] mt-2 ${msg.role === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                                        {msg.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Loading indicator */}
                        {isLoading && (
                            <div className="flex gap-2.5 animate-in fade-in duration-300">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shrink-0">
                                    <Bot size={16} className="text-white" />
                                </div>
                                <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 border border-slate-100 shadow-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1">
                                            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                        <span className="text-xs text-slate-400 ml-1">Đang phân tích dữ liệu...</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Scroll to bottom button */}
                    {showScrollBtn && (
                        <button
                            onClick={scrollToBottom}
                            className="absolute bottom-[140px] left-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full shadow-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors z-10"
                        >
                            <ChevronDown size={16} className="text-slate-600" />
                        </button>
                    )}

                    {/* Quick Actions - toggleable */}
                    {showSuggestions && !isLoading && (
                        <div className="px-4 pb-2 shrink-0 animate-in fade-in slide-in-from-bottom-2 duration-200">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Câu hỏi gợi ý</p>
                                <button
                                    onClick={() => setShowSuggestions(false)}
                                    className="text-slate-400 hover:text-slate-600 transition-colors p-0.5"
                                    title="Ẩn gợi ý"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {QUICK_QUESTIONS.map((q, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSend(q.text)}
                                        className="text-xs bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 rounded-full px-3 py-1.5 border border-slate-200 hover:border-indigo-200 transition-all duration-200 font-medium whitespace-nowrap"
                                    >
                                        {q.icon} {q.text}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Input Area */}
                    <div className="p-3 border-t border-slate-100 bg-white shrink-0">
                        <div className="flex items-end gap-2">
                            {/* Toggle Suggestions Button */}
                            <button
                                onClick={() => setShowSuggestions(!showSuggestions)}
                                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0 border ${
                                    showSuggestions
                                        ? 'bg-amber-50 text-amber-500 border-amber-200'
                                        : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-amber-50 hover:text-amber-500 hover:border-amber-200'
                                }`}
                                title={showSuggestions ? 'Ẩn gợi ý' : 'Hiện câu hỏi gợi ý'}
                            >
                                <Lightbulb size={18} />
                            </button>
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                placeholder="Hỏi về công việc, tiến độ, nhân sự..."
                                className="flex-1 resize-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all min-h-[44px] max-h-[120px] leading-snug"
                                rows={1}
                                disabled={isLoading}
                            />
                            <button
                                onClick={() => handleSend()}
                                disabled={!input.trim() || isLoading}
                                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0 ${
                                    input.trim() && !isLoading
                                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/40 active:scale-95'
                                        : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                }`}
                            >
                                <Send size={18} />
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-400 text-center mt-2 font-medium">
                            Powered by Gemini AI • Dữ liệu real-time từ hệ thống DQH
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}
