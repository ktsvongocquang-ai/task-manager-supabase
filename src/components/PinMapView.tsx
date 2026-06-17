import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { FloorPlan, MarkerNote, UserRoleProfile, CommentReply } from '../types/floorplan';
import {
  ZoomIn, ZoomOut, Maximize, MapPin, Move, Camera, X,
  ChevronDown, MessageSquare, Search, Loader2, Mic, Play, Pause, Send,
  ChevronLeft, Target
} from 'lucide-react';
import { renderPdfPageToImage, renderPdfPageFromArrayBuffer, getPdfDocumentFromArrayBuffer, renderPdfPageFromDocument } from '../utils/pdfUtils';
import VoiceNoteRecorder from './VoiceNoteRecorder';
import ImageGalleryModal from './modals/ImageGalleryModal';

const parseImages = (photoData: string | null): string[] => {
  if (!photoData) return [];
  try {
    const parsed = JSON.parse(photoData);
    if (Array.isArray(parsed)) return parsed;
    return [photoData];
  } catch {
    return [photoData];
  }
};

interface PinMapViewProps {
  floorPlans: FloorPlan[];
  activeFloorPlanId: string | null;
  setActiveFloorPlanId: (id: string | null) => void;
  markers: MarkerNote[];
  onAddMarker: (floorPlanId: string, x: number, y: number, pageIndex?: number) => void;
  onSelectMarker: (id: string | null) => void;
  onUpdateMarker: (updated: MarkerNote) => void;
  onDeleteMarker: (id: string) => void;
  selectedMarkerId: string | null;
  onNavigateToReport?: () => void;
  onTriggerCamera?: () => void;
  onOpenMiro?: (planId: string) => void;
  onExtractPageToMiro?: (planId: string, pageIndex: number, pageDataUrl: string, pageName: string) => void;
  // Multi-user / Role Settings
  activeUserRole?: UserRoleProfile;
  userRolesList?: UserRoleProfile[];
  onSetActiveUserRole?: (role: UserRoleProfile) => void;
  onClose?: () => void;
}

