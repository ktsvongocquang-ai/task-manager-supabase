import React, { useState, useEffect, useRef } from 'react'
import { Send, User as UserIcon, MessageSquare, ChevronRight, X, Pencil, Trash2, Check, Image as ImageIcon, XCircle, Loader2 } from 'lucide-react'
import { getComments, createComment, updateComment, deleteComment } from '../../services/comments'
import { createNotification } from '../../services/notifications'
import { supabase } from '../../services/supabase'
import type { Comment } from '../../types'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'
import { compressImageToBlob } from '../../utils/imageCompress'

interface CommentSectionProps {
    taskId?: string | null;
    projectId?: string | null;
    currentUserProfile: any;
    profiles: any[];
    itemName: string;
    moduleType?: 'core' | 'marketing';
}

export const CommentSection: React.FC<CommentSectionProps> = ({ taskId, projectId, currentUserProfile, profiles, itemName, moduleType = 'core' }) => {
    const [comments, setComments] = useState<Comment[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [newThreadMessage, setNewThreadMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [showMentions, setShowMentions] = useState(false)
    const [mentionFilter, setMentionFilter] = useState('')
    const [activeMentionTarget, setActiveMentionTarget] = useState<'main' | 'thread'>('main')
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
    const [editContent, setEditContent] = useState('')

    // Image upload state - per input area
    const [pendingMainImage, setPendingMainImage] = useState<File | null>(null)
    const [pendingMainPreview, setPendingMainPreview] = useState<string | null>(null)
    const [pendingThreadImage, setPendingThreadImage] = useState<File | null>(null)
    const [pendingThreadPreview, setPendingThreadPreview] = useState<string | null>(null)
    const [uploadingMain, setUploadingMain] = useState(false)
    const [uploadingThread, setUploadingThread] = useState(false)

    const mentionsRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const threadInputRef = useRef<HTMLInputElement>(null)
    const mainFileRef = useRef<HTMLInputElement>(null)
    const threadFileRef = useRef<HTMLInputElement>(null)
    const mainBottomRef = useRef<HTMLDivElement>(null)
    const threadBottomRef = useRef<HTMLDivElement>(null)
    const prevCommentsLength = useRef(0)
    const prevThreadIdRef = useRef<string | null>(null)

    useEffect(() => {
        if (taskId || projectId) fetchComments()
    }, [taskId, projectId])

    // Scroll main chat ONLY when new comments added (not when thread opens/closes)
    useEffect(() => {
        if (comments.length > prevCommentsLength.current) {
            setTimeout(() => mainBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
        }
        prevCommentsLength.current = comments.length
    }, [comments])

    // Scroll thread when thread replies change or thread first opens
    useEffect(() => {
        if (activeThreadId && activeThreadId !== prevThreadIdRef.current) {
            setTimeout(() => threadBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 150)
        }
        prevThreadIdRef.current = activeThreadId
    }, [activeThreadId])

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
        const data = await getComments(taskId, projectId, moduleType)
        setComments(data as Comment[])
        setLoading(false)
    }

    const uploadImage = async (file: File): Promise<string | null> => {
        let blob: File | Blob = file
        let ext = file.name.split('.').pop() || 'jpg'
        try {
            blob = await compressImageToBlob(file, 2048, 0.85)
            ext = 'webp'
        } catch (e) {
            console.error('Image compression failed, uploading original:', e)
        }
        const path = `comments/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error } = await supabase.storage.from('chat-images').upload(path, blob)
        if (error) { console.error('Upload error:', error); return null }
        const { data } = supabase.storage.from('chat-images').getPublicUrl(path)
        return data.publicUrl
    }

    const handleFileSelect = (target: 'main' | 'thread') => (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith('image/')) { alert('Chỉ hỗ trợ file hình ảnh.'); return }
        if (file.size > 5 * 1024 * 1024) { alert('File quá lớn. Tối đa 5MB.'); return }
        const preview = URL.createObjectURL(file)
        if (target === 'main') { setPendingMainImage(file); setPendingMainPreview(preview) }
        else { setPendingThreadImage(file); setPendingThreadPreview(preview) }
        e.target.value = ''
    }

    const clearImage = (target: 'main' | 'thread') => {
        if (target === 'main') {
            if (pendingMainPreview) URL.revokeObjectURL(pendingMainPreview)
            setPendingMainImage(null); setPendingMainPreview(null)
        } else {
            if (pendingThreadPreview) URL.revokeObjectURL(pendingThreadPreview)
            setPendingThreadImage(null); setPendingThreadPreview(null)
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'main' | 'thread') => {
        const val = e.target.value
        if (target === 'main') setNewMessage(val)
        else setNewThreadMessage(val)
        setActiveMentionTarget(target)

        const words = val.split(' ')
        const lastWord = words[words.length - 1]
        if (lastWord.startsWith('@') && lastWord.length > 1) {
            setShowMentions(true)
            setMentionFilter(lastWord.substring(1).toLowerCase())
        } else {
            setShowMentions(false)
        }
    }

    const insertMention = (profile: any) => {
        if (activeMentionTarget === 'main') {
            const words = newMessage.split(' ')
            words[words.length - 1] = `@${profile.full_name.replace(/\s+/g, '')} `
            setNewMessage(words.join(' '))
            inputRef.current?.focus()
        } else {
            const words = newThreadMessage.split(' ')
            words[words.length - 1] = `@${profile.full_name.replace(/\s+/g, '')} `
            setNewThreadMessage(words.join(' '))
            threadInputRef.current?.focus()
        }
        setShowMentions(false)
    }

    const detectMentions = (text: string): string[] => {
        return profiles.filter(p => text.includes(`@${p.full_name.replace(/\s+/g, '')}`)).map(p => p.id)
    }

    const handleSend = async (target: 'main' | 'thread') => {
        const message = target === 'main' ? newMessage : newThreadMessage
        const pendingImage = target === 'main' ? pendingMainImage : pendingThreadImage
        if (!message.trim() && !pendingImage) return
        if (!currentUserProfile) return

        const content = message.trim()
        const detectedMentions = detectMentions(content)
        const parentId = target === 'thread' ? activeThreadId : null

        // Optimistic UI
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
        setComments(prev => [...prev, tempComment])
        if (target === 'main') setNewMessage('')
        else setNewThreadMessage('')

        // Upload image if any
        let imageUrl: string | null = null
        if (pendingImage) {
            if (target === 'main') setUploadingMain(true)
            else setUploadingThread(true)
            imageUrl = await uploadImage(pendingImage)
            clearImage(target)
            if (target === 'main') setUploadingMain(false)
            else setUploadingThread(false)
        }

        const success = await createComment(currentUserProfile.id, content, detectedMentions, taskId, projectId, parentId, moduleType, imageUrl)

        if (success) {
            // Notify mentioned users
            for (const mentionedUserId of detectedMentions) {
                if (mentionedUserId !== currentUserProfile.id) {
                    const contextType = taskId ? 'Nhiệm vụ' : 'Dự án'
                    await createNotification(mentionedUserId, `${currentUserProfile.full_name} đã nhắc đến bạn trong ${contextType}: "${itemName}"`, 'mention', currentUserProfile.id, taskId, projectId, moduleType)
                }
            }
            // Notify parent comment author on thread reply
            if (parentId) {
                const parentComment = comments.find(c => c.id === parentId)
                if (parentComment && parentComment.user_id !== currentUserProfile.id && !detectedMentions.includes(parentComment.user_id)) {
                    await createNotification(parentComment.user_id, `${currentUserProfile.full_name} đã trả lời bình luận của bạn trong "${itemName}"`, 'mention', currentUserProfile.id, taskId, projectId, moduleType)
                }
            }

            // Notify task executor (assignee) and project manager
            if (taskId) {
                const taskTable = moduleType === 'marketing' ? 'marketing_tasks' : 'tasks';
                const projectTable = moduleType === 'marketing' ? 'marketing_projects' : 'projects';
                
                const { data: taskData } = await supabase.from(taskTable).select('assignee_id, project_id').eq('id', taskId).single();
                if (taskData) {
                    const notifyUsers = async (userIds: string | string[] | null) => {
                        if (!userIds) return;
                        const ids = Array.isArray(userIds) ? userIds : [userIds];
                        for (const uId of ids) {
                            if (uId && uId !== currentUserProfile.id && !detectedMentions.includes(uId)) {
                                await createNotification(uId, `${currentUserProfile.full_name} đã bình luận vào công việc: "${itemName}"`, 'comment', currentUserProfile.id, taskId, projectId, moduleType);
                            }
                        }
                    };
                    
                    // Notify assignee(s)
                    await notifyUsers(taskData.assignee_id);
                    
                    // Notify manager
                    if (taskData.project_id) {
                        const { data: projData } = await supabase.from(projectTable).select('manager_id').eq('id', taskData.project_id).single();
                        if (projData && projData.manager_id) {
                            await notifyUsers(projData.manager_id);
                        }
                    }
                }
            }
            fetchComments()
        } else {
            fetchComments()
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent, target: 'main' | 'thread') => {
        if (e.key === 'Enter' && !showMentions) handleSend(target)
    }

    const handleStartEdit = (comment: Comment) => {
        setEditingCommentId(comment.id)
        setEditContent(comment.content)
    }

    const handleSaveEdit = async () => {
        if (!editingCommentId || !editContent.trim()) return
        const success = await updateComment(editingCommentId, editContent.trim())
        if (success) setComments(prev => prev.map(c => c.id === editingCommentId ? { ...c, content: editContent.trim() } : c))
        setEditingCommentId(null)
        setEditContent('')
    }

    const handleCancelEdit = () => { setEditingCommentId(null); setEditContent('') }

    const handleDelete = async (commentId: string) => {
        if (!confirm('Bạn có chắc muốn xóa bình luận này?')) return
        const success = await deleteComment(commentId)
        if (success) {
            setComments(prev => prev.filter(c => c.id !== commentId && c.parent_id !== commentId))
            if (activeThreadId === commentId) setActiveThreadId(null)
        }
    }

    const filteredProfiles = profiles.filter(p => p.full_name.toLowerCase().includes(mentionFilter) && p.id !== currentUserProfile?.id)

    const renderContent = (content: string) => {
        const regexParts = profiles.map(p => `@${p.full_name.replace(/\s+/g, '')}`)
        if (regexParts.length === 0) return content
        const regex = new RegExp(`(${regexParts.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g')
        const parts = content.split(regex)
        return parts.map((part, i) => regexParts.includes(part) ? <span key={i} className="text-blue-600 font-semibold">{part}</span> : part)
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
                <div className="px-3 py-2 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">Thành viên</div>
                {filteredProfiles.map(p => (
                    <div key={p.id} className="px-4 py-2 hover:bg-indigo-50 cursor-pointer flex items-center gap-2 group transition-colors" onClick={() => insertMention(p)}>
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-600">{p.full_name.charAt(0)}</div>
                        <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-700">@{p.full_name}</span>
                    </div>
                ))}
            </div>
        ) : null
    )

    return (
        <div className="flex h-[340px] border border-slate-200 rounded-xl bg-white overflow-hidden relative transition-all shadow-sm">
            {/* Left Column (Main Chat) */}
            <div className={`flex flex-col h-full bg-white transition-all duration-300 ${activeThreadId ? 'w-1/2 border-r border-slate-200' : 'w-full'}`}>
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center z-10 shrink-0">
                    <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                        <MessageSquare size={16} className="text-indigo-500" />
                        Ghi chú & Thảo luận
                    </h4>
                    {!activeThreadId && <span className="text-xs text-slate-500 font-medium">{parentComments.length} bản ghi</span>}
                </div>

                <div className="flex-1 p-4 py-3 overflow-y-auto bg-slate-50/20 space-y-4 relative custom-scrollbar">
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
                            const hasReplies = replies.length > 0

                            return (
                                <div key={comment.id || idx} className={`flex gap-3 max-w-[92%] group/comment ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
                                    <div className={`w-8 h-8 mt-1 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] text-white font-bold shadow-sm ${isMe ? 'bg-indigo-500' : 'bg-slate-500'}`}>
                                        {getProfileInitials(comment.user_id)}
                                    </div>
                                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} flex-1 min-w-0`}>
                                        <div className="flex items-baseline gap-2 mb-1">
                                            <span className="text-xs font-bold text-slate-700">{getProfileName(comment.user_id)}</span>
                                            <span className="text-[10px] font-medium text-slate-400">{formatDistanceToNow(parseISO(comment.created_at), { addSuffix: true, locale: vi })}</span>
                                            {isMe && editingCommentId !== comment.id && (
                                                <div className="flex items-center gap-1 opacity-0 group-hover/comment:opacity-100 transition-opacity">
                                                    <button onClick={(e) => { e.stopPropagation(); handleStartEdit(comment) }} className="p-0.5 text-slate-400 hover:text-indigo-600 transition-colors"><Pencil size={12} /></button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(comment.id) }} className="p-0.5 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
                                                </div>
                                            )}
                                        </div>
                                        {/* Image */}
                                        {(comment as any).image_url && (
                                            <div className="mb-1 rounded-xl overflow-hidden border border-slate-200 shadow-sm max-w-[180px]">
                                                <img src={(comment as any).image_url} alt="Hình" className="w-full h-auto object-cover cursor-pointer" onClick={() => window.open((comment as any).image_url, '_blank')} />
                                            </div>
                                        )}
                                        {editingCommentId === comment.id ? (
                                            <div className="flex items-center gap-2 w-full">
                                                <input autoFocus value={editContent} onChange={(e) => setEditContent(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') handleCancelEdit() }} className="flex-1 bg-white border border-indigo-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700" />
                                                <button onClick={handleSaveEdit} className="p-1.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"><Check size={14} /></button>
                                                <button onClick={handleCancelEdit} className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors"><X size={14} /></button>
                                            </div>
                                        ) : comment.content ? (
                                            <div className={`px-4 py-2.5 shadow-sm text-sm break-words whitespace-pre-wrap ${isMe ? 'bg-[#ebf0fe] text-slate-800 border border-[#d6e0fd] rounded-2xl rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-sm'}`}>
                                                {renderContent(comment.content)}
                                            </div>
                                        ) : null}

                                        {/* Thread toggle */}
                                        <div className={`mt-1.5 flex items-center gap-2 group cursor-pointer w-full ${isMe ? 'flex-row-reverse' : ''}`} onClick={() => setActiveThreadId(activeThreadId === comment.id ? null : comment.id)}>
                                            {hasReplies ? (
                                                <div className={`text-[11px] font-bold flex items-center gap-1 ${activeThreadId === comment.id ? 'text-indigo-600' : 'text-blue-500 hover:text-blue-600'}`}>
                                                    {replies.length} phản hồi <ChevronRight size={13} />
                                                </div>
                                            ) : (
                                                <div className="text-[11px] font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Trả lời
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                    <div ref={mainBottomRef} className="h-1" />
                </div>

                {/* Main Input */}
                <div className="p-3 bg-white border-t border-slate-200 relative shrink-0">
                    {pendingMainPreview && (
                        <div className="relative inline-block mb-2">
                            <img src={pendingMainPreview} alt="Preview" className="h-16 rounded-lg border border-slate-200 object-cover" />
                            <button onClick={() => clearImage('main')} className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center">
                                <XCircle size={12} />
                            </button>
                        </div>
                    )}
                    <MentionsDropdown />
                    <div className="flex gap-2 items-center">
                        <input ref={mainFileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect('main')} />
                        <button onClick={() => mainFileRef.current?.click()} className="w-7 h-7 shrink-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg flex items-center justify-center transition-colors" title="Gửi hình ảnh">
                            <ImageIcon size={14} />
                        </button>
                        <input
                            ref={inputRef}
                            type="text"
                            value={newMessage}
                            onChange={(e) => handleInputChange(e, 'main')}
                            onKeyDown={(e) => handleKeyPress(e, 'main')}
                            placeholder="Ghi chú & thảo luận... (@ để tag)"
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700"
                            onFocus={() => setActiveMentionTarget('main')}
                        />
                        <button onClick={() => handleSend('main')} disabled={(!newMessage.trim() && !pendingMainImage) || uploadingMain} className="w-8 h-8 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl flex items-center justify-center transition-colors shrink-0 shadow-sm">
                            {uploadingMain ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} className={newMessage.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Column (Thread) */}
            {activeThreadId && (
                <div className="flex flex-col h-full w-1/2 bg-slate-50 border-l border-slate-200 animate-in fade-in slide-in-from-right-4 duration-300 shadow-[inset_1px_0_0_rgba(0,0,0,0.05)] relative z-20">
                    <div className="px-4 py-3 bg-white border-b border-slate-200 flex justify-between items-center sticky top-0 z-10 shadow-sm shrink-0">
                        <h4 className="font-extrabold text-slate-800 text-sm">Chủ đề</h4>
                        <button onClick={() => setActiveThreadId(null)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors">
                            <X size={16} strokeWidth={2.5} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {activeThreadParent && (
                            <div className="p-4 border-b border-slate-200/60 bg-white">
                                <div className="flex gap-3">
                                    <div className="w-7 h-7 rounded-full bg-slate-500 flex items-center justify-center flex-shrink-0 text-[10px] text-white font-bold">
                                        {getProfileInitials(activeThreadParent.user_id)}
                                    </div>
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <div className="flex items-baseline gap-2 mb-1">
                                            <span className="text-xs font-bold text-slate-800">{getProfileName(activeThreadParent.user_id)}</span>
                                            <span className="text-[10px] font-medium text-slate-400">{formatDistanceToNow(parseISO(activeThreadParent.created_at), { addSuffix: true, locale: vi })}</span>
                                        </div>
                                        {(activeThreadParent as any).image_url && (
                                            <div className="mb-1 rounded-lg overflow-hidden border border-slate-200 max-w-[140px]">
                                                <img src={(activeThreadParent as any).image_url} alt="Hình" className="w-full h-auto object-cover cursor-pointer" onClick={() => window.open((activeThreadParent as any).image_url, '_blank')} />
                                            </div>
                                        )}
                                        {activeThreadParent.content && (
                                            <div className="text-sm text-slate-700 leading-relaxed font-medium break-words whitespace-pre-wrap">
                                                {renderContent(activeThreadParent.content)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="p-3 space-y-4">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="text-xs font-bold text-slate-400 whitespace-nowrap">{activeThreadReplies.length} phản hồi</div>
                                <div className="h-px bg-slate-200 w-full rounded-full flex-1" />
                            </div>

                            {activeThreadReplies.map((reply, idx) => {
                                const isReplyMine = reply.user_id === currentUserProfile?.id
                                return (
                                    <div key={reply.id || idx} className="flex gap-2.5 group/reply">
                                        <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0 text-[10px] font-bold shadow-sm">
                                            {getProfileInitials(reply.user_id)}
                                        </div>
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <div className="flex items-baseline gap-2 mb-1">
                                                <span className="text-xs font-bold text-slate-700">{getProfileName(reply.user_id)}</span>
                                                <span className="text-[10px] font-medium text-slate-400">{formatDistanceToNow(parseISO(reply.created_at), { addSuffix: true, locale: vi })}</span>
                                                {isReplyMine && editingCommentId !== reply.id && (
                                                    <div className="flex items-center gap-1 opacity-0 group-hover/reply:opacity-100 transition-opacity">
                                                        <button onClick={() => handleStartEdit(reply)} className="p-0.5 text-slate-400 hover:text-indigo-600 transition-colors"><Pencil size={12} /></button>
                                                        <button onClick={() => handleDelete(reply.id)} className="p-0.5 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
                                                    </div>
                                                )}
                                            </div>
                                            {(reply as any).image_url && (
                                                <div className="mb-1 rounded-lg overflow-hidden border border-slate-200 max-w-[130px]">
                                                    <img src={(reply as any).image_url} alt="Hình" className="w-full h-auto object-cover cursor-pointer" onClick={() => window.open((reply as any).image_url, '_blank')} />
                                                </div>
                                            )}
                                            {editingCommentId === reply.id ? (
                                                <div className="flex items-center gap-2 w-full">
                                                    <input autoFocus value={editContent} onChange={(e) => setEditContent(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') handleCancelEdit() }} className="flex-1 bg-white border border-indigo-300 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700" />
                                                    <button onClick={handleSaveEdit} className="p-1.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"><Check size={14} /></button>
                                                    <button onClick={handleCancelEdit} className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors"><X size={14} /></button>
                                                </div>
                                            ) : reply.content ? (
                                                <div className="text-sm text-slate-800 leading-relaxed break-words whitespace-pre-wrap">{renderContent(reply.content)}</div>
                                            ) : null}
                                        </div>
                                    </div>
                                )
                            })}
                            <div ref={threadBottomRef} className="h-1" />
                        </div>
                    </div>

                    {/* Thread Input */}
                    <div className="p-3 bg-white border-t border-slate-200 relative shrink-0">
                        {pendingThreadPreview && (
                            <div className="relative inline-block mb-2">
                                <img src={pendingThreadPreview} alt="Preview" className="h-14 rounded-lg border border-slate-200 object-cover" />
                                <button onClick={() => clearImage('thread')} className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center">
                                    <XCircle size={12} />
                                </button>
                            </div>
                        )}
                        {activeMentionTarget === 'thread' && <MentionsDropdown />}
                        <div className="flex gap-2 items-center">
                            <input ref={threadFileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect('thread')} />
                            <button onClick={() => threadFileRef.current?.click()} className="w-7 h-7 shrink-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg flex items-center justify-center transition-colors" title="Gửi hình ảnh">
                                <ImageIcon size={14} />
                            </button>
                            <input
                                ref={threadInputRef}
                                type="text"
                                value={newThreadMessage}
                                onChange={(e) => handleInputChange(e, 'thread')}
                                onKeyDown={(e) => handleKeyPress(e, 'thread')}
                                placeholder="Trả lời trong chủ đề... (@ để tag)"
                                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700"
                                onFocus={() => setActiveMentionTarget('thread')}
                            />
                            <button onClick={() => handleSend('thread')} disabled={(!newThreadMessage.trim() && !pendingThreadImage) || uploadingThread} className="w-8 h-8 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-50 disabled:text-slate-400 text-white rounded-xl flex items-center justify-center transition-colors shadow-sm shrink-0">
                                {uploadingThread ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
