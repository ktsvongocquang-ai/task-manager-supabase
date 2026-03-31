import { useAuthStore } from '../../store/authStore';
import { User, ShieldAlert, Award, Mail, Link } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';

export const Profile = () => {
    const { profile, user } = useAuthStore();
    const [linking, setLinking] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const getRoleBrand = (role?: string) => {
        if (role === 'Admin') return { color: 'bg-admin', text: 'text-admin', badge: 'bg-orange-50 text-admin font-bold' }
        if (role === 'Quản lý thiết kế') return { color: 'bg-manager', text: 'text-manager', badge: 'bg-blue-50 text-manager font-bold' }
        if (role === 'Quản lý thi công') return { color: 'bg-indigo-600', text: 'text-indigo-600', badge: 'bg-indigo-50 text-indigo-600 font-bold' }
        if (role === 'Kỹ sư') return { color: 'bg-amber-500', text: 'text-amber-600', badge: 'bg-amber-50 text-amber-600 font-bold' }
        if (role === 'Khách hàng') return { color: 'bg-emerald-500', text: 'text-emerald-600', badge: 'bg-emerald-50 text-emerald-600 font-bold' }
        if (role === 'Nhân viên') return { color: 'bg-employee', text: 'text-employee', badge: 'bg-green-50 text-employee font-bold' }
        return { color: 'bg-employee', text: 'text-employee', badge: 'bg-green-50 text-employee font-bold' }
    }

    const brand = getRoleBrand(profile?.role);
    const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
    
    const hasGoogleLinked = user?.app_metadata?.providers?.includes('google');

    const handleLinkGoogle = async () => {
        try {
            setLinking(true);
            const { error } = await supabase.auth.linkIdentity({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/dashboard` // redirect back to dashboard
                }
            });
            if (error) throw error;
        } catch (error: any) {
            console.error('Google link error:', error);
            alert(`Lỗi liên kết Google: ${error.message}`);
        } finally {
            setLinking(false);
        }
    };

    return (
        <div className="flex-1 bg-slate-50/50 min-h-full pb-24 md:pb-8">
            <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
                {/* Header Profile Section */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden mb-6 sm:mb-8">
                    <div className="h-32 sm:h-48 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative">
                        {/* Abstract pattern overlay could go here */}
                    </div>
                    <div className="px-6 pb-6 relative">
                        <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-16 sm:-mt-20 mb-4 sm:mb-0 gap-4 sm:gap-6">
                            <div className={`w-32 h-32 sm:w-40 sm:h-40 rounded-3xl ${brand.color} border-4 border-white shadow-xl flex flex-col justify-center items-center transform transition-all hover:scale-105 duration-300`}>
                                <span className="text-5xl sm:text-6xl text-white font-black tracking-tighter">{initials}</span>
                                {profile?.role && (
                                    <div className="absolute -bottom-3 bg-white px-4 py-1.5 rounded-full shadow-lg border border-slate-100 flex items-center gap-1.5">
                                        <Award size={14} className={brand.text} />
                                        <span className={`text-xs font-bold ${brand.text}`}>{profile.role}</span>
                                    </div>
                                )}
                            </div>
                            
                            <div className="text-center sm:text-left pt-2 sm:pt-0 pb-2 flex-1">
                                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-1">{profile?.full_name || 'Người dùng'}</h1>
                                <p className="text-slate-500 font-medium flex items-center justify-center sm:justify-start gap-1.5 mb-3">
                                    <Mail size={16} /> 
                                    {profile?.email}
                                </p>
                                {/* Google Link Action */}
                                {hasGoogleLinked ? (
                                    <div className="inline-flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-full text-xs font-medium">
                                        <svg width="14" height="14" viewBox="0 0 48 48">
                                            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                                            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                                            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                                            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                                        </svg>
                                        Đã liên kết Google
                                    </div>
                                ) : (
                                    <button 
                                        onClick={handleLinkGoogle}
                                        disabled={linking}
                                        className="inline-flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 shadow-sm"
                                    >
                                        <Link size={14} className={linking ? "animate-spin" : ""} />
                                        {linking ? 'Đang liên kết...' : 'Liên kết tài khoản Google'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                    {/* Left Column: Info */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <User size={18} className="text-indigo-500" />
                                Thông tin chung
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs text-slate-500 font-medium mb-1">Chức vụ / Phòng ban</p>
                                    <p className="text-sm font-bold text-slate-900">{profile?.position || 'Chưa cập nhật'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-medium mb-1">Số điện thoại</p>
                                    <p className="text-sm font-bold text-slate-900">{(profile as any)?.phone || 'Chưa cập nhật'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-medium mb-1">Cơ sở / Chi nhánh</p>
                                    <p className="text-sm font-bold text-slate-900">{(profile as any)?.branch || 'Chưa cập nhật'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Roles & Permissions */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5 sm:p-6">
                            <h3 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <ShieldAlert size={20} className="text-indigo-500" />
                                Quyền hạn & Chức năng
                            </h3>
                            
                            <div className="prose prose-slate prose-sm max-w-none">
                                <p className="text-slate-600 leading-relaxed mb-6">
                                    Tài khoản của bạn được định danh với vai trò <span className={brand.badge}>{profile?.role}</span>. Dưới đây là các module và chức năng bạn được phép truy cập theo phân quyền trên hệ thống.
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Dynamically render permissions based on role just to show the user */}
                                    {profile?.role === 'Admin' && (
                                        <>
                                            <PermissionItem title="Công việc & Dự án" desc="Toàn quyền truy cập tất cả Kanban, Gantt, Lịch trình và Dự án." type="full" />
                                            <PermissionItem title="Thi công & Thiết kế" desc="Giám sát mọi công trình và ý tưởng." type="full" />
                                            <PermissionItem title="CRM & Marketing" desc="Kiểm soát toàn bộ module khách hàng." type="full" />
                                            <PermissionItem title="Người dùng" desc="Thêm/sửa/xoá và phân quyền nhân sự." type="full" />
                                        </>
                                    )}

                                    {profile?.role === 'Quản lý thiết kế' && (
                                        <>
                                            <PermissionItem title="Công việc & Dự án" desc="Toàn quyền Kanban, Gantt, Lịch trình và Dự án." type="full" />
                                            <PermissionItem title="Marketing" desc="Quản lý nội dung và chiến dịch marketing." type="full" />
                                            <PermissionItem title="Thi công" desc="Xem và theo dõi tiến độ công trình." type="full" />
                                            <PermissionItem title="CRM & Người dùng" desc="Không có quyền quản lý nhân sự hay báo giá." type="denied" />
                                        </>
                                    )}

                                    {profile?.role === 'Quản lý thi công' && (
                                        <>
                                            <PermissionItem title="Công việc & Dự án" desc="Truy cập Kanban, Gantt và quản lý dự án thi công." type="full" />
                                            <PermissionItem title="Thi công" desc="Toàn quyền quản lý công trình, tiến độ, nhật ký." type="full" />
                                            <PermissionItem title="Marketing & CRM" desc="Không có quyền truy cập." type="denied" />
                                        </>
                                    )}

                                    {profile?.role === 'Kỹ sư' && (
                                        <>
                                            <PermissionItem title="Thi công" desc="Cập nhật tiến độ, hạng mục, nhật ký công trường." type="full" />
                                            <PermissionItem title="Việc cá nhân" desc="Quản lý danh sách việc được giao." type="full" />
                                            <PermissionItem title="Công việc chung & CRM" desc="Không có quyền truy cập." type="denied" />
                                        </>
                                    )}

                                    {profile?.role === 'Khách hàng' && (
                                        <>
                                            <PermissionItem title="Tiến độ công trình" desc="Xem tiến độ, nhật ký và thanh toán dự án của mình." type="read" />
                                            <PermissionItem title="Thi công (sửa)" desc="Chỉ xem, không thể chỉnh sửa." type="denied" />
                                        </>
                                    )}

                                    {profile?.role === 'Nhân viên' && (
                                        <>
                                            <PermissionItem title="Công việc cá nhân" desc="Truy cập danh sách việc và Kanban cá nhân." type="full" />
                                            <PermissionItem title="Dự án tổng" desc="Chỉ xem các dự án được chỉ định." type="read" />
                                            <PermissionItem title="Thi công & CRM" desc="Không có quyền truy cập." type="denied" />
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PermissionItem = ({ title, desc, type }: { title: string, desc: string, type: 'full' | 'read' | 'denied' }) => {
    return (
        <div className={`p-4 rounded-xl border ${type === 'full' ? 'bg-indigo-50/50 border-indigo-100' : type === 'read' ? 'bg-amber-50/50 border-amber-100' : 'bg-slate-50 border-slate-100 opacity-80'}`}>
            <h4 className={`text-sm font-bold mb-1 ${type === 'full' ? 'text-indigo-900' : type === 'read' ? 'text-amber-900' : 'text-slate-500'}`}>{title}</h4>
            <p className="text-xs text-slate-500">{desc}</p>
        </div>
    )
}
