import { useRef, useState, useEffect, useMemo, ChangeEvent, MouseEvent as ReactMouseEvent, DragEvent, Fragment } from 'react';
import { FloorPlan, MarkerNote, WhiteboardAnnotation, UserRoleProfile, Project } from '../types';
import { 
  Map, Plus, Upload, Maximize2, Minimize2, MousePointer, 
  Square, Circle, ArrowUpRight, Paintbrush, StickyNote, Type, 
  Trash2, Undo2, Redo2, MessageSquare, Check, GripHorizontal, 
  ZoomIn, ZoomOut, Sparkles, RefreshCw, Layers, Pin,
  Triangle, Diamond, Boxes, ChevronRight, Lock, Unlock, Sliders,
  Frame, Send, X, User, Camera, Volume2, Lightbulb, Play, Pause, AlertCircle, Calendar, Edit3,
  Download, Crop, Focus, Cloud, Highlighter, Eraser
} from 'lucide-react';

interface FloorPlanViewerProps {
  floorPlan: FloorPlan | null; // Currently selected floor plan (focused drawing)
  floorPlans: FloorPlan[]; // All floor plans to display together on the shared workspace
  activeFloorPlanId: string | null;
  setActiveFloorPlanId: (id: string | null) => void;
  onUpdateFloorPlan: (plan: FloorPlan) => void; // Moves floor plan cards around in the workspace
  
  markers: MarkerNote[];
  id?: string;
  selectedMarkerId: string | null;
  onSelectMarker: (id: string | null) => void;
  onAddMarker: (x: number, y: number) => void;
  onUploadFloorPlan: (name: string, imageData: string, canvasX?: number, canvasY?: number, width?: number, height?: number) => void;
  
  // Whiteboard Annotations props
  annotations: WhiteboardAnnotation[];
  onAddAnnotation: (annot: WhiteboardAnnotation) => void;
  onUpdateAnnotation: (annot: WhiteboardAnnotation) => void;
  onDeleteAnnotation: (id: string) => void;
  selectedAnnotationId: string | null;
  onSelectAnnotation: (id: string | null) => void;
  
  activeWhiteboardTool: 'select' | 'marker' | 'sticky' | 'text' | 'rect' | 'ellipse' | 'arrow' | 'pen' | 'highlighter' | 'eraser' | 'line' | 'elbow-arrow' | 'block-arrow' | 'rhombus' | 'triangle' | 'diagram' | 'frame' | 'cloud';
  setActiveWhiteboardTool: (tool: 'select' | 'marker' | 'sticky' | 'text' | 'rect' | 'ellipse' | 'arrow' | 'pen' | 'highlighter' | 'eraser' | 'line' | 'elbow-arrow' | 'block-arrow' | 'rhombus' | 'triangle' | 'diagram' | 'frame' | 'cloud') => void;
  activeUserRole: UserRoleProfile;
  currentColor: string;
  setCurrentColor: (color: string) => void;
  
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  activeProjectId?: string | null;
  onDeleteFloorPlan?: (id: string) => void;
  activeProject?: Project | null;
  onUpdateMarker?: (updated: MarkerNote) => void;
  userRolesList?: UserRoleProfile[];
}

