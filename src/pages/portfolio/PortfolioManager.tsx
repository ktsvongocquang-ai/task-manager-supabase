import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../store/authStore';
import { QRCodeSVG } from 'qrcode.react';
import { Plus, Link as LinkIcon, Trash2, Copy, Shield, ShieldOff, Clock, LayoutGrid, Edit3 } from 'lucide-react';
import { PortfolioProjectModal } from './PortfolioProjectModal';

export function PortfolioManager() {
    const { profile } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'shares' | 'projects'>('shares');
    const [shares, setShares] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [portfolioProjects, setPortfolioProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [editingProject, setEditingProject] = useState<any | null>(null);
    
    // Form state
    const [title, setTitle] = useState('');
    const [passcode, setPasscode] = useState('');
    const [usePasscode, setUsePasscode] = useState(true);
    const [expireDays, setExpireDays] = useState(7);
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchShares();
        fetchProjects();
        fetchPortfolioProjects();
    }, [profile]);

    const fetchPortfolioProjects = async () => {
        try {
            const { data } = await supabase.from('portfolio_projects').select('*').order('sort_order', { ascending: true });
            if (data) setPortfolioProjects(data);
        } catch (err) {
            console.error('Lỗi tải danh sách portfolio project:', err);
        }
    };

    const fetchProjects = async () => {
        try {
            const { data } = await supabase.from('construction_projects').select('id, name').order('created_at', { ascending: false });
            if (data) setProjects(data);
        } catch (err) {
            console.error('Lỗi tải danh sách dự án:', err);
        }
    };

    const fetchShares = async () => {
        if (!profile) return;
        setLoading(true);
        try {
            let query = supabase.from('portfolio_shares').select('*, construction_projects:project_id(name)').order('created_at', { ascending: false });
            if (profile.role !== 'Admin') {
                query = query.eq('created_by', profile.id);
            }
            const { data } = await query;
            if (data) setShares(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const generateToken = () => {
        return Math.random().toString(36).substring(2, 10);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            const token = generateToken();
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + expireDays);

            const { error } = await supabase.from('portfolio_shares').insert({
                title,
                token,
                passcode: usePasscode && passcode.trim() !== '' ? passcode : null,
                expires_at: expiresAt.toISOString(),
                project_id: selectedProjectId || null,
                created_by: profile?.id
            });

            if (error) throw error;
            
            setShowShareModal(false);
            setTitle('');
            setPasscode('');
            setSelectedProjectId('');
            fetchShares();
        } catch (err: any) {
            alert('Lỗi tạo link: ' + err.message);
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteShare = async (id: string) => {
        if (!confirm('Bạn có chắc muốn xóa Link này không? Khách hàng sẽ không thể truy cập nữa.')) return;
        try {
            await supabase.from('portfolio_shares').delete().eq('id', id);
            fetchShares();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteProject = async (id: string) => {
        if (!confirm('Bạn có chắc muốn xóa dự án này khỏi Portfolio không?')) return;
        try {
            await supabase.from('portfolio_projects').delete().eq('id', id);
            fetchPortfolioProjects();
        } catch (err) {
            console.error(err);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Đã copy Link vào khay nhớ tạm!');
    };

    const getLink = (token: string) => {
        return `${window.location.origin}/p/${token}`;
    };

    if (loading) return <div className="p-8 text-center">Đang tải...</div>;

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý Portfolio</h1>
                    <p className="text-gray-500 text-sm mt-1">Quản lý nội dung dự án và link chia sẻ an toàn</p>
                </div>
                <button 
                    onClick={() => {
                        if (activeTab === 'shares') {
                            setShowShareModal(true);
                        } else {
                            setEditingProject(null);
                            setShowProjectModal(true);
                        }
                    }}
                    className="bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
                >
                    <Plus size={18} />
                    {activeTab === 'shares' ? 'Tạo Link Mới' : 'Thêm Dự Án'}
                </button>
            </div>

            <div className="flex gap-4 border-b border-gray-200 mb-6">
                <button 
                    onClick={() => setActiveTab('shares')}
                    className={`pb-3 px-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'shares' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Link Chia Sẻ
                </button>
                <button 
                    onClick={() => setActiveTab('projects')}
                    className={`pb-3 px-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'projects' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Nội Dung Dự Án
                </button>
            </div>

            {activeTab === 'shares' && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {shares.map(share => {
                    const isExpired = new Date(share.expires_at) < new Date();
                    const link = getLink(share.token);
                    return (
                        <div key={share.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                            <div className="p-5 flex-1">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-gray-900 line-clamp-1 mb-1" title={share.title}>{share.title}</h3>
                                        {share.construction_projects?.name && (
                                            <div className="text-[10px] text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded font-semibold inline-block">
                                                Dự án: {share.construction_projects.name}
                                            </div>
                                        )}
                                    </div>
                                    {share.passcode ? (
                                        <div className="text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-medium flex items-center gap-1 shrink-0 ml-2" title="Có bảo mật mã PIN">
                                            <Shield size={14} /> PIN
                                        </div>
                                    ) : (
                                        <div className="text-gray-500 bg-gray-100 px-2 py-1 rounded text-xs font-medium flex items-center gap-1 shrink-0 ml-2" title="Không dùng mã PIN">
                                            <ShieldOff size={14} /> Public
                                        </div>
                                    )}
                                </div>
                                
                                <div className="text-sm text-gray-600 mb-4 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Clock size={14} className="text-gray-400" />
                                        <span className={isExpired ? 'text-red-500 font-medium' : ''}>
                                            {isExpired ? 'Đã hết hạn' : `Hết hạn: ${new Date(share.expires_at).toLocaleDateString('vi-VN')}`}
                                        </span>
                                    </div>
                                    {share.passcode && (
                                        <div className="bg-gray-50 p-2 rounded border border-gray-100 flex justify-between items-center">
                                            <span className="text-xs text-gray-500">Mã PIN:</span>
                                            <span className="font-mono font-medium tracking-widest">{share.passcode}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 mt-auto">
                                    <input 
                                        type="text" 
                                        readOnly 
                                        value={link}
                                        className="bg-gray-50 border border-gray-200 text-xs px-2 py-1.5 rounded flex-1 outline-none text-gray-500"
                                    />
                                    <button onClick={() => copyToClipboard(link)} className="p-1.5 text-gray-500 hover:text-primary hover:bg-blue-50 rounded transition-colors" title="Copy Link">
                                        <Copy size={16} />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="border-t border-gray-100 p-4 bg-gray-50 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                                        <QRCodeSVG value={link} size={48} level="M" />
                                    </div>
                                    <div className="text-xs text-gray-500 font-medium leading-tight">
                                        Quét QR<br/>để xem
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleDeleteShare(share.id)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Xóa Link"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {activeTab === 'shares' && shares.length === 0 && !loading && (
                <div className="text-center py-20 bg-white rounded-xl border border-gray-200 border-dashed">
                    <LinkIcon size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">Chưa có link chia sẻ nào</h3>
                    <p className="text-gray-500 text-sm">Tạo link chia sẻ bảo mật để gửi cho khách hàng xem Landing Page.</p>
                </div>
            )}
            </>
            )}
            
            {activeTab === 'projects' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {portfolioProjects.map(proj => (
                        <div key={proj.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                            {proj.cover_image ? (
                                <img src={proj.cover_image} alt={proj.title} className="w-full h-32 object-cover" />
                            ) : (
                                <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
                                    <LayoutGrid className="text-gray-300" size={32} />
                                </div>
                            )}
                            <div className="p-4 flex-1">
                                <h3 className="font-bold text-gray-900 mb-1">{proj.title}</h3>
                                <p className="text-xs text-gray-500 mb-2">{proj.subtitle}</p>
                                <div className="flex flex-wrap gap-1">
                                    <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full">{proj.style}</span>
                                    <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full">{proj.location}</span>
                                </div>
                            </div>
                            <div className="border-t border-gray-100 p-3 bg-gray-50 flex items-center justify-between">
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${proj.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                                    {proj.is_published ? 'Đang xuất bản' : 'Bản nháp'}
                                </span>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => {
                                            setEditingProject(proj);
                                            setShowProjectModal(true);
                                        }}
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                    >
                                        <Edit3 size={16} />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteProject(proj.id)}
                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {activeTab === 'projects' && portfolioProjects.length === 0 && !loading && (
                <div className="text-center py-20 bg-white rounded-xl border border-gray-200 border-dashed">
                    <LayoutGrid size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">Chưa có dự án nào</h3>
                    <p className="text-gray-500 text-sm">Thêm các dự án tiêu biểu để hiển thị trên Landing Page.</p>
                </div>
            )}

            {/* Create Share Modal */}
            {showShareModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-gray-900">Tạo Link Chia Sẻ</h3>
                            <button onClick={() => setShowShareModal(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tên khách hàng / Dự án</label>
                                <input 
                                    type="text" 
                                    required
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                    placeholder="VD: Anh Minh - Biệt thự Quận 2"
                                />
                            </div>
                            
                            <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 space-y-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={usePasscode}
                                        onChange={e => setUsePasscode(e.target.checked)}
                                        className="rounded text-primary focus:ring-primary h-4 w-4"
                                    />
                                    <span className="text-sm font-medium text-gray-800 flex items-center gap-1.5"><Shield size={14} className="text-primary"/> Bảo vệ bằng Mã PIN</span>
                                </label>
                                
                                {usePasscode && (
                                    <input 
                                        type="text"
                                        required={usePasscode}
                                        value={passcode}
                                        onChange={e => setPasscode(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono tracking-widest focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                        placeholder="Nhập PIN (VD: 123456)"
                                    />
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian hiệu lực</label>
                                <select 
                                    value={expireDays}
                                    onChange={e => setExpireDays(Number(e.target.value))}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                >
                                    <option value={1}>1 ngày</option>
                                    <option value={3}>3 ngày</option>
                                    <option value={7}>7 ngày</option>
                                    <option value={14}>14 ngày</option>
                                    <option value={30}>30 ngày</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Liên kết dự án thực tế (Không bắt buộc)</label>
                                <select 
                                    value={selectedProjectId}
                                    onChange={e => setSelectedProjectId(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
                                >
                                    <option value="">-- Không liên kết (Chế độ mô phỏng) --</option>
                                    {projects.map(proj => (
                                        <option key={proj.id} value={proj.id}>{proj.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setShowShareModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Hủy
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={creating}
                                    className="px-4 py-2 bg-primary hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                >
                                    {creating ? 'Đang tạo...' : 'Tạo Link'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            {showProjectModal && (
                <PortfolioProjectModal
                    isOpen={showProjectModal}
                    onClose={() => setShowProjectModal(false)}
                    project={editingProject}
                    onSaved={() => {
                        setShowProjectModal(false);
                        fetchPortfolioProjects();
                    }}
                />
            )}
        </div>
    );
}
