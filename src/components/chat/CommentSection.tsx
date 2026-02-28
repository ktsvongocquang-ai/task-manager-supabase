import React, { useState, useEffect, useRef } from 'react'
import { Send, User as UserIcon } from 'lucide-react'
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
    const [loading, setLoading] = useState(false)
    const [showMentions, setShowMentions] = useState(false)
    const [mentionFilter, setMentionFilter] = useState('')
    const mentionsRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (taskId || projectId) {
            fetchComments()
        }
    }, [taskId, projectId])

    useEffect(() => {
        // Scroll to bottom when new comments arrive
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [comments])

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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setNewMessage(val)

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
        const words = newMessage.split(' ')
        words.pop() // Remove the '@partial'
        const newText = [...words, `@${profile.full_name.replace(/\s+/g, '')} `].join(' ')
        setNewMessage(newText)
        setShowMentions(false)
        inputRef.current?.focus()
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

    const handleSend = async () => {
        if (!newMessage.trim() || !currentUserProfile) return

        const content = newMessage.trim()
        const detectedMentions = detectMentions(content)

        // Optimistic UI update
        const tempComment: Comment = {
            id: 'temp-' + Date.now(),
            task_id: taskId || null,
            project_id: projectId || null,
            user_id: currentUserProfile.id,
            content: content,
            mentions: detectedMentions,
            created_at: new Date().toISOString()
        }
        setComments([...comments, tempComment])
        setNewMessage('')

        const success = await createComment(currentUserProfile.id, content, detectedMentions, taskId, projectId)

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
            fetchComments() // Refresh to get true ID and timestamp
        } else {
            // Revert on failure (simplified)
            fetchComments()
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !showMentions) {
            handleSend()
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

    return (
        <div className="flex flex-col h-[400px] border border-slate-200 rounded-xl bg-white overflow-hidden relative">
            {/* Header */}
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <h4 className="font-bold text-slate-700 text-sm">Ghi chú & Bình luận</h4>
                <span className="text-xs text-slate-500 font-medium">{comments.length} tin nhắn</span>
            </div>

            {/* Chat Area */}
            <div className="flex-1 p-4 overflow-y-auto bg-slate-50/30 space-y-4">
                {loading && comments.length === 0 ? (
                    <div className="flex justify-center items-center h-full">
                        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : comments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <UserIcon size={32} className="mb-2 opacity-20" />
                        <p className="text-sm">Chưa có bình luận nào.</p>
                        <p className="text-xs mt-1">Gõ @tên để nhắc ai đó!</p>
                    </div>
                ) : (
                    comments.map((comment, idx) => {
                        const isMe = comment.user_id === currentUserProfile?.id
                        return (
                            <div key={comment.id || idx} className={`flex gap-3 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] text-white font-bold shadow-sm ${isMe ? 'bg-indigo-500' : 'bg-slate-400'}`}>
                                    {getProfileInitials(comment.user_id)}
                                </div>
                                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    <div className="flex items-baseline gap-2 mb-1">
                                        <span className="text-xs font-bold text-slate-700">{getProfileName(comment.user_id)}</span>
                                        <span className="text-[9px] text-slate-400">
                                            {formatDistanceToNow(parseISO(comment.created_at), { addSuffix: true, locale: vi })}
                                        </span>
                                    </div>
                                    <div className={`px-4 py-2 rounded-2xl text-sm ${isMe ? 'bg-indigo-500 text-white rounded-tr-sm' : 'bg-slate-100 text-slate-700 rounded-tl-sm'}`}>
                                        {renderContent(comment.content)}
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={bottomRef} />
            </div>

            {/* Mentions Dropdown */}
            {showMentions && filteredProfiles.length > 0 && (
                <div ref={mentionsRef} className="absolute bottom-[60px] left-4 bg-white border border-slate-200 rounded-lg shadow-xl w-64 max-h-48 overflow-y-auto z-10">
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
            )}

            {/* Input Area */}
            <div className="p-3 bg-white border-t border-slate-200">
                <div className="flex gap-2 relative">
                    <input
                        ref={inputRef}
                        type="text"
                        value={newMessage}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyPress}
                        placeholder="Thêm bình luận... Gõ @ để tag thành viên"
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!newMessage.trim() || loading}
                        className="w-10 h-10 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-200 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-colors shrink-0 shadow-sm"
                    >
                        <Send size={16} className={newMessage.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} />
                    </button>
                </div>
            </div>
        </div>
    )
}