export default function PinMapView({
  floorPlans,
  activeFloorPlanId,
  setActiveFloorPlanId,
  markers,
  onAddMarker,
  onSelectMarker,
  onUpdateMarker,
  onDeleteMarker,
  selectedMarkerId,
  onNavigateToReport,
  onTriggerCamera,
  onOpenMiro,
  onExtractPageToMiro,
  activeUserRole,
  userRolesList,
  onSetActiveUserRole,
  onClose
}: PinMapViewProps) {
  // State
  const activePlanId = activeFloorPlanId || floorPlans[0]?.id || null;
  const setLocalActivePlanId = (id: string) => setActiveFloorPlanId(id);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [mode, setMode] = useState<'pan' | 'pin'>('pan');
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [showPlanSelector, setShowPlanSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dictation state
  const [isDictating, setIsDictating] = useState(false);
  const dictationRecognitionRef = useRef<any>(null);

  // Comment state
  const [newCommentText, setNewCommentText] = useState('');

  // Gallery state
  const [galleryImages, setGalleryImages] = useState<string[] | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const touchStartRef = useRef<{
    x: number;
    y: number;
    panX: number;
    panY: number;
    zoom: number;
    dist: number;
  }>({ x: 0, y: 0, panX: 0, panY: 0, zoom: 1, dist: 0 });
  const isTouchingRef = useRef<boolean>(false);

  // Derived state
  const activePlan = floorPlans.find(fp => fp.id === activePlanId) || floorPlans[0] || null;
  
  // PDF On-demand rendering state
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [renderedPages, setRenderedPages] = useState<Record<string, string>>({}); // cache: `${planId}-${pageIndex}` -> dataUrl
  const [isRenderingPdf, setIsRenderingPdf] = useState(false);
  const [renderStatus, setRenderStatus] = useState(''); // descriptive status for loading display
  const pdfBufferCache = useRef<Record<string, ArrayBuffer>>({}); // planId -> fetched PDF buffer
  const pdfDocumentCache = useRef<Record<string, any>>({}); // planId -> PDFDocumentProxy

  // Group plans for dropdown (Now just lists the floorPlans directly since 1 file = 1 FloorPlan)
  const groupedPlans = useMemo(() => {
    return floorPlans.map(fp => ({
      id: fp.id,
      name: fp.pageCount && fp.pageCount > 1 ? `${fp.name} (${fp.pageCount} trang)` : fp.name,
      representativePlanId: fp.id,
      pageCount: fp.pageCount || 1,
    }));
  }, [floorPlans]);

  // Reset view when plan changes
  useEffect(() => {
    setCurrentPageIndex(0);
  }, [activePlanId]);

  // Handle on-demand PDF rendering when pageIndex or plan changes
  useEffect(() => {
    if (!activePlan || !activePlan.pdfData) return;

    // NEW FORMAT: pdfData is a JSON array of pre-rendered page image URLs — no rendering needed!
    try {
      const parsed = JSON.parse(activePlan.pdfData);
      if (Array.isArray(parsed)) return;
    } catch {
      // Not JSON — fall through to legacy URL-based on-demand rendering
    }

    // LEGACY FORMAT: pdfData is a Supabase PDF URL — render on-demand
    const cacheKey = `${activePlan.id}-${currentPageIndex}`;
    if (renderedPages[cacheKey]) return; // Already cached

    let isMounted = true;
    const renderPage = async () => {
      setIsRenderingPdf(true);
      try {
        let pdfDoc = pdfDocumentCache.current[activePlan.id];
        if (!pdfDoc) {
          // Check if we already have the PDF buffer cached in memory
          let arrayBuffer = pdfBufferCache.current[activePlan.id];
          if (!arrayBuffer) {
            setRenderStatus('Đang tải PDF từ server...');
            const resp = await fetch(activePlan.pdfData!);
            if (!resp.ok) throw new Error(`Fetch failed: ${resp.status}`);
            arrayBuffer = await resp.arrayBuffer();
            if (isMounted) {
              pdfBufferCache.current[activePlan.id] = arrayBuffer; // Cache for subsequent pages
            }
          }
          if (!isMounted) return;
          setRenderStatus('Đang xử lý tài liệu...');
          pdfDoc = await getPdfDocumentFromArrayBuffer(arrayBuffer);
          if (isMounted) {
            pdfDocumentCache.current[activePlan.id] = pdfDoc;
          }
        }
        if (!isMounted) return;
        setRenderStatus(`Đang render trang ${currentPageIndex + 1}...`);
        const dataUrl = await renderPdfPageFromDocument(pdfDoc, currentPageIndex);
        if (isMounted) {
          setRenderedPages(prev => ({ ...prev, [cacheKey]: dataUrl }));
          setRenderStatus('');
        }
      } catch (err) {
        console.error('Failed to render PDF page:', err);
        if (isMounted) setRenderStatus('Lỗi render trang — thử lại hoặc re-upload file.');
      } finally {
        if (isMounted) setIsRenderingPdf(false);
      }
    };
    renderPage();
    return () => { isMounted = false; };
  }, [activePlan, currentPageIndex, renderedPages]);

  const currentCanvasImage = useMemo(() => {
    if (!activePlan) return '';
    if (activePlan.pdfData) {
      try {
        const parsed = JSON.parse(activePlan.pdfData);
        if (Array.isArray(parsed)) {
          return parsed[currentPageIndex] || activePlan.imageData;
        }
      } catch { }
      const cacheKey = `${activePlan.id}-${currentPageIndex}`;
      return renderedPages[cacheKey] || '';
    }
    return activePlan.imageData || '';
  }, [activePlan, currentPageIndex, renderedPages]);

  const handleZoom = useCallback((factor: number) => {
    setZoom(prev => Math.max(0.05, Math.min(prev * factor, 10)));
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      handleZoom(zoomFactor);
    } else {
      setPan(prev => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY
      }));
    }
  }, [handleZoom]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (mode === 'pin') return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [mode, pan.x, pan.y]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning || mode === 'pin') return;
    setPan({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y
    });
  }, [isPanning, mode, panStart.x, panStart.y]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const getPinchDistance = (touches: React.TouchList) => {
    return Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY
    );
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (mode === 'pin') return;
    isTouchingRef.current = true;
    if (e.touches.length === 1) {
      touchStartRef.current.x = e.touches[0].clientX;
      touchStartRef.current.y = e.touches[0].clientY;
      touchStartRef.current.panX = pan.x;
      touchStartRef.current.panY = pan.y;
    } else if (e.touches.length === 2) {
      touchStartRef.current.dist = getPinchDistance(e.touches);
      touchStartRef.current.zoom = zoom;
    }
  }, [mode, pan.x, pan.y, zoom]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isTouchingRef.current || mode === 'pin') return;
    if (e.touches.length === 1) {
      const dx = e.touches[0].clientX - touchStartRef.current.x;
      const dy = e.touches[0].clientY - touchStartRef.current.y;
      setPan({
        x: touchStartRef.current.panX + dx,
        y: touchStartRef.current.panY + dy
      });
    } else if (e.touches.length === 2) {
      const newDist = getPinchDistance(e.touches);
      const zoomFactor = newDist / touchStartRef.current.dist;
      setZoom(Math.max(0.05, Math.min(touchStartRef.current.zoom * zoomFactor, 10)));
    }
  }, [mode]);

  const handleTouchEnd = useCallback(() => {
    isTouchingRef.current = false;
  }, []);

  const hasPrev = currentPageIndex > 0;
  const hasNext = activePlan ? currentPageIndex < (activePlan.pageCount || 1) - 1 : false;

  const handlePrev = useCallback(() => {
    if (hasPrev) setCurrentPageIndex(prev => prev - 1);
  }, [hasPrev]);

  const handleNext = useCallback(() => {
    if (hasNext) setCurrentPageIndex(prev => prev + 1);
  }, [hasNext]);

  const handleFit = useCallback(() => {
    if (imageRef.current && containerRef.current) {
      const imgW = imageRef.current.naturalWidth || imageRef.current.width;
      const imgH = imageRef.current.naturalHeight || imageRef.current.height;
      if (imgW <= 1 || imgH <= 1) return;
      
      const containerW = containerRef.current.clientWidth;
      const containerH = containerRef.current.clientHeight;
      if (imgW > 0 && imgH > 0 && containerW > 0 && containerH > 0) {
        const scaleX = (containerW - 40) / imgW;
        const scaleY = (containerH - 40) / imgH;
        const fitScale = Math.min(scaleX, scaleY);
        setZoom(Math.max(fitScale, 0.05));
        setPan({ x: 0, y: 0 });
      } else {
        setZoom(1);
      }
    } else {
      setZoom(1);
    }
  }, []);

  const handleImageClick = useCallback((e: React.MouseEvent) => {
    if (mode !== 'pin' || !activePlanId || !imageRef.current) return;
    if (isRenderingPdf) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
      onAddMarker(activePlanId, x, y);
      setMode('pan');
    }
  }, [mode, activePlanId, onAddMarker, isRenderingPdf]);

  const handleConfirmCenterPin = useCallback(() => {
    if (mode !== 'pin' || !activePlanId || !imageRef.current || !containerRef.current) return;
    if (isRenderingPdf) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const centerX = containerRect.left + containerRect.width / 2;
    const centerY = containerRect.top + containerRect.height / 2;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((centerX - rect.left) / rect.width) * 100;
    const y = ((centerY - rect.top) / rect.height) * 100;

    if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
      onAddMarker(activePlanId, x, y);
      setMode('pan');
    }
  }, [mode, activePlanId, onAddMarker, isRenderingPdf]);

  const filteredMarkers = useMemo(() => {
    if (!activePlanId) return [];
    let list = markers.filter(m => m.floorPlanId === activePlanId);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(m => 
        (m.title && m.title.toLowerCase().includes(q)) || 
        (m.textNotes && m.textNotes.toLowerCase().includes(q)) ||
        (m.assignee && m.assignee.toLowerCase().includes(q))
      );
    }
    return list.sort((a, b) => b.createdAt - a.createdAt);
  }, [markers, activePlanId, searchQuery]);

  const getStatus = (m: any) => m.tags?.[0] || 'Chưa xử lý';

  return (
    <div className="flex-1 flex overflow-hidden bg-[#1a1a1a]">
      {/* LEFT: Issue List Sidebar */}
      <div className="w-72 border-r border-[#333] flex flex-col shrink-0 hidden md:flex">
        {/* Header */}
        <div className="h-14 border-b border-[#333] flex items-center justify-between px-4 bg-[#111] shrink-0">
          <h3 className="font-bold text-sm text-white">Danh sách lỗi</h3>
          <span className="text-xs font-bold text-[#888] bg-[#333] px-2 py-0.5 rounded-full">
            {filteredMarkers.length}
          </span>
        </div>
        
        {/* Search */}
        <div className="p-3 border-b border-[#222] shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-[#666] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm lỗi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#222] border-none rounded-lg text-sm focus:ring-2 focus:ring-rose-500 transition-shadow outline-none"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {filteredMarkers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-[#666]">
              <div className="text-sm">Chưa có lỗi nào</div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredMarkers.map((m, idx) => {
                const status = getStatus(m);
                const isDone = status === 'Đã duyệt' || status === 'Đã sửa';
                const bgColor = isDone ? 'bg-emerald-500' : status === 'Đang sửa' ? 'bg-amber-500' : 'bg-[#2a1114]0';
                const isActive = selectedMarkerId === m.id;
                
                return (
                  <div
                    key={m.id}
                    onClick={() => onSelectMarker(m.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isActive ? 'border-rose-500 shadow-md bg-[#2a1114]' : 'border-[#333] hover:border-[#444] hover:shadow-sm bg-[#1a1a1a]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 shrink-0 rounded-full ${bgColor} text-white text-[11px] font-bold flex items-center justify-center shadow-sm`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-white truncate">
                          {m.title || 'Lỗi không tên'}
                        </div>
                        <div className="text-xs text-[#888] mt-1 line-clamp-2">
                          {m.textNotes || 'Không có mô tả'}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#222] text-[#aaa]">
                            {status}
                          </span>
                          <span className="text-[10px] text-[#666]">
                            {new Date(m.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Main Canvas Area */}
      <div className="flex-1 flex flex-col relative bg-[#141414]">
        {/* Top Header */}
        <div className="h-14 bg-[#1a1a1a] border-b border-[#333] flex items-center justify-between px-3 md:px-4 z-40 shrink-0 shadow-sm">
          <div className="flex items-center gap-2 md:gap-3">
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#666] hover:bg-[#222] hover:text-[#ccc] transition-colors" title="Về Hồ Sơ Dự Án">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="h-4 w-px bg-[#333]" />
            <h2 className="font-bold text-white text-xs md:text-sm truncate max-w-[120px] sm:max-w-[200px] md:max-w-[400px]">
              {activePlan?.name || 'Đang tải...'}
            </h2>
          </div>
          
          <div className="flex items-center gap-1.5 md:gap-2">
            <button
              onClick={handleFit}
              className="px-2 py-1.5 md:px-3 text-[10px] md:text-xs font-bold text-[#aaa] bg-[#222] hover:bg-[#333] rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <Maximize className="w-3.5 h-3.5 inline-block md:hidden mr-1" />
              <span className="hidden md:inline">FIT VỪA MÀN HÌNH</span>
              <span className="md:hidden">FIT</span>
            </button>
            
            <button
              onClick={onNavigateToReport}
              className="px-3 py-1.5 text-[10px] md:text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>DÀN LỖI</span>
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div
          className="flex-1 overflow-hidden relative select-none touch-none"
          ref={containerRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          style={{ cursor: mode === 'pan' ? (isPanning ? 'grabbing' : 'grab') : 'crosshair' }}
        >
          {!activePlan ? (
            <div className="absolute inset-0 flex items-center justify-center text-[#666] text-sm">
              Chọn bản vẽ để bắt đầu
            </div>
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
                transition: isPanning ? 'none' : 'transform 0.15s ease-out',
              }}
            >
              {/* Floor Plan Page */}
              <div className="relative bg-[#1a1a1a] shadow-lg border border-[#333] rounded-lg overflow-hidden">
                <img
                  ref={imageRef}
                  src={currentCanvasImage}
                  alt="Floor Plan"
                  className={`max-w-none transition-opacity duration-300 ${isRenderingPdf ? 'opacity-40' : 'opacity-100'}`}
                  draggable={false}
                  onLoad={handleFit}
                  onClick={handleImageClick}
                  style={{
                    pointerEvents: mode === 'pan' ? 'none' : 'auto',
                    display: 'block'
                  }}
                />

                {filteredMarkers.map((m, idx) => {
                  const status = getStatus(m);
                  const isActive = selectedMarkerId === m.id;
                  const isDone = status === 'Đã duyệt' || status === 'Đã sửa';
                  const bgColor = isDone ? 'bg-emerald-500' : status === 'Đang sửa' ? 'bg-amber-500' : 'bg-[#2a1114]0';
                  return (
                    <div
                      key={m.id}
                      className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all z-10 ${isActive ? 'scale-125 z-30' : 'hover:scale-110'}`}
                      style={{ left: `${m.x}%`, top: `${m.y}%` }}
                      onClick={(e) => { e.stopPropagation(); onSelectMarker(m.id); }}
                    >
                      {isActive && <div className="absolute -inset-2 rounded-full bg-[#1a1a1a]/40 animate-ping" />}
                      <div className={`w-7 h-7 rounded-full ${bgColor} text-white text-[11px] font-bold flex items-center justify-center shadow-lg border-[1.5px] border-white relative z-10`}>
                        {idx + 1}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Rendering Loader Overlay */}
          {isRenderingPdf && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/30 backdrop-blur-[2px] pointer-events-none z-50">
              <div className="bg-[#111]/90 text-white px-6 py-3 rounded-2xl shadow-2xl flex flex-col items-center gap-2 backdrop-blur-md border border-slate-700/50">
                <div className="flex items-center gap-2.5">
                  <Loader2 className="w-5 h-5 animate-spin text-rose-400" />
                  <span className="text-sm font-semibold">{renderStatus || 'Đang xử lý...'}</span>
                </div>
                {renderStatus.includes('tải PDF') && (
                  <p className="text-[11px] text-[#666] text-center max-w-[220px]">
                    File PDF lớn có thể mất 10–30 giây. Tải 1 lần, các trang sau nhanh hơn.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Pagination */}
          {activePlan && (activePlan.pageCount || 1) > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-[#111]/80 backdrop-blur-md border border-slate-700/50 p-2 rounded-full shadow-2xl z-40 select-none">
              <button 
                onClick={handlePrev} 
                disabled={!hasPrev || isRenderingPdf}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-[#444] text-slate-200 hover:bg-[#2a1114]0 hover:text-white disabled:opacity-30 disabled:hover:bg-[#444] disabled:hover:text-slate-200 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <div className="w-0 h-0 border-y-8 border-y-transparent border-r-[12px] border-r-current mr-1" />
              </button>
              
              <div className="px-4 text-slate-200 font-medium text-[15px] whitespace-nowrap min-w-[100px] text-center">
                Trang {currentPageIndex + 1} / {activePlan.pageCount}
              </div>
              
              <button 
                onClick={handleNext}
                disabled={!hasNext || isRenderingPdf}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-[#444] text-slate-200 hover:bg-[#2a1114]0 hover:text-white disabled:opacity-30 disabled:hover:bg-[#444] disabled:hover:text-slate-200 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <div className="w-0 h-0 border-y-8 border-y-transparent border-l-[12px] border-l-current ml-1" />
              </button>
            </div>
          )}

          {/* Targeting Mode Banner */}
          {mode === 'pin' && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-[#2a1114]0 text-white px-6 py-2 rounded-full shadow-xl font-bold flex items-center gap-2 animate-bounce select-none pointer-events-none z-50">
              <Target className="w-4 h-4" />
              Di chuyển bản đồ vào hồng tâm và chốt vị trí
            </div>
          )}

          {/* Center Targeting Crosshair */}
          {mode === 'pin' && (
            <div className="absolute inset-0 pointer-events-none z-40 flex items-center justify-center">
              <div className="relative flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-2 border-rose-500/50" />
                <div className="absolute w-16 h-px bg-[#2a1114]0/50" />
                <div className="absolute h-16 w-px bg-[#2a1114]0/50" />
                <div className="absolute w-2 h-2 bg-[#2a1114]0 rounded-full" />
              </div>
            </div>
          )}

          {/* Confirm Center Pin Button */}
          {mode === 'pin' && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50">
              <button
                onClick={handleConfirmCenterPin}
                disabled={isRenderingPdf}
                className="bg-rose-600 hover:bg-[#2a1114]0 text-white px-8 py-3 rounded-full font-bold shadow-[0_0_20px_rgba(225,29,72,0.4)] flex items-center gap-2 cursor-pointer transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                <Target className="w-5 h-5" />
                CHỐT PIN TẠI ĐÂY
              </button>
            </div>
          )}

          {/* Floating Actions (Right Bottom) */}
          <div className="absolute bottom-6 right-6 flex flex-col gap-3 z-40">
            {mode === 'pan' && (
              <button
                onClick={() => setMode('pin')}
                className="w-14 h-14 bg-[#2a1114]0 hover:bg-rose-400 text-white rounded-full shadow-xl flex flex-col items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Target className="w-5 h-5 mb-0.5" />
                <span className="text-[9px] font-bold uppercase">Chốt lỗi</span>
              </button>
            )}

            <div className="bg-[#1a1a1a]/90 backdrop-blur-md rounded-2xl shadow-xl flex flex-col overflow-hidden border border-[#333]">
              <button
                onClick={() => handleZoom(1.2)}
                className="w-12 h-12 flex items-center justify-center text-[#ccc] hover:bg-[#222] hover:text-rose-600 transition-colors border-b border-[#333] cursor-pointer"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleZoom(0.8)}
                className="w-12 h-12 flex items-center justify-center text-[#ccc] hover:bg-[#222] hover:text-rose-600 transition-colors cursor-pointer"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
