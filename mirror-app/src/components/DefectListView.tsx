import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Wrench,
  ChevronRight,
  Camera,
  MapPin,
  CalendarDays,
  FolderOpen,
  ChevronDown,
} from 'lucide-react';
import type { Project, FloorPlan, MarkerNote } from '../types';

interface DefectListViewProps {
  projects: Project[];
  floorPlans: FloorPlan[];
  markerNotes: MarkerNote[];
  onUpdateMarker: (updated: MarkerNote) => void;
  onOpenProject: (projectId: string) => void;
  onClose: () => void;
}

const STATUS_FILTERS = [
  { key: 'all', label: 'Tất cả', color: 'indigo' },
  { key: 'Chưa sửa', label: 'Chưa sửa', color: 'rose' },
  { key: 'Đang sửa', label: 'Đang sửa', color: 'amber' },
  { key: 'Đã duyệt', label: 'Đã duyệt', color: 'emerald' },
] as const;

const CATEGORY_FILTERS = [
  'Tất cả',
  'Nội thất',
  'Kết cấu',
  'MEP',
  'Ốp lát',
  'Hoàn thiện',
  'Trần & Đèn',
] as const;

const statusColorMap: Record<string, { border: string; bg: string; text: string }> = {
  'Chưa sửa': { border: 'border-l-rose-500', bg: 'bg-rose-500/15', text: 'text-rose-400' },
  'Đang sửa': { border: 'border-l-amber-500', bg: 'bg-amber-500/15', text: 'text-amber-400' },
  'Đã duyệt': { border: 'border-l-emerald-500', bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
};

const statusIconMap: Record<string, React.ReactNode> = {
  'Chưa sửa': <AlertTriangle size={10} />,
  'Đang sửa': <Wrench size={10} />,
  'Đã duyệt': <CheckCircle2 size={10} />,
};

function timeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  if (months > 0) return `${months} tháng trước`;
  if (weeks > 0) return `${weeks} tuần trước`;
  if (days > 0) return `${days} ngày trước`;
  if (hours > 0) return `${hours} giờ trước`;
  if (minutes > 0) return `${minutes} phút trước`;
  return 'Vừa xong';
}

function getMarkerStatus(marker: MarkerNote): string {
  if (marker.tags && marker.tags.length > 0) {
    const first = marker.tags[0];
    if (first === 'Chưa sửa' || first === 'Đang sửa' || first === 'Đã duyệt') {
      return first;
    }
  }
  return 'Chưa sửa';
}

