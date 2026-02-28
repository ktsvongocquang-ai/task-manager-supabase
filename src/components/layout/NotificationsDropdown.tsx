import React, { useState, useEffect } from 'react'
import { Bell, Check, Clock, AlertCircle, FileText, CheckCircle2, Inbox } from 'lucide-react'
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../../services/notifications'
import type { AppNotification } from '../../types'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { vi } from 'date-fns/locale'

interface NotificationsDropdownProps {
    userId?: string;
    onClose: () => void;
    onCountChange: (count: number) => void;
}

export const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({ userId, onClose, onCountChange }) => {
    const [notifications, setNotifications] = useState<AppNotification[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (userId) {
            fetchNotifications()
        }
    }, [userId])

    const fetchNotifications = async () => {
        setLoading(true)
        const data = await getNotifications(userId!)
        setNotifications(data)

        const unreadCount = data.filter(n => !n.is_read).length
        onCountChange(unreadCount)
        setLoading(false)
    }

    const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        await markNotificationAsRead(id)
        const updated = notifications.map(n => n.id === id ? { ...n, is_read: true } : n)
        setNotifications(updated)
        onCountChange(updated.filter(n => !n.is_read).length)
    }

    const handleMarkAllAsRead = async () => {
        if (!userId) return;
        await markAllNotificationsAsRead(userId)
        const updated = notifications.map(n => ({ ...n, is_read: true }))
        setNotifications(updated)
        onCountChange(0)
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'mention': return <FileText className="text-blue-500" size={16} />
            case 'assignment': return <CheckCircle2 className="text-emerald-500" size={16} />
            case 'overdue': return <AlertCircle className="text-red-500" size={16} />
            case 'due_today': return <Clock className="text-amber-500" size={16} />
            default: return <Bell className="text-gray-500" size={16} />
        }
    }

    const getBgColor = (type: string, isRead: boolean) => {
        if (isRead) return 'bg-white hover:bg-slate-50'
        switch (type) {
            case 'overdue': return 'bg-red-50 hover:bg-red-100'
            case 'due_today': return 'bg-amber-50 hover:bg-amber-100'
            case 'assignment': return 'bg-emerald-50 hover:bg-emerald-100'
            case 'mention': return 'bg-blue-50 hover:bg-blue-100'
            default: return 'bg-slate-50 hover:bg-slate-100'
        }
    }

    return (
        <div className="absolute right-0 mt-2 w-80 md:w-96 glass-card shadow-2xl z-[70] animate-in fade-in zoom-in duration-200 origin-top-right overflow-hidden flex flex-col max-h-[500px] border border-white/40" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-100/50 flex justify-between items-center bg-white/80 backdrop-blur-md">
                <div className="flex items-center gap-2">
                    <Bell className="text-yellow-500 fill-yellow-500" size={18} />
                    <h3 className="font-bold text-gray-900 text-sm">Thông báo</h3>
                </div>
                {notifications.some(n => !n.is_read) && (
                    <button
                        onClick={handleMarkAllAsRead}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md transition-colors"
                    >
                        Đánh dấu đã đọc tất cả
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50/30 backdrop-blur-sm custom-scrollbar">
                {loading ? (
                    <div className="p-8 text-center text-slate-500 text-xs flex flex-col items-center">
                        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                        Đang tải thông báo...
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="p-10 text-center flex flex-col items-center justify-center">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                            <Inbox className="text-slate-400" size={24} />
                        </div>
                        <p className="text-sm font-semibold text-slate-600">Tuyệt vời!</p>
                        <p className="text-xs text-slate-500 mt-1">Bạn không có thông báo nào mới.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100/50">
                        {notifications.map((notif) => (
                            <div
                                key={notif.id}
                                className={`p-4 transition-colors cursor-pointer group ${getBgColor(notif.type, notif.is_read)}`}
                                // Future enhancement: navigate to the task/project
                                onClick={() => { }}
                            >
                                <div className="flex gap-3">
                                    <div className="flex-shrink-0 mt-0.5">
                                        <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center">
                                            {getIcon(notif.type)}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-xs ${notif.is_read ? 'text-slate-600 font-medium' : 'text-slate-800 font-bold'} leading-relaxed`}>
                                            {notif.content}
                                        </p>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-[10px] text-slate-400 font-medium">
                                                {formatDistanceToNow(parseISO(notif.created_at), { addSuffix: true, locale: vi })}
                                            </span>
                                            {!notif.is_read && (
                                                <button
                                                    onClick={(e) => handleMarkAsRead(notif.id, e)}
                                                    className="w-5 h-5 rounded-full hover:bg-black/5 flex items-center justify-center text-transparent group-hover:text-blue-500 transition-colors"
                                                    title="Đánh dấu đã đọc"
                                                >
                                                    <Check size={12} strokeWidth={3} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-3 border-t border-gray-100/50 bg-white/80 text-center">
                <button
                    onClick={onClose}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                >
                    Đóng
                </button>
            </div>
        </div>
    )
}
