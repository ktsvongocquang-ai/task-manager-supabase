import React, { useState, useEffect, useRef } from 'react'
import { Send, User as UserIcon, MessageSquare, ChevronRight, X } from 'lucide-react'
import { getComments, createComment } from '../../services/comments'
import { createNotification } from '../../services/notifications'
import type { Comment } from '../../types'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'

interface CommentSectionProps {
    taskId?: string | null;
    projectId?: string | null;
    currentUserProfile: any;
    profiles: any[];
    itemName: string; // Used for notification context
}

export const CommentSection: React.FC<CommentSectionProps> = ({ taskId, projectId, currentUserProfile, profiles, itemName }) => {
    const [comments, setComments] = useState<Comment[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [newThreadMessage, setNewThreadMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [showMentions, setShowMentions] = useState(false)
    const [mentionFilter, setMentionFilter] = useState('')
    const [activeMentionTarget, setActiveMentionTarget] = useState<'main' | 'thread'>('main')
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null)

    const mentionsRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const threadInputRef = useRef<HTMLInputElement>(null)
    const bottomRef = useRef<HTMLDivElement>(null)
    const threadBottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (taskId || projectId) {
            fetchComments()
        }
    }, [taskId, projectId])

    useEffect(() => {
        // Scroll to bottom when new comments arrive
        setTimeout(() => {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
            threadBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
    }, [comments, activeThreadId])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (mentionsRef.current && !mentionsRef.current.contains(event.target as Node)) {
                setShowMentions(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const fetchComments = async () => {
        setLoading(true)
        const data = await getComments(taskId, projectId)
        setComments(data as Comment[])
        setLoading(false)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'main' | 'thread') => {
        const val = e.target.value
        if (target === 'main') {
            setNewMessage(val)
        } else {
            setNewThreadMessage(val)
        }
        setActiveMentionTarget(target)

        // Very basic mention detection: check if typing @word
        const words = val.split(' ')
        const lastWord = words[words.length - 1]
        if (lastWord.startsWith('@')) {
            setShowMentions(true)
            setMentionFilter(lastWord.substring(1).toLowerCase())
        } else {
            setShowMentions(false)
        }
    }

    const insertMention = (profile: any) => {
        if (activeMentionTarget === 'main') {
            const words = newMessage.split(' ')
            words.pop() // Remove the '@partial'
            const newText = [...words, `@${profile.full_name.replace(/\s+/g, '')} `].join(' ')
            setNewMessage(newText)
            inputRef.current?.focus()
        } else {
            const words = newThreadMessage.split(' ')
            words.pop()
            const newText = [...words, `@${profile.full_name.replace(/\s+/g, '')} `].join(' ')
            setNewThreadMessage(newText)
            threadInputRef.current?.focus()
        }
        setShowMentions(false)
    }

    const detectMentions = (text: string): string[] => {
        const mentionedIds: string[] = []
        profiles.forEach(p => {
            const mentionTag = `@${p.full_name.replace(/\s+/g, '')}`
            if (text.includes(mentionTag)) {
                mentionedIds.push(p.id)
            }
        })
        return mentionedIds
    }

    const handleSend = async (target: 'main' | 'thread') => {
        const message = target === 'main' ? newMessage : newThreadMessage;
        if (!message.trim() || !currentUserProfile) return

        const content = message.trim()
        const detectedMentions = detectMentions(content)
        const parentId = target === 'thread' ? activeThreadId : null;

        // Optimistic UI update
        const tempComment: Comment = {
            id: 'temp-' + Date.now(),
            task_id: taskId || null,
            project_id: projectId || null,
            parent_id: parentId,
            user_id: currentUserProfile.id,
            content: content,
            mentions: detectedMentions,
            created_at: new Date().toISOString()
        }
        setComments([...comments, tempComment])

        if (target === 'main') {
            setNewMessage('')
        } else {
            setNewThreadMessage('')
        }

        const success = await createComment(currentUserProfile.id, content, detectedMentions, taskId, projectId, parentId)

        if (success) {
            // Send notifications to mentioned users
            for (const mentionedUserId of detectedMentions) {
                if (mentionedUserId !== currentUserProfile.id) { // Don't notify self
                    const contextType = taskId ? 'Nhiệm vụ' : 'Dự án'
                    await createNotification(
                        mentionedUserId,
                        `${currentUserProfile.full_name} đã nhắc đến bạn trong ${contextType}: "${itemName}"`,
                        'mention',
                        currentUserProfile.id,
                        taskId,
                        projectId
                    )
                }
            }

            // Generate notification for the author of the original post if responding in a thread
            if (parentId) {
                const parentComment = comments.find(c => c.id === parentId)
                if (parentComment && parentComment.user_id !== currentUserProfile.id && !detectedMentions.includes(parentComment.user_id)) {
                    await createNotification(
                        parentComment.user_id,
                        `${currentUserProfile.full_name} đã trả lời bình luận của bạn.`,
                        'mention', // reuse mention type for replies
                        currentUserProfile.id,
                        taskId,
                        projectId
                    )
                }
            }

            fetchComments() // Refresh to get true ID and timestamp
        } else {
            // Revert on failure (simplified)
            fetchComments()
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent, target: 'main' | 'thread') => {
        if (e.key === 'Enter' && !showMentions) {
            handleSend(target)
        }
    }

    const filteredProfiles = profiles.filter(p => p.full_name.toLowerCase().includes(mentionFilter) && p.id !== currentUserProfile?.id)

    // Render mention text with blue highlights
    const renderContent = (content: string) => {
        let regexParts = profiles.map(p => `@${p.full_name.replace(/\s+/g, '')}`)
        if (regexParts.length === 0) return content;

        const regex = new RegExp(`(${regexParts.join('|')})`, 'g')
        const parts = content.split(regex)

        return parts.map((part, i) => {
            if (regexParts.includes(part)) {
                return <span key={i} className="text-blue-600 font-semibold">{part}</span>
            }
            return part
        })
    }

    const getProfileInitials = (userId: string) => {
        const p = profiles.find(pr => pr.id === userId)
        if (!p || !p.full_name) return 'U'
        return p.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
    }

    const getProfileName = (userId: string) => {
        const p = profiles.find(pr => pr.id === userId)
        return p ? p.full_name : 'Người dùng'
    }

    const parentComments = comments.filter(c => !c.parent_id)
    const getThreadComments = (parentId: string) => comments.filter(c => c.parent_id === parentId)
    const activeThreadParent = comments.find(c => c.id === activeThreadId)
    const activeThreadReplies = activeThreadId ? getThreadComments(activeThreadId) : []

    const MentionsDropdown = () => (
        showMentions && filteredProfiles.length > 0 ? (
            <div ref={mentionsRef} className="absolute bottom-full mb-2 left-4 bg-white border border-slate-200 rounded-lg shadow-xl w-64 max-h-48 overflow-y-auto z-50">
                <div className="px-3 py-2 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                    Thành viên
                </div>
                {filteredProfiles.map(p => (
                    <div
                        key={p.id}
                        className="px-4 py-2 hover:bg-indigo-50 cursor-pointer flex items-center gap-2 group transition-colors"
                        onClick={() => insertMention(p)}
                    >
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-600">
                            {p.full_name.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-700">@{p.full_name}</span>
                    </div>
                ))}
            </div>
        ) : null
    )

    return (
        <div className="flex h-[320px] border border-slate-200 rounded-xl bg-white overflow-hidden relative transition-all shadow-sm">
            {/* Left Column (Main Chat) */}
            <div className={`flex flex-col h-full bg-white transition-all duration-300 ${activeThreadId ? 'w-1/2 border-r border-slate-200' : 'w-full'}`}>
                {/* Header */}
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center z-10">
                    <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                        <MessageSquare size={16} className="text-indigo-500" />
                        Ghi chú & Thảo luận
                    </h4>
                    {!activeThreadId && <span className="text-xs text-slate-500 font-medium">{parentComments.length} bản ghi</span>}
                </div>

                {/* Chat Area */}
                <div className="flex-1 p-4 py-6 overflow-y-auto bg-slate-50/20 space-y-6 relative custom-scrollbar">
                    {loading && comments.length === 0 ? (
                        <div className="flex justify-center items-center h-full">
                            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : parentComments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <UserIcon size={32} className="mb-2 opacity-20" />
                            <p className="text-sm font-semibold">Chưa có bình luận nào.</p>
                            <p className="text-xs mt-1">Gõ @tên để nhắc ai đó vào việc này!</p>
                        </div>
                    ) : (
                        parentComments.map((comment, idx) => {
                            const isMe = comment.user_id === currentUserProfile?.id
                            const replies = getThreadComments(comment.id)
                            const hasReplies = replies.length > 0;

                            return (
                                <div key={comment.id || idx} className={`flex gap-3 max-w-[90%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
                                    <div className={`w-8 h-8 mt-1 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] text-white font-bold shadow-sm ${isMe ? 'bg-indigo-500' : 'bg-slate-500'}`}>
                                        {getProfileInitials(comment.user_id)}
                                    </div>
                                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} flex-1 min-w-0`}>
                                        <div className="flex items-baseline gap-2 mb-1">
                                            <span className="text-xs font-bold text-slate-700">{getProfileName(comment.user_id)}</span>
                                            <span className="text-[10px] font-medium text-slate-400">
                                                {formatDistanceToNow(parseISO(comment.created_at), { addSuffix: true, locale: vi })}
                                            </span>
                                        </div>
                                        <div className={`px-4 py-2.5 shadow-sm text-sm break-words whitespace-pre-wrap ${isMe ? 'bg-[#ebf0fe] text-slate-800 border border-[#d6e0fd] rounded-2xl rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-sm'}`}>
                                            {renderContent(comment.content)}
                                        </div>

                                        {/* Thread Summary UI (Lark-style) */}
                                        <div className={`mt-2 flex items-center gap-2 group cursor-pointer w-full ${isMe ? 'flex-row-reverse' : ''}`} onClick={() => setActiveThreadId(comment.id)}>
                                            {hasReplies ? (
                                                <div className={`text-[12px] font-bold flex items-center gap-1 ${activeThreadId === comment.id ? 'text-indigo-600' : 'text-blue-500 hover:text-blue-600'}`}>
                                                    {replies.length} phản hồi <ChevronRight size={14} />
                                                </div>
                                            ) : (
                                                <div className="text-[12px] font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Trả lời
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                    <div ref={bottomRef} className="h-1" />
                </div>

                {/* Input Area */}
                <div className="p-3 bg-white border-t border-slate-200 relative">
                    <MentionsDropdown />
                    <div className="flex gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={newMessage}
                            onChange={(e) => handleInputChange(e, 'main')}
                            onKeyDown={(e) => handleKeyPress(e, 'main')}
                            placeholder="Ghi chú & thảo luận mới..."
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700"
                            onFocus={() => setActiveMentionTarget('main')}
                        />
                        <button
                            onClick={() => handleSend('main')}
                            disabled={!newMessage.trim() || loading}
                            className="w-10 h-10 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl flex items-center justify-center transition-colors shrink-0 shadow-sm"
                        >
                            <Send size={16} className={newMessage.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Column (Thread) */}
            {activeThreadId && (
                <div className="flex flex-col h-full w-1/2 bg-slate-50 border-l border-slate-200 animate-in fade-in slide-in-from-right-4 duration-300 shadow-[inset_1px_0_0_rgba(0,0,0,0.05)] relative z-20">
                    <div className="px-4 py-3 bg-white border-b border-slate-200 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                        <h4 className="font-extrabold text-slate-800 text-sm">Chủ đề</h4>
                        <button
                            onClick={() => setActiveThreadId(null)}
                            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
                        >
                            <X size={16} strokeWidth={2.5} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {/* Parent Message Sticky Header context */}
                        {activeThreadParent && (
                            <div className="p-5 border-b border-slate-200/60 bg-white">
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-500 flex items-center justify-center flex-shrink-0 text-[10px] text-white font-bold shadow-sm">
                                        {getProfileInitials(activeThreadParent.user_id)}
                                    </div>
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <div className="flex items-baseline gap-2 mb-1.5">
                                            <span className="text-xs font-black text-slate-800">{getProfileName(activeThreadParent.user_id)}</span>
                                            <span className="text-[10px] font-medium text-slate-400">
                                                {formatDistanceToNow(parseISO(activeThreadParent.created_at), { addSuffix: true, locale: vi })}
                                            </span>
                                        </div>
                                        <div className="text-sm text-slate-700 leading-relaxed font-medium break-words whitespace-pre-wrap">
                                            {renderContent(activeThreadParent.content)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="p-4 space-y-5">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="text-xs font-bold text-slate-400 whitespace-nowrap">{activeThreadReplies.length} phản hồi</div>
                                <div className="h-px bg-slate-200 w-full rounded-full flex-1" />
                            </div>

                            {activeThreadReplies.map((reply, idx) => (
                                <div key={reply.id || idx} className="flex gap-3 group">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0 text-[10px] font-bold shadow-sm">
                                        {getProfileInitials(reply.user_id)}
                                    </div>
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <div className="flex items-baseline gap-2 mb-1">
                                            <span className="text-xs font-bold text-slate-700">{getProfileName(reply.user_id)}</span>
                                            <span className="text-[10px] font-medium text-slate-400">
                                                {formatDistanceToNow(parseISO(reply.created_at), { addSuffix: true, locale: vi })}
                                            </span>
                                        </div>
                                        <div className="text-sm text-slate-800 leading-relaxed break-words whitespace-pre-wrap">
                                            {renderContent(reply.content)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={threadBottomRef} className="h-1" />
                        </div>
                    </div>

                    {/* Thread Input */}
                    <div className="p-3 bg-white border-t border-slate-200 relative">
                        {/* We use the same conditional rendering logic inside MentionsDropdown, but positioned properly. 
                            Actually, we can reuse MentionsDropdown since state is shared, but we ensure ref is relative to active target area */}
                        {activeMentionTarget === 'thread' && (
                            <MentionsDropdown />
                        )}
                        <div className="flex gap-2">
                            <input
                                ref={threadInputRef}
                                type="text"
                                value={newThreadMessage}
                                onChange={(e) => handleInputChange(e, 'thread')}
                                onKeyDown={(e) => handleKeyPress(e, 'thread')}
                                placeholder="Trả lời trong chủ đề..."
                                className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700"
                                onFocus={() => setActiveMentionTarget('thread')}
                            />
                            <button
                                onClick={() => handleSend('thread')}
                                disabled={!newThreadMessage.trim() || loading}
                                className="px-3 py-2 bg-blue-50 hover:bg-blue-100 disabled:bg-slate-50 disabled:text-slate-400 text-blue-600 rounded-xl text-sm font-bold flex items-center transition-colors shadow-sm"
                            >
                                Gửi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