export default function FloorPlanViewer({
  floorPlan,
  floorPlans,
  activeFloorPlanId,
  setActiveFloorPlanId,
  onUpdateFloorPlan,
  markers,
  selectedMarkerId,
  onSelectMarker,
  onAddMarker,
  onUploadFloorPlan,
  
  annotations,
  onAddAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  selectedAnnotationId,
  onSelectAnnotation,
  
  activeWhiteboardTool,
  setActiveWhiteboardTool,
  activeUserRole,
  currentColor,
  setCurrentColor,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  activeProjectId,
  onDeleteFloorPlan,
  activeProject,
  onUpdateMarker,
  userRolesList = []
}: FloorPlanViewerProps) {
  const boardId = activeProjectId ? `board-${activeProjectId}` : 'global';
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedAnnotation = annotations.find(a => a.id === selectedAnnotationId) || null;
  const [activePropDropdown, setActivePropDropdown] = useState<'none' | 'color' | 'thickness' | 'dash' | 'opacity' | 'linetype'>('none');

  // Drag over states
  // Drag over states
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const [isWhiteboardEnabled, setIsWhiteboardEnabled] = useState<boolean>(true);
  
  // Group plans for display on Miro board
  const groupedFloorPlans = useMemo(() => {
    const groups: FloorPlan[] = [];
    const seenGroups = new Set<string>();
    
    // We want to ensure that if the activeFloorPlanId is in a group, THAT specific plan is the representative
    const activePlanObj = floorPlans.find(fp => fp.id === activeFloorPlanId);
    
    floorPlans.forEach(fp => {
      // Exclude plans that haven't been explicitly placed on the Miro board yet
      // (They will remain accessible only in the Project Profile or Pin Map until "Added to Miro")
      if (fp.canvasX === undefined || fp.canvasY === undefined) {
        return;
      }

      if (fp.documentGroupId) {
        if (!seenGroups.has(fp.documentGroupId)) {
          seenGroups.add(fp.documentGroupId);
          // If active plan is in this group, use it. Otherwise use the first one we see.
          const isGroupActive = activePlanObj && activePlanObj.documentGroupId === fp.documentGroupId;
          const representativePlan = isGroupActive ? activePlanObj : fp;
          groups.push(representativePlan);
        }
      } else {
        groups.push(fp);
      }
    });
    return groups;
  }, [floorPlans, activeFloorPlanId]);

  const [inPlaceCommentText, setInPlaceCommentText] = useState<string>('');
  const [popoverTab, setPopoverTab] = useState<'info' | 'detail' | 'discuss'>('info');
  const [isPopoverAudioPlaying, setIsPopoverAudioPlaying] = useState<boolean>(false);
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null);

  useEffect(() => {
    setPopoverTab('info');
    setIsPopoverAudioPlaying(false);
  }, [selectedMarkerId]);

  // We set a virtual giant Miro whiteboard dimension: 100,000px x 100,000px simulates an infinite canvas
  const canvasWidth = 100000;
  const canvasHeight = 100000;

  // Zoom & Pan states for the camera
  const [zoomLevel, setZoomLevel] = useState<number>(0.4); // Starts somewhat zoomed out to show the grid workspace
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [isZooming, setIsZooming] = useState<boolean>(false);
  const zoomTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const boardLayerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  // Touch & multi-touch pinch zoom refs
  const activePointersRef = useRef<Map<number, { clientX: number; clientY: number }>>(new Map());
  const pinchStartDistanceRef = useRef<number>(0);
  const pinchStartZoomLevelRef = useRef<number>(0.4);
  const pinchStartDragOffsetRef = useRef<{ x: number; y: number }>({ x: 50, y: 50 });
  const pinchStartMidpointRef = useRef<{ x: number; y: number } | null>(null);
  const pinchStartBoardCoordsRef = useRef<{ x: number; y: number } | null>(null);

  // === PRODUCTION-GRADE GESTURE REFS ===
  // Fix #1: Smooth pinch→pan transition — prevents canvas jump when releasing one finger from pinch
  const pinchJustEndedRef = useRef<boolean>(false);
  // Fix #2: Anti-ghost-click — blocks accidental marker/drawing triggers after pinch-zoom ends
  const lastPinchEndTimeRef = useRef<number>(0);
  // Fix #4: Stable refs for wheel handler to avoid re-creating listener on every zoom frame
  const zoomLevelRef = useRef<number>(0.4);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 50, y: 50 });
  // Fix #5: Momentum/inertia panning — velocity tracking
  const panVelocityRef = useRef<{ vx: number; vy: number }>({ vx: 0, vy: 0 });
  const lastPanTimeRef = useRef<number>(0);
  const lastPanPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const momentumRafRef = useRef<number | null>(null);
  // Fix #6: Double-tap to zoom
  const lastTapTimeRef = useRef<number>(0);
  const lastTapPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  // Track if currently in active pinch gesture
  const isPinchingRef = useRef<boolean>(false);

  // Sync state to refs for stable event handler closures (Fix #4)
  useEffect(() => {
    zoomLevelRef.current = zoomLevel;
    dragOffsetRef.current = dragOffset;
  }, [zoomLevel, dragOffset]);

  // Smooth mouse-wheel zooming centered on user's cursor (Miro-like)
  // Fix #4: Uses refs so listener is created ONCE — no re-creation on every zoom frame
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleNativeWheel = (e: WheelEvent) => {
      // Prevent default page scroll
      e.preventDefault();

      setIsZooming(true);
      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current);
      }
      zoomTimeoutRef.current = setTimeout(() => {
        setIsZooming(false);
      }, 300);

      const currentZoom = zoomLevelRef.current;
      const currentOffset = dragOffsetRef.current;

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Board canvas coordinates directly under cursor
      const boardX = (mouseX - currentOffset.x) / currentZoom;
      const boardY = (mouseY - currentOffset.y) / currentZoom;

      // Precise scaling ratio mimicking professional graphic boards
      const ratio = 1.08;
      let nextZoomLevel;
      if (e.deltaY < 0) {
        // Scroll Up = Zoom In
        nextZoomLevel = Math.min(currentZoom * ratio, 3.5);
      } else {
        // Scroll Down = Zoom Out
        // Allow zooming out extremely far (2%) to see the massive 100k canvas
        nextZoomLevel = Math.max(currentZoom / ratio, 0.02);
      }

      // Fix #12: Snap to 100% when close — professional feel
      if (nextZoomLevel > 0.96 && nextZoomLevel < 1.04) {
        nextZoomLevel = 1.0;
      }

      // New offsets ensuring board coordinates (boardX, boardY) stay stationary under cursor (mouseX, mouseY)
      const nextDragOffsetX = mouseX - boardX * nextZoomLevel;
      const nextDragOffsetY = mouseY - boardY * nextZoomLevel;

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setZoomLevel(nextZoomLevel);
        setDragOffset({ x: nextDragOffsetX, y: nextDragOffsetY });
      });
    };

    // Fix #14: Prevent browser default gestures (pull-to-refresh, back-swipe, pinch-zoom browser level)
    const handleNativeTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };
    const handleNativeTouchMove = (e: TouchEvent) => {
      e.preventDefault();
    };

    container.addEventListener('wheel', handleNativeWheel, { passive: false });
    container.addEventListener('touchstart', handleNativeTouchStart, { passive: false });
    container.addEventListener('touchmove', handleNativeTouchMove, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleNativeWheel);
      container.removeEventListener('touchstart', handleNativeTouchStart);
      container.removeEventListener('touchmove', handleNativeTouchMove);
      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current);
      }
    };
  }, []); // Fix #4: Empty deps — reads from refs, created once

  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });


  // Presentation Mode design states
  const [isPresentationMode, setIsPresentationMode] = useState<boolean>(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [isShapesFlyoutOpen, setIsShapesFlyoutOpen] = useState<boolean>(false);
  const [isFrameFlyoutOpen, setIsFrameFlyoutOpen] = useState<boolean>(false);
  const [isPenFlyoutOpen, setIsPenFlyoutOpen] = useState<boolean>(false);
  const [penStrokeWidth, setPenStrokeWidth] = useState<number>(5);
  const [editingFrameId, setEditingFrameId] = useState<string | null>(null);

  // Filter markers for present tour
  const activePlanMarkers = markers
    .filter(m => !activeFloorPlanId || m.floorPlanId === activeFloorPlanId)
    .sort((a, b) => a.createdAt - b.createdAt);

  const focusOnMarker = (marker: MarkerNote) => {
    const parentPlanIndex = groupedFloorPlans.findIndex(p => p.id === marker.floorPlanId);
    if (parentPlanIndex === -1) return;
    const plan = groupedFloorPlans[parentPlanIndex];
    const containerW = containerRef.current?.clientWidth || 1000;
    const containerH = containerRef.current?.clientHeight || 650;
    
    const pos = computePlanPosition(plan, parentPlanIndex);
    const fw = getFrameWidth(plan);
    const planHeight = (plan.height / plan.width) * fw;
    
    // Tọa độ marker trên canvas khổng lồ:
    const markerX = pos.x + (marker.x / 100) * fw;
    const markerY = pos.y + (marker.y / 100) * planHeight;
    
    const targetZoom = 1.0; 
    setZoomLevel(targetZoom);
    setDragOffset({
      x: containerW / 2 - markerX * targetZoom,
      y: containerH / 2 - markerY * targetZoom
    });
  };

  useEffect(() => {
    if (isPresentationMode && activePlanMarkers.length > 0) {
      const curMarker = activePlanMarkers[currentSlideIndex];
      if (curMarker) {
        focusOnMarker(curMarker);
      }
    }
  }, [isPresentationMode, currentSlideIndex, activeFloorPlanId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAutoPlaying && isPresentationMode && activePlanMarkers.length > 0) {
      interval = setInterval(() => {
        setCurrentSlideIndex((prevIdx) => {
          if (prevIdx < activePlanMarkers.length - 1) {
            return prevIdx + 1;
          } else {
            setIsAutoPlaying(false);
            return prevIdx;
          }
        });
      }, 10000);
    }
    return () => clearInterval(interval);
  }, [isAutoPlaying, isPresentationMode, activePlanMarkers.length]);

  // Global hotkeys to control Miro tools
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside typing elements
      const activeEl = document.activeElement;
      if (activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.getAttribute('contenteditable') === 'true'
      )) {
        return;
      }

      // Hotkey Delete/Backspace for active whiteboard annotation or floor plan
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedAnnotationId && selectedAnnotation && !selectedAnnotation.isLocked) {
          onDeleteAnnotation(selectedAnnotationId);
          onSelectAnnotation(null);
          e.preventDefault();
          return;
        }
        
        // Delete focused floor plan if no annotation/marker is selected
        if (!selectedAnnotationId && !selectedMarkerId && activeFloorPlanId && activeFloorPlanId !== 'demo-floor-plan' && onDeleteFloorPlan) {
          onDeleteFloorPlan(activeFloorPlanId);
          e.preventDefault();
          return;
        }
      }

      const key = e.key.toLowerCase();
      
      // Lock / Unlock: Ctrl + Shift + L
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && key === 'l') {
        if (selectedAnnotationId && selectedAnnotation) {
          onUpdateAnnotation({ ...selectedAnnotation, isLocked: !selectedAnnotation.isLocked });
          e.preventDefault();
        } else if (activeFloorPlanId && activeFloorPlanId !== 'demo-floor-plan') {
          const plan = floorPlans.find(p => p.id === activeFloorPlanId);
          if (plan) onUpdateFloorPlan({ ...plan, isLocked: !plan.isLocked });
          e.preventDefault();
        }
        return;
      }
      
      // Duplicate: Ctrl + D
      if ((e.ctrlKey || e.metaKey) && key === 'd') {
        if (selectedAnnotationId && selectedAnnotation) {
          onAddAnnotation({ ...selectedAnnotation, id: `annot-${Date.now()}`, x: selectedAnnotation.x + 2, y: selectedAnnotation.y + 2, createdAt: Date.now() });
          e.preventDefault();
        }
        return;
      }
      
      // Copy: Ctrl + C
      if ((e.ctrlKey || e.metaKey) && key === 'c') {
        if (selectedAnnotationId && selectedAnnotation) {
          navigator.clipboard.writeText(JSON.stringify(selectedAnnotation));
          // alert visually could be added here
        }
        return; // don't prevent default, let them copy text if they have it selected
      }
      switch (key) {
        case 'v':
          setActiveWhiteboardTool('select');
          setIsShapesFlyoutOpen(false);
          break;
        case 'c':
          setActiveWhiteboardTool('marker');
          setIsShapesFlyoutOpen(false);
          break;
        case 'n':
          setActiveWhiteboardTool('sticky');
          setIsShapesFlyoutOpen(false);
          break;
        case 't':
          setActiveWhiteboardTool('text');
          setIsShapesFlyoutOpen(false);
          break;
        case 'r':
          setActiveWhiteboardTool('rect');
          setIsShapesFlyoutOpen(false);
          break;
        case 'o':
          setActiveWhiteboardTool('ellipse');
          setIsShapesFlyoutOpen(false);
          break;
        case 'l':
          setActiveWhiteboardTool('line');
          setIsShapesFlyoutOpen(false);
          break;
        case 'a':
          setActiveWhiteboardTool('arrow');
          setIsShapesFlyoutOpen(false);
          break;
        case 'p':
          setActiveWhiteboardTool('pen');
          setIsShapesFlyoutOpen(false);
          break;
        case 's':
          setIsShapesFlyoutOpen(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [setActiveWhiteboardTool, selectedAnnotationId, selectedAnnotation, onDeleteAnnotation, onSelectAnnotation]);

  const [presentationAudioUrl, setPresentationAudioUrl] = useState<string | null>(null);
  const [isPlayingPresentationAudio, setIsPlayingPresentationAudio] = useState<boolean>(false);

  const currentSlideMarker = isPresentationMode ? activePlanMarkers[currentSlideIndex] : null;

  useEffect(() => {
    if (currentSlideMarker && currentSlideMarker.audioData) {
      try {
        const base64Content = currentSlideMarker.audioData.split(',')[1] || currentSlideMarker.audioData;
        const byteCharacters = atob(base64Content);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setPresentationAudioUrl(url);
        setIsPlayingPresentationAudio(false);
        return () => {
          URL.revokeObjectURL(url);
        };
      } catch (err) {
        console.error("Lỗi slideshow player parsing:", err);
        setPresentationAudioUrl(null);
      }
    } else {
      setPresentationAudioUrl(null);
      setIsPlayingPresentationAudio(false);
    }
  }, [currentSlideIndex, isPresentationMode, currentSlideMarker]);

  const togglePresentationAudio = () => {
    const player = document.getElementById('presentation-slideshow-player') as HTMLAudioElement;
    if (!player) return;
    if (isPlayingPresentationAudio) {
      player.pause();
      setIsPlayingPresentationAudio(false);
    } else {
      player.play().catch(e => console.error("Error setting presentation speaker:", e));
      setIsPlayingPresentationAudio(true);
    }
  };

  // Layout calculations for floor plan drawings on the board:
  // Each drawing renders inside an elegant frame with base width = 1200px
  const baseFrameWidth = 1200;

  // Floor Plan resizing state
  const [resizingPlanId, setResizingPlanId] = useState<string | null>(null);
  const [resizeStartInfo, setResizeStartInfo] = useState<{ startX: number; startY: number; startWidth: number; startHeight: number; startPlanX: number; startPlanY: number; direction: string; planId: string } | null>(null);

  // Get effective render width for a plan (with scale)
  const getFrameWidth = (plan: FloorPlan) => baseFrameWidth * (plan.canvasScale || 1);

  // Compute position on the whiteboard board for each blueprint frame
  const computePlanPosition = (plan: FloorPlan, index: number) => {
    // If the plan has user-defined coordinates, use them!
    if (plan.canvasX !== undefined && plan.canvasY !== undefined) {
      return { x: plan.canvasX, y: plan.canvasY };
    }
    // Otherwise fallback to grid grid layout
    const columns = 2;
    const row = Math.floor(index / columns);
    const column = index % columns;
    const startX = 300 + column * 1650;
    const startY = 250 + row * 1150;
    return { x: startX, y: startY };
  };

  // Helper properties to map between relative % inside and absolute board pixels
  const getLayoutForPlan = (planId: string) => {
    if (planId === 'global' || planId.startsWith('board-')) {
      return { x: 0, y: 0, w: canvasWidth, h: canvasHeight, id: planId };
    }
    const idx = groupedFloorPlans.findIndex(p => p.id === planId);
    if (idx !== -1) {
      const p = groupedFloorPlans[idx];
      const pos = computePlanPosition(p, idx);
      const fw = getFrameWidth(p);
      const h = (p.height / p.width) * fw;
      return { x: pos.x, y: pos.y, w: fw, h, id: p.id };
    }
    // Fallback if plan belongs to a group but is not the representative
    const targetPlan = floorPlans.find(p => p.id === planId);
    if (targetPlan && targetPlan.documentGroupId) {
       const repIdx = groupedFloorPlans.findIndex(p => p.documentGroupId === targetPlan.documentGroupId);
       if (repIdx !== -1) {
          const p = groupedFloorPlans[repIdx];
          const pos = computePlanPosition(p, repIdx);
          const fw = getFrameWidth(p);
          const h = (p.height / p.width) * fw;
          return { x: pos.x, y: pos.y, w: fw, h, id: targetPlan.id };
       }
    }
    // Fallback if none matches (safeguard)
    if (groupedFloorPlans.length > 0) {
      const p = groupedFloorPlans[0];
      const pos = computePlanPosition(p, 0);
      const fw = getFrameWidth(p);
      const h = (p.height / p.width) * fw;
      return { x: pos.x, y: pos.y, w: fw, h, id: p.id };
    }
    return { x: 0, y: 0, w: 1000, h: 700, id: 'unknown' };
  };

  // Auto-pan camera to selected marker from external list clicks
  useEffect(() => {
    if (selectedMarkerId) {
      const targetMarker = markers.find(m => m.id === selectedMarkerId);
      if (targetMarker && containerRef.current) {
        const layout = getLayoutForPlan(targetMarker.floorPlanId);
        const absoluteX = layout.x + (targetMarker.x / 100) * layout.w;
        const absoluteY = layout.y + (targetMarker.y / 100) * layout.h;
        
        const targetZoom = 1.2; // Nice readable zoom level
        const rect = containerRef.current.getBoundingClientRect();
        
        const targetOffsetX = (rect.width / 2) - (absoluteX * targetZoom);
        const targetOffsetY = (rect.height / 2) - (absoluteY * targetZoom);
        
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
          setZoomLevel(targetZoom);
          setDragOffset({ x: targetOffsetX, y: targetOffsetY });
        });
      }
    }
  }, [selectedMarkerId]);

  // Dragging entire floor plan frames around on the Miro board
  const [draggingPlanId, setDraggingPlanId] = useState<string | null>(null);
  const [planDragOffset, setPlanDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [tempPlanState, setTempPlanState] = useState<{ id: string, x?: number, y?: number, scale?: number } | null>(null);

  // Drawing relative states
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const isDrawingRef = useRef(false);
  const [drawParentId, setDrawParentId] = useState<string>(boardId);
  const [drawStartPct, setDrawStartPct] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [tempDrawingPoints, setTempDrawingPoints] = useState<string>('');
  const drawingPointsRef = useRef<string[]>([]);
  const [tempAnnot, _setTempAnnot] = useState<Partial<WhiteboardAnnotation> | null>(null);
  const tempAnnotRef = useRef<Partial<WhiteboardAnnotation> | null>(null);
  const setTempAnnot = (val: Partial<WhiteboardAnnotation> | null | ((prev: Partial<WhiteboardAnnotation> | null) => Partial<WhiteboardAnnotation> | null)) => {
    if (typeof val === 'function') {
      _setTempAnnot(prev => {
        const next = val(prev);
        tempAnnotRef.current = next;
        return next;
      });
    } else {
      tempAnnotRef.current = val;
      _setTempAnnot(val);
    }
  };

  // Ref for onAddAnnotation to avoid stale closures in useEffect
  const onAddAnnotationRef = useRef(onAddAnnotation);
  onAddAnnotationRef.current = onAddAnnotation;
  
  // AUTO-SAVE: When user switches tools while drawing, force-save the in-progress drawing
  useEffect(() => {
    if (isDrawingRef.current && tempAnnotRef.current) {
      const savedType = tempAnnotRef.current.type;
      const hasMerit = savedType === 'pen' || savedType === 'highlighter'
        ? drawingPointsRef.current.length > 1
        : (tempAnnotRef.current.width || 0) > 0.05 && (tempAnnotRef.current.height || 0) > 0.05;
      
      if (hasMerit) {
        const annotToSave = { ...tempAnnotRef.current };
        if (savedType === 'pen' || savedType === 'highlighter') {
          annotToSave.points = drawingPointsRef.current.join(' ');
        }
        onAddAnnotationRef.current(annotToSave as WhiteboardAnnotation);
      }
      
      // Clean up drawing state
      isDrawingRef.current = false;
      setIsDrawing(false);
      setTempAnnot(null);
      setTempDrawingPoints('');
      drawingPointsRef.current = [];
      setDrawingConnectionFrom(null);
    }
  }, [activeWhiteboardTool]);

  // Dragging annotations relative states
  const [draggingAnnotId, setDraggingAnnotId] = useState<string | null>(null);
  const [annotDragOffset, setAnnotDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [tempDragAnnots, setTempDragAnnots] = useState<Record<string, Partial<WhiteboardAnnotation>>>({});
  const [dragGroupCache, setDragGroupCache] = useState<string[]>([]);
  const [alignmentGuides, setAlignmentGuides] = useState<{ x?: number, y?: number }>({});
  
  const [resizingAnnotId, setResizingAnnotId] = useState<string | null>(null);
  const [annotResizeStartInfo, setAnnotResizeStartInfo] = useState<{ startX: number; startY: number; startWidth: number; startHeight: number; startAnnotX: number; startAnnotY: number; direction: string; annotId: string } | null>(null);
  const [staticAlignEdges, setStaticAlignEdges] = useState<{ x: number[], y: number[] }>({ x: [], y: [] });
  const [drawingConnectionFrom, setDrawingConnectionFrom] = useState<{ annotId: string, direction: 'left' | 'right' | 'top' | 'bottom' } | null>(null);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, visible: boolean, targetId: string | null, targetType: 'plan' | 'annot' | null }>({ x: 0, y: 0, visible: false, targetId: null, targetType: null });

  // Miro aesthetics Palette
  const colors = [
    { name: 'Red', hex: '#f43f5e' },
    { name: 'Orange', hex: '#f97316' },
    { name: 'Yellow', hex: '#facc15' },
    { name: 'Green', hex: '#10b981' },
    { name: 'Blue', hex: '#3b82f6' },
    { name: 'Purple', hex: '#8b5cf6' },
    { name: 'Black', hex: '#1e293b' }
  ];

  // Transition controls: when are we dragging/panning versus moving camera?
  // We disable CSS transformation transition during actions to avoid "lag" feel
  const isInteracting = isPanning || isDrawing || draggingAnnotId || draggingPlanId || isZooming || resizingPlanId;

  // Zoom / Pan camera centering now only triggers on explicit UI clicks, NOT automatically on selection

  const focusOnPlan = (plan: FloorPlan, index: number, targetZoom = 0.5) => {
    const containerW = containerRef.current?.clientWidth || 1000;
    const containerH = containerRef.current?.clientHeight || 650;
    const pos = computePlanPosition(plan, index);
    const fw = getFrameWidth(plan);
    const planHeight = (plan.height / plan.width) * fw;
    
    // Calculate targeted offsets so center of the drawing frame is in middle of viewport
    const cX = pos.x + fw / 2;
    const cY = pos.y + planHeight / 2;
    
    setZoomLevel(targetZoom);
    setDragOffset({
      x: containerW / 2 - cX * targetZoom,
      y: containerH / 2 - cY * targetZoom
    });
  };

  // Store real container dimensions via ResizeObserver
  const containerSizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        const wasZero = containerSizeRef.current.w === 0 || containerSizeRef.current.h === 0;
        containerSizeRef.current = { w, h };
        if (wasZero && w > 100 && h > 100) {
          focusFitAll();
        }
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [floorPlans.length > 0]); // Re-attach when floor plans appear

  // Compute the ideal zoom and offset to center and fit all floor plans
  const computeFitAllViewport = () => {
    if (groupedFloorPlans.length === 0) return null;
    
    // Most reliable measurement: getBoundingClientRect
    const container = containerRef.current;
    let containerW = 0, containerH = 0;
    
    if (container) {
      const rect = container.getBoundingClientRect();
      containerW = rect.width;
      containerH = rect.height;
    }
    
    // Fallback if still 0
    if (containerW < 50) containerW = window.innerWidth - 350;
    if (containerH < 50) containerH = window.innerHeight - 160;
    
    // Find enclosing bounding box around all plan frames
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    groupedFloorPlans.forEach((plan, idx) => {
      const pos = computePlanPosition(plan, idx);
      const fw = getFrameWidth(plan);
      const h = (plan.height / plan.width) * fw;
      minX = Math.min(minX, pos.x);
      minY = Math.min(minY, pos.y);
      maxX = Math.max(maxX, pos.x + fw);
      maxY = Math.max(maxY, pos.y + h);
    });
    
    const boundingW = maxX - minX;
    const boundingH = maxY - minY;
    if (boundingW <= 0 || boundingH <= 0) return null;
    
    // 12% padding for breathing room
    const totalW = boundingW * 1.24;
    const totalH = boundingH * 1.24;
    
    const fitZoom = Math.max(0.02, Math.min(containerW / totalW, containerH / totalH, 2.0));
    const centerX = minX + boundingW / 2;
    const centerY = minY + boundingH / 2;
    
    return {
      zoom: fitZoom,
      offsetX: Math.round(containerW / 2 - centerX * fitZoom),
      offsetY: Math.round(containerH / 2 - centerY * fitZoom)
    };
  };

  const focusFitAll = () => {
    const result = computeFitAllViewport();
    if (!result) return;
    setZoomLevel(result.zoom);
    setDragOffset({ x: result.offsetX, y: result.offsetY });
  };

  // Auto-fit viewport to center and maximize all floor plans on load / project switch
  const hasFittedRef = useRef<string>('');
  useEffect(() => {
    if (groupedFloorPlans.length === 0) return;
    const planKey = groupedFloorPlans.map(p => p.id).sort().join(',') + '|' + (activeProjectId || '');
    if (hasFittedRef.current === planKey) return;
    hasFittedRef.current = planKey;
    
    // Wait for container to have real dimensions, then fit
    const timer = setTimeout(() => {
      requestAnimationFrame(() => {
        focusFitAll();
        // Second attempt 400ms later in case first ran too early
        setTimeout(() => requestAnimationFrame(() => focusFitAll()), 400);
      });
    }, 150);
    return () => clearTimeout(timer);
  }, [floorPlans, activeProjectId]);

  // Compress image to reduce memory and storage: max 1600px, JPEG quality 0.7
  function compressImage(dataUrl: string, maxDim = 1600, quality = 0.7): Promise<{ data: string; w: number; h: number }> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let w = img.naturalWidth || 800;
        let h = img.naturalHeight || 600;
        
        // Only compress if image is larger than maxDim or is base64 (not external URL)
        if ((w > maxDim || h > maxDim) && dataUrl.startsWith('data:')) {
          const scale = Math.min(maxDim / w, maxDim / h);
          w = Math.round(w * scale);
          h = Math.round(h * scale);
          
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, w, h);
            const compressed = canvas.toDataURL('image/jpeg', quality);
            resolve({ data: compressed, w, h });
            return;
          }
        }
        resolve({ data: dataUrl, w, h });
      };
      img.onerror = () => resolve({ data: dataUrl, w: 800, h: 600 });
      img.crossOrigin = 'anonymous';
      img.src = dataUrl;
    });
  }

  // Extracts dimensions from image, compresses it, and triggers onUploadFloorPlan
  function extractImageSizeAndUpload(name: string, dataUrl: string, canvasX?: number, canvasY?: number) {
    compressImage(dataUrl).then(({ data, w, h }) => {
      onUploadFloorPlan(name, data, canvasX, canvasY, w, h);
    });
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        extractImageSizeAndUpload(file.name.replace(/\.[^/.]+$/, ""), result);
      };
      reader.readAsDataURL(file);
    });
    // Reset input so same files can be selected again
    e.target.value = '';
  }

  // Handle dropping general Pinterest links or PC image files (supports MULTI-FILE drop)
  function handleImageDrop(e: DragEvent<HTMLDivElement>, coords: { x: number; y: number }) {
    e.preventDefault();
    
    // 1. Dropping PC local explorer image files (support MULTIPLE at once)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      let files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      
      // If dragged from a browser or rich text app (e.g. Word), the dataTransfer might contain multiple MIME format representations of the SAME single image.
      // We check if HTML or URL is present to identify a rich drag, and restrict to the first file to prevent duplicating the image on the board.
      if ((e.dataTransfer.getData('text/html') || e.dataTransfer.getData('URL')) && files.length > 1) {
        files = [files[0]];
      }

      if (files.length === 0) {
        alert('Vui lòng kéo tệp có định dạng hình ảnh (.jpg, .png, .webp, .svg...)!');
        return;
      }

      // Grid layout: place images in a 2-column grid with 1400px spacing
      const colSpacing = 1400;
      const rowSpacing = 1000;
      const cols = 2;
      
      files.forEach((file, index) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          const col = index % cols;
          const row = Math.floor(index / cols);
          const offsetX = coords.x + col * colSpacing;
          const offsetY = coords.y + row * rowSpacing;
          extractImageSizeAndUpload(
            file.name.replace(/\.[^/.]+$/, ""), 
            result, 
            offsetX, 
            offsetY
          );
        };
        reader.readAsDataURL(file);
      });
      return;
    }

    // 2. Dropping images from Pinterest / internet websites / browser tabs
    const urlList = e.dataTransfer.getData('text/uri-list');
    const imageUrl = e.dataTransfer.getData('URL');
    const htmlData = e.dataTransfer.getData('text/html');
    const textData = e.dataTransfer.getData('text/plain');

    let detectedUrl = '';
    
    // Try multiple extraction methods
    // Method A: direct image URL
    if (imageUrl && /\.(jpg|jpeg|png|gif|webp|svg|bmp|avif)/i.test(imageUrl)) {
      detectedUrl = imageUrl;
    }
    // Method B: uri-list
    if (!detectedUrl && urlList && /\.(jpg|jpeg|png|gif|webp|svg|bmp|avif)/i.test(urlList)) {
      detectedUrl = urlList;
    }
    // Method C: extract from HTML <img> tags (handles src, data-src, srcset)
    if (!detectedUrl && htmlData) {
      // Try src attribute first
      const srcMatch = htmlData.match(/src=["']([^"']+\.(jpg|jpeg|png|gif|webp|svg|bmp|avif)[^"']*)/i);
      if (srcMatch) {
        detectedUrl = srcMatch[1];
      }
      // Try data-src
      if (!detectedUrl) {
        const dataSrcMatch = htmlData.match(/data-src=["']([^"']+)/i);
        if (dataSrcMatch) detectedUrl = dataSrcMatch[1];
      }
      // Last resort: any src attribute
      if (!detectedUrl) {
        const anySrcMatch = htmlData.match(/src=["']([^"']+)/i);
        if (anySrcMatch && !anySrcMatch[1].startsWith('data:text')) detectedUrl = anySrcMatch[1];
      }
    }
    // Method D: plain URL from text
    if (!detectedUrl && imageUrl) {
      detectedUrl = imageUrl;
    }
    if (!detectedUrl && textData && (textData.startsWith('http://') || textData.startsWith('https://'))) {
      detectedUrl = textData;
    }

    if (detectedUrl) {
      const name = "Ảnh Tham Khảo " + new Date().toLocaleTimeString('vi-VN');
      
      // Try to fetch as blob and convert to base64 (avoids CORS at render time)
      fetch(detectedUrl, { mode: 'cors' })
        .then(res => {
          if (!res.ok) throw new Error('fetch failed');
          return res.blob();
        })
        .then(blob => {
          const reader = new FileReader();
          reader.onloadend = () => {
            extractImageSizeAndUpload(name, reader.result as string, coords.x, coords.y);
          };
          reader.readAsDataURL(blob);
        })
        .catch(() => {
          // CORS blocked: use URL directly (still works for many images)
          extractImageSizeAndUpload(name, detectedUrl, coords.x, coords.y);
        });
    } else {
      alert('Không phát hiện thấy hình ảnh hợp lệ. Bạn hãy tải ảnh về máy rồi kéo từ PC thả vào vùng làm việc!');
    }
  }

  // Map mouse coordinate to Canvas absolute pixel coordinate on the (0-7000, 0-4500) board
  function getCanvasCoords(clientX: number, clientY: number): { x: number; y: number } {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    
    // Standard reverse transformation math aligned with left-top transform origin
    const boardX = (clientX - rect.left - dragOffset.x) / zoomLevel;
    const boardY = (clientY - rect.top - dragOffset.y) / zoomLevel;
    
    return {
      x: boardX,
      y: boardY
    };
  }

  // Detect which drawing frame is beneath the coordinate
  function detectPlanUnderCoords(x: number, y: number) {
    for (let i = 0; i < groupedFloorPlans.length; i++) {
      const plan = groupedFloorPlans[i];
      const pos = computePlanPosition(plan, i);
      const fw = getFrameWidth(plan);
      const h = (plan.height / plan.width) * fw;
      
      if (x >= pos.x && x <= pos.x + fw && y >= pos.y && y <= pos.y + h) {
        return { plan, layout: { x: pos.x, y: pos.y, w: fw, h } };
      }
    }
    return null;
  }

  // Stage Mouse Downs
  function handleStageMouseDown(e: React.PointerEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement;

    // GUARD: Ignore clicks on toolbar, UI overlays, and marker pins
    if (target.closest('.no-pan-trigger') || target.closest('.marker-pin-button') || target.closest('.whiteboard-element')) {
      return;
    }

    // Add pointer to active pointers map
    if ('pointerId' in e) {
      activePointersRef.current.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });
    }

    // Fix #5: Cancel any ongoing momentum animation on new touch
    if (momentumRafRef.current) {
      cancelAnimationFrame(momentumRafRef.current);
      momentumRafRef.current = null;
    }
    panVelocityRef.current = { vx: 0, vy: 0 };

    // Capture pointer for reliable mobile drawing (only for drawing tools, not text/sticky/marker)
    const needsCapture = !['select', 'text', 'sticky', 'marker'].includes(activeWhiteboardTool);
    if (needsCapture && 'pointerId' in e) {
      try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch(_) {}
    }

    if (isShapesFlyoutOpen) setIsShapesFlyoutOpen(false);
    if (isFrameFlyoutOpen) setIsFrameFlyoutOpen(false);
    if (isPenFlyoutOpen) setIsPenFlyoutOpen(false);

    // Fix #2: Anti-ghost-click — block ALL non-pan actions for 350ms after pinch zoom ends
    const timeSincePinch = Date.now() - lastPinchEndTimeRef.current;
    const isGhostClick = timeSincePinch < 350;

    // Fix #6: Double-tap to zoom detection (only in select mode, only single pointer)
    if (activeWhiteboardTool === 'select' && activePointersRef.current.size === 1 && !isGhostClick) {
      const now = Date.now();
      const timeSinceLastTap = now - lastTapTimeRef.current;
      const distFromLastTap = Math.hypot(
        e.clientX - lastTapPosRef.current.x,
        e.clientY - lastTapPosRef.current.y
      );
      
      if (timeSinceLastTap < 300 && distFromLastTap < 30) {
        // DOUBLE TAP detected — toggle zoom between 1.0 and current
        lastTapTimeRef.current = 0; // Reset to prevent triple-tap
        
        const container = containerRef.current;
        if (container) {
          const rect = container.getBoundingClientRect();
          const tapX = e.clientX - rect.left;
          const tapY = e.clientY - rect.top;
          const boardX = (tapX - dragOffset.x) / zoomLevel;
          const boardY = (tapY - dragOffset.y) / zoomLevel;
          
          // Toggle: if zoomed in (>0.8), zoom out to fit. If zoomed out, zoom to 1.0
          const targetZoom = zoomLevel > 0.8 ? 0.3 : 1.0;
          const nextOffsetX = tapX - boardX * targetZoom;
          const nextOffsetY = tapY - boardY * targetZoom;
          
          setZoomLevel(targetZoom);
          setDragOffset({ x: nextOffsetX, y: nextOffsetY });
        }
        return; // Don't proceed with normal pointerdown logic
      }
      
      lastTapTimeRef.current = now;
      lastTapPosRef.current = { x: e.clientX, y: e.clientY };
    }

    // If Select, or holding middle mouse/Space button, pan around
    if (activeWhiteboardTool === 'select' || e.button === 1) {
      const target = e.target as HTMLElement;
      if (target.closest('.whiteboard-element') || target.closest('.no-pan-trigger')) return;

      if (activePointersRef.current.size === 1) {
        // Fix #1: If pinch just ended, don't re-init panStart from old coords.
        // Instead mark as "needs re-init" so handleStageMouseMove will do it from current position.
        if (pinchJustEndedRef.current) {
          pinchJustEndedRef.current = false;
          // Re-init panStart from THIS pointer's current position
          setPanStart({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
        } else {
          setPanStart({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
        }
        setIsPanning(true);
        // Fix #5: Init velocity tracking
        lastPanTimeRef.current = performance.now();
        lastPanPosRef.current = { x: e.clientX, y: e.clientY };
      } else if (activePointersRef.current.size === 2) {
        setIsPanning(false);
        isPinchingRef.current = true;
        const pointers = Array.from(activePointersRef.current.values());
        const dx = pointers[0].clientX - pointers[1].clientX;
        const dy = pointers[0].clientY - pointers[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Fix #3: Ignore pinch if fingers are too close (< 30px) — prevents extreme zoom ratios
        if (distance < 30) {
          pinchStartDistanceRef.current = 0;
          return;
        }
        
        pinchStartDistanceRef.current = distance;
        pinchStartZoomLevelRef.current = zoomLevel;
        pinchStartDragOffsetRef.current = { ...dragOffset };
        
        const midX = (pointers[0].clientX + pointers[1].clientX) / 2;
        const midY = (pointers[0].clientY + pointers[1].clientY) / 2;
        pinchStartMidpointRef.current = { x: midX, y: midY };
        
        const container = containerRef.current;
        if (container) {
          const rect = container.getBoundingClientRect();
          const containerMidX = midX - rect.left;
          const containerMidY = midY - rect.top;
          pinchStartBoardCoordsRef.current = {
            x: (containerMidX - dragOffset.x) / zoomLevel,
            y: (containerMidY - dragOffset.y) / zoomLevel
          };
        }
      }
      return;
    }

    // Ignore multi-touch for drawing tools
    if (activePointersRef.current.size > 1) {
      return;
    }

    // Fix #2: Anti-ghost-click guard — block drawing/marker/eraser actions if pinch just ended
    if (isGhostClick) {
      return;
    }

    const { x: boardX, y: boardY } = getCanvasCoords(e.clientX, e.clientY);
    
    // Clear sidebar highlights
    onSelectMarker(null);
    onSelectAnnotation(null);

    // Eraser tool
    if (activeWhiteboardTool === 'eraser') {
      const match = detectPlanUnderCoords(boardX, boardY);
      if (match) {
        setIsDrawing(true);
        isDrawingRef.current = true;
        setDrawParentId(match.plan.id);
        setTempAnnot(null);
        eraseAtCoords(boardX, boardY);
      }
      return;
    }

    // Pinpointing camera photo faults
    if (activeWhiteboardTool === 'marker') {
      const match = detectPlanUnderCoords(boardX, boardY);
      if (match) {
        // Map back to percent coordinates of that floor plan
        const pctX = ((boardX - match.layout.x) / match.layout.w) * 100;
        const pctY = ((boardY - match.layout.y) / match.layout.h) * 100;
        
        // Auto set active drawing inside parent App scope so selected detail panel responds correctly!
        setActiveFloorPlanId(match.plan.id);
        
        // Drop marker
        onAddMarker(pctX, pctY);
      } else {
        // Alert that markers need an architect blueprint to cling to
        alert('Vui lòng ghim lỗi 📷 trực tiếp lên mặt bằng bản vẽ thiết kế!');
      }
      return;
    }

    // Creating post-it / stickies or texts anywhere!
    if (activeWhiteboardTool === 'sticky' || activeWhiteboardTool === 'text') {
      e.stopPropagation();
      e.preventDefault();
      
      const match = detectPlanUnderCoords(boardX, boardY);
      const parentId = match ? match.plan.id : boardId;
      const layout = getLayoutForPlan(parentId);
      
      // Calculate percentages relative to parent frame
      const pctX = ((boardX - layout.x) / layout.w) * 100;
      const pctY = ((boardY - layout.y) / layout.h) * 100;
      const cleanText = activeWhiteboardTool === 'sticky' ? 'Ghi chú giấy nhớ...' : 'Gõ văn bản tự do...';
      
      const isGlobal = parentId === 'global' || parentId.startsWith('board-');
      // Default sticky is 150x150 px. Default text is 200x50 px.
      // If global (w=100000, h=100000), 150px is 0.15%
      const stickyW = isGlobal ? 0.15 : 12;
      const stickyH = isGlobal ? 0.15 : 10;
      const textW = isGlobal ? 0.2 : 16;
      const textH = isGlobal ? 0.05 : 4;
      
      const id = `annot-${Date.now()}`;
      onAddAnnotation({
        id,
        floorPlanId: parentId,
        type: activeWhiteboardTool,
        x: pctX,
        y: pctY,
        width: activeWhiteboardTool === 'sticky' ? stickyW : textW,
        height: activeWhiteboardTool === 'sticky' ? stickyH : textH,
        color: currentColor,
        content: cleanText,
        createdAt: Date.now(),
        userName: activeUserRole.name,
        comments: []
      });
      
      setActiveWhiteboardTool('select');
      onSelectAnnotation(id);
      return;
    }

    // Draw Vector geometries (Rects, Ellipses, Arrows Connecting panels, Freehand Pen)
    const match = detectPlanUnderCoords(boardX, boardY);
    const parentId = match ? match.plan.id : boardId;
    const layout = getLayoutForPlan(parentId);
    
    const pctX = ((boardX - layout.x) / layout.w) * 100;
    const pctY = ((boardY - layout.y) / layout.h) * 100;

    setIsDrawing(true);
    isDrawingRef.current = true;
    setDrawParentId(parentId);
    setDrawStartPct({ x: pctX, y: pctY });

    const id = `annot-${Date.now()}`;
    if (activeWhiteboardTool === 'pen' || activeWhiteboardTool === 'highlighter') {
      // Free pen tracking
      const nextPoint = `${pctX * 10},${pctY * 10}`;
      drawingPointsRef.current = [nextPoint];
      setTempDrawingPoints(nextPoint);
      setTempAnnot({
        id,
        floorPlanId: parentId,
        type: activeWhiteboardTool,
        x: pctX,
        y: pctY,
        width: 1,
        height: 1,
        color: currentColor,
        content: '',
        points: nextPoint,
        createdAt: Date.now(),
        userName: activeUserRole.name,
        comments: [],
        strokeWidth: penStrokeWidth
      });
    } else {
      // Boxes, Circles, Connecting Connector Lines
      setTempAnnot({
        id,
        floorPlanId: parentId,
        type: activeWhiteboardTool,
        x: pctX,
        y: pctY,
        endX: pctX,
        endY: pctY,
        width: 1,
        height: 1,
        color: currentColor,
        content: activeWhiteboardTool === 'frame' ? 'Khung thiết kế' : '',
        createdAt: Date.now(),
        userName: activeUserRole.name,
        comments: []
      });
    }
  }

  function eraseAtCoords(boardX: number, boardY: number) {
    const ERASE_RADIUS = 20 / zoomLevel; 
    const toDelete: string[] = [];
    annotations.forEach(a => {
      if (a.isLocked) return;
      const layout = getLayoutForPlan(a.floorPlanId);
      const ax = layout.x + (a.x / 100) * layout.w;
      const ay = layout.y + (a.y / 100) * layout.h;
      const aw = (a.width || 0) / 100 * layout.w;
      const ah = (a.height || 0) / 100 * layout.h;
      
      if (boardX >= ax - ERASE_RADIUS && boardX <= ax + aw + ERASE_RADIUS &&
          boardY >= ay - ERASE_RADIUS && boardY <= ay + ah + ERASE_RADIUS) {
        toDelete.push(a.id);
      }
    });
    if (toDelete.length > 0) {
      toDelete.forEach(id => onDeleteAnnotation(id));
    }
  }

  // Mouse move drawing and panning actions
  function handleStageMouseMove(e: React.PointerEvent<HTMLDivElement>) {
    // Update pointer coordinates in active pointers map
    if ('pointerId' in e && activePointersRef.current.has(e.pointerId)) {
      activePointersRef.current.set(e.pointerId, { clientX: e.clientX, clientY: e.clientY });
    }

    // If pinch-to-zoom is active (2 pointers)
    if (activePointersRef.current.size === 2 && pinchStartDistanceRef.current > 0) {
      const pointers = Array.from(activePointersRef.current.values());
      const dx = pointers[0].clientX - pointers[1].clientX;
      const dy = pointers[0].clientY - pointers[1].clientY;
      const currentDistance = Math.sqrt(dx * dx + dy * dy);
      
      const scale = currentDistance / pinchStartDistanceRef.current;
      
      let nextZoomLevel = pinchStartZoomLevelRef.current * scale;
      nextZoomLevel = Math.max(0.02, Math.min(nextZoomLevel, 3.5));
      
      // Fix #12: Snap to 100% during pinch
      if (nextZoomLevel > 0.96 && nextZoomLevel < 1.04) {
        nextZoomLevel = 1.0;
      }
      
      const currentMidX = (pointers[0].clientX + pointers[1].clientX) / 2;
      const currentMidY = (pointers[0].clientY + pointers[1].clientY) / 2;
      
      const container = containerRef.current;
      if (container && pinchStartBoardCoordsRef.current) {
        const rect = container.getBoundingClientRect();
        const containerMidX = currentMidX - rect.left;
        const containerMidY = currentMidY - rect.top;
        
        const nextDragOffsetX = containerMidX - pinchStartBoardCoordsRef.current.x * nextZoomLevel;
        const nextDragOffsetY = containerMidY - pinchStartBoardCoordsRef.current.y * nextZoomLevel;
        
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
          setZoomLevel(nextZoomLevel);
          setDragOffset({ x: nextDragOffsetX, y: nextDragOffsetY });
        });
      }
      return;
    }

    // 1. Camera Pan
    if (isPanning && activePointersRef.current.size === 1) {
      // Fix #5: Track velocity for momentum inertia
      const now = performance.now();
      const dt = now - lastPanTimeRef.current;
      if (dt > 0) {
        const vx = (e.clientX - lastPanPosRef.current.x) / dt;
        const vy = (e.clientY - lastPanPosRef.current.y) / dt;
        // Exponential moving average for smooth velocity
        panVelocityRef.current = {
          vx: vx * 0.6 + panVelocityRef.current.vx * 0.4,
          vy: vy * 0.6 + panVelocityRef.current.vy * 0.4
        };
      }
      lastPanTimeRef.current = now;
      lastPanPosRef.current = { x: e.clientX, y: e.clientY };

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setDragOffset({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y
        });
      });
      return;
    }

    // 1.5 Resizing Floor Plan Frames
    if (resizingPlanId && resizeStartInfo) {
      const clientX = e.clientX;
      const clientY = e.clientY;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      
      rafRef.current = requestAnimationFrame(() => {
        const deltaX = (clientX - resizeStartInfo.startX) / zoomLevel;
        const deltaY = (clientY - resizeStartInfo.startY) / zoomLevel;
        const targetPlan = floorPlans.find(p => p.id === resizingPlanId);
        
        if (targetPlan) {
          const dir = resizeStartInfo.direction;
          let newWidth = resizeStartInfo.startWidth;
          
          if (dir.includes('e')) newWidth += deltaX;
          if (dir.includes('w')) newWidth -= deltaX;
          
          // Handle n/s only for pure vertical edge dragging
          if (dir === 's') newWidth += deltaY * (targetPlan.width / targetPlan.height);
          if (dir === 'n') newWidth -= deltaY * (targetPlan.width / targetPlan.height);

          newWidth = Math.max(100, Math.round(newWidth));
          const newScale = newWidth / baseFrameWidth;
          
          // Calculate position adjustments to keep the opposite edge anchored
          let newX = resizeStartInfo.startPlanX;
          let newY = resizeStartInfo.startPlanY;
          
          const widthDiff = newWidth - resizeStartInfo.startWidth;
          const heightDiff = (newWidth * (targetPlan.height / targetPlan.width)) - resizeStartInfo.startHeight;

          if (dir.includes('w')) newX = resizeStartInfo.startPlanX - Math.round(widthDiff);
          if (dir.includes('n')) newY = resizeStartInfo.startPlanY - Math.round(heightDiff);

          setTempPlanState(prev => ({ 
              ...(prev || {}), 
              id: targetPlan.id, 
              scale: newScale,
              x: newX,
              y: newY
          }));
        }
      });
      return;
    }

    // 2. Dragging Floor Plan Drawing Frames
    if (draggingPlanId) {
      const clientX = e.clientX;
      const clientY = e.clientY;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      
      rafRef.current = requestAnimationFrame(() => {
        const coords = getCanvasCoords(clientX, clientY);
        const targetPlan = floorPlans.find(p => p.id === draggingPlanId);
        if (targetPlan) {
          setTempPlanState(prev => ({ 
            ...prev, 
            id: targetPlan.id, 
            x: Math.round(coords.x - planDragOffset.x),
            y: Math.round(coords.y - planDragOffset.y)
          }));
        }
      });
      return;
    }

    // 2.5 Resizing Annotations (Frames, Rects, Ellipses)
    if (resizingAnnotId && annotResizeStartInfo) {
      const clientX = e.clientX;
      const clientY = e.clientY;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      
      rafRef.current = requestAnimationFrame(() => {
        const target = annotations.find(a => a.id === resizingAnnotId);
        if (!target) return;

        const layout = getLayoutForPlan(target.floorPlanId);
        // delta in % of layout
        const deltaX = ((clientX - annotResizeStartInfo.startX) / zoomLevel / layout.w) * 100;
        const deltaY = ((clientY - annotResizeStartInfo.startY) / zoomLevel / layout.h) * 100;

        let newX = annotResizeStartInfo.startAnnotX;
        let newY = annotResizeStartInfo.startAnnotY;
        let newW = annotResizeStartInfo.startWidth;
        let newH = annotResizeStartInfo.startHeight;
        
        const dir = annotResizeStartInfo.direction;

        if (dir.includes('e')) newW = Math.max(1, annotResizeStartInfo.startWidth + deltaX);
        if (dir.includes('s')) newH = Math.max(1, annotResizeStartInfo.startHeight + deltaY);
        
        if (dir.includes('w')) {
          const maxDeltaX = annotResizeStartInfo.startWidth - 1;
          const safeDeltaX = Math.min(deltaX, maxDeltaX);
          newX = annotResizeStartInfo.startAnnotX + safeDeltaX;
          newW = annotResizeStartInfo.startWidth - safeDeltaX;
        }
        
        if (dir.includes('n')) {
          const maxDeltaY = annotResizeStartInfo.startHeight - 1;
          const safeDeltaY = Math.min(deltaY, maxDeltaY);
          newY = annotResizeStartInfo.startAnnotY + safeDeltaY;
          newH = annotResizeStartInfo.startHeight - safeDeltaY;
        }

        setTempDragAnnots({
          [target.id]: {
            x: newX,
            y: newY,
            width: newW,
            height: newH
          }
        });
      });
      return;
    }

    // 3. Dragging Annotations Shapes / Notes
    if (draggingAnnotId) {
      const clientX = e.clientX;
      const clientY = e.clientY;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      
      rafRef.current = requestAnimationFrame(() => {
        const coords = getCanvasCoords(clientX, clientY);
        const target = annotations.find(a => a.id === draggingAnnotId);
        if (target) {
          const layout = getLayoutForPlan(target.floorPlanId);
          const nextLocalX = ((coords.x - annotDragOffset.x - layout.x) / layout.w) * 100;
          const nextLocalY = ((coords.y - annotDragOffset.y - layout.y) / layout.h) * 100;
          
          const nextX = nextLocalX;
          const nextY = nextLocalY;
          const updates: Record<string, Partial<WhiteboardAnnotation>> = {};

          let finalX = nextX;
          let finalY = nextY;
          let guideX: number | undefined = undefined;
          let guideY: number | undefined = undefined;
          
          // Smart Alignment Guides
          const SNAP_THRESHOLD = 0.8; 
          const targetW = target.width || 0;
          const targetH = target.height || 0;
          const targetCenterX = nextX + targetW / 2;
          const targetCenterY = nextY + targetH / 2;

          let minDiffX = Infinity;
          let minDiffY = Infinity;

          const targetXEdges = [nextX, targetCenterX, nextX + targetW];
          targetXEdges.forEach(tx => {
            staticAlignEdges.x.forEach(ax => {
              const diff = Math.abs(tx - ax);
              if (diff < SNAP_THRESHOLD && diff < minDiffX) {
                minDiffX = diff;
                guideX = ax;
              }
            });
          });

          const targetYEdges = [nextY, targetCenterY, nextY + targetH];
          staticAlignEdges.y.forEach(ay => {
            targetYEdges.forEach(ty => {
              const diff = Math.abs(ty - ay);
              if (diff < SNAP_THRESHOLD && diff < minDiffY) {
                minDiffY = diff;
                guideY = ay;
              }
            });
          });

          setAlignmentGuides({ x: guideX, y: guideY });

          const deltaX = finalX - target.x;
          const deltaY = finalY - target.y;

          if (target.type === 'frame') {
            dragGroupCache.forEach(id => {
              const a = annotations.find(ann => ann.id === id);
              if (a) {
                updates[a.id] = {
                  x: a.x + deltaX,
                  y: a.y + deltaY,
                  endX: a.endX !== undefined ? a.endX + deltaX : undefined,
                  endY: a.endY !== undefined ? a.endY + deltaY : undefined
                };
              }
            });
          }

          updates[target.id] = { x: finalX, y: finalY };
          setTempDragAnnots(updates);
        }
      });
      return;
    }

    // 4. Drawing new shapes
    if (!isDrawingRef.current) return;
    const clientX = e.clientX;
    const clientY = e.clientY;

    if (activeWhiteboardTool === 'eraser') {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const coords = getCanvasCoords(clientX, clientY);
        eraseAtCoords(coords.x, coords.y);
      });
      return;
    }

    if (!tempAnnotRef.current) return;
    
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    
    rafRef.current = requestAnimationFrame(() => {
      const { x: boardX, y: boardY } = getCanvasCoords(clientX, clientY);
      const layout = getLayoutForPlan(drawParentId);
      
      const pctX = ((boardX - layout.x) / layout.w) * 100;
      const pctY = ((boardY - layout.y) / layout.h) * 100;
      const drawingType = tempAnnotRef.current?.type;

      if (drawingType === 'pen' || drawingType === 'highlighter') {
        if (drawingPointsRef.current.length === 0) return;
        const nextPoint = `${pctX * 10},${pctY * 10}`;
        drawingPointsRef.current.push(nextPoint);
        const allPointsStr = drawingPointsRef.current.join(' ');
        setTempDrawingPoints(allPointsStr);
        setTempAnnot(prev => prev ? { ...prev, points: allPointsStr } : null);
        return;
      } else if (['arrow', 'line', 'elbow-arrow'].includes(drawingType || '')) {
        setTempAnnot(prev => prev ? {
          ...prev,
          endX: pctX,
          endY: pctY
        } : null);
      } else {
        const leftX = Math.min(drawStartPct.x, pctX);
        const topY = Math.min(drawStartPct.y, pctY);
        const w = Math.abs(drawStartPct.x - pctX);
        const h = Math.abs(drawStartPct.y - pctY);
        setTempAnnot(prev => prev ? {
          ...prev,
          x: leftX,
          y: topY,
          width: w,
          height: h
        } : null);
      }
    });
  }

  // Mouse up releases
  function handleStageMouseUp(e?: React.PointerEvent<HTMLDivElement>) {
    const wasPinching = isPinchingRef.current;
    
    if (e && 'pointerId' in e) {
      activePointersRef.current.delete(e.pointerId);
    } else {
      activePointersRef.current.clear();
    }

    // Fix #1: Handle pinch→pan transition smoothly
    if (wasPinching && activePointersRef.current.size === 1) {
      // One finger was just lifted from a pinch — the remaining finger should NOT cause a pan jump
      isPinchingRef.current = false;
      pinchJustEndedRef.current = true;
      pinchStartDistanceRef.current = 0;
      pinchStartBoardCoordsRef.current = null;
      
      // Fix #2: Record pinch end time for ghost-click prevention
      lastPinchEndTimeRef.current = Date.now();
      
      // Re-initialize panStart from the remaining pointer's current position
      const remainingPointer = Array.from(activePointersRef.current.values())[0];
      if (remainingPointer) {
        setIsPanning(true);
        setPanStart({ x: remainingPointer.clientX - dragOffset.x, y: remainingPointer.clientY - dragOffset.y });
        lastPanTimeRef.current = performance.now();
        lastPanPosRef.current = { x: remainingPointer.clientX, y: remainingPointer.clientY };
        panVelocityRef.current = { vx: 0, vy: 0 }; // Reset velocity — don't carry over from pinch
      }
      return; // Don't proceed to cleanup — still have 1 active pointer
    }

    if (activePointersRef.current.size < 2) {
      pinchStartDistanceRef.current = 0;
      pinchStartBoardCoordsRef.current = null;
      if (wasPinching) {
        isPinchingRef.current = false;
        lastPinchEndTimeRef.current = Date.now();
      }
    }

    if (activePointersRef.current.size === 0) {
      // Fix #5: Apply momentum/inertia after pan release
      if (isPanning && !wasPinching) {
        const velocity = panVelocityRef.current;
        const speed = Math.hypot(velocity.vx, velocity.vy);
        
        if (speed > 0.15) {  // Only apply momentum if moving fast enough
          let vx = velocity.vx * 16; // Convert from px/ms to px/frame (60fps)
          let vy = velocity.vy * 16;
          const friction = 0.92; // Deceleration factor — lower = stops faster
          
          const applyMomentum = () => {
            vx *= friction;
            vy *= friction;
            
            if (Math.abs(vx) < 0.3 && Math.abs(vy) < 0.3) {
              momentumRafRef.current = null;
              return;
            }
            
            setDragOffset(prev => ({
              x: prev.x + vx,
              y: prev.y + vy
            }));
            
            momentumRafRef.current = requestAnimationFrame(applyMomentum);
          };
          
          momentumRafRef.current = requestAnimationFrame(applyMomentum);
        }
      }
      
      setIsPanning(false);
      isPinchingRef.current = false;
    }
    
    if ((draggingPlanId || resizingPlanId) && tempPlanState) {
      const targetPlan = floorPlans.find(p => p.id === tempPlanState.id);
      if (targetPlan) {
        onUpdateFloorPlan({
          ...targetPlan,
          canvasX: tempPlanState.x !== undefined ? tempPlanState.x : targetPlan.canvasX,
          canvasY: tempPlanState.y !== undefined ? tempPlanState.y : targetPlan.canvasY,
          canvasScale: tempPlanState.scale !== undefined ? tempPlanState.scale : targetPlan.canvasScale
        });
      }
    }
    
    setDraggingPlanId(null);
    setResizingPlanId(null);
    setResizeStartInfo(null);
    setTempPlanState(null);
    setDraggingAnnotId(null);
    setResizingAnnotId(null);
    setAnnotResizeStartInfo(null);

    if (Object.keys(tempDragAnnots).length > 0) {
      Object.entries(tempDragAnnots).forEach(([id, changes]) => {
        const annot = annotations.find(a => a.id === id);
        if (annot) {
          onUpdateAnnotation({ ...annot, ...changes });
        }
      });
      setTempDragAnnots({});
    }
    
    if (isDrawingRef.current && tempAnnotRef.current) {
      setIsDrawing(false);
      isDrawingRef.current = false;
      
      const savedType = tempAnnotRef.current.type;
      const meritsSave = savedType === 'pen' || savedType === 'highlighter'
        ? (drawingPointsRef.current.length > 0)
        : ['arrow', 'line', 'elbow-arrow'].includes(savedType || '')
          ? (Math.abs((tempAnnotRef.current.endX || 0) - (tempAnnotRef.current.x || 0)) > 0.05 || Math.abs((tempAnnotRef.current.endY || 0) - (tempAnnotRef.current.y || 0)) > 0.05)
          : ((tempAnnotRef.current.width || 0) > 0.05 && (tempAnnotRef.current.height || 0) > 0.05);

      if (drawingConnectionFrom && !meritsSave) {
        // QUICK DUPLICATE LOGIC (Miro style)
        const sourceAnnot = annotations.find(a => a.id === drawingConnectionFrom.annotId);
        if (sourceAnnot) {
          const layout = getLayoutForPlan(sourceAnnot.floorPlanId);
          // 1. Calculate new position (Shift by width/height + gap)
          const gapPctX = (50 / layout.w) * 100; // ~50px visual gap
          const gapPctY = (50 / layout.h) * 100;
          
          const sourceW = sourceAnnot.width || 10;
          const sourceH = sourceAnnot.height || 10;
          
          let offsetX = 0;
          let offsetY = 0;
          
          if (drawingConnectionFrom.direction === 'left') offsetX = -(sourceW + gapPctX);
          if (drawingConnectionFrom.direction === 'right') offsetX = (sourceW + gapPctX);
          if (drawingConnectionFrom.direction === 'top') offsetY = -(sourceH + gapPctY);
          if (drawingConnectionFrom.direction === 'bottom') offsetY = (sourceH + gapPctY);
          
          const newAnnotId = `annot-${Date.now()}-dup`;
          const newAnnot: WhiteboardAnnotation = {
            ...sourceAnnot,
            id: newAnnotId,
            x: sourceAnnot.x + offsetX,
            y: sourceAnnot.y + offsetY,
            createdAt: Date.now()
          };
          
          // 2. Adjust arrow
          const arrowId = `annot-${Date.now()}-arr`;
          // Connect from the edge of source to the edge of target
          let startX = sourceAnnot.x + sourceW / 2;
          let startY = sourceAnnot.y + sourceH / 2;
          let endX = newAnnot.x + sourceW / 2;
          let endY = newAnnot.y + sourceH / 2;
          
          if (drawingConnectionFrom.direction === 'left') {
            startX = sourceAnnot.x; endX = newAnnot.x + sourceW;
          } else if (drawingConnectionFrom.direction === 'right') {
            startX = sourceAnnot.x + sourceW; endX = newAnnot.x;
          } else if (drawingConnectionFrom.direction === 'top') {
            startY = sourceAnnot.y; endY = newAnnot.y + sourceH;
          } else if (drawingConnectionFrom.direction === 'bottom') {
            startY = sourceAnnot.y + sourceH; endY = newAnnot.y;
          }
          
          const arrowAnnot: WhiteboardAnnotation = {
            id: arrowId,
            floorPlanId: sourceAnnot.floorPlanId,
            type: 'elbow-arrow',
            x: startX,
            y: startY,
            endX: endX,
            endY: endY,
            width: 1, height: 1,
            color: currentColor,
            content: '',
            createdAt: Date.now(),
            userName: activeUserRole.name,
            comments: []
          };
          
          onAddAnnotation(newAnnot);
          setTimeout(() => onAddAnnotation(arrowAnnot), 50);
          
          // Auto select new element instead of the arrow so user can continue chaining
          setTimeout(() => {
            onSelectAnnotation(newAnnotId);
            setActiveWhiteboardTool('select');
          }, 100);
        }
      } else if (meritsSave) {
        const annotToSave = { ...tempAnnotRef.current };
        if (savedType === 'pen' || savedType === 'highlighter') {
           annotToSave.points = drawingPointsRef.current.join(' ');
        }
        onAddAnnotation(annotToSave as WhiteboardAnnotation);
      }
      
      setDrawingConnectionFrom(null);
      setTempAnnot(null);
      setTempDrawingPoints('');
      drawingPointsRef.current = [];
    }
  }

  function handleCreateFrameWithPreset(preset: string) {
    const parentId = activeFloorPlanId || (floorPlans.length > 0 ? floorPlans[0].id : boardId);
    
    let w = 25;
    let h = 20;
    let label = 'Vùng mới';
    
    switch (preset) {
      case 'A4':
        w = 35; h = 25; label = 'Vùng A4'; break;
      case 'Letter':
        w = 32; h = 25; label = 'Vùng Thư (Letter)'; break;
      case '16:9':
        w = 36; h = 20.25; label = 'Vùng Slide 16:9'; break;
      case '4:3':
        w = 32; h = 24; label = 'Vùng Sơ Đồ 4:3'; break;
      case '1:1':
        w = 25; h = 25; label = 'Vùng Vuông 1:1'; break;
      case 'mobile':
        w = 16; h = 28.5; label = 'Vùng Điện thoại (Mobile)'; break;
      case 'tablet':
        w = 24; h = 32; label = 'Vùng Máy tính bảng (Tablet)'; break;
      case 'desktop':
        w = 40; h = 25; label = 'Vùng Màn hình lớn (Desktop)'; break;
      case 'slides':
        w = 40; h = 22.5; label = 'Trang slide thuyết trình'; break;
      case 'diagram':
        w = 35; h = 25; label = 'Khung sơ đồ phân tích'; break;
      default: // custom
        setActiveWhiteboardTool('frame');
        setIsFrameFlyoutOpen(false);
        return;
    }
    
    const id = `annot-${Date.now()}`;
    onAddAnnotation({
      id,
      floorPlanId: parentId,
      type: 'frame',
      x: 35,
      y: 35,
      width: w,
      height: h,
      color: '#3b82f6', // Miro blue color default for frame
      content: label,
      createdAt: Date.now(),
      userName: activeUserRole.name,
      comments: []
    });
    
    setActiveWhiteboardTool('select');
    onSelectAnnotation(id);
    setIsFrameFlyoutOpen(false);
  }

  // Handle Dragging Whiteboard objects on canvas
  function handleAnnotDragStart(e: React.MouseEvent, annot: WhiteboardAnnotation) {
    if (activeWhiteboardTool !== 'select') return;
    if (annot.isLocked) return; // Miro lock: block any dragging or moving on locked elements
    e.stopPropagation();
    
    setDraggingAnnotId(annot.id);
    const { x: boardX, y: boardY } = getCanvasCoords(e.clientX, e.clientY);
    const layout = getLayoutForPlan(annot.floorPlanId);
    
    // Position of annotation in global pixels
    const animAbsX = layout.x + (annot.x / 100) * layout.w;
    const animAbsY = layout.y + (annot.y / 100) * layout.h;
    
    setAnnotDragOffset({
      x: boardX - animAbsX,
      y: boardY - animAbsY
    });

    if (annot.type === 'frame') {
      const targetMinX = annot.x;
      const targetMaxX = annot.x + annot.width;
      const targetMinY = annot.y;
      const targetMaxY = annot.y + annot.height;
      const groupedIds: string[] = [];
      
      annotations.forEach(a => {
        if (a.id === annot.id || a.floorPlanId !== annot.floorPlanId) return;
        
        let isInside = false;
        if (['line', 'arrow', 'elbow-arrow'].includes(a.type)) {
          const ax1 = a.x;
          const ay1 = a.y;
          const ax2 = a.endX !== undefined ? a.endX : a.x;
          const ay2 = a.endY !== undefined ? a.endY : a.y;
          isInside = ax1 >= targetMinX && ax1 <= targetMaxX &&
                     ay1 >= targetMinY && ay1 <= targetMaxY &&
                     ax2 >= targetMinX && ax2 <= targetMaxX &&
                     ay2 >= targetMinY && ay2 <= targetMaxY;
        } else if (a.type === 'pen' || a.type === 'highlighter') {
          // Check if the FIRST point is inside the frame
          // a.points stores "pctX*10,pctY*10" so we divide by 10 to get pct
          if (a.points) {
             const firstPointStr = a.points.split(' ')[0];
             if (firstPointStr) {
               const [pctX10, pctY10] = firstPointStr.split(',');
               const px = parseFloat(pctX10) / 10; // This is percentage
               const py = parseFloat(pctY10) / 10;
               isInside = px >= targetMinX && px <= targetMaxX && py >= targetMinY && py <= targetMaxY;
             }
          }
        } else {
          const ax = a.x;
          const ay = a.y;
          isInside = ax >= targetMinX && ax <= targetMaxX &&
                     ay >= targetMinY && ay <= targetMaxY;
        }

        if (isInside) groupedIds.push(a.id);
      });
      setDragGroupCache(groupedIds);
    } else {
      setDragGroupCache([]);
    }

    // Precompute static alignment edges for O(1) alignment checks during RAF
    const xEdges: number[] = [];
    const yEdges: number[] = [];
    annotations.forEach(a => {
      if (a.id === annot.id || a.floorPlanId !== annot.floorPlanId || ['line', 'arrow', 'elbow-arrow'].includes(a.type)) return;
      const aW = a.width || 0;
      const aH = a.height || 0;
      xEdges.push(a.x, a.x + aW / 2, a.x + aW);
      yEdges.push(a.y, a.y + aH / 2, a.y + aH);
    });
    setStaticAlignEdges({ x: xEdges, y: yEdges });
  }

  function handleAnnotResizeStart(e: React.MouseEvent, annot: WhiteboardAnnotation, direction: string) {
    if (activeWhiteboardTool !== 'select') return;
    if (annot.isLocked) return;
    e.stopPropagation();
    
    setResizingAnnotId(annot.id);
    
    setAnnotResizeStartInfo({
      startX: e.clientX,
      startY: e.clientY,
      startWidth: annot.width,
      startHeight: annot.height,
      startAnnotX: annot.x,
      startAnnotY: annot.y,
      direction,
      annotId: annot.id
    });
  }

  // Start dragging a floor plan drawing frame
  function handlePlanDragStart(e: React.MouseEvent, plan: FloorPlan, index: number) {
    if (plan.isLocked) return;
    e.stopPropagation();
    setDraggingPlanId(plan.id);
    const coords = getCanvasCoords(e.clientX, e.clientY);
    const pos = computePlanPosition(plan, index);
    setPlanDragOffset({
      x: coords.x - pos.x,
      y: coords.y - pos.y
    });
    // Set focused plan in main views
    setActiveFloorPlanId(plan.id);
  }

  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.15, 2.0));
  };
  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.15, 0.02));
  };

  function parsePenPointsToAbsArray(pointsStr: string, layout: { x: number, y: number, w: number, h: number }) {
    if (!pointsStr) return [];
    return pointsStr.split(' ').map(p => {
      const [pctX10, pctY10] = p.split(',');
      const px = parseFloat(pctX10) / 10;
      const py = parseFloat(pctY10) / 10;
      const absX = layout.x + (px / 100) * layout.w;
      const absY = layout.y + (py / 100) * layout.h;
      return [absX, absY];
    });
  }

  function parsePenPointsToRelArray(pointsStr: string, layout: { w: number, h: number }) {
    if (!pointsStr) return [];
    return pointsStr.split(' ').map(p => {
      const [pctX10, pctY10] = p.split(',');
      const px = parseFloat(pctX10) / 10;
      const py = parseFloat(pctY10) / 10;
      const relX = (px / 100) * layout.w;
      const relY = (py / 100) * layout.h;
      return [relX, relY];
    });
  }

  function getSmoothSvgPath(points: number[][]) {
    if (points.length === 0) return '';
    const path = [`M ${points[0][0]},${points[0][1]}`];
    for (let i = 1; i < points.length - 1; i++) {
      const xc = (points[i][0] + points[i + 1][0]) / 2;
      const yc = (points[i][1] + points[i + 1][1]) / 2;
      path.push(`Q ${points[i][0]},${points[i][1]} ${xc},${yc}`);
    }
    if (points.length > 1) {
      path.push(`L ${points[points.length - 1][0]},${points[points.length - 1][1]}`);
    }
    return path.join(' ');
  }

  const projectFloorPlans = activeProjectId
    ? floorPlans.filter(p => p.projectId === activeProjectId)
    : floorPlans;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-full shadow-2xl overflow-hidden relative">
      
      {/* 2D PLAN SHEETS HORIZONTAL TAB SELECTOR (Vùng 2 - Tinh gọn Dàn ngang) */}
      <div className="bg-slate-950/95 border-b border-slate-900 px-4 py-2 flex items-center justify-between shrink-0 select-none z-30 no-pan-trigger">


        <div className="flex items-center gap-2 text-slate-450 shrink-0 select-none">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline">Mặt bằng:</span>
        </div>

        <div className="flex-1 flex items-center gap-2 overflow-x-auto px-4 py-1 no-scrollbar scroll-smooth">
          {projectFloorPlans.length === 0 ? (
            <span className="text-[10px] text-slate-500 italic">
              Chưa có bản vẽ nào. Kéo thả hình ảnh vào board hoặc nhấp 'Dán bản vẽ mới'!
            </span>
          ) : (() => {
            const pinnedPlans = projectFloorPlans.filter(p => p.isPinned);
            const unpinnedCount = projectFloorPlans.length - pinnedPlans.length;
            return (
              <>
                {pinnedPlans.length === 0 ? (
                  <span className="text-[10px] text-slate-500 italic">
                    Chưa ghim bản vẽ nào. Nhấn nút "Ghim" trên tiêu đề bản vẽ để hiện ở đây.
                  </span>
                ) : (
                  pinnedPlans.map(plan => {
                    const isSelected = activeFloorPlanId === plan.id;
                    const typeLabel = plan.planType === 'tiling' 
                      ? 'Sàn Ốp Lát' 
                      : plan.planType === 'existing' 
                        ? 'Hiện Trạng' 
                        : 'Thiết Kế';

                    return (
                      <div
                        key={plan.id}
                        className={`group relative flex items-center shrink-0 min-w-[145px] max-w-[200px] h-9 p-1 pl-3 pr-2.5 rounded-xl border transition-all select-none cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600/10 border-emerald-500/30 text-emerald-300 shadow shadow-emerald-500/5'
                            : 'bg-slate-900 border-slate-900 hover:bg-slate-850 hover:text-slate-200 text-slate-400'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveFloorPlanId(plan.id);
                          onSelectMarker(null);
                          onSelectAnnotation(null);
                          
                          // Focus automatically when clicking tab
                          const planIndex = groupedFloorPlans.findIndex(p => p.id === plan.id);
                          if (planIndex !== -1) {
                            focusOnPlan(plan, planIndex, 0.5);
                          } else if (plan.documentGroupId) {
                            // If it's a grouped plan, focus on the representative
                            const repIndex = groupedFloorPlans.findIndex(p => p.documentGroupId === plan.documentGroupId);
                            if (repIndex !== -1) focusOnPlan(groupedFloorPlans[repIndex], repIndex, 0.5);
                          }
                        }}
                        title={plan.name}
                      >
                        <div className="flex-1 min-w-0 pr-4">
                          <span className="text-[11px] font-extrabold truncate block leading-tight select-none">{plan.name}</span>
                          <span className={`text-[8px] font-bold select-none text-slate-500 block leading-none mt-0.5`}>
                            {typeLabel}
                          </span>
                        </div>
                        
                        {/* Delete tab button (Trash2) */}
                        {plan.id !== 'demo-floor-plan' && onDeleteFloorPlan && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteFloorPlan(plan.id);
                            }}
                            className="absolute right-1.5 text-slate-550 hover:text-rose-500 hover:bg-rose-500/15 p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer"
                            title="Xóa bản vẽ"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
                {unpinnedCount > 0 && (
                  <span className="text-[9px] text-slate-500 font-bold shrink-0 bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg">
                    +{unpinnedCount} chưa ghim
                  </span>
                )}
              </>
            );
          })()}
        </div>

        {/* Inline right upload trigger */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-indigo-650 hover:bg-indigo-600 text-white font-bold rounded-xl text-xs shadow-md transition-all active:scale-95 cursor-pointer select-none"
          title="Dán bản vẽ thiết kế mới"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Dán bản vẽ mới</span>
        </button>
      </div>

      {/* 2. DYNAMIC MIRO-STYLE FLOATING CONTEXT TOOLBAR */}
      {(() => {
        const selectedAnnot = selectedAnnotationId ? annotations.find(a => a.id === selectedAnnotationId) : null;
        const isDrawingMode = floorPlans.length > 0 && activeWhiteboardTool !== 'select' && activeWhiteboardTool !== 'marker';
        
        if (!selectedAnnot && !isDrawingMode) return null;
        
        const showColorPicker = isDrawingMode || (selectedAnnot && ['sticky', 'text', 'rect', 'ellipse', 'frame', 'pen', 'arrow', 'line', 'elbow-arrow'].includes(selectedAnnot.type));
        
        return (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur-md border border-slate-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-xl px-2 py-1.5 flex items-center gap-1.5 transition-all pointer-events-auto">
            {/* Color Palette */}
            {showColorPicker && (
              <div className="flex items-center gap-1.5 px-3 border-r border-slate-200">
                {colors.map(col => (
                  <button
                    key={col.hex}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (selectedAnnot) {
                        onUpdateAnnotation({ ...selectedAnnot, color: col.hex });
                      } else {
                        setCurrentColor(col.hex);
                      }
                    }}
                    style={{ backgroundColor: col.hex }}
                    className={`w-5 h-5 rounded-full border-2 cursor-pointer transition-transform ${
                      (selectedAnnot ? selectedAnnot.color === col.hex : currentColor === col.hex) ? 'border-indigo-500 scale-125 shadow-sm' : 'border-transparent hover:scale-110'
                    }`}
                    title={col.name}
                  />
                ))}
              </div>
            )}
            
            {/* Outline / Stroke Width toggle (if applicable) */}
            {selectedAnnot && ['rect', 'ellipse', 'frame', 'arrow', 'line', 'elbow-arrow', 'pen'].includes(selectedAnnot.type) && (
              <div className="flex items-center gap-1 px-2 border-r border-slate-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateAnnotation({ ...selectedAnnot, strokeWidth: ((selectedAnnot.strokeWidth || 3.5) % 8) + 2 });
                  }}
                  className="px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                  title="Độ dày viền"
                >
                  Viền: {selectedAnnot.strokeWidth || 3.5}px
                </button>
              </div>
            )}

            {/* Dash style toggle */}
            {selectedAnnot && ['rect', 'ellipse', 'frame'].includes(selectedAnnot.type) && (
              <div className="flex items-center gap-1 px-2 border-r border-slate-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const styles = ['solid', 'dashed', 'dotted'];
                    const currentIdx = styles.indexOf(selectedAnnot.strokeDash || 'solid');
                    onUpdateAnnotation({ ...selectedAnnot, strokeDash: styles[(currentIdx + 1) % styles.length] as 'solid' | 'dashed' | 'dotted' });
                  }}
                  className="px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                  title="Kiểu viền"
                >
                  Kiểu: {selectedAnnot.strokeDash === 'dashed' ? 'Đứt (---)' : selectedAnnot.strokeDash === 'dotted' ? 'Chấm (...)' : 'Liền (──)'}
                </button>
              </div>
            )}
            
            {/* Opacity toggle */}
            {selectedAnnot && ['rect', 'ellipse', 'frame'].includes(selectedAnnot.type) && (
              <div className="flex items-center gap-1 px-2 border-r border-slate-200">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const currentOp = selectedAnnot.opacity === undefined ? 15 : selectedAnnot.opacity;
                    onUpdateAnnotation({ ...selectedAnnot, opacity: currentOp === 0 ? 15 : currentOp === 15 ? 40 : currentOp === 40 ? 100 : 0 });
                  }}
                  className="px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                  title="Độ mờ nền"
                >
                  Nền: {selectedAnnot.opacity === undefined ? 15 : selectedAnnot.opacity}%
                </button>
              </div>
            )}

            {/* Delete button */}
            {selectedAnnot && (
              <div className="px-2 pl-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteAnnotation(selectedAnnot.id);
                    onSelectAnnotation(null);
                  }}
                  className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Xóa đối tượng (Del)"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        );
      })()}

      {/* 3. WHITEBOARD WORKSPACE CONTAINER */}
      <div 
        ref={containerRef}
        className="flex-1 bg-slate-100 relative overflow-hidden flex items-center justify-center pointer-events-auto"
        style={{ touchAction: 'none', overscrollBehavior: 'none' }}
      >
        {/* Dynamic Instructional Banner for Pinning Camera and Voice Faults (Miro-style) */}
        {floorPlans.length > 0 && activeWhiteboardTool === 'marker' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-[#0f1222] border-2 border-emerald-500 text-white shadow-[0_15px_40px_rgba(8,10,24,0.6)] rounded-3xl p-4 flex items-center gap-3.5 max-w-xl w-[90%] md:w-auto animate-bounce-subtle pointer-events-auto">
            <div className="bg-emerald-500/20 border border-emerald-400 p-2.5 rounded-2xl shrink-0 flex items-center justify-center animate-pulse">
              <Camera className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-left font-sans">
              <div className="text-[9px] font-black uppercase tracking-widest text-emerald-400 mb-0.5">Quy trình ghim lỗi hiện trường DQH</div>
              <p className="text-xs font-bold leading-relaxed text-slate-100">
                👉 Nhấp chuột vào bất cứ điểm có lỗi nào trên bản vẽ bên dưới để <span className="text-emerald-400 underline decoration-emerald-500/50 decoration-2">ghim vị trí</span>, sau đó hệ thống sẽ tự động mở <span className="text-yellow-400 font-extrabold">Webcam chụp ảnh hiện trạng</span> & <span className="text-cyan-400 font-extrabold font-mono">Ghi âm Voice mô tả</span> ngay lập tức!
              </p>
            </div>
            <button 
              onClick={() => setActiveWhiteboardTool('select')}
              className="text-[10px] bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-400 px-3 py-1.5 rounded-xl border border-slate-700 font-extrabold cursor-pointer h-fit self-center shrink-0 transition-all active:scale-95"
              title="Hủy công cụ ghim lỗi"
            >
              Hủy
            </button>
          </div>
        )}

        {floorPlans.length > 0 ? (
          <div
            className="w-full h-full absolute inset-0 select-none overflow-hidden touch-none"
            onPointerDown={handleStageMouseDown}
            onPointerMove={handleStageMouseMove}
            onPointerUp={handleStageMouseUp}
            onPointerCancel={handleStageMouseUp}
            onPointerLeave={handleStageMouseUp}
            onContextMenu={(e) => {
              e.preventDefault();
              let targetType: 'plan' | 'annot' | null = null;
              let targetId: string | null = null;
              if (selectedAnnotationId) {
                targetType = 'annot';
                targetId = selectedAnnotationId;
              } else if (activeFloorPlanId) {
                targetType = 'plan';
                targetId = activeFloorPlanId;
              }
              if (targetId) {
                setContextMenu({ x: e.clientX, y: e.clientY, visible: true, targetId, targetType });
              }
            }}
            onClick={() => {
              if (contextMenu.visible) {
                setContextMenu({ ...contextMenu, visible: false });
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.dataTransfer.dropEffect = 'copy';
              setIsDraggingOver(true);
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDraggingOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDraggingOver(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDraggingOver(false);
              const coords = getCanvasCoords(e.clientX, e.clientY);
              handleImageDrop(e, coords);
            }}
            style={{
              touchAction: 'none',
              // Graph paper (ô caro) grid pattern
              backgroundImage: 'linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)',
              backgroundSize: '24px 24px',
              backgroundColor: '#f8fafc',
              cursor: activeWhiteboardTool === 'select' ? (isPanning ? 'grabbing' : 'grab') : 'crosshair'
            }}
          >
            {/* Visual Drag and Drop reference image overlay alert */}
            {isDraggingOver && (
              <div className="absolute inset-0 bg-indigo-950/75 backdrop-blur-sm z-40 flex flex-col items-center justify-center border-4 border-dashed border-indigo-400 m-6 rounded-3xl pointer-events-none animate-pulse">
                <div className="p-5 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl text-indigo-400 mb-4 shadow-xl">
                  <Upload className="w-12 h-12 animate-bounce text-indigo-400" />
                </div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider">Thả để chèn ảnh Pinterest hoặc PC</h3>
                <p className="text-xs text-indigo-300 mt-2 font-medium">Bản vẽ hoặc hình ảnh tham khảo sẽ xuất hiện ngay tại vị trí kéo thả</p>
              </div>
            )}
            {/* GIANT TRANSFORMING BOARD CANVAS CANVAS LAYER */}
            <div
              ref={boardLayerRef}
              className={`absolute origin-top-left ${isInteracting ? '' : 'transition-transform duration-300 ease-out'}`}
              style={{
                width: `${canvasWidth}px`,
                height: `${canvasHeight}px`,
                transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) scale(${zoomLevel})`,
                willChange: isInteracting ? 'transform' : 'auto',
                contain: 'layout style',
              }}
            >
              
              {groupedFloorPlans.map((rawPlan, idx) => {
                // Apply temporary fast-refresh state for smooth 60fps drag/resize without DB lag
                const plan = tempPlanState?.id === rawPlan.id 
                  ? { 
                      ...rawPlan, 
                      canvasX: tempPlanState.x !== undefined ? tempPlanState.x : rawPlan.canvasX,
                      canvasY: tempPlanState.y !== undefined ? tempPlanState.y : rawPlan.canvasY,
                      canvasScale: tempPlanState.scale !== undefined ? tempPlanState.scale : rawPlan.canvasScale 
                    } 
                  : rawPlan;
                
                const pos = computePlanPosition(plan, idx);
                const isFocused = activeFloorPlanId === plan.id;
                const isBeingDragged = draggingPlanId === plan.id;
                const fw = getFrameWidth(plan);
                const h = (plan.height / plan.width) * fw;
                
                // VIEWPORT CULLING: skip rendering off-screen plans for performance
                if (containerRef.current && !isBeingDragged) {
                  const vw = containerRef.current.clientWidth;
                  const vh = containerRef.current.clientHeight;
                  const screenLeft = -dragOffset.x / zoomLevel;
                  const screenTop = -dragOffset.y / zoomLevel;
                  const screenRight = screenLeft + vw / zoomLevel;
                  const screenBottom = screenTop + vh / zoomLevel;
                  const margin = 200; // extra margin to preload nearby plans
                  
                  if (pos.x + fw < screenLeft - margin || pos.x > screenRight + margin ||
                      pos.y + h < screenTop - margin || pos.y > screenBottom + margin) {
                    // Off-screen: render minimal placeholder
                    return (
                      <div
                        key={plan.id}
                        className="absolute rounded-2xl bg-slate-100 border border-slate-300"
                        style={{
                          left: `${pos.x}px`,
                          top: `${pos.y}px`,
                          width: `${fw}px`,
                          height: `${h}px`,
                          zIndex: 5
                        }}
                      />
                    );
                  }
                }
                
                return (
                  <div
                    key={plan.id}
                    className={`absolute select-none floorplan-element ${
                      isFocused 
                        ? 'border border-[#2563eb] z-30' // Thin crisp blue border like Miro
                        : 'border border-transparent hover:border-slate-300 z-10'
                    } ${
                      activeWhiteboardTool === 'select'
                        ? isBeingDragged ? 'cursor-grabbing' : 'cursor-grab'
                        : ''
                    }`}
                    style={{
                      left: `${pos.x}px`,
                      top: `${pos.y}px`,
                      width: `${fw}px`,
                      height: `${h}px`,
                      zIndex: isBeingDragged ? 40 : (isFocused ? 30 : 10),
                      contain: 'layout paint',
                    }}
                    onPointerDown={(e: React.PointerEvent) => {
                      if (activeWhiteboardTool === 'select') {
                        const target = e.target as HTMLElement;
                        if (
                          target.closest('.whiteboard-element') || 
                          target.closest('button') || 
                          target.closest('input') || 
                          target.closest('textarea')
                        ) {
                          return;
                        }
                        if (!plan.isLocked) {
                          handlePlanDragStart(e, plan, idx);
                        }
                      }
                    }}
                  >
                    {/* Floating Miro-style Context Toolbar (Appears above the selected item) */}
                    {isFocused && (
                      <div 
                        className="absolute left-0 -top-[48px] h-[36px] bg-white border border-slate-200 shadow-md rounded-md flex items-center gap-1 px-1.5 no-pan-trigger select-none cursor-default whitespace-nowrap pointer-events-auto"
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        {/* Fake options matching Miro */}
                        <div className="flex items-center px-2 py-1 text-xs text-slate-700 font-medium border-r border-slate-200 cursor-pointer hover:bg-slate-100 rounded">
                          Bản Vẽ #{idx + 1}
                        </div>
                        <button className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer transition-colors" title="Chuyển đổi (Convert to)">
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer transition-colors" title="Tải xuống (Download)">
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer transition-colors" title="Cắt ảnh (Crop)">
                          <Crop className="w-3.5 h-3.5" />
                        </button>
                        
                        <div className="w-[1px] h-[20px] bg-slate-200 mx-1" />
                        
                        <button 
                          className={`p-1.5 rounded cursor-pointer transition-colors ${plan.isPinned ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
                          title="Ghim lên thanh điều hướng"
                          onClick={() => onUpdateFloorPlan({ ...plan, isPinned: !plan.isPinned })}
                        >
                          <Pin className={`w-3.5 h-3.5 ${plan.isPinned ? 'fill-indigo-600' : ''}`} />
                        </button>
                        
                        <button 
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer transition-colors"
                          title="Phóng Cận Cảnh"
                          onClick={() => {
                            setActiveFloorPlanId(plan.id);
                            focusOnPlan(plan, idx, 0.6);
                          }}
                        >
                          <Focus className="w-3.5 h-3.5" />
                        </button>
                        
                        <button 
                          className={`p-1.5 rounded cursor-pointer transition-colors ${plan.isLocked ? 'text-rose-600 bg-rose-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
                          title={plan.isLocked ? "Mở khóa vị trí" : "Khóa vị trí (Lock)"}
                          onClick={() => onUpdateFloorPlan({ ...plan, isLocked: !plan.isLocked })}
                        >
                          {plan.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}

                    {/* Actual Blueprint Graphic */}
                    <div className="w-full h-full bg-white relative">
                      <img
                        src={plan.imageData}
                        alt={plan.name}
                        className="w-full h-full object-contain pointer-events-none block select-none"
                        draggable={false}
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    
                    {/* Miro 8-Dot Resize Handles and 4 Connection Handles (Only show when selected and unlocked) */}
                    {activeWhiteboardTool === 'select' && isFocused && !plan.isLocked && (
                      <>
                        {/* 4 Connection Handles (Light blue dots that draw arrows) */}
                        <div 
                          className="absolute top-1/2 -left-6 -translate-y-1/2 w-3.5 h-3.5 bg-white border border-[#2563eb] rounded-full cursor-crosshair z-40 pointer-events-auto opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center before:absolute before:-inset-4 before:content-[''] group/conn shadow-sm"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setActiveWhiteboardTool('elbow-arrow');
                            setIsDrawing(true);
                            setDrawParentId(boardId);
                            setDrawingConnectionFrom({ annotId: plan.id, direction: 'left' });
                            const { x: boardX, y: boardY } = getCanvasCoords(e.clientX, e.clientY);
                            const layout = getLayoutForPlan(boardId);
                            const pctX = ((boardX - layout.x) / layout.w) * 100;
                            const pctY = ((boardY - layout.y) / layout.h) * 100;
                            setDrawStartPct({ x: pctX, y: pctY });
                            setTempAnnot({ id: `annot-${Date.now()}`, floorPlanId: boardId, type: 'elbow-arrow', x: pctX, y: pctY, endX: pctX, endY: pctY, width: 1, height: 1, color: currentColor, content: '', createdAt: Date.now(), userName: activeUserRole.name, comments: [] });
                          }}
                        >
                          <div className="w-1.5 h-1.5 bg-[#2563eb] rounded-full group-hover/conn:scale-125 transition-transform" />
                        </div>
                        <div 
                          className="absolute top-1/2 -right-6 -translate-y-1/2 w-3.5 h-3.5 bg-white border border-[#2563eb] rounded-full cursor-crosshair z-40 pointer-events-auto opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center before:absolute before:-inset-4 before:content-[''] group/conn shadow-sm"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setActiveWhiteboardTool('elbow-arrow');
                            setIsDrawing(true);
                            setDrawParentId(boardId);
                            setDrawingConnectionFrom({ annotId: plan.id, direction: 'right' });
                            const { x: boardX, y: boardY } = getCanvasCoords(e.clientX, e.clientY);
                            const layout = getLayoutForPlan(boardId);
                            const pctX = ((boardX - layout.x) / layout.w) * 100;
                            const pctY = ((boardY - layout.y) / layout.h) * 100;
                            setDrawStartPct({ x: pctX, y: pctY });
                            setTempAnnot({ id: `annot-${Date.now()}`, floorPlanId: boardId, type: 'elbow-arrow', x: pctX, y: pctY, endX: pctX, endY: pctY, width: 1, height: 1, color: currentColor, content: '', createdAt: Date.now(), userName: activeUserRole.name, comments: [] });
                          }}
                        >
                          <div className="w-1.5 h-1.5 bg-[#2563eb] rounded-full group-hover/conn:scale-125 transition-transform" />
                        </div>
                        <div 
                          className="absolute -top-6 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white border border-[#2563eb] rounded-full cursor-crosshair z-40 pointer-events-auto opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center before:absolute before:-inset-4 before:content-[''] group/conn shadow-sm"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setActiveWhiteboardTool('elbow-arrow');
                            setIsDrawing(true);
                            setDrawParentId(boardId);
                            setDrawingConnectionFrom({ annotId: plan.id, direction: 'top' });
                            const { x: boardX, y: boardY } = getCanvasCoords(e.clientX, e.clientY);
                            const layout = getLayoutForPlan(boardId);
                            const pctX = ((boardX - layout.x) / layout.w) * 100;
                            const pctY = ((boardY - layout.y) / layout.h) * 100;
                            setDrawStartPct({ x: pctX, y: pctY });
                            setTempAnnot({ id: `annot-${Date.now()}`, floorPlanId: boardId, type: 'elbow-arrow', x: pctX, y: pctY, endX: pctX, endY: pctY, width: 1, height: 1, color: currentColor, content: '', createdAt: Date.now(), userName: activeUserRole.name, comments: [] });
                          }}
                        >
                          <div className="w-1.5 h-1.5 bg-[#2563eb] rounded-full group-hover/conn:scale-125 transition-transform" />
                        </div>
                        <div 
                          className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white border border-[#2563eb] rounded-full cursor-crosshair z-40 pointer-events-auto opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center before:absolute before:-inset-4 before:content-[''] group/conn shadow-sm"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            setActiveWhiteboardTool('elbow-arrow');
                            setIsDrawing(true);
                            setDrawParentId(boardId);
                            setDrawingConnectionFrom({ annotId: plan.id, direction: 'bottom' });
                            const { x: boardX, y: boardY } = getCanvasCoords(e.clientX, e.clientY);
                            const layout = getLayoutForPlan(boardId);
                            const pctX = ((boardX - layout.x) / layout.w) * 100;
                            const pctY = ((boardY - layout.y) / layout.h) * 100;
                            setDrawStartPct({ x: pctX, y: pctY });
                            setTempAnnot({ id: `annot-${Date.now()}`, floorPlanId: boardId, type: 'elbow-arrow', x: pctX, y: pctY, endX: pctX, endY: pctY, width: 1, height: 1, color: currentColor, content: '', createdAt: Date.now(), userName: activeUserRole.name, comments: [] });
                          }}
                        >
                          <div className="w-1.5 h-1.5 bg-[#2563eb] rounded-full group-hover/conn:scale-125 transition-transform" />
                        </div>

                        {/* 4 Corners (White circles with blue border) with massive invisible padding */}
                        <div 
                          className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-white border border-[#2563eb] rounded-full cursor-nwse-resize z-50 pointer-events-auto before:absolute before:-inset-4 before:content-['']"
                          onPointerDown={(e) => {
                            e.stopPropagation(); setResizingPlanId(plan.id);
                            setResizeStartInfo({ startX: e.clientX, startY: e.clientY, startWidth: fw, startHeight: h, startPlanX: pos.x, startPlanY: pos.y, direction: 'nw', planId: plan.id });
                          }}
                        />
                        <div 
                          className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-white border border-[#2563eb] rounded-full cursor-nesw-resize z-50 pointer-events-auto before:absolute before:-inset-4 before:content-['']"
                          onPointerDown={(e) => {
                            e.stopPropagation(); setResizingPlanId(plan.id);
                            setResizeStartInfo({ startX: e.clientX, startY: e.clientY, startWidth: fw, startHeight: h, startPlanX: pos.x, startPlanY: pos.y, direction: 'ne', planId: plan.id });
                          }}
                        />
                        <div 
                          className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-white border border-[#2563eb] rounded-full cursor-nesw-resize z-50 pointer-events-auto before:absolute before:-inset-4 before:content-['']"
                          onPointerDown={(e) => {
                            e.stopPropagation(); setResizingPlanId(plan.id);
                            setResizeStartInfo({ startX: e.clientX, startY: e.clientY, startWidth: fw, startHeight: h, startPlanX: pos.x, startPlanY: pos.y, direction: 'sw', planId: plan.id });
                          }}
                        />
                        <div
                          className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border border-[#2563eb] rounded-full cursor-nwse-resize z-50 pointer-events-auto shadow-sm before:absolute before:-inset-4 before:content-['']"
                          onPointerDown={(e) => {
                            e.stopPropagation(); setResizingPlanId(plan.id);
                            setResizeStartInfo({ startX: e.clientX, startY: e.clientY, startWidth: fw, startHeight: h, startPlanX: pos.x, startPlanY: pos.y, direction: 'se', planId: plan.id });
                          }}
                        />

                        {/* 4 Edges (Solid blue dots) with massive invisible padding */}
                        <div 
                          className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-[#2563eb] rounded-full cursor-ew-resize z-50 pointer-events-auto shadow-sm before:absolute before:-inset-4 before:content-['']"
                          onPointerDown={(e) => {
                            e.stopPropagation(); setResizingPlanId(plan.id);
                            setResizeStartInfo({ startX: e.clientX, startY: e.clientY, startWidth: fw, startHeight: h, startPlanX: pos.x, startPlanY: pos.y, direction: 'w', planId: plan.id });
                          }}
                        />
                        <div 
                          className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-[#2563eb] rounded-full cursor-ew-resize z-50 pointer-events-auto shadow-sm before:absolute before:-inset-4 before:content-['']"
                          onPointerDown={(e) => {
                            e.stopPropagation(); setResizingPlanId(plan.id);
                            setResizeStartInfo({ startX: e.clientX, startY: e.clientY, startWidth: fw, startHeight: h, startPlanX: pos.x, startPlanY: pos.y, direction: 'e', planId: plan.id });
                          }}
                        />
                        <div 
                          className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#2563eb] rounded-full cursor-ns-resize z-50 pointer-events-auto shadow-sm before:absolute before:-inset-4 before:content-['']"
                          onPointerDown={(e) => {
                            e.stopPropagation(); setResizingPlanId(plan.id);
                            setResizeStartInfo({ startX: e.clientX, startY: e.clientY, startWidth: fw, startHeight: h, startPlanX: pos.x, startPlanY: pos.y, direction: 'n', planId: plan.id });
                          }}
                        />
                        <div 
                          className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#2563eb] rounded-full cursor-ns-resize z-50 pointer-events-auto shadow-sm before:absolute before:-inset-4 before:content-['']"
                          onPointerDown={(e) => {
                            e.stopPropagation(); setResizingPlanId(plan.id);
                            setResizeStartInfo({ startX: e.clientX, startY: e.clientY, startWidth: fw, startHeight: h, startPlanX: pos.x, startPlanY: pos.y, direction: 's', planId: plan.id });
                          }}
                        />
                      </>
                    )}
                  </div>
                );
              })}


              {/* SINGLE CORE VECTOR GEOMETRY SVG LAYER OVER WHOLE BOARD */}
              <svg
                viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
                className="absolute inset-0 w-full h-full pointer-events-none z-[35]"
              >
                {/* Custom Marker Arrow head definitions */}
                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill={currentColor} />
                  </marker>
                  {annotations.map(annot => (
                    <marker 
                      key={`arrowmarker-${annot.id}`} 
                      id={`arrow-${annot.id}`} 
                      viewBox="0 0 10 10" 
                      refX="5" 
                      refY="5" 
                      markerWidth="6" 
                      markerHeight="6" 
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 0 L 10 5 L 0 10 z" fill={annot.color} />
                    </marker>
                  ))}
                </defs>

                {/* Render Geometries (rectangles, ellipses, arrows, pens) across drawings! */}
                {[...annotations].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0) || (a.createdAt || 0) - (b.createdAt || 0)).map(baseAnnot => {
                  // Merge local drag override if it exists
                  const annot = tempDragAnnots[baseAnnot.id] ? { ...baseAnnot, ...tempDragAnnots[baseAnnot.id] } : baseAnnot;

                  // LOD Optimization: Skip rendering extremely tiny vectors when zoomed out far
                  if (zoomLevel < 0.15 && (annot.type === 'pen' || annot.type === 'arrow')) return null;

                  const parentLayout = getLayoutForPlan(annot.floorPlanId);
                  const isSelected = selectedAnnotationId === annot.id;
                  const borderCol = annot.color;
                  const layout = getLayoutForPlan(annot.floorPlanId);
                  
                  // Compute absolute canvas coordinates
                  const ax = layout.x + (annot.x / 100) * layout.w;
                  const ay = layout.y + (annot.y / 100) * layout.h;
                  const aw = (annot.width / 100) * layout.w;
                  const ah = (annot.height / 100) * layout.h;

                  // Dynamic stroke styling parameters
                  const baseStrokeWidth = annot.strokeWidth !== undefined ? annot.strokeWidth : (['pen', 'arrow', 'line', 'elbow-arrow'].includes(annot.type) ? 5 : 3.5);
                  const strokeW = isSelected ? baseStrokeWidth * 1.6 : baseStrokeWidth;

                  // Custom border stroke style dash array
                  let dashArray: string | undefined = undefined;
                  if (annot.strokeDash === 'dashed') {
                    dashArray = "12,6";
                  } else if (annot.strokeDash === 'dotted') {
                    dashArray = "3,6";
                  } else if (annot.strokeDash === 'solid') {
                    dashArray = undefined;
                  } else if (isSelected) {
                    dashArray = "10,6"; // selection highlight fallback
                  }

                  // Background color & opacity config
                  const fillOpacityConfig = annot.opacity !== undefined ? annot.opacity / 100 : 0.15;
                  const fillVal = annot.opacity === 0 ? "none" : borderCol;

                  const renderResizeHandles = () => {
                    if (!isSelected || !['frame', 'rect', 'ellipse'].includes(annot.type)) return null;
                    const hCls = "pointer-events-auto transition-transform";
                    return (
                      <g>
                        <circle cx={ax} cy={ay} r="4.5" fill="white" stroke="#2563eb" strokeWidth="1.5" className={`${hCls} cursor-nwse-resize`} onMouseDown={(e) => handleAnnotResizeStart(e, annot, 'nw')} />
                        <circle cx={ax + aw / 2} cy={ay} r="4.5" fill="white" stroke="#2563eb" strokeWidth="1.5" className={`${hCls} cursor-ns-resize`} onMouseDown={(e) => handleAnnotResizeStart(e, annot, 'n')} />
                        <circle cx={ax + aw} cy={ay} r="4.5" fill="white" stroke="#2563eb" strokeWidth="1.5" className={`${hCls} cursor-nesw-resize`} onMouseDown={(e) => handleAnnotResizeStart(e, annot, 'ne')} />
                        
                        <circle cx={ax} cy={ay + ah / 2} r="4.5" fill="white" stroke="#2563eb" strokeWidth="1.5" className={`${hCls} cursor-ew-resize`} onMouseDown={(e) => handleAnnotResizeStart(e, annot, 'w')} />
                        <circle cx={ax + aw} cy={ay + ah / 2} r="4.5" fill="white" stroke="#2563eb" strokeWidth="1.5" className={`${hCls} cursor-ew-resize`} onMouseDown={(e) => handleAnnotResizeStart(e, annot, 'e')} />
                        
                        <circle cx={ax} cy={ay + ah} r="4.5" fill="white" stroke="#2563eb" strokeWidth="1.5" className={`${hCls} cursor-nesw-resize`} onMouseDown={(e) => handleAnnotResizeStart(e, annot, 'sw')} />
                        <circle cx={ax + aw / 2} cy={ay + ah} r="4.5" fill="white" stroke="#2563eb" strokeWidth="1.5" className={`${hCls} cursor-ns-resize`} onMouseDown={(e) => handleAnnotResizeStart(e, annot, 's')} />
                        <circle cx={ax + aw} cy={ay + ah} r="4.5" fill="white" stroke="#2563eb" strokeWidth="1.5" className={`${hCls} cursor-nwse-resize`} onMouseDown={(e) => handleAnnotResizeStart(e, annot, 'se')} />
                      </g>
                    );
                  };

                  const commonGroupProps = {
                    key: annot.id,
                    className: "pointer-events-auto cursor-move whiteboard-element",
                    onPointerDown: (e: React.PointerEvent) => handleAnnotDragStart(e as unknown as React.MouseEvent, annot),
                    onClick: (e: React.MouseEvent) => {
                      e.stopPropagation();
                      onSelectAnnotation(annot.id);
                      onSelectMarker(null);
                    }
                  };

                  if (annot.type === 'frame') {
                    return (
                      <g {...commonGroupProps}>
                        {/* Frame main bounding container */}
                        <rect
                          x={ax}
                          y={ay}
                          width={aw}
                          height={ah}
                          fill={annot.opacity === 0 ? "none" : (borderCol || '#2563eb')}
                          fillOpacity={annot.opacity !== undefined ? annot.opacity / 100 : 0.04}
                          stroke={borderCol || '#2563eb'}
                          strokeWidth={isSelected ? strokeW * 1.5 : 2}
                          strokeDasharray={dashArray || (isSelected ? "6,4" : undefined)}
                        />
                        {/* Interactive Corner designators for aesthetic precision */}
                        <path d={`M ${ax} ${ay+12} L ${ax} ${ay} L ${ax+12} ${ay}`} stroke={borderCol || '#2563eb'} strokeWidth="3.5" fill="none" />
                        <path d={`M ${ax+aw-12} ${ay} L ${ax+aw} ${ay} L ${ax+aw} ${ay+12}`} stroke={borderCol || '#2563eb'} strokeWidth="3.5" fill="none" />
                        <path d={`M ${ax} ${ay+ah-12} L ${ax} ${ay+ah} L ${ax+12} ${ay+ah}`} stroke={borderCol || '#2563eb'} strokeWidth="3.5" fill="none" />
                        <path d={`M ${ax+aw-12} ${ay+ah} L ${ax+aw} ${ay+ah} L ${ax+aw} ${ay+ah-12}`} stroke={borderCol || '#2563eb'} strokeWidth="3.5" fill="none" />
                        {renderResizeHandles()}
                      </g>
                    );
                  }

                  if (annot.type === 'rect') {
                    return (
                      <g {...commonGroupProps}>
                        <rect
                          x={ax}
                          y={ay}
                          width={aw}
                          height={ah}
                          fill={fillVal}
                          fillOpacity={fillOpacityConfig}
                          stroke={borderCol}
                          strokeWidth={strokeW}
                          strokeDasharray={dashArray}
                        />
                        {renderResizeHandles()}
                      </g>
                    );
                  }

                  if (annot.type === 'ellipse') {
                    const cx = ax + aw / 2;
                    const cy = ay + ah / 2;
                    const rx = aw / 2;
                    const ry = ah / 2;
                    return (
                      <g {...commonGroupProps}>
                        <ellipse
                          cx={cx}
                          cy={cy}
                          rx={rx}
                          ry={ry}
                          fill={fillVal}
                          fillOpacity={fillOpacityConfig}
                          stroke={borderCol}
                          strokeWidth={strokeW}
                          strokeDasharray={dashArray}
                        />
                        {renderResizeHandles()}
                      </g>
                    );
                  }

                  // Enhanced arrows, lines, and elbow routes
                  if (['line', 'arrow', 'elbow-arrow'].includes(annot.type)) {
                    const ax2 = layout.x + ((annot.endX || annot.x) / 100) * layout.w;
                    const ay2 = layout.y + ((annot.endY || annot.y) / 100) * layout.h;

                    const isArrowType = annot.type === 'arrow' || annot.type === 'elbow-arrow';
                    const isElbowType = annot.lineType === 'elbow' || annot.type === 'elbow-arrow';
                    const isCurvedType = annot.lineType === 'curved';

                    let pathD = `M ${ax} ${ay} L ${ax2} ${ay2}`;

                    if (isElbowType) {
                      const midX = (ax + ax2) / 2;
                      const midY = (ay + ay2) / 2;

                      if (annot.lineJump) {
                        // Advanced overlapping Line Jump bridge arc
                        pathD = `M ${ax} ${ay} L ${midX} ${ay} L ${midX} ${midY - 8} A 8 8 0 0 1 ${midX} ${midY + 8} L ${midX} ${ay2} L ${ax2} ${ay2}`;
                      } else {
                        pathD = `M ${ax} ${ay} L ${midX} ${ay} L ${midX} ${ay2} L ${ax2} ${ay2}`;
                      }
                    } else if (isCurvedType) {
                      const midX = (ax + ax2) / 2;
                      pathD = `M ${ax} ${ay} Q ${midX} ${ay} ${ax2} ${ay2}`;
                    }

                    return (
                      <path
                        key={annot.id}
                        d={pathD}
                        fill="none"
                        stroke={borderCol}
                        strokeWidth={strokeW}
                        strokeDasharray={dashArray}
                        markerEnd={isArrowType ? `url(#arrow-${annot.id})` : undefined}
                      />
                    );
                  }

                  if (annot.type === 'block-arrow') {
                    const ay_mid = ay + ah / 2;
                    const ay_top_shaft = ay + ah * 0.3;
                    const ay_bottom_shaft = ay + ah * 0.7;
                    const ax_arrow_start = ax + aw * 0.6;
                    const pathD = `M ${ax} ${ay_top_shaft} 
                                   L ${ax_arrow_start} ${ay_top_shaft} 
                                   L ${ax_arrow_start} ${ay} 
                                   L ${ax + aw} ${ay_mid} 
                                   L ${ax_arrow_start} ${ay + ah} 
                                   L ${ax_arrow_start} ${ay_bottom_shaft} 
                                   L ${ax} ${ay_bottom_shaft} Z`;
                    return (
                      <path
                        key={annot.id}
                        d={pathD}
                        fill={fillVal}
                        fillOpacity={fillOpacityConfig}
                        stroke={borderCol}
                        strokeWidth={strokeW}
                        strokeDasharray={dashArray}
                      />
                    );
                  }

                  if (annot.type === 'rhombus') {
                    const midX = ax + aw / 2;
                    const midY = ay + ah / 2;
                    const points = `${midX},${ay} ${ax + aw},${midY} ${midX},${ay + ah} ${ax},${midY}`;
                    return (
                      <polygon
                        key={annot.id}
                        points={points}
                        fill={fillVal}
                        fillOpacity={fillOpacityConfig}
                        stroke={borderCol}
                        strokeWidth={strokeW}
                        strokeDasharray={dashArray}
                      />
                    );
                  }

                  if (annot.type === 'triangle') {
                    const midX = ax + aw / 2;
                    const points = `${midX},${ay} ${ax + aw},${ay + ah} ${ax},${ay + ah}`;
                    return (
                      <polygon
                        key={annot.id}
                        points={points}
                        fill={fillVal}
                        fillOpacity={fillOpacityConfig}
                        stroke={borderCol}
                        strokeWidth={strokeW}
                        strokeDasharray={dashArray}
                      />
                    );
                  }

                  if (annot.type === 'diagram') {
                    return (
                      <g key={annot.id}>
                        <rect
                          x={ax}
                          y={ay}
                          width={aw}
                          height={ah}
                          fill={fillVal}
                          fillOpacity={fillOpacityConfig}
                          stroke={borderCol}
                          strokeWidth={strokeW}
                          strokeDasharray={dashArray}
                        />
                        <line
                          x1={ax + Math.min(10, aw * 0.15)}
                          y1={ay}
                          x2={ax + Math.min(10, aw * 0.15)}
                          y2={ay + ah}
                          stroke={borderCol}
                          strokeWidth={isSelected ? strokeW * 0.5 : strokeW * 0.6}
                        />
                        <line
                          x1={ax + aw - Math.min(10, aw * 0.15)}
                          y1={ay}
                          x2={ax + aw - Math.min(10, aw * 0.15)}
                          y2={ay + ah}
                          stroke={borderCol}
                          strokeWidth={isSelected ? strokeW * 0.5 : strokeW * 0.6}
                        />
                      </g>
                    );
                  }

                  if ((annot.type === 'pen' || annot.type === 'highlighter') && annot.points) {
                    const mappedPolyPoints = parsePenPointsToAbsArray(annot.points, layout);
                    const isHighlighter = annot.type === 'highlighter';
                    return (
                      <path
                        key={annot.id}
                        d={getSmoothSvgPath(mappedPolyPoints)}
                        fill="none"
                        stroke={borderCol}
                        strokeWidth={isHighlighter ? Math.max(strokeW * 3, 15) : strokeW}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray={dashArray}
                        opacity={isHighlighter ? 0.4 : 1}
                        style={{ mixBlendMode: isHighlighter ? 'multiply' : 'normal' }}
                        className="pointer-events-auto cursor-move hover:opacity-80 transition-opacity"
                        onMouseDown={(e) => handleAnnotDragStart(e, annot)}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAnnotation(annot.id);
                          onSelectMarker(null);
                        }}
                      />
                    );
                  }

                  if (annot.type === 'cloud') {
                    return (
                      <rect
                        key={annot.id}
                        x={ax}
                        y={ay}
                        width={aw}
                        height={ah}
                        fill={fillVal}
                        fillOpacity={fillOpacityConfig}
                        stroke={borderCol}
                        strokeWidth={strokeW}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="12 12"
                        rx={10}
                      />
                    );
                  }

                  return null;
                })}

                {/* Real-time live drawing preview overlay line */}
                {isDrawing && tempAnnot && (
                  <>
                    {(() => {
                      const layout = getLayoutForPlan(drawParentId);
                      const ax = layout.x + (tempAnnot.x || 0) / 100 * layout.w;
                      const ay = layout.y + (tempAnnot.y || 0) / 100 * layout.h;
                      const aw = (tempAnnot.width || 0) / 100 * layout.w;
                      const ah = (tempAnnot.height || 0) / 100 * layout.h;

                      if (tempAnnot.type === 'rect' || tempAnnot.type === 'frame') {
                        return (
                          <rect
                            x={ax}
                            y={ay}
                            width={aw}
                            height={ah}
                            fill="none"
                            stroke={currentColor}
                            strokeWidth="5"
                            strokeDasharray="8,8"
                          />
                        );
                      }
                      if (tempAnnot.type === 'ellipse') {
                        return (
                          <ellipse
                            cx={ax + aw / 2}
                            cy={ay + ah / 2}
                            rx={aw / 2}
                            ry={ah / 2}
                            fill="none"
                            stroke={currentColor}
                            strokeWidth="5"
                            strokeDasharray="8,8"
                          />
                        );
                      }
                      if (tempAnnot.type === 'arrow') {
                        const ax2 = layout.x + (tempAnnot.endX || 0) / 100 * layout.w;
                        const ay2 = layout.y + (tempAnnot.endY || 0) / 100 * layout.h;
                        return (
                          <line
                            x1={ax}
                            y1={ay}
                            x2={ax2}
                            y2={ay2}
                            stroke={currentColor}
                            strokeWidth="5"
                            markerEnd="url(#arrow)"
                          />
                        );
                      }
                      if (tempAnnot.type === 'line') {
                        const ax2 = layout.x + (tempAnnot.endX || 0) / 100 * layout.w;
                        const ay2 = layout.y + (tempAnnot.endY || 0) / 100 * layout.h;
                        return (
                          <line
                            x1={ax}
                            y1={ay}
                            x2={ax2}
                            y2={ay2}
                            stroke={currentColor}
                            strokeWidth="5"
                            strokeDasharray="4,4"
                          />
                        );
                      }
                      if (tempAnnot.type === 'elbow-arrow') {
                        const ax2 = layout.x + (tempAnnot.endX || 0) / 100 * layout.w;
                        const ay2 = layout.y + (tempAnnot.endY || 0) / 100 * layout.h;
                        const midX = (ax + ax2) / 2;
                        const pathD = `M ${ax} ${ay} L ${midX} ${ay} L ${midX} ${ay2} L ${ax2} ${ay2}`;
                        return (
                          <path
                            d={pathD}
                            fill="none"
                            stroke={currentColor}
                            strokeWidth="5"
                            markerEnd="url(#arrow)"
                          />
                        );
                      }
                      if (tempAnnot.type === 'block-arrow') {
                        const ay_mid = ay + ah / 2;
                        const ay_top_shaft = ay + ah * 0.3;
                        const ay_bottom_shaft = ay + ah * 0.7;
                        const ax_arrow_start = ax + aw * 0.6;
                        const pathD = `M ${ax} ${ay_top_shaft} 
                                       L ${ax_arrow_start} ${ay_top_shaft} 
                                       L ${ax_arrow_start} ${ay} 
                                       L ${ax + aw} ${ay_mid} 
                                       L ${ax_arrow_start} ${ay + ah} 
                                       L ${ax_arrow_start} ${ay_bottom_shaft} 
                                       L ${ax} ${ay_bottom_shaft} Z`;
                        return (
                          <path
                            d={pathD}
                            fill={`${currentColor}15`}
                            stroke={currentColor}
                            strokeWidth="3.5"
                            strokeDasharray="4,4"
                          />
                        );
                      }
                      if (tempAnnot.type === 'rhombus') {
                        const midX = ax + aw / 2;
                        const midY = ay + ah / 2;
                        const points = `${midX},${ay} ${ax + aw},${midY} ${midX},${ay + ah} ${ax},${midY}`;
                        return (
                          <polygon
                            points={points}
                            fill={`${currentColor}15`}
                            stroke={currentColor}
                            strokeWidth="3.5"
                            strokeDasharray="4,4"
                          />
                        );
                      }
                      if (tempAnnot.type === 'triangle') {
                        const midX = ax + aw / 2;
                        const points = `${midX},${ay} ${ax + aw},${ay + ah} ${ax},${ay + ah}`;
                        return (
                          <polygon
                            points={points}
                            fill={`${currentColor}15`}
                            stroke={currentColor}
                            strokeWidth="3.5"
                            strokeDasharray="4,4"
                          />
                        );
                      }
                      if (tempAnnot.type === 'cloud') {
                        return (
                          <rect
                            x={ax}
                            y={ay}
                            width={aw}
                            height={ah}
                            fill="none"
                            stroke={currentColor}
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeDasharray="12 12"
                            rx={10}
                          />
                        );
                      }
                      if (tempAnnot.type === 'diagram') {
                        return (
                          <g>
                            <rect
                              x={ax}
                              y={ay}
                              width={aw}
                              height={ah}
                              fill={`${currentColor}15`}
                              stroke={currentColor}
                              strokeWidth="3.5"
                              strokeDasharray="4,4"
                            />
                            <line
                              x1={ax + Math.min(10, aw * 0.15)}
                              y1={ay}
                              x2={ax + Math.min(10, aw * 0.15)}
                              y2={ay + ah}
                              stroke={currentColor}
                              strokeWidth="2"
                            />
                            <line
                              x1={ax + aw - Math.min(10, aw * 0.15)}
                              y1={ay}
                              x2={ax + aw - Math.min(10, aw * 0.15)}
                              y2={ay + ah}
                              stroke={currentColor}
                              strokeWidth="2"
                            />
                          </g>
                        );
                      }
                      if ((tempAnnot.type === 'pen' || tempAnnot.type === 'highlighter') && tempAnnot.points) {
                        const mappedPolyPoints = parsePenPointsToAbsArray(tempAnnot.points, layout);
                        const isHighlighter = tempAnnot.type === 'highlighter';
                        return (
                          <path
                            d={getSmoothSvgPath(mappedPolyPoints)}
                            fill="none"
                            stroke={currentColor}
                            strokeWidth={isHighlighter ? Math.max(penStrokeWidth * 3, 15) : penStrokeWidth}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity={isHighlighter ? 0.4 : 1}
                            style={{ mixBlendMode: isHighlighter ? 'multiply' : 'normal' }}
                          />
                        );
                      }
                    })()}
                  </>
                )}

                {/* Smart Alignment Guides */}
                {draggingAnnotId && alignmentGuides.x !== undefined && (() => {
                  const targetPlan = annotations.find(a => a.id === draggingAnnotId)?.floorPlanId;
                  if (!targetPlan) return null;
                  const layout = getLayoutForPlan(targetPlan);
                  const absX = layout.x + (alignmentGuides.x / 100) * layout.w;
                  return (
                    <line
                      x1={absX}
                      y1={0}
                      x2={absX}
                      y2="100%"
                      stroke="#8b5cf6"
                      strokeWidth="1.5"
                      strokeDasharray="5,5"
                      pointerEvents="none"
                    />
                  );
                })()}
                {draggingAnnotId && alignmentGuides.y !== undefined && (() => {
                  const targetPlan = annotations.find(a => a.id === draggingAnnotId)?.floorPlanId;
                  if (!targetPlan) return null;
                  const layout = getLayoutForPlan(targetPlan);
                  const absY = layout.y + (alignmentGuides.y / 100) * layout.h;
                  return (
                    <line
                      x1={0}
                      y1={absY}
                      x2="100%"
                      y2={absY}
                      stroke="#8b5cf6"
                      strokeWidth="1.5"
                      strokeDasharray="5,5"
                      pointerEvents="none"
                    />
                  );
                })()}
              </svg>


              {/* INTERACTIVE STICKY NOTES, LABELS & FAULT PIN MARKERS overlays */}
              <div className="absolute inset-0 w-full h-full pointer-events-none z-30">
                
                {/* 1. FAULT CAMERA PIN MARKERS (Mapped exactly over blueprint cards or stacked dynamically) */}
                {(() => {
                  // Group markers close to each other on the same drawing
                  const clusters: { [key: string]: MarkerNote[] } = {};
                  const visited = new Set<string>();
                  
                  // Sort markers newest first so the latest error at a spot is the primary one
                  const sorted = [...markers].sort((a, b) => b.createdAt - a.createdAt);
                  
                  for (const m of sorted) {
                    if (visited.has(m.id)) continue;
                    
                    // Find close markers on the same floor plan
                    const closeGroup = sorted.filter(other => {
                      if (other.floorPlanId !== m.floorPlanId || visited.has(other.id)) return false;
                      const dx = other.x - m.x;
                      const dy = other.y - m.y;
                      const distance = Math.sqrt(dx * dx + dy * dy);
                      // Consider co-located if distance <= 2% of the drawing width/height
                      return distance <= 2.0;
                    });
                    
                    if (closeGroup.length > 0) {
                      clusters[m.id] = closeGroup;
                      for (const item of closeGroup) {
                        visited.add(item.id);
                      }
                    }
                  }

                  return Object.entries(clusters).map(([primaryId, closeGroup]) => {
                    const primaryMarker = closeGroup[0]; // The newest one is first due to sort
                    const parentIdx = groupedFloorPlans.findIndex(p => p.id === primaryMarker.floorPlanId);
                    if (parentIdx === -1) return null;
                    
                    const layout = getLayoutForPlan(primaryMarker.floorPlanId);
                    
                    // Center coordinate of this cluster grouping
                    const ax = layout.x + (primaryMarker.x / 100) * layout.w;
                    const ay = layout.y + (primaryMarker.y / 100) * layout.h;

                    // A cluster/group is selected if ANY marker in it is selected
                    const isGroupSelected = closeGroup.some(item => item.id === selectedMarkerId);
                    // A cluster is in presentation if any marker in it matches presentation slide
                    const isGroupCurrentSlide = isPresentationMode && closeGroup.some(item => activePlanMarkers[currentSlideIndex]?.id === item.id);
                    
                    const isActive = isGroupCurrentSlide || isGroupSelected;
                    
                    // Hover state: we target primaryId
                    const isHovered = hoveredMarkerId === primaryId && !isGroupSelected;
                    
                    const hasConcept = closeGroup.some(item => item.conceptNotes || item.conceptPhotoData);

                    // Determine pin color based on status tag
                    const groupStatus = primaryMarker.tags && primaryMarker.tags[0] ? primaryMarker.tags[0] : 'Chưa sửa';
                    const statusColors: Record<string, { bg: string; ping: string; border: string; glow: string }> = {
                      'Chưa sửa': { bg: '#e11d48', ping: 'bg-rose-500', border: '#ffffff', glow: '0 10px 25px rgba(225, 29, 72, 0.3)' },
                      'Đang sửa': { bg: '#f59e0b', ping: 'bg-amber-400', border: '#fde047', glow: '0 10px 25px rgba(245, 158, 11, 0.4)' },
                      'Đã duyệt': { bg: '#10b981', ping: 'bg-emerald-400', border: '#6ee7b7', glow: '0 10px 25px rgba(16, 185, 129, 0.4)' },
                    };
                    const pinStyle = statusColors[groupStatus] || statusColors['Chưa sửa'];

                    return (
                      <div
                        key={primaryId}
                        onMouseEnter={() => setHoveredMarkerId(primaryId)}
                        onMouseLeave={() => setHoveredMarkerId(null)}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 marker-pin-button pointer-events-auto`}
                        style={{ 
                          left: `${ax}px`, 
                          top: `${ay}px`,
                          zIndex: isGroupSelected || isHovered ? 50 : 30 
                        }}
                      >
                        {/* Ping Animation backplane */}
                        <span className={`absolute inline-flex h-16 w-16 rounded-full opacity-70 -left-3 -top-3 animate-ping ${
                          isGroupCurrentSlide 
                            ? 'bg-yellow-400' 
                            : isGroupSelected 
                              ? pinStyle.ping
                              : pinStyle.ping
                        }`} />
                        
                        {/* Main clickable button pin */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveFloorPlanId(primaryMarker.floorPlanId);
                            onSelectMarker(primaryMarker.id);
                            onSelectAnnotation(null);
                            setActiveWhiteboardTool('select');
                            if (isPresentationMode) {
                              const sIdx = activePlanMarkers.findIndex(m => m.id === primaryMarker.id);
                              if (sIdx !== -1) setCurrentSlideIndex(sIdx);
                            }
                          }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                          }}
                          onTouchStart={(e) => {
                            e.stopPropagation();
                          }}
                          className="relative h-10 w-10 rounded-full border-4 shadow-2xl flex items-center justify-center transition-all duration-200 transform hover:scale-125 cursor-pointer focus:outline-none"
                          style={{
                            backgroundColor: isGroupCurrentSlide 
                              ? '#f59e0b'
                              : pinStyle.bg,
                            borderColor: isGroupCurrentSlide 
                              ? '#fde047'
                              : isGroupSelected
                                ? '#ffffff'
                                : pinStyle.border,
                            color: (isGroupCurrentSlide || groupStatus === 'Đang sửa') ? '#0f172a' : '#ffffff',
                            boxShadow: isGroupSelected 
                              ? `0 0 20px rgba(99, 102, 241, 0.5), ${pinStyle.glow}`
                              : pinStyle.glow
                          }}
                        >
                          <span className="text-sm">{groupStatus === 'Đã duyệt' ? '✅' : groupStatus === 'Đang sửa' ? '🔧' : '📷'}</span>
                        </button>
                        
                        {/* Count Badge for Multi-Fault stacking */}
                        {closeGroup.length > 1 && (
                          <div 
                            className="absolute -bottom-1 -right-1 bg-amber-500 border-2 border-slate-900 text-slate-950 text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-lg select-none z-50 animate-pulse" 
                            title={`Có ${closeGroup.length} lỗi trùng lặp tại vị trí này!`}
                          >
                            {closeGroup.length}
                          </div>
                        )}

                        {/* Concept analysis indicator badge */}
                        {hasConcept && (
                          <div className="absolute -top-1.5 -right-1.5 bg-indigo-600 border-2 border-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-lg animate-bounce select-none z-50" title="Có phân tích concept ý tưởng / Ảnh minh họa">
                            💡
                          </div>
                        )}

                        {/* Interactive List Tooltip for detailed hovering */}
                        {isHovered && (
                          <div 
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            className="absolute z-65 flex flex-col bg-[#0b0d19]/98 text-slate-100 rounded-3xl border-2 border-indigo-500/80 p-3.5 shadow-[0_15px_40px_rgba(0,0,0,0.85)] w-[300px] font-sans -translate-x-1/2 -translate-y-[calc(100%+14px)] transition-all duration-150 backdrop-blur-md cursor-default pointer-events-auto"
                          >
                            <div className="text-[10px] font-black uppercase tracking-wider text-indigo-400 mb-2 flex items-center justify-between border-b border-slate-800 pb-1.5">
                              <span>📍 VỊ TRÍ: {closeGroup.length} LỖI GHI NHẬN</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setHoveredMarkerId(null);
                                  setActiveFloorPlanId(primaryMarker.floorPlanId);
                                  onAddMarker(primaryMarker.x, primaryMarker.y);
                                }}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-2.5 py-1 rounded-xl text-[8.5px] cursor-pointer transition-all flex items-center justify-center gap-1 hover:scale-105 active:scale-95 border border-emerald-500 hover:border-emerald-400 no-pan-trigger shadow-md shrink-0 select-none"
                                title="Ghi nhận thêm 1 lỗi mới chồng tại chính vị trí này"
                              >
                                ➕ Thêm lỗi ở đây
                              </button>
                            </div>

                            <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1 select-none custom-scrollbar pb-1">
                              {closeGroup.map((item) => {
                                const isItemSelected = selectedMarkerId === item.id;
                                const itemStatus = item.tags && item.tags[0] ? item.tags[0] : 'Chưa sửa';
                                const tagStyles: Record<string, string> = {
                                  'Chưa sửa': 'text-rose-400 bg-rose-500/10 border-rose-500/20',
                                  'Đang sửa': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                                  'Đã duyệt': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                                };
                                return (
                                  <div
                                    key={item.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveFloorPlanId(item.floorPlanId);
                                      onSelectMarker(item.id);
                                      onSelectAnnotation(null);
                                      setActiveWhiteboardTool('select');
                                      if (isPresentationMode) {
                                        const sIdx = activePlanMarkers.findIndex(x => x.id === item.id);
                                        if (sIdx !== -1) setCurrentSlideIndex(sIdx);
                                      }
                                    }}
                                    className={`flex items-start gap-2.5 p-2 rounded-xl border cursor-pointer transition-all duration-100 ${
                                      isItemSelected 
                                        ? 'border-indigo-500 bg-indigo-950/40 shadow-[0_0_10px_rgba(99,102,241,0.2)]' 
                                        : 'border-slate-800/80 bg-slate-900/50 hover:bg-slate-850 hover:border-slate-700'
                                    }`}
                                  >
                                    {item.photoData ? (
                                      <img 
                                        src={item.photoData} 
                                        alt="Thumbnail" 
                                        className="w-10 h-10 object-cover rounded-lg border border-slate-800 bg-slate-950 shrink-0"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : (
                                      <div className="w-10 h-10 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-center shrink-0">
                                        <Camera className="w-4 h-4 text-slate-500" />
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                                      <h6 className={`font-extrabold text-[11px] leading-tight truncate ${isItemSelected ? 'text-indigo-400' : 'text-white'}`}>
                                        {item.title || "Lỗi thi công chưa đặt tên"}
                                      </h6>
                                      <p className="text-[10px] text-slate-400 line-clamp-1 italic mt-0.5">
                                        {item.transcription || item.textNotes || "Chưa có mô tả chi tiết..."}
                                      </p>
                                      <div className="flex items-center justify-between mt-1.5 text-[9px]">
                                        <span className={`px-1.5 py-0.5 rounded border text-[8px] font-black ${tagStyles[itemStatus] || 'text-rose-400'}`}>
                                          {itemStatus}
                                        </span>
                                        <span className="text-slate-500 text-[8px] font-mono">
                                          📅 {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="mt-2.5 pt-2 border-t border-slate-800 text-center text-[8.5px] text-indigo-400 font-black tracking-wider animate-pulse select-none">
                              👉 CLICK DÒNG ĐỂ LỰA CHỌN XEM CHI TIẾT
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}

                {/* 1.5 FLOATING COLLABORATIVE COMMENT POPUP NEXT TO SELECTED PIN (Miro style) */}
                {(() => {
                  return null; // Bỏ bảng popup này đi vì đã có Sidebar
                  if (!selectedMarkerId) return null;
                  const activeM = markers.find(m => m.id === selectedMarkerId);
                  if (!activeM) return null;
                  
                  const pIdx = floorPlans.findIndex(p => p.id === activeM.floorPlanId);
                  if (pIdx === -1) return null;
                  
                  const layout = getLayoutForPlan(activeM.floorPlanId);
                  const ax = layout.x + (activeM.x / 100) * layout.w;
                  const ay = layout.y + (activeM.y / 100) * layout.h;
                  const activeComments = activeM.comments || [];
                  
                  // Handle sending comments in-place on the whiteboard canvas
                  const submitInPlaceComment = () => {
                    if (!inPlaceCommentText.trim() || !onUpdateMarker) return;
                    
                    const newReply = {
                      id: `reply-${Date.now()}`,
                      userId: activeUserRole.id,
                      userName: activeUserRole.name,
                      userRole: activeUserRole.role,
                      content: inPlaceCommentText.trim(),
                      createdAt: Date.now()
                    };
                    
                    const updated = {
                      ...activeM,
                      comments: [...activeComments, newReply]
                    };
                    
                    onUpdateMarker(updated);
                    setInPlaceCommentText('');
                  };
                  
                  const handlePopupUploadPhoto = (e: ChangeEvent<HTMLInputElement>) => {
                    const file = e.target.files?.[0];
                    if (file && onUpdateMarker) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        onUpdateMarker({
                          ...activeM,
                          photoData: reader.result as string
                        });
                      };
                      reader.readAsDataURL(file);
                    }
                  };

                  const handlePopupUploadDetail = (e: ChangeEvent<HTMLInputElement>) => {
                    const file = e.target.files?.[0];
                    if (file && onUpdateMarker) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        onUpdateMarker({
                          ...activeM,
                          conceptPhotoData: reader.result as string
                        });
                      };
                      reader.readAsDataURL(file);
                    }
                  };

                  const handleToggleStatus = (status: string) => {
                    if (!onUpdateMarker) return;
                    onUpdateMarker({
                      ...activeM,
                      tags: [status]
                    });
                  };

                  const togglePopoverAudio = () => {
                    const audioEl = document.getElementById(`popover-audio-${activeM.id}`) as HTMLAudioElement;
                    if (!audioEl) return;
                    if (audioEl.paused) {
                      audioEl.play().then(() => {
                        setIsPopoverAudioPlaying(true);
                      }).catch(err => console.error("Audio playback blocked:", err));
                      audioEl.onended = () => {
                        setIsPopoverAudioPlaying(false);
                      };
                    } else {
                      audioEl.pause();
                      setIsPopoverAudioPlaying(false);
                    }
                  };

                  const currentStatus = activeM.tags && activeM.tags[0] ? activeM.tags[0] : 'Chưa sửa';

                  return (
                    <div 
                      className="absolute z-50 pointer-events-auto flex"
                      style={{ 
                        left: `${ax + 24}px`, 
                        top: `${ay - 140}px`,
                        width: '380px'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Miro-style connective arrowhead pointing to the camera pin */}
                      <div className="absolute left-[-8px] top-[152px] w-0 h-0 border-t-[8px] border-t-transparent border-r-[8px] border-r-[#0f1222] border-b-[8px] border-b-transparent z-10" />
                      
                      {/* Dark Elegant Glass Card Popover with blue glow border from screenshot */}
                      <div className="bg-[#0f1222] text-slate-100 rounded-3xl border-2 border-indigo-500 shadow-[0_20px_50px_rgba(8,10,24,0.8)] flex flex-col w-full overflow-hidden font-sans">
                        
                        {/* Popover Header with Title and Close Button */}
                        <div className="px-4 py-3 bg-[#151930] border-b border-slate-800 flex flex-col gap-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 pr-2">
                              <input 
                                type="text"
                                value={activeM.title}
                                onChange={(e) => {
                                  if (onUpdateMarker) {
                                    onUpdateMarker({
                                      ...activeM,
                                      title: e.target.value
                                    });
                                  }
                                }}
                                className="w-full bg-transparent border-none text-white font-extrabold text-xs focus:ring-1 focus:ring-indigo-500 rounded px-1 -ml-1 text-ellipsis outline-none placeholder-slate-400"
                                placeholder="Nhập tên lỗi kỹ thuật..."
                              />
                              <div className="text-[9px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                                <Calendar className="w-2.5 h-2.5 text-indigo-400" />
                                {new Date(activeM.createdAt).toLocaleDateString('vi-VN')} {new Date(activeM.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                            
                            <button 
                              onClick={() => {
                                onSelectMarker(null);
                                setIsPopoverAudioPlaying(false);
                              }}
                              className="p-1 hover:bg-slate-800 rounded-full transition-colors cursor-pointer text-slate-400 hover:text-white shrink-0"
                              title="Đóng bảng thông tin"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Quick Interactive Status selector */}
                          <div className="flex items-center gap-1 border-t border-slate-800/80 pt-2 pb-0.5">
                            <span className="text-[9px] text-slate-400 font-bold uppercase mr-1">Trạng thái:</span>
                            {[
                              { value: 'Chưa sửa', label: '🔴 Chưa sửa', color: 'bg-rose-500/25 border-rose-500 text-rose-300' },
                              { value: 'Đang sửa', label: '🟡 Đang sửa', color: 'bg-amber-500/25 border-amber-500 text-amber-300' },
                              { value: 'Đã duyệt', label: '🟢 Đã duyệt', color: 'bg-emerald-500/25 border-emerald-500 text-emerald-300' }
                            ].map((st) => (
                              <button
                                key={st.value}
                                onClick={() => handleToggleStatus(st.value)}
                                className={`text-[9px] px-1.5 py-0.5 border rounded-md font-bold transition-all cursor-pointer ${
                                  currentStatus === st.value 
                                    ? st.color
                                    : 'bg-slate-900/50 border-slate-800/80 text-slate-400 hover:text-white'
                                }`}
                              >
                                {st.value}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Interactive Tab navigation bar */}
                        <div className="grid grid-cols-3 border-b border-slate-800 text-[10.5px] bg-[#111425] text-center font-bold">
                          <button
                            onClick={() => setPopoverTab('info')}
                            className={`py-2 flex items-center justify-center gap-1 cursor-pointer border-b-2 transition-colors ${
                              popoverTab === 'info'
                                ? 'border-emerald-500 text-emerald-400 bg-slate-900/40'
                                : 'border-transparent text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>Hiện Trạng</span>
                          </button>
                          <button
                            onClick={() => setPopoverTab('detail')}
                            className={`py-2 flex items-center justify-center gap-1 cursor-pointer border-b-2 transition-colors ${
                              popoverTab === 'detail'
                                ? 'border-cyan-500 text-cyan-400 bg-slate-900/40'
                                : 'border-transparent text-slate-400 hover:text-slate-200'
                            }`}
                            title="Gửi chi tiết bản vẽ thi công"
                          >
                            <Lightbulb className="w-3.5 h-3.5" />
                            <span>Bản Vẽ Detail</span>
                          </button>
                          <button
                            onClick={() => setPopoverTab('discuss')}
                            className={`py-2 flex items-center justify-center gap-1 cursor-pointer border-b-2 transition-colors ${
                              popoverTab === 'discuss'
                                ? 'border-indigo-500 text-indigo-400 bg-slate-900/40'
                                : 'border-transparent text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Thảo Luận ({activeComments.length})</span>
                          </button>
                        </div>
                        
                        {/* Tab Content 1: Fault Info */}
                        {popoverTab === 'info' && (
                          <div className="px-4 py-3.5 flex flex-col gap-3.5 max-h-[280px] overflow-y-auto scrollbar-thin">
                            {/* Photo field status */}
                            {activeM.photoData ? (
                              <div className="relative rounded-2xl overflow-hidden border border-slate-800 group shadow-md bg-slate-900">
                                <img 
                                  src={activeM.photoData} 
                                  alt="Hiện trạng lỗi" 
                                  className="w-full max-h-[125px] object-cover block transition-transform duration-300 group-hover:scale-105"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute bottom-1.5 left-1.5 bg-slate-950/80 border border-slate-800 text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded backdrop-blur-xs">
                                  Ảnh hiện trường thực tế
                                </div>
                                <button
                                  onClick={() => {
                                    if (onUpdateMarker) onUpdateMarker({ ...activeM, photoData: null });
                                  }}
                                  className="absolute top-1.5 right-1.5 p-1 bg-slate-950/70 hover:bg-rose-600 rounded-full border border-slate-850 text-slate-300 hover:text-white transition-colors cursor-pointer"
                                  title="Gỡ ảnh"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="h-[105px] border-2 border-dashed border-slate-800 bg-slate-900/30 rounded-2xl flex flex-col items-center justify-center text-center p-3">
                                <Camera className="w-5 h-5 text-slate-500 mb-1" />
                                <span className="text-[11px] font-bold text-slate-400 mb-1.5">Chưa có ảnh khảo sát hiện trạng</span>
                                <div>
                                  <label 
                                    htmlFor="popup-photo-uploader"
                                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-[10px] font-bold rounded-lg border border-slate-700 cursor-pointer transition-colors"
                                  >
                                    📁 Chọn tệp ảnh tải lên
                                  </label>
                                  <input 
                                    type="file" 
                                    id="popup-photo-uploader" 
                                    className="hidden" 
                                    accept="image/*" 
                                    onChange={handlePopupUploadPhoto} 
                                  />
                                </div>
                              </div>
                            )}

                            {/* Play Voice descriptions with custom audio controls */}
                            {activeM.audioData ? (
                              <div className="bg-[#12162a] border border-slate-800 p-2.5 rounded-2xl flex items-center justify-between gap-2.5">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <button
                                    onClick={togglePopoverAudio}
                                    className="w-8.5 h-8.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-full flex items-center justify-center flex-shrink-0 transition-all font-black animate-pulse cursor-pointer"
                                    title={isPopoverAudioPlaying ? "Tạm dừng" : "Phát voice note thuyết minh"}
                                  >
                                    {isPopoverAudioPlaying ? (
                                      <Pause className="w-4 h-4 fill-slate-950" />
                                    ) : (
                                      <Play className="w-4 h-4 fill-slate-950 translate-x-[1px]" />
                                    )}
                                  </button>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-[8.5px] uppercase font-black text-emerald-400 tracking-wider leading-none mb-0.5">Thuyết Minh Giọng Nói</div>
                                    <p className="text-[10px] text-slate-200 font-sans italic truncate">
                                      {activeM.transcription || 'Nhấn nút để nghe ghi chú hiện trường...'}
                                    </p>
                                  </div>
                                </div>
                                <audio 
                                  id={`popover-audio-${activeM.id}`} 
                                  src={activeM.audioData} 
                                  onEnded={() => setIsPopoverAudioPlaying(false)}
                                  className="hidden" 
                                />
                              </div>
                            ) : (
                              <div className="p-2 border border-slate-800 bg-slate-900/10 rounded-xl text-center text-[10px] text-slate-500 italic">
                                🎙 Chưa đính kèm voice note hiện trường
                              </div>
                            )}

                            {/* Detailed Description and Voice transcription translation info */}
                            <div className="flex flex-col gap-1">
                              <span className="text-[9px] uppercase font-black tracking-wider text-slate-400">Ghi chú hoặc Dịch thoại:</span>
                              <textarea
                                value={activeM.textNotes || ''}
                                onChange={(e) => {
                                  if (onUpdateMarker) {
                                    onUpdateMarker({
                                      ...activeM,
                                      textNotes: e.target.value
                                    });
                                  }
                                }}
                                rows={2}
                                className="w-full bg-[#131627] border border-slate-800 rounded-xl p-2 text-xs text-slate-200 placeholder-slate-405 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                                placeholder="Gõ mô tả lỗi kỹ thuật chi tiết tại đây..."
                              />
                            </div>
                          </div>
                        )}

                        {/* Tab Content 2: Architect's Proposed Detail & Rectification Blueprint */}
                        {popoverTab === 'detail' && (
                          <div className="px-4 py-3.5 flex flex-col gap-3.5 max-h-[280px] overflow-y-auto scrollbar-thin">
                            
                            {/* Blue explanatory Banner */}
                            <div className="bg-cyan-950/20 border border-cyan-800/40 text-[10.5px] leading-relaxed p-2.5 rounded-2xl text-cyan-300">
                              🏠 <strong>Hỗ trợ từ xa:</strong> Nhân sự ở văn phòng có thể đính kèm ảnh <strong>bản vẽ chi tiết thiết kế (Detail)</strong> & hướng dẫn kỹ thuật vào vị trí này để các bạn ngoài công trình thi công chuẩn xác!
                            </div>

                            {/* Illustrative drawing proposed detail drawing input or rendering */}
                            {activeM.conceptPhotoData ? (
                              <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 group shadow-md">
                                <img 
                                  src={activeM.conceptPhotoData} 
                                  alt="Bản vẽ Detail hướng dẫn" 
                                  className="w-full max-h-[125px] object-cover block transition-transform duration-300 group-hover:scale-105"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute bottom-1.5 left-1.5 bg-slate-950/80 border border-slate-800 text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded backdrop-blur-xs text-cyan-400">
                                  Bản vẽ Detail kỹ thuật thiết kế
                                </div>
                                <button
                                  onClick={() => {
                                    if (onUpdateMarker) onUpdateMarker({ ...activeM, conceptPhotoData: null });
                                  }}
                                  className="absolute top-1.5 right-1.5 p-1 bg-slate-950/70 hover:bg-rose-600 rounded-full border border-slate-850 text-slate-300 hover:text-white transition-colors cursor-pointer"
                                  title="Gỡ bản vẽ"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="h-[105px] border-2 border-dashed border-cyan-950 bg-cyan-950/10 rounded-2xl flex flex-col items-center justify-center text-center p-3">
                                <Lightbulb className="w-5 h-5 text-cyan-500 mb-1" />
                                <span className="text-[11px] font-bold text-slate-400 mb-1.5">Chưa gửi tệp bản vẽ Detail thiết kế</span>
                                <div>
                                  <label 
                                    htmlFor="popup-detail-uploader"
                                    className="px-2.5 py-1 bg-cyan-900/60 hover:bg-cyan-800 text-cyan-200 hover:text-white text-[10px] font-bold rounded-lg border border-cyan-800 cursor-pointer transition-colors"
                                  >
                                    ➕ Tải Bản Vẽ Detail (Ảnh)
                                  </label>
                                  <input 
                                    type="file" 
                                    id="popup-detail-uploader" 
                                    className="hidden" 
                                    accept="image/*" 
                                    onChange={handlePopupUploadDetail} 
                                  />
                                </div>
                              </div>
                            )}

                            {/* Rectifying detail texts direction guide */}
                            <div className="flex flex-col gap-1">
                              <span className="text-[9px] uppercase font-black tracking-wider text-cyan-400">Chỉ bảo kỹ thuật / Hướng dẫn cách xử lý:</span>
                              <textarea
                                value={activeM.conceptNotes || ''}
                                onChange={(e) => {
                                  if (onUpdateMarker) {
                                    onUpdateMarker({
                                      ...activeM,
                                      conceptNotes: e.target.value
                                    });
                                  }
                                }}
                                rows={3}
                                className="w-full bg-[#131627] border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-1 focus:ring-cyan-505 font-sans"
                                placeholder="Gõ hướng dẫn cách sửa, kích thước, chủng loại vật liệu sửa lỗi..."
                              />
                            </div>
                          </div>
                        )}

                        {/* Tab Content 3: Discussion List of Comments */}
                        {popoverTab === 'discuss' && (
                          <div className="px-4 py-3.5 flex flex-col gap-3 max-h-[220px] overflow-y-auto scrollbar-thin bg-[#0f1222]">
                            {activeComments.length === 0 ? (
                              <div className="py-8 text-center text-slate-500 text-xs italic flex flex-col items-center gap-1.5">
                                <MessageSquare className="w-6 h-6 text-slate-700 animate-pulse" />
                                <span>Vị trí lỗi chưa có thảo luận nào.</span>
                                <span className="text-[11px] text-indigo-400 not-italic font-medium">Bình luận nhanh dưới đây để thảo luận!</span>
                              </div>
                            ) : (
                              activeComments.map((c) => {
                                const roleCol = userRolesList.find(r => r.name === c.userName)?.color || '#4f46e5';
                                
                                // Check and replace "@mention" with styled tags
                                const renderWithMentions = (text: string) => {
                                  const parts = text.split(/(\s+)/);
                                  return parts.map((part, pIdx) => {
                                    if (part.startsWith('@')) {
                                      return (
                                        <span key={pIdx} className="text-cyan-400 font-bold bg-cyan-950/40 px-1 py-0.5 rounded text-[10.5px]">
                                          {part}
                                        </span>
                                      );
                                    }
                                    return part;
                                  });
                                };
                                
                                return (
                                  <div key={c.id} className="flex flex-col gap-0.5 text-[11px] bg-[#151829] border border-slate-800/80 p-2.5 rounded-2xl">
                                    <div className="flex items-center justify-between">
                                      <span className="font-extrabold text-white flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: roleCol }} />
                                        {c.userName}
                                      </span>
                                      <span className="text-[8.5px] text-slate-500 font-mono">
                                        {new Date(c.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                    <span className="text-[8.5px] font-bold text-indigo-305 text-indigo-300 uppercase tracking-widest">
                                      {c.userRole}
                                    </span>
                                    <p className="text-slate-300 mt-1 font-sans break-words whitespace-pre-wrap">
                                      {renderWithMentions(c.content)}
                                    </p>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                        
                        {/* Replying Context Indicator */}
                        <div className="px-4 py-1.5 bg-[#121628]/80 text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-800/60 leading-none shrink-0 border-slate-800">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full inline-block animate-pulse" style={{ backgroundColor: activeUserRole.color }} />
                            Đang bình luận: <strong className="text-slate-200">{activeUserRole.name}</strong>
                          </span>
                        </div>
                        
                        {/* Comment Input Footer area */}
                        <div className="px-3.5 py-3 bg-[#131627] border-t border-[#1e293b] flex flex-col gap-2 shrink-0">
                          <div className="flex items-stretch gap-1.5">
                            <textarea
                              rows={2}
                              value={inPlaceCommentText}
                              onChange={(e) => setInPlaceCommentText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  submitInPlaceComment();
                                }
                              }}
                              placeholder="Gõ bình luận hoặc @Username..."
                              className="flex-1 bg-[#181c32] border border-slate-800 text-xs px-3 py-1.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-white placeholder-[#4d516d] resize-none font-sans"
                            />
                            
                            <button
                              onClick={submitInPlaceComment}
                              className="px-3 bg-indigo-600 hover:bg-[#6366f1] active:bg-indigo-800 text-white rounded-xl shadow-lg transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                              title="Gửi phản hồi nhanh tại vị trí"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center justify-between text-[9px] text-[#4d516d] leading-none">
                            <span>Enter để gửi, Shift+Enter xuống dòng</span>
                            <span className="text-cyan-400 font-medium font-sans">DQH Architects</span>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })()}


                {/* 2. MIRO INTERACTIVE STICKY NOTES AND FREE TEXT IN FRAME CARD LAYERS */}
                {annotations.slice().sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0) || (a.createdAt || 0) - (b.createdAt || 0)).map((annot) => {
                  if (annot.type !== 'sticky' && annot.type !== 'text' && annot.type !== 'frame') return null;
                  
                  const isSelected = selectedAnnotationId === annot.id;
                  const isDragging = draggingAnnotId === annot.id;
                  const layout = getLayoutForPlan(annot.floorPlanId);

                  // Compute whiteboard absolute coordinate values
                  const ax = layout.x + (annot.x / 100) * layout.w;
                  const ay = layout.y + (annot.y / 100) * layout.h;
                  const aw = (annot.width / 100) * layout.w;
                  const ah = (annot.height / 100) * layout.h;

                  if (annot.type === 'frame') {
                    const isTitleEditing = editingFrameId === annot.id;
                    return (
                      <div
                        key={annot.id}
                        onMouseDown={(e) => handleAnnotDragStart(e, annot)}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAnnotation(annot.id);
                          onSelectMarker(null);
                        }}
                        className={`absolute whiteboard-element pointer-events-auto select-none ${isDragging ? '' : 'transition-all'} group ${
                          isSelected ? 'z-[40]' : 'z-[36]'
                        }`}
                        style={{
                          left: `${ax}px`,
                          top: `${ay - 34}px`, // 34px above the frame top boundary
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        {/* Miro-style editable name handle tag */}
                        <div 
                          className={`px-3 py-1.5 text-xs font-extrabold flex items-center gap-1.5 rounded-t-xl border-t border-x shadow-md transition-colors ${
                            isSelected 
                              ? 'bg-indigo-600 text-white border-indigo-500' 
                              : 'bg-slate-900/95 text-indigo-400 border-slate-800 hover:text-indigo-300'
                          }`}
                        >
                          <Frame className="w-3.5 h-3.5 animate-pulse" />
                          {isTitleEditing ? (
                            <input
                              autoFocus
                              type="text"
                              value={annot.content || ''}
                              onClick={(e) => e.stopPropagation()}
                              onMouseDown={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                onUpdateAnnotation({
                                  ...annot,
                                  content: e.target.value
                                });
                              }}
                              onBlur={() => setEditingFrameId(null)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  setEditingFrameId(null);
                                }
                              }}
                              className="bg-slate-950 text-white border border-indigo-500 rounded px-1.5 py-0.5 outline-none font-extrabold text-[11px] max-w-[150px] focus:ring-1 focus:ring-indigo-400"
                            />
                          ) : (
                            <span 
                              onDoubleClick={(e) => {
                                e.stopPropagation();
                                setEditingFrameId(annot.id);
                              }}
                              className="cursor-text select-text"
                              title="Nhấp đúp chuột để đổi tên vùng"
                            >
                              {annot.content || 'Khung chưa đặt tên'}
                            </span>
                          )}
                          
                          {!isTitleEditing && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingFrameId(annot.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-850 rounded text-[10px] text-slate-300 hover:text-white transition-opacity ml-1 cursor-pointer flex items-center justify-center font-bold"
                              title="Sửa tên vùng"
                            >
                              ✐
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={annot.id}
                      onMouseDown={(e) => handleAnnotDragStart(e, annot)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAnnotation(annot.id);
                        onSelectMarker(null);
                      }}
                      className={`absolute whiteboard-element pointer-events-auto select-none ${isDragging ? '' : 'transition-all'} ${
                        isSelected ? 'ring-4 ring-indigo-500/50' : ''
                      } ${isDragging ? 'opacity-80 scale-105 cursor-grabbing' : 'cursor-grab'}`}
                      style={{
                        left: `${ax}px`,
                        top: `${ay}px`,
                        zIndex: 40,
                        width: annot.type === 'sticky' ? `${aw}px` : 'auto',
                        height: annot.type === 'sticky' ? `${ah}px` : 'auto',
                        minWidth: annot.type === 'sticky' ? '180px' : 'auto',
                        minHeight: annot.type === 'sticky' ? '150px' : 'auto',
                        opacity: annot.opacity !== undefined ? annot.opacity / 100 : 1,
                        backgroundColor: annot.type === 'sticky' ? annot.color : (isSelected ? 'transparent' : '#fef08a'),
                        borderRadius: annot.type === 'sticky' ? '16px' : '4px',
                        border: annot.type === 'sticky' 
                          ? `${annot.strokeWidth || 1}px ${annot.strokeDash === 'dashed' ? 'dashed' : annot.strokeDash === 'dotted' ? 'dotted' : 'solid'} ${annot.color}`
                          : (isSelected ? '1px dashed #ef4444' : 'none'),
                        borderLeftWidth: annot.type === 'sticky' ? '12px' : undefined,
                        padding: annot.type === 'sticky' ? '14px' : '4px 8px',
                        boxShadow: annot.type === 'sticky'
                          ? '0 10px 30px rgba(0,0,0,0.15)'
                          : (isSelected ? 'none' : '0 2px 4px rgba(0,0,0,0.1)'),
                        backdropFilter: 'none',
                        display: 'flex',
                        flexDirection: 'column' as const,
                        justifyContent: annot.type === 'sticky' ? 'space-between' : 'center',
                      }}
                    >
                      {/* Single textarea — no overlay, no double text */}
                      <textarea
                        value={annot.content}
                        onChange={(e) => {
                          onUpdateAnnotation({
                            ...annot,
                            content: e.target.value
                          });
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAnnotation(annot.id);
                        }}
                        placeholder="Gõ nội dung..."
                        spellCheck={false}
                        className="font-sans"
                        style={{
                          width: '100%',
                          height: annot.type === 'sticky' ? '100%' : 'auto',
                          minHeight: annot.type === 'text' ? '24px' : undefined,
                          background: 'transparent',
                          border: 'none',
                          outline: 'none',
                          resize: 'none',
                          fontWeight: 700,
                          lineHeight: 1.6,
                          fontSize: annot.type === 'sticky' ? '13px' : '16px',
                          color: annot.type === 'sticky'
                            ? (annot.color === '#ffffff' || annot.color === '#fcd34d' ? '#1e293b' : '#1e293b')
                            : '#ef4444',
                          cursor: activeWhiteboardTool === 'select' ? 'text' : 'inherit',
                        }}
                        disabled={activeWhiteboardTool !== 'select'}
                      />
                      
                      {/* Creator Profile Avatar bottom footer bar */}
                      {annot.type === 'sticky' && (
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-700 mt-2.5 border-t border-slate-950/10 pt-2 shrink-0">
                          <span className="truncate max-w-[120px]">✐ {annot.userName}</span>
                          {isSelected && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteAnnotation(annot.id);
                              }}
                              className="p-1 hover:bg-slate-950/10 active:bg-slate-950/20 rounded shadow-sm text-rose-800 cursor-pointer text-xs"
                              title="Delete note"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}

                      {/* Delete button for text type */}
                      {annot.type === 'text' && isSelected && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteAnnotation(annot.id);
                          }}
                          className="absolute -top-3 -right-3 p-1.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-500 rounded-full shadow-md cursor-pointer z-50"
                          title="Xóa chữ"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Blank Board Importer screen */
          <div className="flex flex-col items-center justify-center p-12 text-center max-w-sm shrink-0">
            <div className="w-20 h-20 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-6 shadow-inner animate-pulse">
              <Upload className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-slate-100 text-base mb-1">Chưa có bản vẽ dự án nào</h4>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Hãy tải lên bản vẽ thiết kế xây dựng JPG/PNG hoặc xem bản vẽ mẫu để bắt đầu whiteboard đa dự án!
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-350 font-bold px-6 py-3 rounded-2xl text-slate-950 text-xs shadow-xl cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Tải bản vẽ kỹ thuật lên ngay
            </button>
          </div>
        )}

        {/* Miro Quick bottom scale controls info HUD */}
        {floorPlans.length > 0 && (
          <div className="absolute bottom-4 right-4 z-25 bg-slate-950/95 backdrop-blur-md rounded-2xl p-1 px-3 border border-slate-800 shadow-2xl flex items-center gap-2 select-none">
            <button onClick={zoomOut} className="p-1.5 text-slate-400 hover:text-white cursor-pointer transition-colors" title="Zoom Out">
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono font-bold text-indigo-400 px-1 w-11 text-center">{Math.round(zoomLevel * 100)}%</span>
            <button onClick={zoomIn} className="p-1.5 text-slate-400 hover:text-white cursor-pointer transition-colors" title="Zoom In">
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            
            <span className="h-4 w-px bg-slate-800 mx-1"></span>

            <button 
              onClick={() => {
                focusFitAll();
              }} 
              className="px-2.5 py-1 text-[10px] bg-indigo-500/10 border border-indigo-500/15 hover:bg-indigo-500/20 text-indigo-400 rounded-lg font-bold cursor-pointer transition-all"
            >
              Reset
            </button>
          </div>
        )}



        {/* SPATIAL PRESENTATION DECK OVERLAY (Sliding Sidebar panel overlay) */}
        {isPresentationMode && currentSlideMarker && (
          <div className="absolute top-16 right-4 bottom-22 w-[480px] bg-slate-950/98 border border-slate-800/85 rounded-3xl shadow-2xl z-40 flex flex-col overflow-hidden text-slate-105 backdrop-blur-md animate-fade-in no-pan-trigger pointer-events-auto">
            {/* Header */}
            <div className="p-4 bg-slate-900 border-b border-slate-800/60 flex items-center justify-between shadow-md">
              <div className="min-w-0 pr-4">
                <span className="text-[10px] tracking-widest font-black uppercase text-indigo-400 block mb-0.5 animate-pulse">
                  ⚡ THUYẾT MINH KHÔNG GIAN DỰ ÁN ({currentSlideIndex + 1}/{activePlanMarkers.length})
                </span>
                <h3 className="text-xs font-bold text-white truncate">{currentSlideMarker.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsPresentationMode(false);
                  setIsAutoPlaying(false);
                }}
                className="p-1 px-2.5 bg-slate-800 hover:bg-rose-900/50 hover:text-rose-400 text-slate-400 border border-slate-700 rounded-xl text-[10.5px] font-bold transition-all cursor-pointer shadow-sm"
              >
                ✕ Thoát
              </button>
            </div>

            {/* Scrollable Slide Body */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 divide-y divide-slate-800/50 scrollbar-thin">
              
              {/* SECTION 1: FIELD SITE CONDITION SURVEY */}
              <div className="flex flex-col gap-2.5 pt-1">
                <span className="text-[10.5px] uppercase font-extrabold text-emerald-400 flex items-center gap-1">
                  📸 1. Khảo Sát Hiện Trạng Thực Tế
                </span>
                
                {/* Survey Image Render */}
                {currentSlideMarker.photoData ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-850 bg-slate-900 group shadow-md">
                    <img 
                      src={currentSlideMarker.photoData} 
                      alt="Hiện trạng thực tế" 
                      className="w-full max-h-[185px] object-cover block transition-transform duration-300 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-2 left-2 bg-slate-950/80 border border-slate-800 text-[9px] font-mono font-bold px-2 py-0.5 rounded-md backdrop-blur-xs">
                      Ảnh chụp hiện trường
                    </div>
                  </div>
                ) : (
                  <div className="h-[120px] bg-slate-900 border border-slate-850/60 rounded-2xl flex flex-col items-center justify-center text-center p-4">
                    <span className="text-slate-500 text-xs italic">Không có ảnh chụp hiện trạng đính kèm</span>
                  </div>
                )}

                {/* Voice notes in slideshow player */}
                {currentSlideMarker.audioData && (
                  <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-2.5 flex flex-col gap-2 shadow-sm mt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                        📢 Thuyết minh ghi âm (Audio file):
                      </span>
                      {presentationAudioUrl && (
                        <button
                          type="button"
                          onClick={togglePresentationAudio}
                          className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10px] rounded-lg cursor-pointer transition-all flex items-center gap-1 shadow-sm"
                        >
                          {isPlayingPresentationAudio ? "⏸ Dừng" : "▶ Nghe Thuyết Minh"}
                        </button>
                      )}
                    </div>
                    {presentationAudioUrl && (
                      <audio
                        id="presentation-slideshow-player"
                        src={presentationAudioUrl}
                        onEnded={() => setIsPlayingPresentationAudio(false)}
                        className="hidden"
                      />
                    )}
                    {currentSlideMarker.transcription && (
                      <p className="text-[10.5px] italic text-slate-350 leading-relaxed bg-slate-950/50 border-l-2 border-l-emerald-555 p-2 rounded-lg font-sans">
                        "{currentSlideMarker.transcription}"
                      </p>
                    )}
                  </div>
                )}

                {/* Survey detailed texts */}
                {currentSlideMarker.textNotes ? (
                  <div className="bg-slate-905/50 rounded-xl p-3 border border-slate-850 text-xs leading-relaxed text-slate-300 shadow-inner">
                    <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Mô tả chi tiết bổ túc kỹ thuật:</label>
                    <p className="font-sans break-words">{currentSlideMarker.textNotes}</p>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic">Chưa bổ sung mô tả hiện trạng chi tiết.</p>
                )}
              </div>

              {/* SECTION 2: IDEATION & DESIGN SOLUTION DECK */}
              <div className="flex flex-col gap-2.5 pt-4">
                <span className="text-[10.5px] uppercase font-extrabold text-indigo-400 flex items-center gap-1">
                  💡 2. Ý Tưởng & Giải Pháp Thiết Kế (DQH Concept)
                </span>

                {/* Moodboard Reference Render */}
                {currentSlideMarker.conceptPhotoData ? (
                  <div className="relative rounded-2xl overflow-hidden border border-indigo-950/80 bg-indigo-950/20 group shadow-md animate-fade-in">
                    <img 
                      src={currentSlideMarker.conceptPhotoData} 
                      alt="Ảnh minh họa ý tưởng" 
                      className="w-full max-h-[185px] object-cover block transition-transform duration-300 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-2 left-2 bg-indigo-950/90 border border-indigo-800/50 text-[9px] font-mono font-bold px-2 py-0.5 rounded-md text-indigo-300">
                      Moodboard Ý tưởng / Render đề xuất
                    </div>
                  </div>
                ) : (
                  <div className="h-[120px] bg-indigo-950/10 border border-indigo-950/20 border-dashed rounded-2xl flex flex-col items-center justify-center text-center p-4">
                    <span className="text-slate-500 text-xs italic mb-1">Chưa đính kèm hình ảnh minh họa concept</span>
                    <span className="text-[9px] text-slate-600">Đóng trình chiếu và vào TAB "Ý Tưởng & Minh Họa" ở Sidebar để thêm</span>
                  </div>
                )}

                {/* Concept solution notes */}
                {currentSlideMarker.conceptNotes ? (
                  <div className="bg-indigo-950/20 rounded-xl p-3 border border-indigo-900/30 text-xs leading-relaxed text-indigo-100 shadow-inner">
                    <label className="text-[10px] uppercase font-bold text-indigo-400 block mb-1">Thuyết minh giải pháp đề xuất:</label>
                    <p className="font-sans break-words">{currentSlideMarker.conceptNotes}</p>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic">Chưa bổ sung thuyết minh concept.</p>
                )}
              </div>
            </div>

            {/* Slide Navigation footer panel */}
            <div className="p-4 bg-slate-900 border-t border-slate-800/80 flex items-center justify-between shrink-0 select-none shadow-inner">
              <button
                type="button"
                disabled={currentSlideIndex === 0}
                onClick={() => setCurrentSlideIndex(currentSlideIndex - 1)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all disabled:pointer-events-none cursor-pointer flex items-center gap-0.5 border border-slate-700 shadow-sm"
              >
                ◀ Lùi lại
              </button>

              <div className="flex flex-col items-center">
                <span className="text-[11px] font-mono font-bold text-slate-350">
                  Slide {currentSlideIndex + 1} / {activePlanMarkers.length}
                </span>
                <button
                  type="button"
                  onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                  className={`text-[9.5px] uppercase font-black px-2 py-0.5 mt-1 rounded-md transition-all cursor-pointer ${
                    isAutoPlaying 
                      ? 'bg-amber-500 text-slate-950 animate-pulse' 
                      : 'bg-slate-800 text-slate-405 hover:text-slate-200 border border-slate-700'
                  }`}
                >
                  {isAutoPlaying ? "⏸ Tạm dừng chạy" : "▶ Tự động phát (10s)"}
                </button>
              </div>

              <button
                type="button"
                disabled={currentSlideIndex === activePlanMarkers.length - 1}
                onClick={() => setCurrentSlideIndex(currentSlideIndex + 1)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all disabled:pointer-events-none cursor-pointer flex items-center gap-0.5 border border-slate-700 shadow-sm"
              >
                Kế tiếp ▶
              </button>
            </div>
          </div>
        )}

        {/* MIRO-STYLE PROPERTIES CONTEXTUAL TOOLBAR */}
        {selectedAnnotation && (
          <div className="absolute left-1/2 -translate-x-1/2 top-4 z-50 flex flex-col items-center gap-1.5 select-none pointer-events-none no-pan-trigger">
            <div className="p-1.5 bg-slate-900/95 backdrop-blur-lg border border-slate-800 shadow-2xl rounded-2xl flex items-center gap-2 pointer-events-auto text-slate-100 min-h-12 px-3">
              
              {/* Element Description info indicator */}
              <div className="flex items-center gap-2 border-r border-slate-800 pr-2 mr-1">
                <span className="text-xs font-mono px-1 py-0.5 bg-slate-850 rounded text-indigo-400 capitalize">
                  {selectedAnnotation.type.replace('-arrow', ' ➔')}
                </span>
                {selectedAnnotation.isLocked && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded-full font-bold flex items-center gap-0.5 animate-pulse">
                    🔒 Đang khóa
                  </span>
                )}
              </div>

              {/* Dynamic Disabled Container based on locked status */}
              <div className={`flex items-center gap-1.5 ${selectedAnnotation.isLocked ? 'pointer-events-none opacity-30' : ''}`}>
                
                {/* 1. Color Picker circle array */}
                <div className="flex items-center gap-1 bg-slate-850/50 p-1 rounded-xl">
                  {['#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#06b6d4', '#8b5cf6', '#64748b'].map(c => (
                    <button
                      key={c}
                      onClick={() => onUpdateAnnotation({ ...selectedAnnotation, color: c })}
                      className="w-5 h-5 rounded-full border border-slate-700 cursor-pointer hover:scale-110 active:scale-95 transition-transform relative"
                      style={{ backgroundColor: c }}
                      title={`Đổi màu ${c}`}
                    >
                      {selectedAnnotation.color === c && (
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-black">✓</span>
                      )}
                    </button>
                  ))}
                  
                  {/* Custom color input tool */}
                  <input
                    type="color"
                    value={selectedAnnotation.color}
                    onChange={(e) => onUpdateAnnotation({ ...selectedAnnotation, color: e.target.value })}
                    className="w-5 h-5 bg-transparent border-0 p-0 cursor-pointer rounded-full overflow-hidden"
                    title="Màu tùy chỉnh"
                  />
                </div>

                {/* 2. Stroke Thickness Slider Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setActivePropDropdown(activePropDropdown === 'thickness' ? 'none' : 'thickness')}
                    className={`p-2 rounded-lg text-xs font-bold font-mono transition-colors flex items-center gap-1 border ${
                      activePropDropdown === 'thickness' ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/30' : 'bg-slate-850 border-slate-750 text-slate-300 hover:bg-slate-800'
                    }`}
                    title="Phát nét vẽ (Cỡ đường nét)"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>{selectedAnnotation.strokeWidth !== undefined ? selectedAnnotation.strokeWidth : (['pen', 'arrow', 'line', 'elbow-arrow'].includes(selectedAnnotation.type) ? 5 : 3.5)}px</span>
                  </button>

                  {activePropDropdown === 'thickness' && (
                    <div className="absolute left-0 top-11 z-50 p-3 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl flex flex-col gap-2 min-w-[180px]">
                      <span className="text-[10px] text-slate-400 font-bold">Cỡ đường nét (Tùy chỉnh):</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="1"
                          max="20"
                          step="1"
                          value={selectedAnnotation.strokeWidth !== undefined ? selectedAnnotation.strokeWidth : 4}
                          onChange={(e) => onUpdateAnnotation({ ...selectedAnnotation, strokeWidth: parseInt(e.target.value) })}
                          className="w-full accent-indigo-500"
                        />
                        <span className="text-xs font-mono w-6 text-right">
                          {selectedAnnotation.strokeWidth !== undefined ? selectedAnnotation.strokeWidth : 4}px
                        </span>
                      </div>
                      <div className="grid grid-cols-5 gap-1 mt-1">
                        {[2, 4, 6, 8, 12].map(v => (
                          <button
                            key={v}
                            onClick={() => {
                              onUpdateAnnotation({ ...selectedAnnotation, strokeWidth: v });
                              setActivePropDropdown('none');
                            }}
                            className={`p-1 rounded text-[10px] font-mono border ${
                              selectedAnnotation.strokeWidth === v ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                            }`}
                          >
                            {v}px
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Border Stroke Dash style switch */}
                <div className="relative">
                  <button
                    onClick={() => setActivePropDropdown(activePropDropdown === 'dash' ? 'none' : 'dash')}
                    className={`p-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 border capitalize ${
                      activePropDropdown === 'dash' ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/30' : 'bg-slate-850 border-slate-750 text-slate-300 hover:bg-slate-800'
                    }`}
                    title="Kiểu nét viền đường biên"
                  >
                    <span>{selectedAnnotation.strokeDash || 'Solid'}</span>
                  </button>

                  {activePropDropdown === 'dash' && (
                    <div className="absolute left-0 top-11 z-50 p-1 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl flex flex-col min-w-[125px]">
                      {(['solid', 'dashed', 'dotted'] as const).map(style => (
                        <button
                          key={style}
                          onClick={() => {
                            onUpdateAnnotation({ ...selectedAnnotation, strokeDash: style });
                            setActivePropDropdown('none');
                          }}
                          className={`px-3 py-1.5 text-left rounded text-xs transition-colors hover:bg-slate-850 flex items-center justify-between ${
                            selectedAnnotation.strokeDash === style || (style === 'solid' && !selectedAnnotation.strokeDash)
                              ? 'text-indigo-400 font-bold bg-slate-850/50'
                              : 'text-slate-300'
                          }`}
                        >
                          <span className="capitalize">{style}</span>
                          <span className="text-slate-500 font-mono">
                            {style === 'solid' && "━━━━━"}
                            {style === 'dashed' && "- - - -"}
                            {style === 'dotted' && ". . . ."}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Shape Fill Opacity switch */}
                <div className="relative">
                  <button
                    onClick={() => setActivePropDropdown(activePropDropdown === 'opacity' ? 'none' : 'opacity')}
                    className={`p-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 border ${
                      activePropDropdown === 'opacity' ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/30 font-bold' : 'bg-slate-850 border-slate-750 text-slate-300 hover:bg-slate-800'
                    }`}
                    title="Đổ màu nền (Nồng độ mờ Fill Alpha)"
                  >
                    <span>Mờ: {selectedAnnotation.opacity !== undefined ? `${selectedAnnotation.opacity}%` : "15%"}</span>
                  </button>

                  {activePropDropdown === 'opacity' && (
                    <div className="absolute left-0 top-11 z-50 p-2 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl flex flex-col gap-1 min-w-[140px]">
                      <span className="text-[10px] text-slate-400 font-bold p-1">Nồng độ màu nền:</span>
                      {[0, 15, 40, 75, 100].map(op => (
                        <button
                          key={op}
                          onClick={() => {
                            onUpdateAnnotation({ ...selectedAnnotation, opacity: op });
                            setActivePropDropdown('none');
                          }}
                          className={`px-3 py-1 text-left rounded text-xs transition-colors hover:bg-slate-850 flex items-center justify-between ${
                            (selectedAnnotation.opacity === op || (op === 15 && selectedAnnotation.opacity === undefined))
                              ? 'text-indigo-400 font-bold bg-slate-850/50'
                              : 'text-slate-300'
                          }`}
                        >
                          <span>{op === 0 ? "Trong suốt (None)" : `${op}%`}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 5. Path Connector routing options (Only for vectors!) */}
                {['line', 'arrow', 'elbow-arrow'].includes(selectedAnnotation.type) && (
                  <>
                    <div className="relative">
                      <button
                        onClick={() => setActivePropDropdown(activePropDropdown === 'linetype' ? 'none' : 'linetype')}
                        className={`p-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 border capitalize ${
                          activePropDropdown === 'linetype' ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/30' : 'bg-slate-850 border-slate-750 text-slate-300 hover:bg-slate-800'
                        }`}
                        title="Đường rẽ nhánh liên kết"
                      >
                        <span>Cáp: {selectedAnnotation.lineType || 'straight'}</span>
                      </button>

                      {activePropDropdown === 'linetype' && (
                        <div className="absolute left-0 top-11 z-50 p-1 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl flex flex-col min-w-[130px]">
                          {(['straight', 'elbow', 'curved'] as const).map(lt => (
                            <button
                              key={lt}
                              onClick={() => {
                                onUpdateAnnotation({ ...selectedAnnotation, lineType: lt });
                                setActivePropDropdown('none');
                              }}
                              className={`px-3 py-1.5 text-left rounded text-xs transition-colors hover:bg-slate-850 flex items-center justify-between ${
                                selectedAnnotation.lineType === lt || (lt === 'straight' && !selectedAnnotation.lineType)
                                  ? 'text-indigo-400 font-bold bg-slate-850/50'
                                  : 'text-slate-300'
                              }`}
                            >
                              <span className="capitalize">{lt}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Overlapping line jump switch */}
                    <button
                      onClick={() => onUpdateAnnotation({ ...selectedAnnotation, lineJump: !selectedAnnotation.lineJump })}
                      className={`p-2 rounded-lg text-xs font-bold transition-colors border flex items-center gap-1 ${
                        selectedAnnotation.lineJump ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-850 border-slate-750 text-slate-300 hover:bg-slate-800'
                      }`}
                      title="Chế độ Cầu nhảy dây cáp (Tránh chéo nét)"
                    >
                      <span className={selectedAnnotation.lineJump ? 'text-white' : 'text-slate-400'}>⌒</span>
                      <span>Bridge</span>
                    </button>
                  </>
                )}

                {/* 6. Sorting depth positioning layers order */}
                <div className="flex items-center gap-1 bg-slate-850 p-1 rounded-lg border border-slate-750">
                  <button
                    onClick={() => {
                      if (annotations.length <= 1) return;
                      const allTimestamps = annotations.map(a => a.createdAt || 0);
                      const minTimestamp = Math.min(...allTimestamps);
                      onUpdateAnnotation({ ...selectedAnnotation, createdAt: minTimestamp - 1000 });
                    }}
                    className="p-1.5 hover:bg-slate-750 text-slate-300 hover:text-white rounded transition-colors text-xs flex items-center gap-0.5"
                    title="Đưa ra phía sau (Send to Back)"
                  >
                     ▼ Back
                  </button>
                  <span className="h-3 w-[1px] bg-slate-750" />
                  <button
                    onClick={() => {
                      onUpdateAnnotation({ ...selectedAnnotation, createdAt: Date.now() + 10000 });
                    }}
                    className="p-1.5 hover:bg-slate-750 text-slate-300 hover:text-white rounded transition-colors text-xs flex items-center gap-0.5"
                    title="Đưa lên trên cùng (Bring to Front)"
                  >
                     ▲ Front
                  </button>
                </div>

              </div>

              {/* 7. Miro Lock / Unlock Controller (Permanently interactive out of lock) */}
              <button
                onClick={() => onUpdateAnnotation({ ...selectedAnnotation, isLocked: !selectedAnnotation.isLocked })}
                className={`p-2.5 rounded-lg transition-colors border cursor-pointer ${
                  selectedAnnotation.isLocked
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold hover:bg-amber-400 shadow-lg'
                    : 'bg-slate-850 hover:bg-slate-850 text-slate-300 border-slate-750 hover:text-slate-100'
                }`}
                title={selectedAnnotation.isLocked ? "Mở khóa hình vẽ (Unlock)" : "Khóa hình vẽ cố định (Miro-style Lock)"}
              >
                {selectedAnnotation.isLocked ? (
                  <div className="flex items-center gap-1 text-[11px]">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Mở khóa</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-[11px]">
                    <Unlock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Khóa nét</span>
                  </div>
                )}
              </button>

              {/* 8. Recycle Bin Eraser deletion button */}
              <button
                onClick={() => {
                  if (selectedAnnotation.isLocked) return;
                  onDeleteAnnotation(selectedAnnotation.id);
                  onSelectAnnotation(null);
                }}
                disabled={selectedAnnotation.isLocked}
                className="p-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg cursor-pointer transition-colors border border-rose-500 disabled:opacity-30 disabled:pointer-events-none"
                title="Xóa đối tượng"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

            </div>

            {/* Hint tip for better discoverability */}
            <p className="text-[10px] text-slate-500 font-medium bg-slate-950/80 backdrop-blur px-2.5 py-1 rounded-full shadow border border-slate-800">
              💡 {selectedAnnotation.isLocked ? "Ấn 'Mở khóa' để sửa đổi hoặc kéo thả đối tượng" : "Sử dụng phím Backspace / Delete để xóa nhanh vật thể đang chọn"}
            </p>
          </div>
        )}

        {/* MIRO-STYLE EXUCTIVE LEFT VERTICAL FLOATING TOOLBAR */}
        {floorPlans.length > 0 && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2 items-center pointer-events-none select-none">
            {/* The primary vertical bar */}
            <div className="p-2 bg-slate-900 border border-slate-850 rounded-2xl flex flex-col gap-2 shadow-2xl pointer-events-auto no-pan-trigger">
              
              {/* Tool 1: Select (Pointer) */}
              <button
                onClick={() => {
                  setActiveWhiteboardTool('select');
                  onSelectMarker(null);
                  onSelectAnnotation(null);
                  setIsShapesFlyoutOpen(false);
                  setIsFrameFlyoutOpen(false);
                  setIsPenFlyoutOpen(false);
                }}
                className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center cursor-pointer hover:bg-slate-800 ${
                  activeWhiteboardTool === 'select'
                    ? 'bg-indigo-600 text-white font-bold shadow-lg scale-105'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Công cụ Chọn & Di chuyển (V)"
              >
                <MousePointer className="w-5 h-5" />
              </button>

              <span className="w-6 h-px bg-slate-850"></span>

              {/* Tool: Pen & Drawing Flyout */}
              <div className="relative">
                <button
                  onClick={() => {
                    if (['pen', 'highlighter', 'eraser'].includes(activeWhiteboardTool)) {
                      setIsPenFlyoutOpen(!isPenFlyoutOpen);
                    } else {
                      setActiveWhiteboardTool('pen');
                      setIsPenFlyoutOpen(true);
                    }
                    onSelectMarker(null);
                    onSelectAnnotation(null);
                    setIsShapesFlyoutOpen(false);
                    setIsFrameFlyoutOpen(false);
                  }}
                  className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center cursor-pointer hover:bg-slate-800 relative ${
                    ['pen', 'highlighter', 'eraser'].includes(activeWhiteboardTool)
                      ? 'bg-indigo-600 text-white font-bold shadow-lg scale-105'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Công cụ vẽ (Bút, Dạ quang, Tẩy)"
                >
                  {activeWhiteboardTool === 'eraser' ? <Eraser className="w-5 h-5" /> : 
                   activeWhiteboardTool === 'highlighter' ? <Highlighter className="w-5 h-5" /> : 
                   <Edit3 className="w-5 h-5" />}
                  
                  {/* Small arrow indicator */}
                  <div className="absolute bottom-1 right-1 opacity-50">
                    <svg width="6" height="6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M21 21L3 21L21 3L21 21Z" />
                    </svg>
                  </div>
                </button>

                {/* PEN FLYOUT MENU */}
                {isPenFlyoutOpen && (
                  <div className="absolute left-14 top-0 bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl p-2.5 flex flex-col gap-2 w-48 z-50 animate-in fade-in zoom-in-95 duration-100">
                    
                    {/* Tool Types */}
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => setActiveWhiteboardTool('pen')}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-3 cursor-pointer ${
                          activeWhiteboardTool === 'pen' ? 'bg-indigo-55/65 text-indigo-400' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <Edit3 className="w-4 h-4" /> Bút vẽ (Pen)
                      </button>
                      <button
                        onClick={() => setActiveWhiteboardTool('highlighter')}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-3 cursor-pointer ${
                          activeWhiteboardTool === 'highlighter' ? 'bg-indigo-55/65 text-indigo-400' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <Highlighter className="w-4 h-4" /> Dạ quang
                      </button>
                      <button
                        onClick={() => setActiveWhiteboardTool('eraser')}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-3 cursor-pointer ${
                          activeWhiteboardTool === 'eraser' ? 'bg-indigo-55/65 text-indigo-400' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <Eraser className="w-4 h-4" /> Tẩy xóa
                      </button>
                    </div>

                    <hr className="border-slate-700/50 my-1 shrink-0" />

                    {/* Thickness Selector */}
                    {activeWhiteboardTool !== 'eraser' && (
                      <>
                        <div className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Độ dày nét</div>
                        <div className="flex items-center justify-around px-2 py-2">
                          {[3, 6, 12].map(w => (
                            <button
                              key={w}
                              onClick={() => setPenStrokeWidth(w)}
                              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                                penStrokeWidth === w ? 'bg-slate-700' : 'hover:bg-slate-800'
                              }`}
                            >
                              <div 
                                className="bg-slate-300 rounded-full" 
                                style={{ width: w + 2, height: w + 2 }} 
                              />
                            </button>
                          ))}
                        </div>
                        
                        <hr className="border-slate-700/50 my-1 shrink-0" />
                        
                        {/* Color Selector */}
                        <div className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Màu sắc</div>
                        <div className="flex flex-wrap gap-2 px-2 py-2">
                          {['#000000', '#f8fafc', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'].map(color => (
                            <button
                              key={color}
                              onClick={() => setCurrentColor(color)}
                              className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                                currentColor === color ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.4)]' : 'border-transparent hover:scale-105'
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Tool 2: Camera Fault / Sticky pin */}
              <div className="relative group/tool flex items-center">
                <button
                  onClick={() => {
                    setActiveWhiteboardTool('marker');
                    setIsShapesFlyoutOpen(false);
                    setIsFrameFlyoutOpen(false);
                    setIsPenFlyoutOpen(false);
                  }}
                  className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
                    activeWhiteboardTool === 'marker'
                      ? 'bg-emerald-500 text-white font-bold shadow-[0_4px_20px_rgba(16,185,129,0.4)] scale-110 ring-2 ring-emerald-400'
                      : 'text-slate-400 hover:text-slate-250 hover:bg-slate-800'
                  }`}
                  title="Ghim lỗi chụp hình & kèm Voice mô tả (Phím tắt C)"
                >
                  <Camera className="w-5 h-5" />
                </button>
                {/* Always-on active indicator next to tool, or hover tooltip description */}
                {activeWhiteboardTool === 'marker' ? (
                  <div className="absolute left-14 bg-slate-950 border border-emerald-500/50 shadow-xl rounded-xl py-1.5 px-3.5 whitespace-nowrap text-[10px] font-bold text-emerald-300 z-50 pointer-events-none flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                    Ghim hiện trường đang bật
                  </div>
                ) : (
                  <div className="absolute left-14 bg-slate-950 border border-slate-850 shadow-xl rounded-xl py-1.5 px-3.5 whitespace-nowrap text-[10px] font-bold text-slate-300 opacity-0 group-hover/tool:opacity-100 transition-opacity duration-200 pointer-events-none z-50 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    Ghim vị trí lỗi hiện trường + Camera + Voice Ghi Chú (C)
                  </div>
                )}
              </div>

              {/* Tool 3: Sticky Note */}
              <button
                onClick={() => {
                  setActiveWhiteboardTool('sticky');
                  setIsShapesFlyoutOpen(false);
                  setIsFrameFlyoutOpen(false);
                  setIsPenFlyoutOpen(false);
                }}
                className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center cursor-pointer hover:bg-slate-800 ${
                  activeWhiteboardTool === 'sticky'
                    ? 'bg-indigo-600 text-white font-bold shadow-lg scale-105'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Dán giấy nhớ (N)"
              >
                <StickyNote className="w-5 h-5 text-amber-400" />
              </button>

              {/* Tool 4: Free text */}
              <button
                onClick={() => {
                  setActiveWhiteboardTool('text');
                  setIsShapesFlyoutOpen(false);
                  setIsFrameFlyoutOpen(false);
                  setIsPenFlyoutOpen(false);
                }}
                className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center cursor-pointer hover:bg-slate-800 ${
                  activeWhiteboardTool === 'text'
                    ? 'bg-indigo-600 text-white font-bold shadow-lg scale-105'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Chèn nhãn văn bản (T)"
              >
                <Type className="w-5 h-5" />
              </button>

              <span className="w-6 h-px bg-slate-850"></span>

              {/* Tool 5: Shapes & Lines FLYOUT Trigger */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsShapesFlyoutOpen(!isShapesFlyoutOpen);
                    setIsFrameFlyoutOpen(false);
                    setIsPenFlyoutOpen(false);
                  }}
                  className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center cursor-pointer hover:bg-slate-800 relative ${
                    ['rect', 'ellipse', 'rhombus', 'triangle', 'line', 'elbow-arrow', 'block-arrow', 'diagram', 'cloud'].includes(activeWhiteboardTool)
                      ? 'bg-indigo-600 text-white font-bold shadow-lg scale-105'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Hình vẽ & Khối liên kết Miro (S/Sơ Đồ)"
                >
                  {/* Icon depending on active shape */}
                  {(() => {
                    switch (activeWhiteboardTool) {
                      case 'rect': return <Square className="w-5 h-5" />;
                      case 'ellipse': return <Circle className="w-5 h-5" />;
                      case 'rhombus': return <Diamond className="w-5 h-5" />;
                      case 'triangle': return <Triangle className="w-5 h-5" />;
                      case 'arrow': return <ArrowUpRight className="w-5 h-5" />;
                      case 'line': return (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="4" y1="20" x2="20" y2="4" />
                        </svg>
                      );
                      case 'elbow-arrow': return (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="4,20 12,20 12,4 20,4" />
                          <polygon points="17,1 20,4 17,7" fill="currentColor" />
                        </svg>
                      );
                      case 'block-arrow': return (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M4 10h10V6l6 6-6 6v-4H4z" fill="currentColor" />
                        </svg>
                      );
                      case 'diagram': return <Boxes className="w-5 h-5" />;
                      case 'cloud': return <Cloud className="w-5 h-5" />;
                      default: return <Boxes className="w-5 h-5 text-indigo-400" />;
                    }
                  })()}
                  
                  {/* Indicator small dot */}
                  <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                </button>

                {/* MIRO POPUP FLYOUT MENU SHAPES & CONNECTIONS - STYLED EXACTLY LIKE SCREENSHOT 1 */}
                {isShapesFlyoutOpen && (
                  <div className="absolute left-[52px] top-1/2 -translate-y-1/2 bg-white text-slate-800 border border-slate-200 rounded-3xl w-64 shadow-2xl p-4 flex flex-col gap-1 z-50 pointer-events-auto no-pan-trigger animate-scale-up text-left whitespace-nowrap">
                    
                    {/* SECTION 1: LINES & CONNECTORS */}
                    <div className="px-2 py-1 text-[9.5px] font-black uppercase text-slate-400 tracking-wider">Đường vẽ & Kết nối</div>
                    
                    <button
                      onClick={() => {
                        setActiveWhiteboardTool('line');
                        setIsShapesFlyoutOpen(false);
                      }}
                      className={`w-full text-xs font-bold px-2 py-1.5 rounded-xl flex items-center justify-between text-left hover:bg-slate-50 transition-colors ${
                        activeWhiteboardTool === 'line' ? 'bg-indigo-55/65 text-indigo-600' : 'text-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <svg className="w-4 h-4 text-slate-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="4" y1="20" x2="20" y2="4" />
                        </svg>
                        <span>Đường thẳng (Line)</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-450 bg-slate-100 px-1 rounded font-normal">L</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveWhiteboardTool('arrow');
                        setIsShapesFlyoutOpen(false);
                      }}
                      className={`w-full text-xs font-bold px-2 py-1.5 rounded-xl flex items-center justify-between text-left hover:bg-slate-50 transition-colors ${
                        activeWhiteboardTool === 'arrow' ? 'bg-indigo-55/65 text-indigo-600' : 'text-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <ArrowUpRight className="w-4 h-4 text-slate-500 shrink-0" />
                        <span>Mũi tên thẳng (Arrow)</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-450 bg-slate-100 px-1 rounded font-normal">A</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveWhiteboardTool('elbow-arrow');
                        setIsShapesFlyoutOpen(false);
                      }}
                      className={`w-full text-xs font-bold px-2 py-1.5 rounded-xl flex items-center justify-between text-left hover:bg-slate-50 transition-colors ${
                        activeWhiteboardTool === 'elbow-arrow' ? 'bg-indigo-55/65 text-indigo-600' : 'text-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <svg className="w-4 h-4 text-slate-500 shrink-0 shadow-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="4,20 12,20 12,4 20,4" />
                          <polygon points="17,1 20,4 17,7" fill="currentColor" />
                        </svg>
                        <span>Mũi tên vuông (Elbow)</span>
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveWhiteboardTool('block-arrow');
                        setIsShapesFlyoutOpen(false);
                      }}
                      className={`w-full text-xs font-bold px-2 py-1.5 rounded-xl flex items-center justify-between text-left hover:bg-slate-50 transition-colors ${
                        activeWhiteboardTool === 'block-arrow' ? 'bg-indigo-55/65 text-indigo-600' : 'text-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <svg className="w-4 h-4 text-slate-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M4 10h10V6l6 6-6 6v-4H4z" fill="currentColor" />
                        </svg>
                        <span>Mũi tên khối (Block Arrow)</span>
                      </span>
                    </button>

                    <hr className="border-slate-100 my-1.5 shrink-0" />

                    {/* SECTION 2: BASIC SHAPES */}
                    <div className="px-2 py-1 text-[9.5px] font-black uppercase text-slate-400 tracking-wider mt-2">Hình học & Đánh dấu</div>

                    <button
                      onClick={() => {
                        setActiveWhiteboardTool('rect');
                        setIsShapesFlyoutOpen(false);
                      }}
                      className={`w-full text-xs font-bold px-2 py-1.5 rounded-xl flex items-center justify-between text-left hover:bg-slate-50 transition-colors ${
                        activeWhiteboardTool === 'rect' ? 'bg-indigo-55/65 text-indigo-600' : 'text-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Square className="w-4 h-4 text-slate-500 shrink-0" />
                        <span>Hình chữ nhật / Hộp kỹ thuật</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-450 bg-slate-100 px-1 rounded font-normal">R</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveWhiteboardTool('cloud');
                        setIsShapesFlyoutOpen(false);
                      }}
                      className={`w-full text-xs font-bold px-2 py-1.5 rounded-xl flex items-center justify-between text-left hover:bg-slate-50 transition-colors ${
                        activeWhiteboardTool === 'cloud' ? 'bg-indigo-55/65 text-indigo-600' : 'text-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Cloud className="w-4 h-4 text-slate-500 shrink-0" />
                        <span>Khoanh đám mây (Cloud)</span>
                      </span>
                    </button>
                  </div>
                )}
              </div>



              {/* Tool 7: Frame / Vùng Tool */}
              <div className="relative">
                <button
                  onClick={() => {
                    setActiveWhiteboardTool(activeWhiteboardTool === 'frame' ? 'select' : 'frame');
                    setIsShapesFlyoutOpen(false);
                  }}
                  className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center cursor-pointer hover:bg-slate-800 ${
                    activeWhiteboardTool === 'frame'
                      ? 'bg-indigo-600 text-white font-bold shadow-lg scale-105'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Tạo vùng có đặt tên / Khung chứa Miro (F)"
                >
                  <Frame className="w-5 h-5" />
                </button>


              </div>
            </div>

            {/* Minor control accessories attached vertically under the Miro toolbar */}
            <div className="p-1 px-1.5 bg-slate-900 border border-slate-850 rounded-xl flex flex-col gap-1 shadow-2xl pointer-events-auto no-pan-trigger">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUndo();
                }}
                disabled={!canUndo}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 disabled:opacity-30 cursor-pointer transition-all active:scale-95 flex items-center justify-center"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRedo();
                }}
                disabled={!canRedo}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 disabled:opacity-30 cursor-pointer transition-all active:scale-95 flex items-center justify-center"
                title="Redo (Ctrl+Y)"
              >
                <Redo2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Importer reference element */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* 4. PROFESSIONAL HIGH-FIDELITY SURVEY & CONCEPT REPORT MODAL */}
      {isReportOpen && (
        <div id="survey-concept-report-modal" className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 overflow-y-auto p-4 md:p-8 flex items-start justify-center pointer-events-auto select-text">
          {/* Custom style block to handle clean white CSS when printing */}
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              body * {
                visibility: hidden !important;
                background: white !important;
                color: black !important;
              }
              #survey-printable-area, #survey-printable-area * {
                visibility: visible !important;
              }
              #survey-printable-area {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                background: white !important;
                color: black !important;
                padding: 0 !important;
                margin: 0 !important;
                box-shadow: none !important;
                border: none !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}} />

          <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col gap-6 relative animate-scale-up">
            
            {/* Modal Control Actions (no-print) */}
            <div className="no-print flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
              <div className="flex items-center gap-2">
                <span className="p-1 px-2.5 bg-indigo-500/10 text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-wider animate-pulse">
                  🖨️ PDF REPORT CREATOR
                </span>
                <h2 className="text-sm font-extrabold text-white">Xem Trước Bản In Báo Cáo Song Song</h2>
              </div>
              
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-350 text-slate-950 font-bold text-xs rounded-xl cursor-pointer shadow-lg transition-all flex items-center gap-2"
                >
                  <span>In Báo Cáo / Xuất PDF 🎴</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsReportOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold text-xs rounded-xl cursor-pointer transition-all border border-slate-700"
                >
                  Đóng Lại
                </button>
              </div>
            </div>

            {/* Printable Area Wrapper */}
            <div id="survey-printable-area" className="bg-white text-slate-900 p-8 md:p-12 rounded-2xl shadow-xl font-sans leading-relaxed border border-slate-200">
              
              {/* Document Header */}
              <div className="flex flex-col md:flex-row md:items-start justify-between border-b-4 border-slate-900 pb-6 mb-8 gap-6">
                <div>
                  <h1 className="text-xl font-black tracking-tight text-slate-950 uppercase select-none">
                    ĐÀO QUỐC HUY ARCHITECTS & ASSOCIATES
                  </h1>
                  <p className="text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase mt-1">
                    DQH DESIGN STUDIO • HỆ THỐNG GIÁM SÁT THỰC ĐỊA & PHẢN BIỆN DESIGN CONCEPT
                  </p>
                  <p className="text-xs text-slate-500 mt-2 font-medium">
                    Địa chỉ văn phòng: Tòa nhà D_QH, Quận 1, TP. HCM • Hotline: (+84) DESIGN-FLOW
                  </p>
                </div>
                <div className="text-left md:text-right md:min-w-[200px]">
                  <span className="text-[10px] bg-slate-100 text-slate-800 border border-slate-200 font-black px-2.5 py-1 rounded-md block w-fit md:ml-auto">
                    MÃ PHIẾU: D_QH-{floorPlan ? floorPlan.id.substring(0,6).toUpperCase() : 'SURVEY'}
                  </span>
                  <p className="text-xs font-bold text-slate-900 mt-3">Ngày lập: {new Date().toLocaleDateString('vi-VN')}</p>
                  <p className="text-[11px] text-slate-500 mt-1">Nguồn: Whiteboard D_QH Collaborative Space</p>
                </div>
              </div>

              {/* Title Section */}
              <div className="text-center mb-10 max-w-2xl mx-auto">
                <h2 className="text-lg md:text-xl font-black text-slate-950 tracking-tight uppercase leading-tight">
                  BÁO CÁO SONG SONG KHẢO SÁT HIỆN TRẠNG & BIỆN PHÁP Ý TƯỞNG THIẾT KẾ CHUYÊN SÂU
                </h2>
                <div className="h-1.5 w-16 bg-indigo-600 mx-auto my-3 rounded-full"></div>
                <p className="text-xs text-slate-500 font-medium">
                  Trực quan hóa sự tương hợp trực tiếp giữa hiện trạng sai hỏng thực tế tại công trình và layout đề xuất cải tạo thiết kế từ Team Kiến trúc sư ĐQH Architects
                </p>
              </div>

              {/* Meta brief boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 bg-slate-50 border border-slate-200/80 rounded-2xl p-4.5">
                <div>
                  <span className="text-[10px] font-mono tracking-wider text-slate-400 block uppercase">Hồ sơ thiết bản vẽ:</span>
                  <span className="text-xs font-bold text-slate-900 mt-0.5 block">{floorPlan ? floorPlan.name : 'Chưa có'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono tracking-wider text-slate-400 block uppercase">Tổng số điểm ghim:</span>
                  <span className="text-xs font-bold text-slate-900 mt-0.5 block">{activePlanMarkers.length} vị trí kỹ thuật</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono tracking-wider text-slate-400 block uppercase">Trạng thái hồ sơ:</span>
                  <span className="text-xs font-bold text-emerald-700 mt-0.5 block">✓ Đang đối sánh & Trình duyệt</span>
                </div>
              </div>

              {/* MAIN CONTENT LISTING (Parallel rows) */}
              <div className="flex flex-col gap-10">
                {activePlanMarkers.map((marker, mIdx) => (
                  <div key={marker.id} className="border-2 border-slate-200/80 rounded-2xl overflow-hidden shadow-sm page-break-inside-avoid">
                    
                    {/* Row Header Banner */}
                    <div className="bg-slate-100 border-b border-slate-200 p-3.5 flex flex-wrap items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2">
                        <span className="h-6 w-6 rounded-full bg-slate-950 text-white font-mono text-xs font-bold flex items-center justify-center">
                          {mIdx + 1}
                        </span>
                        <div>
                          <h4 className="text-xs font-black text-slate-950">{marker.title}</h4>
                          <span className="text-[9.5px] text-slate-500 font-mono">Tọa độ ghim trên mặt bằng thiết kế: X: {Math.round(marker.x)}%, Y: {Math.round(marker.y)}%</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase bg-white border border-slate-200/80 px-2 py-0.5 rounded">
                        ĐIỂM KHẢO SÁT CHUYÊN BIỆT
                      </span>
                    </div>

                    {/* Table-like Side-by-Side Dual Grid columns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                      
                      {/* Left Column: Field conditions */}
                      <div className="p-4 flex flex-col gap-3.5 bg-slate-50/30">
                        <span className="text-[10px] tracking-wide uppercase font-extrabold text-emerald-755 flex items-center gap-1 border-b border-slate-200 pb-1.5">
                          📸 PHẦN I: KHẢO SÁT HIỆN TRẠNG thực tế tại hiện trường
                        </span>
                        
                        {/* Survey Image */}
                        {marker.photoData ? (
                          <div className="rounded-xl overflow-hidden border border-slate-200 bg-white max-w-sm mx-auto shadow-xs">
                            <img 
                              src={marker.photoData} 
                              alt="Khảo sát hiện trạng" 
                              className="w-full max-h-[170px] object-cover block"
                              referrerPolicy="no-referrer"
                            />
                            <div className="bg-slate-50 text-[9px] text-slate-500 font-medium px-2 py-1 text-center border-t border-slate-100">
                              Ảnh hiện trường thu thập trực tiếp
                            </div>
                          </div>
                        ) : (
                          <div className="h-[100px] border border-slate-200 border-dashed rounded-xl flex items-center justify-center p-3 text-center bg-slate-50">
                            <span className="text-slate-400 text-xs italic">Không đính kèm tệp ảnh khảo sát hiện trạng</span>
                          </div>
                        )}

                        {/* Transcription */}
                        {marker.transcription && (
                          <div className="bg-emerald-50/20 border-l-2 border-emerald-500 rounded p-2.5">
                            <span className="text-[9px] font-black uppercase text-slate-400 block mb-0.5">Bản dịch Thuyết Minh thoại hiện trường:</span>
                            <p className="text-[11px] italic text-slate-800 leading-relaxed font-sans font-medium">"{marker.transcription}"</p>
                          </div>
                        )}

                        {/* Text note description */}
                        <div className="text-xs text-slate-700 bg-white border border-slate-150 rounded-xl p-3 shadow-xs">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Mô tả bổ túc kỹ thuật thực địa:</span>
                          {marker.textNotes ? (
                            <p className="font-sans whitespace-pre-wrap leading-relaxed">{marker.textNotes}</p>
                          ) : (
                            <p className="text-slate-400 italic">Kiến trúc sư chưa bổ sung mô tả khảo sát.</p>
                          )}
                        </div>
                      </div>

                      {/* Right Column: Concept Solutions */}
                      <div className="p-4 flex flex-col gap-3.5">
                        <span className="text-[10px] tracking-wide uppercase font-extrabold text-indigo-755 flex items-center gap-1 border-b border-slate-200 pb-1.5">
                          💡 PHẦN II: BIỆN PHÁP Ý tưởng & Giải Pháp (DQH Design Reference)
                        </span>

                        {/* Concept Design Image */}
                        {marker.conceptPhotoData ? (
                          <div className="rounded-xl overflow-hidden border border-slate-200 bg-white max-w-sm mx-auto shadow-xs animate-fade-in">
                            <img 
                              src={marker.conceptPhotoData} 
                              alt="Ý tưởng thiết kế" 
                              className="w-full max-h-[170px] object-cover block"
                              referrerPolicy="no-referrer"
                            />
                            <div className="bg-indigo-50 text-[9px] text-indigo-700 font-medium px-2 py-1 text-center border-t border-slate-100">
                              Ý tưởng đề xuất / Render Concept / Catalog tệp mẫu
                            </div>
                          </div>
                        ) : (
                          <div className="h-[100px] border border-slate-200 border-dashed rounded-xl flex items-center justify-center p-3 text-center bg-slate-50">
                            <span className="text-slate-400 text-xs italic">Không đính kèm minh họa Concept cải tạo</span>
                          </div>
                        )}

                        {/* Concept notes text desc */}
                        <div className="text-xs text-slate-700 bg-indigo-50/15 border border-indigo-100 rounded-xl p-3 shadow-xs">
                          <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider block mb-1">Thuyết minh giải pháp kiến trúc đề xuất:</span>
                          {marker.conceptNotes ? (
                            <p className="font-sans text-slate-900 whitespace-pre-wrap leading-relaxed">{marker.conceptNotes}</p>
                          ) : (
                            <p className="text-slate-400 italic">Kiến trúc sư chưa bổ sung thuyết minh concept.</p>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                ))}
              </div>

              {/* Signature bottom blocks for legal design handoffs */}
              <div className="border-t-2 border-slate-350 mt-12 pt-8 grid grid-cols-2 gap-12 page-break-inside-avoid">
                <div className="text-center">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-widest block">CHỦ ĐẦU TƯ / BAN QUẢN LÝ DỰ ÁN</span>
                  <span className="text-[10px] italic text-slate-400 block mt-1">(Ký, ghi rõ họ tên và đóng dấu duyệt giải pháp)</span>
                  <div className="h-20"></div>
                  <span className="h-px bg-slate-200 w-32 block mx-auto"></span>
                </div>
                <div className="text-center">
                  <span className="text-[11px] font-medium text-slate-500 uppercase tracking-widest block">ĐẠI DIỆN ĐƠN VỊ TƯ VẤN THIẾT KẾ</span>
                  <span className="text-[10px] italic text-slate-400 block mt-1">DQH Architects & Associates</span>
                  <div className="h-20"></div>
                  <span className="h-px bg-slate-200 w-32 block mx-auto"></span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
      
      {/* 4. CONTEXT MENU (Miro Style) */}
      {contextMenu.visible && contextMenu.targetType && (
        <div 
          className="absolute z-[9999] bg-white rounded-lg shadow-[0_4px_24px_rgba(0,0,0,0.12)] border border-slate-200 py-1.5 w-64 font-sans select-none flex flex-col pointer-events-auto"
          style={{ 
            left: Math.min(contextMenu.x, window.innerWidth - 260), 
            top: Math.min(contextMenu.y, window.innerHeight - 300) 
          }}
          onContextMenu={(e) => e.preventDefault()}
        >
          {(() => {
            let isTargetLocked = false;
            if (contextMenu.targetType === 'annot' && contextMenu.targetId) {
               isTargetLocked = !!annotations.find(a => a.id === contextMenu.targetId)?.isLocked;
            } else if (contextMenu.targetType === 'plan' && contextMenu.targetId) {
               isTargetLocked = !!floorPlans.find(p => p.id === contextMenu.targetId)?.isLocked;
            }
            return (
              <>
                {/* Menu Items */}
          <button 
            className="flex items-center justify-between w-full px-4 py-2 hover:bg-slate-100 text-left text-[13px] text-slate-800 transition-colors"
            onClick={() => {
              if (contextMenu.targetType === 'annot' && contextMenu.targetId) {
                const target = annotations.find(a => a.id === contextMenu.targetId);
                if (target) {
                  onAddAnnotation({ ...target, id: `annot-${Date.now()}`, x: target.x + 2, y: target.y + 2, createdAt: Date.now() });
                }
              }
              setContextMenu({ ...contextMenu, visible: false });
            }}
          >
            <span>Duplicate</span>
            <span className="text-slate-400 text-xs">Ctrl + D</span>
          </button>
          
          <button 
            className="flex items-center justify-between w-full px-4 py-2 hover:bg-slate-100 text-left text-[13px] text-slate-800 transition-colors"
            onClick={() => {
              // Quick copy to clipboard as JSON
              if (contextMenu.targetType === 'annot' && contextMenu.targetId) {
                const target = annotations.find(a => a.id === contextMenu.targetId);
                if (target) navigator.clipboard.writeText(JSON.stringify(target));
              }
              setContextMenu({ ...contextMenu, visible: false });
            }}
          >
            <span>Copy</span>
            <span className="text-slate-400 text-xs">Ctrl + C</span>
          </button>
          
          <div className="h-px bg-slate-200 my-1 w-full" />
          
          {contextMenu.targetType === 'annot' && (
            <>
              <button 
                className="flex items-center justify-between w-full px-4 py-2 hover:bg-slate-100 text-left text-[13px] text-slate-800 transition-colors"
                onClick={() => {
                  if (contextMenu.targetId) {
                     const target = annotations.find(a => a.id === contextMenu.targetId);
                     if (target) {
                        const maxZ = Math.max(...annotations.map(a => a.zIndex || 0), 0);
                        onUpdateAnnotation({ ...target, zIndex: maxZ + 1 });
                     }
                  }
                  setContextMenu({ ...contextMenu, visible: false });
                }}
              >
                <span>Bring to front</span>
                <span className="text-slate-400 text-xs">]</span>
              </button>
              <button 
                className="flex items-center justify-between w-full px-4 py-2 hover:bg-slate-100 text-left text-[13px] text-slate-800 transition-colors"
                onClick={() => {
                  if (contextMenu.targetId) {
                     const target = annotations.find(a => a.id === contextMenu.targetId);
                     if (target) {
                        const minZ = Math.min(...annotations.map(a => a.zIndex || 0), 0);
                        onUpdateAnnotation({ ...target, zIndex: minZ - 1 });
                     }
                  }
                  setContextMenu({ ...contextMenu, visible: false });
                }}
              >
                <span>Send to back</span>
                <span className="text-slate-400 text-xs">[</span>
              </button>
              <div className="h-px bg-slate-200 my-1 w-full" />
            </>
          )}
          
          <button 
            className="flex items-center justify-between w-full px-4 py-2 hover:bg-slate-100 text-left text-[13px] text-slate-800 transition-colors"
            onClick={() => {
              if (contextMenu.targetType === 'annot' && contextMenu.targetId) {
                 const target = annotations.find(a => a.id === contextMenu.targetId);
                 if (target) onUpdateAnnotation({ ...target, isLocked: !target.isLocked });
              } else if (contextMenu.targetType === 'plan' && contextMenu.targetId) {
                 const target = floorPlans.find(p => p.id === contextMenu.targetId);
                 if (target) onUpdateFloorPlan({ ...target, isLocked: !target.isLocked });
              }
              setContextMenu({ ...contextMenu, visible: false });
            }}
          >
            <span className={isTargetLocked ? 'text-indigo-600 font-medium' : ''}>{isTargetLocked ? 'Unlock (Mở khóa)' : 'Lock (Khóa)'}</span>
            <span className="text-slate-400 text-xs">Ctrl+Shift+L</span>
          </button>
          
          {contextMenu.targetType === 'plan' && (
            <button 
              className="flex items-center justify-between w-full px-4 py-2 hover:bg-slate-100 text-left text-[13px] text-slate-800 transition-colors"
              onClick={() => {
                if (contextMenu.targetId) {
                   const target = floorPlans.find(p => p.id === contextMenu.targetId);
                   if (target) onUpdateFloorPlan({ ...target, isPinned: !target.isPinned });
                }
                setContextMenu({ ...contextMenu, visible: false });
              }}
            >
              <span>{floorPlans.find(p => p.id === contextMenu.targetId)?.isPinned ? 'Bỏ ghim (Unpin)' : 'Ghim (Pin)'}</span>
              <span className="text-slate-400 text-xs"></span>
            </button>
          )}

          <div className="h-px bg-slate-200 my-1 w-full" />
          
          <button 
            className="flex items-center justify-between w-full px-4 py-2 hover:bg-red-50 text-left text-[13px] text-red-600 transition-colors"
            onClick={() => {
               if (contextMenu.targetType === 'annot' && contextMenu.targetId) {
                  const target = annotations.find(a => a.id === contextMenu.targetId);
                  if (target && !target.isLocked) onDeleteAnnotation(contextMenu.targetId);
               } else if (contextMenu.targetType === 'plan' && contextMenu.targetId) {
                  const target = floorPlans.find(p => p.id === contextMenu.targetId);
                  if (target && !target.isLocked) onDeleteFloorPlan(contextMenu.targetId);
               }
               setContextMenu({ ...contextMenu, visible: false });
            }}
          >
            <span>Delete</span>
            <span className="text-red-300 text-xs">Del</span>
          </button>
              </>
            );
          })()}
        </div>
      )}

    </div>
  );
}
