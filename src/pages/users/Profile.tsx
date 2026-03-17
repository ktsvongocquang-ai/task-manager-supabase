import { useAuthStore } from '../../store/authStore';
import { User, ShieldAlert, Award, Mail } from 'lucide-react';
import { useEffect } from 'react';

export const Profile = () => {
    const { profile } = useAuthStore();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const getRoleBrand = (role?: string) => {
        if (role === 'Admin') return { color: 'bg-admin', text: 'text-admin', badge: 'bg-orange-50 text-admin font-bold' }
        if (role === 'Quản lý') return { color: 'bg-manager', text: 'text-manager', badge: 'bg-blue-50 text-manager font-bold' }
        if (role === 'Thiết Kế') return { color: 'bg-emerald-500', text: 'text-emerald-600', badge: 'bg-emerald-50 text-emerald-600 font-bold' }
        if (role === 'Marketing') return { color: 'bg-pink-500', text: 'text-pink-600', badge: 'bg-pink-50 text-pink-600 font-bold' }
        if (role === 'Sale') return { color: 'bg-cyan-500', text: 'text-cyan-600', badge: 'bg-cyan-50 text-cyan-600 font-bold' }
        if (role === 'Giám Sát') return { color: 'bg-amber-500', text: 'text-amber-600', badge: 'bg-amber-50 text-amber-600 font-bold' }
        return { color: 'bg-employee', text: 'text-employee', badge: 'bg-green-50 text-employee font-bold' }
    }

    const brand = getRoleBrand(profile?.role);
    const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';

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
                                <p className="text-slate-500 font-medium flex items-center justify-center sm:justify-start gap-1.5">
                                    <Mail size={16} /> 
                                    {profile?.email}
                                </p>
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
                                    {(profile?.role === 'Admin' || profile?.role === 'Quản lý') && (
                                        <>
                                            <PermissionItem title="Công việc & Dự án" desc="Toàn quyền truy cập tất cả Kanban, Gantt, Lịch trình và Dự án." type="full" />
                                            <PermissionItem title="Tài chính & CRM" desc="Kiểm soát toàn bộ Module Sale và Báo giá." type="full" />
                                            <PermissionItem title="Thi công & Thiết kế" desc="Giám sát mọi công trình và ý tưởng." type="full" />
                                            <PermissionItem title="Người dùng" desc="Thêm/sửa/xoá và phân quyền nhân sự." type="full" />
                                        </>
                                    )}

                                    {profile?.role === 'Marketing' && (
                                        <>
                                            <PermissionItem title="Quản lý Công việc" desc="Sử dụng Kanban Marketing, đăng bài, lên lịch." type="full" />
                                            <PermissionItem title="Thi Công" desc="Chỉ xem tiến độ để viết bài PR truyền thông." type="read" />
                                            <PermissionItem title="Dự án chung" desc="Bị giới hạn, không truy cập bảng tổng công ty." type="denied" />
                                            <PermissionItem title="Khách hàng (CRM)" desc="Chỉ Sale và Admin được phép truy cập." type="denied" />
                                        </>
                                    )}

                                    {profile?.role === 'Thiết Kế' && (
                                        <>
                                            <PermissionItem title="Công việc Thiết kế" desc="Sử dụng Kanban 2D/3D." type="full" />
                                            <PermissionItem title="Thi Công" desc="Truy cập xem hồ sơ kỹ thuật hiện trường." type="read" />
                                            <PermissionItem title="Quản trị" desc="Không có quyền quản lý nhân sự hay tài chính." type="denied" />
                                        </>
                                    )}

                                    {profile?.role === 'Sale' && (
                                        <>
                                            <PermissionItem title="Chăm sóc Khách hàng" desc="Sử dụng toàn bộ tính năng CRM và Báo giá." type="full" />
                                            <PermissionItem title="Thi Công" desc="Theo dõi để báo cáo tiến độ cho khách." type="read" />
                                            <PermissionItem title="Marketing" desc="Không thể lên lịch bài đăng." type="denied" />
                                        </>
                                    )}

                                    {profile?.role === 'Giám Sát' && (
                                        <>
                                            <PermissionItem title="Quản lý Thi công" desc="Cập nhật tiến độ dự án, báo cáo hiện trường." type="full" />
                                            <PermissionItem title="Khách hàng & Báo giá" desc="Chỉ dành cho Sale và Kế toán." type="denied" />
                                        </>
                                    )}

                                    {/* Default Fallback */}
                                    {['Nhân viên'].includes(profile?.role || '') && (
                                        <>
                                            <PermissionItem title="Công việc cá nhân" desc="Truy cập danh sách việc và Kanban cá nhân." type="full" />
                                            <PermissionItem title="Dự án tổng" desc="Chỉ xem các dự án được chỉ định." type="read" />
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