const DefectListView: React.FC<DefectListViewProps> = ({
  projects,
  floorPlans,
  markerNotes,
  onUpdateMarker,
  onOpenProject,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('Tất cả');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week'>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);

  // Build lookup maps
  const floorPlanMap = useMemo(() => {
    const map = new Map<string, FloorPlan>();
    floorPlans.forEach((fp) => map.set(fp.id, fp));
    return map;
  }, [floorPlans]);

  const projectMap = useMemo(() => {
    const map = new Map<string, Project>();
    projects.forEach((p) => map.set(p.id, p));
    return map;
  }, [projects]);

  // Find project name for a marker via its floor plan
  const getProjectName = (marker: MarkerNote): string => {
    const fp = floorPlanMap.get(marker.floorPlanId);
    if (fp?.projectId) {
      const project = projectMap.get(fp.projectId);
      return project?.name ?? '';
    }
    return '';
  };

  const getFloorPlanName = (marker: MarkerNote): string => {
    const fp = floorPlanMap.get(marker.floorPlanId);
    return fp?.name ?? '';
  };

  // Get unique project names for filter
  const projectOptions = useMemo(() => {
    const names = new Set<string>();
    markerNotes.forEach((m) => {
      const name = getProjectName(m);
      if (name) names.add(name);
    });
    return Array.from(names).sort();
  }, [markerNotes, floorPlanMap, projectMap]);

  // Filter markers
  const filteredMarkers = useMemo(() => {
    let result = [...markerNotes];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.textNotes.toLowerCase().includes(q) ||
          m.transcription.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((m) => getMarkerStatus(m) === statusFilter);
    }

    // Category filter
    if (categoryFilter !== 'Tất cả') {
      result = result.filter(
        (m) => m.tags && m.tags.some((tag) => tag === categoryFilter)
      );
    }

    // Time filter
    if (timeFilter === 'today') {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      result = result.filter((m) => m.createdAt >= todayStart.getTime());
    } else if (timeFilter === 'week') {
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      result = result.filter((m) => m.createdAt >= weekAgo);
    }

    // Project filter
    if (projectFilter !== 'all') {
      result = result.filter((m) => getProjectName(m) === projectFilter);
    }

    // Sort by newest first
    result.sort((a, b) => b.createdAt - a.createdAt);

    return result;
  }, [markerNotes, searchQuery, statusFilter, categoryFilter, timeFilter, projectFilter]);

  return (
    <div className="fixed inset-0 z-[200] bg-[#1a1a1a] overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#1a1a1a]/95 backdrop-blur-md border-b border-[#333] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-400" />
            <h1 className="text-white font-bold text-sm tracking-wide">
              DANH SÁCH SỰ CỐ
            </h1>
            <span className="ml-1 bg-indigo-500/20 text-indigo-400 text-[10px] font-semibold px-2 py-0.5 rounded-full">
              {markerNotes.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#333] hover:bg-[#444] transition-colors"
          >
            <X size={16} className="text-[#aaa]" />
          </button>
        </div>
      </div>

      <div className="px-4 pt-3 pb-24">
        {/* Search bar */}
        <div className="relative mb-3">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666]"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm lỗi..."
            className="w-full bg-[#222] border border-[#333] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-[#666] focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] hover:text-white"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Row 1: Time + Project + Status — all in one line */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-1.5 scrollbar-none">
          {/* Time chips */}
          {[
            { key: 'all' as const, label: 'Mọi lúc' },
            { key: 'today' as const, label: 'Hôm nay' },
            { key: 'week' as const, label: '7 ngày' },
          ].map((tf) => (
            <button
              key={tf.key}
              onClick={() => setTimeFilter(tf.key)}
              className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-medium border transition-colors ${
                timeFilter === tf.key
                  ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                  : 'bg-[#222] text-[#777] border-[#333]'
              }`}
            >
              {tf.label}
            </button>
          ))}

          {/* Divider */}
          <div className="w-px h-4 bg-[#333] flex-shrink-0 mx-0.5" />

          {/* Project dropdown (Native Select for clipping fix) */}
          <div className="relative flex-shrink-0">
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            >
              <option value="all">Tất cả dự án</option>
              {projectOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium border transition-colors ${
                projectFilter !== 'all'
                  ? 'bg-violet-500/15 text-violet-400 border-violet-500/30'
                  : 'bg-[#222] text-[#777] border-[#333]'
              }`}
            >
              <FolderOpen size={9} />
              <span className="truncate max-w-[60px]">{projectFilter === 'all' ? 'Dự án' : projectFilter.substring(0, 10)}</span>
              <ChevronDown size={9} />
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-4 bg-[#333] flex-shrink-0 mx-0.5" />

          {/* Status chips */}
          {STATUS_FILTERS.map((sf) => {
            const isActive = statusFilter === sf.key;
            const colorClasses: Record<string, string> = {
              indigo: isActive
                ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40'
                : 'bg-[#222] text-[#888] border-[#333]',
              rose: isActive
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                : 'bg-[#222] text-[#888] border-[#333]',
              amber: isActive
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                : 'bg-[#222] text-[#888] border-[#333]',
              emerald: isActive
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-[#222] text-[#888] border-[#333]',
            };
            return (
              <button
                key={sf.key}
                onClick={() => setStatusFilter(sf.key)}
                className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-medium border transition-colors ${colorClasses[sf.color]}`}
              >
                {sf.label}
              </button>
            );
          })}
        </div>

        {/* Row 2: Category chips */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-2 scrollbar-none">
          {CATEGORY_FILTERS.map((cat) => {
            const isActive = categoryFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-medium border transition-colors ${
                  isActive
                    ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
                    : 'bg-[#222] text-[#777] border-[#333]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] text-[#666]">
            Hiển thị {filteredMarkers.length} / {markerNotes.length} sự cố
          </span>
        </div>

        {/* Defect cards */}
        {filteredMarkers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-[#222] flex items-center justify-center mb-4">
              <Search size={24} className="text-[#444]" />
            </div>
            <p className="text-[#666] text-sm font-medium mb-1">
              Không tìm thấy sự cố nào
            </p>
            <p className="text-[#555] text-[11px]">
              Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMarkers.map((marker) => {
              const status = getMarkerStatus(marker);
              const colors = statusColorMap[status] ?? statusColorMap['Chưa sửa'];
              const projectName = getProjectName(marker);
              const floorPlanName = getFloorPlanName(marker);
              const nonStatusTags =
                marker.tags?.filter(
                  (t) =>
                    t !== 'Chưa sửa' && t !== 'Đang sửa' && t !== 'Đã duyệt'
                ) ?? [];

              return (
                <div
                  key={marker.id}
                  className={`bg-[#222] border border-[#333] rounded-2xl p-4 mb-3 border-l-[3px] ${colors.border} active:scale-[0.98] transition-transform`}
                  onClick={() => {
                    const fp = floorPlanMap.get(marker.floorPlanId);
                    if (fp?.projectId) {
                      onOpenProject(fp.projectId);
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* Photo thumbnail */}
                    {marker.photoData ? (
                      <img
                        src={marker.photoData}
                        alt={marker.title}
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-[#2a2a2a] flex items-center justify-center flex-shrink-0">
                        <Camera size={16} className="text-[#555]" />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Title */}
                      <p className="font-bold text-sm text-white truncate">
                        {marker.title || 'Không có tiêu đề'}
                      </p>

                      {/* Project + Floor plan */}
                      {(projectName || floorPlanName) && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin size={9} className="text-[#666] flex-shrink-0" />
                          <p className="text-[10px] text-[#888] truncate">
                            {projectName}
                            {projectName && floorPlanName && ' · '}
                            {floorPlanName}
                          </p>
                        </div>
                      )}

                      {/* Tags */}
                      {nonStatusTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {nonStatusTags.map((tag, i) => (
                            <span
                              key={i}
                              className="bg-[#2a2a2a] text-[#aaa] text-[9px] px-1.5 py-0.5 rounded-md"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Bottom row: date + status */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1 text-[#666]">
                          <Clock size={9} />
                          <span className="text-[9px]">
                            {timeAgo(marker.createdAt)}
                          </span>
                        </div>

                        <div
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium ${colors.bg} ${colors.text}`}
                        >
                          {statusIconMap[status]}
                          <span>{status}</span>
                        </div>
                      </div>
                    </div>

                    {/* Chevron */}
                    <ChevronRight
                      size={14}
                      className="text-[#555] flex-shrink-0 mt-1"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DefectListView;
