import { useState, useRef, useEffect } from 'react'
import { Bot, X, Send, Sparkles, UserCheck } from 'lucide-react'
import { processHRQuestion, type ChatMessage } from '../../services/hrAssistantService'

interface HRAssistantChatProps {
    userId?: string
    userRole?: string
    userName?: string
}

const HR_QUESTIONS = [
    { icon: '💰', text: 'Lương tháng này của tôi bao nhiêu?' },
    { icon: '📊', text: 'Tiến độ KPI của tôi hiện tại?' },
    { icon: '🚨', text: 'Tôi có task nào đang bị trễ hạn?' },
    { icon: '📈', text: 'Làm sao để tôi đạt 100% KPI?' },
];

export const HRAssistantChat = ({ userId, userRole, userName }: HRAssistantChatProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [showSuggestions] = useState(true)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Init welcome msg
    useEffect(() => {
        if (!messages.length && userName) {
            setMessages([{
                role: 'assistant',
                content: `Chào **${userName}**, tôi là Trợ lý Nhân sự thông minh (HR Bot).\n\nTôi có thể giúp bạn kiểm tra KPI, tính lương năng suất (Performance Salary) và theo dõi deadline.\n\nHãy chọn một câu hỏi gợi ý hoặc hỏi tôi bất cứ điều gì!`,
                timestamp: new Date()
            }]);
        }
    }, [messages.length, userName]);

    const scrollToBottom = () => {
         messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        if (isOpen) {
            scrollToBottom()
        }
    }, [messages, isLoading, isOpen])

    const handleSend = async (text?: string) => {
        const question = (text || input).trim()
        if (!question || isLoading || !userId) return

        const userMsg: ChatMessage = { role: 'user', content: question, timestamp: new Date() }
        setMessages(prev => [...prev, userMsg])
        setInput('')
        setIsLoading(true)

        try {
            const resp = await processHRQuestion(question, [...messages, userMsg], userId, userName || '', userRole || '')
            setMessages(prev => [...prev, { role: 'assistant', content: resp, timestamp: new Date() }])
        } catch (e: any) {
             setMessages(prev => [...prev, { role: 'assistant', content: `Lỗi: ${e.message}`, timestamp: new Date() }])
        } finally {
            setIsLoading(false)
        }
    }

    if (!userId) return null;

    return (
        <>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-20 md:bottom-24 left-4 md:left-6 z-[100] w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-500 hover:scale-110 active:scale-95 group ${
                    isOpen
                        ? 'bg-slate-800 rotate-0 shadow-slate-800/30'
                        : 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-teal-500/40 hover:shadow-teal-500/60'
                }`}
                title="HR Assistant"
            >
                {isOpen ? (
                    <X size={22} className="text-white" />
                ) : (
                    <>
                        <UserCheck size={24} className="text-white relative z-10" />
                        <span className="absolute w-full h-full rounded-full bg-teal-400/30 animate-ping" />
                    </>
                )}
            </button>

            {isOpen && (
                <div className="fixed z-[99] bottom-36 md:bottom-40 left-3 md:left-6 w-[calc(100vw-24px)] md:w-[400px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[550px] max-h-[70vh] animate-in fade-in slide-in-from-bottom-5">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-3 flex justify-between items-center text-white shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                                <UserCheck size={18} />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">HR Assistant</h3>
                                <p className="text-xs text-white/80">Tính KPI & Lương Năng Suất</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 relative custom-scrollbar">
                         {messages.map((msg, i) => (
                            <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                {msg.role === 'assistant' && (
                                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                                        <Bot size={16} className="text-teal-600" />
                                    </div>
                                )}
                                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                                    msg.role === 'user'
                                        ? 'bg-teal-600 text-white rounded-tr-sm'
                                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'
                                }`}>
                                     <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\\n/g, '<br/>') }} />
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex items-center gap-2 text-teal-600 text-xs font-semibold p-2">
                                <Sparkles className="animate-spin" size={14} /> AI đang tính toán KPI...
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Suggestion & Input */}
                    <div className="p-3 bg-white border-t border-slate-100 shrink-0">
                        {showSuggestions && !isLoading && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                                {HR_QUESTIONS.map((q, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSend(q.text)}
                                        className="text-[11px] bg-slate-50 text-slate-600 hover:bg-teal-50 hover:text-teal-700 px-3 py-1.5 rounded-full border border-slate-200"
                                    >
                                        {q.icon} {q.text}
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Hỏi về lương và task của bạn..."
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500"
                            />
                            <button
                                onClick={() => handleSend()}
                                disabled={!input.trim() || isLoading}
                                className="w-10 h-10 bg-teal-600 text-white rounded-xl flex items-center justify-center disabled:opacity-50"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
