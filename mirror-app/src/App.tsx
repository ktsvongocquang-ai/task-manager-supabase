import { useState, useEffect, useMemo, useRef } from 'react';
import { FloorPlan, MarkerNote, WhiteboardAnnotation, UserRoleProfile, Project } from './types';
import { 
  getFloorPlans, saveFloorPlan, deleteFloorPlan, getFloorPlanById,
  getMarkerNotes, saveMarkerNote, deleteMarkerNote,
  saveAnnotation, getAnnotations, deleteAnnotation,
  getProjects, saveProject, deleteProject
} from './lib/db';
import { getDemoFloorPlan, getMockProjectFloorPlan, getFlavorFloorPlan } from './lib/demoPlan';
import { 
  Camera, Mic, Plus, FileText, Trash2, Printer, Download, BookOpen, 
  Map, LayoutDashboard, Share2, Upload, Sparkles, Check, CheckCircle2, 
  ChevronRight, HelpCircle, Users, Layers, Layout, ChevronDown, Cloud, CheckSquare, Settings,
  FolderArchive, Award, Briefcase, FileSignature, CheckSquare2, FileCheck, Layers3, RefreshCw,
  Search, Star, ArrowLeft, ExternalLink, Calendar, Grid, List as ListIcon, Hammer, AlertCircle
} from 'lucide-react';
import { BottomNavBar } from './components/BottomNavBar';
import CameraModal from './components/CameraModal';
import FloorPlanViewer from './components/FloorPlanViewer';
import MarkerDetailSidebar from './components/MarkerDetailSidebar';
import OpsMapModal from './components/OpsMapModal';
import ShareProjModal from './components/ShareProjModal';
import LessonsLearnedModal from './components/LessonsLearnedModal';
import ProjectProfile from './components/ProjectProfile';
import DarkDashboard from './components/DarkDashboard';
import ReportLayout from './components/ReportLayout';
import PinMapView from './components/PinMapView';
import NotificationPanel from './components/NotificationPanel';
import CEODashboard from './components/CEODashboard';
import XUDashboard from './components/XUDashboard';
import ProgressView from './components/ProgressView';
import DefectListView from './components/DefectListView';
import KnowledgeHub from './components/KnowledgeHub';
import ProfileView from './components/ProfileView';
import { MarkerDetailModal } from './components/MarkerDetailModal';
import GlobalCaptureModal from './components/GlobalCaptureModal';
import GlobalPinSelectorModal from './components/GlobalPinSelectorModal';
import { getPdfPageCount, compressThumbnailDataUrl, renderPdfPageToImage, compressImageToBlob } from './utils/pdfUtils';
import { uploadFileWithTus } from './utils/uploadUtils';
import { supabase } from './lib/supabase';
import { notify, requestNotificationPermission, subscribeToNotifications, markRead, markAllRead, DQHNotification } from './lib/notifications';
import DefectCategorySelector, { DefectCategory, DEFECT_CATEGORIES } from './components/DefectCategorySelector';

const INITIAL_PROJECTS: Project[] = [];


export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [activeFloorPlanId, setActiveFloorPlanId] = useState<string | null>(null);
  
  // Marker pins states
  const [markerNotes, setMarkerNotes] = useState<MarkerNote[]>([]);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

  // Whiteboard annotations states (Miro features)
  const [annotations, setAnnotations] = useState<WhiteboardAnnotation[]>([]);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [activeWhiteboardTool, setActiveWhiteboardTool] = useState<'select' | 'marker' | 'sticky' | 'text' | 'rect' | 'ellipse' | 'arrow' | 'pen' | 'highlighter' | 'eraser' | 'line' | 'elbow-arrow' | 'block-arrow' | 'rhombus' | 'triangle' | 'diagram' | 'frame' | 'cloud'>('select');
  const [currentColor, setCurrentColor] = useState<string>('#f43f5e'); // Default beautiful rose-red

  // Undo / Redo history stacks
  const [undoStack, setUndoStack] = useState<WhiteboardAnnotation[][]>([]);
  const [redoStack, setRedoStack] = useState<WhiteboardAnnotation[][]>([]);

  // 3 vai trò: Admin, Giám sát, Quản lý thi công
  const userRolesList: UserRoleProfile[] = [
    { id: 'role-admin', name: 'Admin', role: 'Admin', email: 'admin@dqh.vn', tag: 'ADMIN', color: '#8b5cf6' },
    { id: 'role-gs', name: 'Giám sát', role: 'Giám sát', email: 'giamsat@dqh.vn', tag: 'GIÁM SÁT', color: '#f97316' },
    { id: 'role-ql', name: 'Quản lý TC', role: 'Quản lý thi công', email: 'quanly@dqh.vn', tag: 'QUẢN LÝ TC', color: '#3b82f6' },
  ];
  const [activeUserRole, setActiveUserRole] = useState<UserRoleProfile>(userRolesList[0]);

  // Miro-like Space & Board selections (for Left Panel organization)
  const spaces = ['Kiểm tra bàn giao HQ', 'Phase 1 - Xây thô', 'MEP & Hoàn thiện nội thất'];
  const [activeSpace, setActiveSpace] = useState<string>(spaces[0]);
  const boards = ['Bản vẽ Ground Floor', 'Sơ đồ cứu hỏa tầng lửng', 'Nhiệm thu hoàn thiện'];
  const [activeBoardName, setActiveBoardName] = useState<string>(boards[0]);

  // Modal and layout controllers
  const [showCameraModal, setShowCameraModal] = useState<boolean>(false);
  const [showReportPreview, setShowReportPreview] = useState<boolean>(false);
  const [showDowmarkModal, setShowDowmarkModal] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [showLessonsModal, setShowLessonsModal] = useState(false);
  const [recentNotifs, setRecentNotifs] = useState<DQHNotification[]>([]);

  // Global Capture Flow states
  const [isGlobalCaptureOpen, setIsGlobalCaptureOpen] = useState<boolean>(false);
  const [globalDraftFault, setGlobalDraftFault] = useState<Partial<MarkerNote> | null>(null);
  const [isGlobalPinSelectorOpen, setIsGlobalPinSelectorOpen] = useState<boolean>(false);
  const [isDefectCategorySelectorOpen, setIsDefectCategorySelectorOpen] = useState<boolean>(false);
  const [selectedDefectCategory, setSelectedDefectCategory] = useState<{category: string, subcategory: string, planType: string} | null>(null);

  // Subscribe to notifications for the dashboard feed
  useEffect(() => {
    const unsub = subscribeToNotifications((notifs) => setRecentNotifs(notifs));
    return unsub;
  }, []);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetPlanType, setUploadTargetPlanType] = useState<FloorPlan['planType'] | null>(null);
  const [showCompressPrompt, setShowCompressPrompt] = useState<{show: boolean, fileName: string, fileSize: number}>({show: false, fileName: '', fileSize: 0});

  // Optimized Workspace UI / Zen Mode controls
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState<boolean>(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState<boolean>(true);
  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState<boolean>(true);
  const [isHeaderOpen, setIsHeaderOpen] = useState<boolean>(true);
  const [isZenMode, setIsZenMode] = useState<boolean>(false);

  // Miro Dashboard states
  const [currentView, setCurrentView] = useState<'dashboard' | 'workspace'>('dashboard');
  const [workspaceView, setWorkspaceView] = useState<'profile' | 'pinmap' | 'miro' | 'report'>('profile');
  const prevWorkspaceViewRef = useRef<'profile' | 'pinmap' | 'miro' | 'report'>('profile');
  const [favoriteProjectIds, setFavoriteProjectIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('dqh_starred_projects');
    return saved ? JSON.parse(saved) : ['proj-1', 'proj-3', 'proj-8']; // default favorite projects matching screen
  });
  const [dbSearchQuery, setDbSearchQuery] = useState('');
  const [dbStatusFilter, setDbStatusFilter] = useState('all');
  const [dbSortBy, setDbSortBy] = useState('newest');
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [dashboardLayout, setDashboardLayout] = useState<'grid' | 'list'>('list'); // Miro board view defaults to List (table-like as requested)
  const [showCEODashboard, setShowCEODashboard] = useState(false);
  const [showXUDashboard, setShowXUDashboard] = useState(false);
  const [showProgressView, setShowProgressView] = useState(false);
  const [showDefectList, setShowDefectList] = useState(false);
  const [showKnowledgeHub, setShowKnowledgeHub] = useState(false);
  const [showProfileView, setShowProfileView] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState<'projects' | 'progress' | 'notifications' | 'profile'>('projects');

  // Request browser notification permission on first load
  useEffect(() => { requestNotificationPermission(); }, []);

  // Custom project creation input states
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectLeader, setNewProjectLeader] = useState('KTS. Võ Ngọc Quang');
  const [newProjectClient, setNewProjectClient] = useState('');
  const [newProjectAddress, setNewProjectAddress] = useState('');

  // Auto-open right details panel when drawing or defect element is focused
  useEffect(() => {
    if (workspaceView !== 'pinmap' && workspaceView !== prevWorkspaceViewRef.current) {
      prevWorkspaceViewRef.current = workspaceView;
    }
  }, [workspaceView]);

  useEffect(() => {
    if (selectedMarkerId || selectedAnnotationId) {
      setIsRightSidebarOpen(true);
    }
  }, [selectedMarkerId, selectedAnnotationId]);

  // Reset window scroll position and restrict document scrolling when switching views to prevent cut-off headers
  useEffect(() => {
    window.scrollTo(0, 0);
    if (currentView === 'workspace') {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [currentView, workspaceView]);

  // Fetch initial data from IndexedDB
  async function loadData() {
    try {
      setIsLoading(true);
      let plans = await getFloorPlans();
      
      // Fetch projects from Supabase
      const projsList = await getProjects();
      setProjects(projsList);

      // If plans list is empty, we seed the 3 key floorplans for ALL 10 projects!
      if (plans.length === 0) {
        const seededPlans: FloorPlan[] = [];
        
        for (const proj of projsList) {
          // Plan 1: Sàn ốp lát
          const planTiling: FloorPlan = {
            id: `${proj.id}-tiling`,
            name: `Sàn ốp lát`,
            imageData: getFlavorFloorPlan(proj.name, 'tiling'),
            width: 1000,
            height: 700,
            createdAt: Date.now() - 100,
            projectId: proj.id,
            planType: 'tiling',
            isPinned: true
          };
          await saveFloorPlan(planTiling);
          seededPlans.push(planTiling);

          // Plan 2: Gạch hiện trạng
          const planExisting: FloorPlan = {
            id: `${proj.id}-existing`,
            name: `Gạch hiện trạng`,
            imageData: getFlavorFloorPlan(proj.name, 'existing'),
            width: 1000,
            height: 700,
            createdAt: Date.now() - 200,
            projectId: proj.id,
            planType: 'existing',
            isPinned: true
          };
          await saveFloorPlan(planExisting);
          seededPlans.push(planExisting);

          // Plan 3: Bố trí nội thất
          const planLayout: FloorPlan = {
            id: `${proj.id}-layout`,
            name: `Bố trí nội thất`,
            imageData: getFlavorFloorPlan(proj.name, 'layout'),
            width: 1000,
            height: 700,
            createdAt: Date.now() - 300,
            projectId: proj.id,
            planType: 'layout',
            isPinned: true
          };
          await saveFloorPlan(planLayout);
          seededPlans.push(planLayout);

          // Seed realistic defect pins inside Project 1's plans on startup
          if (proj.id === 'proj-1') {
            const marker1: MarkerNote = {
              id: 'seeded-marker-proj1-1',
              floorPlanId: planTiling.id,
              x: 42,
              y: 52,
              title: 'Nứt sạt mạch keo vách kính tắm sát sàn',
              photoData: null,
              audioData: null,
              transcription: 'Phát hiện tại khe hở chân đế vách bath-tub. Keo co dập rách sủi bong.',
              textNotes: 'Biện pháp: KTS. Thắng chỉ thị cạo sủi sạch silicone mốc bẩn, khò khô rãnh và bơm nạp đầy keo chịu moisture mác mốt Apollo chống rêu đen.',
              createdAt: Date.now() - 3600000,
              comments: [
                { id: 'sc-1', userId: 'role-1', userName: 'Thắng', userRole: 'Quản Lý', content: 'Cần đốc thúc xử lý gấp để nghiệm thu.', createdAt: Date.now() - 1800000 }
              ],
              tags: ['Chưa sửa', 'Vách', 'Kính', 'Keo silicon']
            };
            await saveMarkerNote(marker1);

            const marker2: MarkerNote = {
              id: 'seeded-marker-proj1-2',
              floorPlanId: planExisting.id,
              x: 75,
              y: 35,
              title: 'Lệch cốt gạch hiện trạng sảnh phòng khách',
              photoData: null,
              audioData: null,
              transcription: 'Cốt bê tông lồi lõm nhô cục bộ lên 12mm vượt mức khoan cấn xây thô.',
              textNotes: 'Giải pháp: Cho máy cán mài phẳng gồ ghề bê tông nền thô, xịt rửa sạch bụi mạt rồi mới tiến hành đắp vữa hồ cát polymer bù bám dính.',
              createdAt: Date.now() - 7200000,
              comments: [
                { id: 'sc-2', userId: 'role-3', userName: 'QUANG', userRole: 'Quản trị viên', content: 'Đã hoàn tất dọn bãi bào cốt bê tông hoàn toàn phẳng.', createdAt: Date.now() - 3600000 }
              ],
              tags: ['Đang sửa', 'Sàn', 'Cốt cán', 'Bê tông']
            };
            await saveMarkerNote(marker2);

            const stickySeed: WhiteboardAnnotation = {
              id: 'seeded-sticky-proj1',
              floorPlanId: planTiling.id,
              type: 'sticky',
              x: 18,
              y: 25,
              width: 14,
              height: 12,
              color: '#f59e0b',
              content: 'Ghi chú KTS Thắng:\nƯu tiên dải hàng gạch nguyên tấm từ sảnh chính vào trong, gạch vụn xẻ ghép khuất góc tủ dồ!',
              createdAt: Date.now(),
              userName: 'Thắng'
            };
            await saveAnnotation(stickySeed);
          }
        }
        plans = seededPlans;
      } else {
        // Check for backwards compatibility: assign floorplans without projectId to Proj-1
        for (const p of plans) {
          if (!p.projectId) {
            p.projectId = 'proj-1';
            await saveFloorPlan(p);
          }
        }
      }

      setFloorPlans(plans);

      // Track active selections
      const storedActiveProjId = localStorage.getItem('last_active_project_id_v2') || projsList[0].id;
      setActiveProjectId(storedActiveProjId);

      const projectPlans = plans.filter(p => p.projectId === storedActiveProjId);
      if (projectPlans.length > 0) {
        const storedActiveId = localStorage.getItem('last_active_floor_plan_v2');
        const exists = projectPlans.some(p => p.id === storedActiveId);
        setActiveFloorPlanId(exists ? storedActiveId : projectPlans[0].id);
      } else if (plans.length > 0) {
        setActiveFloorPlanId(plans[0].id);
      }

    } catch (err) {
      console.error('Lỗi khi tải dữ liệu từ database:', err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const fetchedPdfDataIds = useRef<Set<string>>(new Set());

  // Sync markerNotes & whiteboard annotations on active floor plan changes
  useEffect(() => {
    if (activeFloorPlanId) {
      localStorage.setItem('last_active_floor_plan', activeFloorPlanId);
      
      if (!fetchedPdfDataIds.current.has(activeFloorPlanId)) {
        const plan = floorPlans.find(p => p.id === activeFloorPlanId);
        // Load pdfData on demand if it's a multi-page document
        if (plan && plan.pageCount && plan.pageCount > 1 && !plan.pdfData) {
          getFloorPlanById(activeFloorPlanId).then(fullPlan => {
            if (fullPlan && fullPlan.pdfData) {
              setFloorPlans(prev => prev.map(p => p.id === fullPlan.id ? fullPlan : p));
              fetchedPdfDataIds.current.add(fullPlan.id);
            }
          });
        }
      }
    }
    loadActiveFloorData();
  }, [activeFloorPlanId, floorPlans]);

  async function loadActiveFloorData() {
    try {
      // 1. Load ALL Camera marker notes from DB (no parameters -> yields all)
      const notes = await getMarkerNotes();
      notes.sort((a, b) => a.createdAt - b.createdAt);
      setMarkerNotes(notes);

      // 2. Load ALL Whiteboard annotations from DB (no parameters -> yields all)
      const annots = await getAnnotations();
      setAnnotations(annots);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleUpdateFloorPlan(updated: FloorPlan) {
    // Optimistic UI Update: apply immediately to prevent visual snap/jitter
    setFloorPlans(prev => prev.map(p => p.id === updated.id ? updated : p));
    try {
      await saveFloorPlan(updated);
    } catch (e) {
      console.error(e);
      // Could revert state here on failure, but for a whiteboard app local success is prioritized
    }
  }

  // Dashboard Project management event handlers
  async function handleCreateProject(name: string, leader: string, client: string, address: string) {
    const newProj: Project = {
      id: `proj-${Date.now()}`,
      name,
      client: client || 'Khách hàng mới',
      leader: leader || 'KTS. Thắng Admin',
      address: address || 'Chưa cập nhật địa chỉ',
      status: 'active',
      progress: Math.floor(Math.random() * 20) + 10, // random start progress
      createdAt: Date.now()
    };
    
    try {
      await saveProject(newProj);
      const updatedProjects = [newProj, ...projects];
      setProjects(updatedProjects);
      
      // Seed beautiful floor plans for this new project so the canvas loads properly!
      // (The seeding code remains the same, we just wrap in try/catch)
      const seed1: FloorPlan = {

      id: `${newProj.id}-tiling`,
      name: `Sàn ốp lát`,
      imageData: getFlavorFloorPlan(newProj.name, 'tiling'),
      width: 1000,
      height: 700,
      createdAt: Date.now() - 100,
      projectId: newProj.id,
      planType: 'tiling',
      isPinned: true,
      canvasX: 0,
      canvasY: 0
    };
    const seed2: FloorPlan = {
      id: `${newProj.id}-existing`,
      name: `Gạch hiện trạng`,
      imageData: getFlavorFloorPlan(newProj.name, 'existing'),
      width: 1000,
      height: 700,
      createdAt: Date.now() - 200,
      projectId: newProj.id,
      planType: 'existing',
      isPinned: true,
      canvasX: 2000,
      canvasY: 0
    };
    const seed3: FloorPlan = {
      id: `${newProj.id}-layout`,
      name: `Bố trí nội thất`,
      imageData: getFlavorFloorPlan(newProj.name, 'layout'),
      width: 1000,
      height: 700,
      createdAt: Date.now() - 300,
      projectId: newProj.id,
      planType: 'layout',
      isPinned: true,
      canvasX: 4000,
      canvasY: 0
    };
    await saveFloorPlan(seed1);
    await saveFloorPlan(seed2);
    await saveFloorPlan(seed3);

    setFloorPlans(prev => [seed1, seed2, seed3, ...prev]);

    // Automatically set and active this new project workspace
    setActiveProjectId(newProj.id);
    setActiveFloorPlanId(seed1.id);
    localStorage.setItem('last_active_project_id_v2', newProj.id);
    setCurrentView('workspace');
    } catch (e: any) {
      console.error(e);
      alert('Không thể tạo dự án. Vui lòng kiểm tra kết nối mạng hoặc quyền truy cập dữ liệu (RLS) trên Supabase. Chi tiết: ' + e.message);
    }
  }

  async function handleDeleteProject(id: string) {
    if (window.confirm('Bạn có chắc chắn muốn xóa dự án này? Mọi bản vẽ mặt bằng và ghim lỗi đi kèm sẽ bị xóa hoàn toàn.')) {
      try {
        await deleteProject(id);
        const updated = projects.filter(p => p.id !== id);
        setProjects(updated);

        // Clean up local related floor plans and delete them
        const relatedDocs = floorPlans.filter(fp => fp.projectId === id);
        const relatedPlanIds = relatedDocs.map(fp => fp.id);
        
        for (const doc of relatedDocs) {
          await deleteFloorPlan(doc.id);
        }
        setFloorPlans(prev => prev.filter(fp => fp.projectId !== id));

        // Clean up orphaned markers
        const relatedMarkers = markerNotes.filter(m => relatedPlanIds.includes(m.floorPlanId));
        for (const m of relatedMarkers) {
          await deleteMarkerNote(m.id);
        }
        setMarkerNotes(prev => prev.filter(m => !relatedPlanIds.includes(m.floorPlanId)));

        // Clean up orphaned annotations
        const relatedAnnots = annotations.filter(a => relatedPlanIds.includes(a.floorPlanId));
        for (const a of relatedAnnots) {
          await deleteAnnotation(a.id);
        }
        setAnnotations(prev => prev.filter(a => !relatedPlanIds.includes(a.floorPlanId)));

        if (activeProjectId === id) {
          const nextActive = updated[0]?.id || null;
          setActiveProjectId(nextActive);
          if (nextActive) {
            const related = floorPlans.filter(p => p.projectId === nextActive);
            setActiveFloorPlanId(related[0]?.id || null);
          } else {
            setActiveFloorPlanId(null);
          }
        }
      } catch (e: any) {
        console.error(e);
        alert('Lỗi khi xóa dự án: ' + e.message);
      }
    }
  }

  async function handleDeleteFloorPlan(planId: string) {
    if (window.confirm('Bạn có chắc chắn muốn xóa bản vẽ này? Mọi ghim lỗi trên bản vẽ cũng sẽ bị xóa.')) {
      try {
        await deleteFloorPlan(planId);
        setFloorPlans(prev => prev.filter(fp => fp.id !== planId));
        
        // Clean up orphaned markers
        const relatedMarkers = markerNotes.filter(m => m.floorPlanId === planId);
        for (const m of relatedMarkers) {
          await deleteMarkerNote(m.id);
        }
        setMarkerNotes(prev => prev.filter(m => m.floorPlanId !== planId));

        if (activeFloorPlanId === planId) {
          setActiveFloorPlanId(null);
        }
      } catch (e: any) {
        console.error(e);
        alert('Lỗi khi xóa bản vẽ: ' + e.message);
      }
    }
  }

  function toggleFavoriteProject(id: string) {
    const list = favoriteProjectIds.includes(id)
      ? favoriteProjectIds.filter(item => item !== id)
      : [...favoriteProjectIds, id];
    setFavoriteProjectIds(list);
    localStorage.setItem('dqh_starred_projects', JSON.stringify(list));
  }

  // Handle uploading custom drawings
  async function handleFloorPlanUpload(
    name: string, 
    imageData: string, 
    canvasX?: number, 
    canvasY?: number, 
    width?: number, 
    height?: number, 
    planType: FloorPlan['planType'] = 'perspective',
    documentGroupId?: string,
    pageIndex?: number,
    pageCount?: number,
    pdfData?: string
  ) {
    const id = `plan-${Date.now()}-${Math.floor(Math.random()*1000)}`;
    const newPlan: FloorPlan = {
      id,
      name,
      imageData,
      width: width || 800,
      height: height || 600,
      createdAt: Date.now(),
      canvasX,
      canvasY,
      projectId: activeProjectId || undefined,
      planType: planType,
      isPinned: false,
      documentGroupId,
      pageIndex,
      pageCount,
      pdfData
    };
    
    setUploadProgress('Đang lưu bản vẽ mặt bằng...');
    try {
      await saveFloorPlan(newPlan);
      setFloorPlans(prev => [newPlan, ...prev]);
      setActiveFloorPlanId(id);
    } catch (e: any) {
      console.error(e);
      const errMessage = e?.message || e?.error_description || JSON.stringify(e);
      alert('Lỗi lưu Database (FloorPlan): ' + errMessage);
      throw e;
    } finally {
      setUploadProgress(null);
    }
  }

  // Handle global file input (Images & PDFs)
  async function handleGlobalFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0 || !uploadTargetPlanType) return;
    
    // Guard: reject files over 50MB (Supabase Free limit)
    const MAX_FILE_MB = 50;
    for (let i = 0; i < files.length; i++) {
      if (files[i].size > MAX_FILE_MB * 1024 * 1024) {
        setShowCompressPrompt({
          show: true, 
          fileName: files[i].name, 
          fileSize: files[i].size / 1024 / 1024
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
    }
    
    setUploadProgress('Đang phân tích & nén tệp...');
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const baseName = file.name.replace(/\.[^/.]+$/, "");
        const documentGroupId = `doc-${Date.now()}-${Math.floor(Math.random()*1000)}`;
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        if (file.type === 'application/pdf') {
          // Upload PDF to Supabase Storage
          // Use TUS Resumable Upload to completely bypass the 50MB Free Tier payload limit!
          await uploadFileWithTus('blueprints', fileName, file, (progress) => {
            setUploadProgress(`Đang đẩy tệp lên đám mây: ${progress}...`);
          });
          
          const { data: { publicUrl: pdfDataUrl } } = supabase.storage.from('blueprints').getPublicUrl(fileName);
          
          const pageCount = await getPdfPageCount(pdfDataUrl);
          setUploadProgress('Render thumbnail trang 1...');
          const rawThumbnail = await renderPdfPageToImage(pdfDataUrl, 0);
          // Compress thumbnail — keeps IndexedDB object under 300KB (prevents size exceeded error)
          const thumbnailDataUrl = await compressThumbnailDataUrl(rawThumbnail, 900, 0.72);
          
          await handleFloorPlanUpload(
            baseName, 
            thumbnailDataUrl, // Compressed thumbnail for IndexedDB
            undefined, undefined, 1600, 1200, 
            uploadTargetPlanType, 
            documentGroupId, 
            0, 
            pageCount,
            pdfDataUrl // Store Supabase public URL for on-demand full-quality rendering
          );
        } else if (file.type.startsWith('image/')) {
          setUploadProgress('Đang nén ảnh trước khi upload...');
          // Compress image to reduce size BEFORE uploading to Supabase Storage
          // This prevents 'object exceeded maximum allowed size' error on large photos
          const compressedBlob = await compressImageToBlob(file, 2048, 0.85);
          const compressedFileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;
          const { error: uploadError } = await supabase.storage.from('blueprints').upload(compressedFileName, compressedBlob, { contentType: 'image/webp' });
          if (uploadError) throw uploadError;
          
          const { data: { publicUrl: imageUrl } } = supabase.storage.from('blueprints').getPublicUrl(compressedFileName);
          
          await handleFloorPlanUpload(baseName, imageUrl, undefined, undefined, 1600, 1200, uploadTargetPlanType, documentGroupId, 0, 1);
        }
      }
    } catch (e: any) {
      console.error("Upload error:", e);
      const errorMessage = e?.message || e?.error_description || JSON.stringify(e);
      alert('Có lỗi xảy ra khi đọc tệp: ' + errorMessage);
    } finally {
      setUploadProgress(null);
      setUploadTargetPlanType(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      // Auto-redirect to pinmap if we are in the middle of capturing a defect
      if (globalDraftFault) {
        setCurrentView('workspace');
        setWorkspaceView('pinmap');
      }
    }
  }

  // Handle successful imports from partner/customer JSON backups
  async function handleImportSuccess(importedPlan: FloorPlan, importedMarkers: MarkerNote[], importedAnnotations: WhiteboardAnnotation[]) {
    try {
      setIsLoading(true);
      
      // 1. Save import drawing meta
      await saveFloorPlan(importedPlan);
      
      // 2. Clear old database items of THIS SPECIFIC drawing so it updates flawlessly
      // (This prevents duplicating existing markers or lines)
      const existingMarkers = markerNotes.filter(m => m.floorPlanId === importedPlan.id);
      for (const m of existingMarkers) {
        await deleteMarkerNote(m.id);
      }
      
      const existingAnnots = annotations.filter(a => a.floorPlanId === importedPlan.id);
      for (const a of existingAnnots) {
        await deleteAnnotation(a.id);
      }

      // 3. Save new markers
      for (const m of importedMarkers) {
        await saveMarkerNote(m);
      }

      // 4. Save new annotations
      for (const a of importedAnnotations) {
        await saveAnnotation(a);
      }

      // 5. Update local state
      setFloorPlans(prev => {
        const filtered = prev.filter(p => p.id !== importedPlan.id);
        return [importedPlan, ...filtered];
      });
      setActiveFloorPlanId(importedPlan.id);
      
      // Force refresh active board data
      const finalMarkers = await getMarkerNotes();
      setMarkerNotes(finalMarkers);
      
      const finalAnnots = await getAnnotations();
      setAnnotations(finalAnnots);

    } catch (err) {
      console.error('Error importing JSON package:', err);
      alert('Không thể nhập file dữ liệu này!');
    } finally {
      setIsLoading(false);
    }
  }

  // Handle full JSON backup restore
  async function handleImportJSONBackup(backup: any) {
    try {
      setIsLoading(true);
      
      if (!backup.projects || !backup.floorPlans || !backup.markerNotes) {
        throw new Error("Tệp sao lưu không đúng định dạng.");
      }

      // 1. Projects
      for (const p of backup.projects) {
        await saveProject(p);
      }
      
      // 2. Floor Plans
      for (const fp of backup.floorPlans) {
        await saveFloorPlan(fp);
      }

      // 3. Marker Notes
      for (const m of backup.markerNotes) {
        await saveMarkerNote(m);
      }

      // 4. Annotations (if present)
      if (backup.annotations && Array.isArray(backup.annotations)) {
        for (const a of backup.annotations) {
          await saveAnnotation(a);
        }
      }

      // Reload the data
      await loadData();
      alert("Đã khôi phục toàn bộ dữ liệu từ tệp sao lưu thành công!");
    } catch (err: any) {
      console.error("Failed to restore JSON backup:", err);
      alert("Lỗi khi nạp sao lưu: " + err.message);
    } finally {
      setIsLoading(false);
    }
  }

  // Handle importing a simulated project lessons learned drawing & database
  async function handleImportMockBluePrint(planName: string, defects: any[], planId: string) {
    try {
      setIsLoading(true);
      const customId = `sim-plan-${planId}`;
      
      const newPlan: FloorPlan = {
        id: customId,
        name: `Bản vẽ trích lục: ${planName}`,
        imageData: getMockProjectFloorPlan(planName),
        width: 1000,
        height: 700,
        createdAt: Date.now(),
        projectId: activeProjectId || 'proj-1',
        planType: 'layout'
      };

      // 1. Save or replace floor plan drawing metadata
      await saveFloorPlan(newPlan);

      // Clean existing notes/annots of this project to prevent duplicate accumulation
      const prevNotes = await getMarkerNotes();
      const matchNotes = prevNotes.filter(n => n.floorPlanId === customId);
      for (const n of matchNotes) {
        await deleteMarkerNote(n.id);
      }

      const prevAnnots = await getAnnotations();
      const matchAnnots = prevAnnots.filter(a => a.floorPlanId === customId);
      for (const a of matchAnnots) {
        await deleteAnnotation(a.id);
      }

      // 2. Transcribe defects list into real MarkerNote pins
      // We will spread them strategically around the blueprint so they don't overlap (e.g. 30%, 45%, 65%)
      const seedOrigins = [
        { x: 28, y: 48 },
        { x: 72, y: 42 },
        { x: 50, y: 25 },
        { x: 35, y: 75 }
      ];

      for (let i = 0; i < defects.length; i++) {
        const def = defects[i];
        const coord = seedOrigins[i % seedOrigins.length];
        
        const mId = `sim-marker-${planId}-${i}`;
        const seedMarker: MarkerNote = {
          id: mId,
          floorPlanId: customId,
          x: coord.x,
          y: coord.y,
          title: def.title,
          photoData: null,
          audioData: null,
          transcription: def.transcription,
          textNotes: def.textNotes,
          createdAt: Date.now() - (i * 3600000),
          comments: def.comments ? def.comments.map((c: any, cIdx: number) => ({
            id: `sim-comment-${planId}-${i}-${cIdx}`,
            userId: `role-${(cIdx % 4) + 1}`,
            userName: c.user,
            userRole: c.role,
            content: c.text,
            createdAt: Date.now() - (i * 3600000) + (cIdx * 60000)
          })) : [],
          tags: def.tags
        };

        await saveMarkerNote(seedMarker);
      }

      // 3. Add an explanatory sticky note on the Miro board!
      const stickyAnnot: WhiteboardAnnotation = {
        id: `sim-sticky-${planId}`,
        floorPlanId: customId,
        type: 'sticky',
        x: 10,
        y: 60,
        width: 14,
        height: 12,
        color: '#f59e0b', // Amber yellow sticky
        content: `BÀI HỌC KINH NGHIỆM:\n\n${defects[0].title}\n\n👉 Kéo dán giấy nhớ thảo luận lỗi này để rút kinh nghiệm!`,
        createdAt: Date.now(),
        userName: 'Thắng'
      };
      await saveAnnotation(stickyAnnot);

      // 4. Update memory states
      setFloorPlans(prev => {
        const filtered = prev.filter(p => p.id !== customId);
        return [newPlan, ...filtered];
      });
      setActiveFloorPlanId(customId);

      // Force refresh active database data in state
      const finalMarkers = await getMarkerNotes();
      setMarkerNotes(finalMarkers);
      
      const finalAnnots = await getAnnotations();
      setAnnotations(finalAnnots);

      alert(`Đã trích lục thành công "${planName}" từ kho tư liệu kiểm tra! Vui lòng zoom/pan bảng vẽ hoặc nhấp vào các điểm lỗi màu đỏ để xem chi tiết bài học kinh nghiệm.`);

    } catch (err) {
      console.error('Error seeding simulated blueprint:', err);
      alert('Không thể tải tiêu bản bài học lỗi này.');
    } finally {
      setIsLoading(false);
    }
  }

  // Handle dropping a marker pin onto the board
  async function handleAddMarker(x: number, y: number) {
    if (!activeFloorPlanId) return;
    
    const count = projectMarkerNotes.length + 1;
    const newMarkerId = `marker-${Date.now()}`;
    
    const draft = globalDraftFault || {};

    const newMarker: MarkerNote = {
      id: newMarkerId,
      floorPlanId: activeFloorPlanId,
      x,
      y,
      title: draft.title || `Chấm lỗi #${count} - Tên Lỗi Kỹ Thuật`,
      photoData: draft.photoData || null,
      audioData: draft.audioData || null,
      transcription: draft.transcription || '',
      textNotes: draft.textNotes || '',
      createdAt: draft.createdAt || Date.now(),
      comments: []
    };

    try {
      await saveMarkerNote(newMarker);
      setMarkerNotes(prev => [...prev, newMarker]);
      setSelectedMarkerId(newMarkerId);
      setSelectedAnnotationId(null);
      // Fire notification
      const projName = projects.find(p => p.id === activeProjectId)?.name || 'Dự án';
      notify.defectNew(projName, newMarker.title || 'Lỗi mới');
      
      if (globalDraftFault) {
        setGlobalDraftFault(null);
        setIsRightSidebarOpen(true);
      } else {
        // Auto open camera to take photo immediately for visual fluid workflow!
        setShowCameraModal(true);
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Handle updates to existing markers
  async function handleUpdateMarker(updated: MarkerNote) {
    const prev = markerNotes.find(m => m.id === updated.id);
    // Optimistic UI Update
    setMarkerNotes(prevList => prevList.map(m => m.id === updated.id ? updated : m));
    try {
      await saveMarkerNote(updated);
      // Fire notification when status changes
      const prevStatus = prev?.tags?.[0];
      const newStatus = updated.tags?.[0];
      if (prevStatus !== newStatus && newStatus) {
        const projName = projects.find(p => {
          const fpIds = floorPlans.filter(fp => fp.projectId === p.id).map(fp => fp.id);
          return fpIds.includes(updated.floorPlanId);
        })?.name || 'Dự án';
        notify.defectUpdated(projName, updated.title || 'Lỗi', newStatus);
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Handle deleting markers
  async function handleDeleteMarker(id: string) {
    const doubleCheck = confirm('Bạn có chắc chắn muốn xóa điểm note này cùng toàn bộ tệp chụp ảnh và thuyết minh giọng nói đính kèm?');
    if (!doubleCheck) return;

    try {
      await deleteMarkerNote(id);
      setMarkerNotes(prev => prev.filter(m => m.id !== id));
      if (selectedMarkerId === id) {
        setSelectedMarkerId(null);
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Delete entire floor plan
  async function handleDeleteFloorPlan(id: string) {
    const doubleCheck = confirm('Bạn có chắc chắn muốn xóa bản vẽ mặt bằng này? Tất cả các điểm ghim, hình ảnh, whiteboard và voice notes liên quan sẽ bị xóa vĩnh viễn khỏi máy.');
    if (!doubleCheck) return;

    try {
      await deleteFloorPlan(id);
      
      // Clean up orphaned markers
      const relatedMarkers = markerNotes.filter(m => m.floorPlanId === id);
      for (const m of relatedMarkers) {
        await deleteMarkerNote(m.id);
      }
      setMarkerNotes(prev => prev.filter(m => m.floorPlanId !== id));

      // Clean up orphaned annotations
      const relatedAnnots = annotations.filter(a => a.floorPlanId === id);
      for (const a of relatedAnnots) {
        await deleteAnnotation(a.id);
      }
      setAnnotations(prev => prev.filter(a => a.floorPlanId !== id));

      const remaining = floorPlans.filter(p => p.id !== id);
      setFloorPlans(remaining);
      
      if (activeFloorPlanId === id) {
        setActiveFloorPlanId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Helper to upload dataUrl to Supabase
  async function uploadDataUrlToSupabase(dataUrl: string): Promise<string> {
    try {
      setUploadProgress('Đang tải ảnh lên máy chủ...');
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
      
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const { error: uploadError } = await supabase.storage.from('project-media').upload(fileName, file);
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage.from('project-media').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (e) {
      console.error('Error uploading to Supabase:', e);
      throw e;
    } finally {
      setUploadProgress(null);
    }
  }

  // Handle inserting captured photo into focused marker
  async function handleCapturePhoto(photoBase64: string) {
    const currentMarker = markerNotes.find(m => m.id === selectedMarkerId);
    if (currentMarker) {
      try {
        let uploadedUrl = photoBase64;
        // Only upload if it's a data url (not already a supabase url from somewhere else)
        if (photoBase64.startsWith('data:')) {
          uploadedUrl = await uploadDataUrlToSupabase(photoBase64);
        }

        // Handle multiple images stored as JSON array in a string
        let existingPhotos: string[] = [];
        if (currentMarker.photoData) {
          try {
            const parsed = JSON.parse(currentMarker.photoData);
            if (Array.isArray(parsed)) {
              existingPhotos = parsed;
            } else {
              existingPhotos = [currentMarker.photoData]; // Legacy format
            }
          } catch (e) {
            existingPhotos = [currentMarker.photoData]; // Legacy format
          }
        }
        
        const newPhotos = [...existingPhotos, uploadedUrl];
        
        const updated = {
          ...currentMarker,
          photoData: JSON.stringify(newPhotos)
        };
        await handleUpdateMarker(updated);
      } catch (e: any) {
        console.error("Full upload error: ", e);
        alert(`Tải ảnh thất bại! Lỗi: ${e?.message || JSON.stringify(e)}`);
      }
    }
  }

  // ==========================================
  // WHITEBOARD ANNOTATIONS OPS
  // ==========================================
  
  // Push state to undo stack
  function pushUndoState(currentAnnotsList: WhiteboardAnnotation[]) {
    // Keep stack size max 25
    setUndoStack(prev => [...prev.slice(-24), [...currentAnnotsList]]);
    setRedoStack([]); // Clear redo stack on new progressive actions
  }

  async function handleAddAnnotation(newAnnot: WhiteboardAnnotation) {
    pushUndoState(annotations);
    // Optimistic UI Update
    setAnnotations(prev => [...prev, newAnnot]);
    setSelectedAnnotationId(newAnnot.id);
    try {
      await saveAnnotation(newAnnot);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleUpdateAnnotation(updated: WhiteboardAnnotation) {
    // Optimistic UI Update
    setAnnotations(prev => prev.map(a => a.id === updated.id ? updated : a));
    try {
      await saveAnnotation(updated);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDeleteAnnotation(id: string) {
    pushUndoState(annotations);
    try {
      await deleteAnnotation(id);
      setAnnotations(prev => prev.filter(a => a.id !== id));
      if (selectedAnnotationId === id) {
        setSelectedAnnotationId(null);
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Undo/Redo trigger mechanics
  async function handleUndo() {
    if (undoStack.length === 0) return;
    const previousState = undoStack[undoStack.length - 1];
    
    // Save current into redo stack
    setRedoStack(prev => [...prev, [...annotations]]);
    
    // Set annotations
    setAnnotations(previousState);
    setUndoStack(prev => prev.slice(0, -1));

    // Persist all onto IndexedDB
    // For safety, clear all annotations in store and save previousState to keep it synced
    try {
      // Clear annotations associated with current activeFloorPlanId
      if (activeFloorPlanId) {
        const stored = await getAnnotations(activeFloorPlanId);
        for (const item of stored) {
          await deleteAnnotation(item.id);
        }
        for (const item of previousState) {
          await saveAnnotation(item);
        }
      }
    } catch (e) {
      console.warn("Error resolving DB sync during undo:", e);
    }
  }

  async function handleRedo() {
    if (redoStack.length === 0) return;
    const nextState = redoStack[redoStack.length - 1];

    setUndoStack(prev => [...prev, [...annotations]]);
    setAnnotations(nextState);
    setRedoStack(prev => prev.slice(0, -1));

    try {
      if (activeFloorPlanId) {
        const stored = await getAnnotations(activeFloorPlanId);
        for (const item of stored) {
          await deleteAnnotation(item.id);
        }
        for (const item of nextState) {
          await saveAnnotation(item);
        }
      }
    } catch (e) {
      console.warn("Error resolving DB sync during redo:", e);
    }
  }

  // Export full JSON backup
  function exportDataPackage() {
    const activePlan = floorPlans.find(p => p.id === activeFloorPlanId);
    if (!activePlan) return;

    const exportBundle = {
      floorPlan: activePlan,
      markers: projectMarkerNotes,
      annotations: projectAnnotations,
      exportedAt: Date.now(),
      vibe: "Floor Plan Camera, Whiteboard & Voice Notes Miro Export Package"
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportBundle, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `bao_cao_${activePlan.name.toLowerCase().replace(/\s+/g, '_')}_export.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  }

  // Derived state to keep each project's whiteboard/pins scoped correctly!
  const activeProject = useMemo(() => {
    return projects.find(p => p.id === activeProjectId) || null;
  }, [projects, activeProjectId]);

  const projectFloorPlans = useMemo(() => {
    return floorPlans.filter(fp => fp.projectId === activeProjectId);
  }, [floorPlans, activeProjectId]);

  const projectFloorPlanIds = useMemo(() => {
    return projectFloorPlans.map(fp => fp.id);
  }, [projectFloorPlans]);

  const projectMarkerNotes = useMemo(() => {
    return markerNotes.filter(m => projectFloorPlanIds.includes(m.floorPlanId));
  }, [markerNotes, projectFloorPlanIds]);

  const projectAnnotations = useMemo(() => {
    return annotations.filter(a => projectFloorPlanIds.includes(a.floorPlanId) || a.floorPlanId === `board-${activeProjectId}`);
  }, [annotations, projectFloorPlanIds, activeProjectId]);

  const selectedMarker = markerNotes.find(m => m.id === selectedMarkerId) || null;
  const selectedAnnotation = annotations.find(a => a.id === selectedAnnotationId) || null;
  const activePlan = floorPlans.find(p => p.id === activeFloorPlanId) || null;

  // ==========================================
  // Render the Miro-Style Project Dashboard (Vùng cổng vào)
  // ==========================================
  if (currentView === 'dashboard') {
    return <DarkDashboard 
       projects={projects}
       floorPlans={floorPlans}
       markerNotes={markerNotes}
       favoriteProjectIds={favoriteProjectIds}
       dbSearchQuery={dbSearchQuery}
       setDbSearchQuery={setDbSearchQuery}
       dashboardLayout={dashboardLayout}
       setDashboardLayout={setDashboardLayout}
       setShowNewProjectModal={setShowNewProjectModal}
       toggleFavoriteProject={toggleFavoriteProject}
       handleDeleteProject={handleDeleteProject}
       onEnterBoard={(id) => {
         setActiveProjectId(id);
         const related = floorPlans.filter(fp => fp.projectId === id);
         if (related.length > 0) setActiveFloorPlanId(related[0].id);
         localStorage.setItem('last_active_project_id_v2', id);
         setWorkspaceView('profile');
         setCurrentView('workspace');
       }}
       onRefresh={loadData}
       onOpenLessonsModal={() => setShowLessonsModal(true)}
     />;
    
    // Original old dashboard code (unreachable but kept for reference)
    const sortedAndFiltered = [...projects].filter(p => {
      const q = dbSearchQuery.toLowerCase();
      const matchSearch = p.name.toLowerCase().includes(q) || 
                          p.leader.toLowerCase().includes(q) || 
                          p.client.toLowerCase().includes(q) ||
                          p.address.toLowerCase().includes(q);
      
      if (dbStatusFilter === 'starred') {
        return matchSearch && favoriteProjectIds.includes(p.id);
      }
      return matchSearch;
    });

    if (dbSortBy === 'newest') {
      sortedAndFiltered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } else if (dbSortBy === 'progress') {
      sortedAndFiltered.sort((a, b) => b.progress - a.progress);
    } else if (dbSortBy === 'alphabet') {
      sortedAndFiltered.sort((a, b) => a.name.localeCompare(b.name));
    }

    return (
      <div className="min-h-screen bg-[#0e131f] text-white flex flex-col font-sans selection:bg-emerald-500/15 selection:text-emerald-300">
        
        {/* MIRO DASHBOARD TOP BAR */}
        <header className="bg-[#0b0f19] border-b border-[#333] h-14 px-4 md:px-6 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-tr from-indigo-500 to-emerald-400 rounded-xl text-white shadow-inner flex items-center justify-center shrink-0">
                <Layout className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-black tracking-tight text-white block leading-none">Site Board</span>
                <span className="text-[9px] text-[#888] font-bold block mt-0.5 uppercase tracking-widest">DQH Architects</span>
              </div>
            </div>
            
            {/* Miro-Like "Free / Pro" Team Badge */}
            <div className="hidden lg:flex items-center gap-1.5 bg-[#222] border border-slate-850 px-2.5 py-1 rounded-full text-[9px] font-black text-amber-400">
              <span className="bg-amber-400/10 px-1.5 py-0.5 rounded text-amber-400 font-extrabold">STUDIO DQH</span>
              <span className="text-[#888]">•</span>
              <span className="text-[#aaa] font-medium">Khảo Sát & Whiteboard Cộng Tác</span>
            </div>
          </div>

          {/* Quick Stats Search & Active user profiles */}
          <div className="flex items-center gap-2.5">
            <div className="hidden md:flex items-center gap-2 text-xs bg-[#222]/60 border border-slate-850 px-3 py-1.5 rounded-xl text-[#aaa]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{projects.length} Dự án sẵn có</span>
            </div>

            <button
              onClick={() => {
                setShowLessonsModal(true);
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black cursor-pointer shadow-md transition-all active:scale-95 duration-150 shrink-0"
              title="Quản lý các mẫu lỗi công trình thiết kế"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Mẫu lỗi</span>
            </button>

            <button
              onClick={() => {
                setShowDowmarkModal(true);
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#222] border border-[#444] hover:bg-[#333] text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-colors shrink-0"
              title="Đồng bộ cơ sở dữ liệu IndexedDB"
            >
              <Cloud className="w-3.5 h-3.5 text-emerald-400" />
              <span>Đồng bộ</span>
            </button>
            
            <div className="hidden sm:flex items-center -space-x-1.5 overflow-hidden ml-1">
              {userRolesList.slice(0, 4).map((user) => (
                <div
                  key={user.id}
                  className="w-6 h-6 rounded-full border border-slate-950 flex items-center justify-center text-[8.5px] font-bold text-white shrink-0"
                  style={{ backgroundColor: user.color }}
                  title={`${user.name} (${user.role})`}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
              ))}
              <div className="w-6 h-6 rounded-full bg-slate-850 border border-slate-950 flex items-center justify-center text-[8.5px] font-bold text-[#aaa] shrink-0 select-none">
                +{userRolesList.length - 4}
              </div>
            </div>
          </div>
        </header>

        {/* MIRO DASHBOARD WRAPPER CONTAINER */}
        <div className="flex-1 overflow-y-auto px-4 py-3 md:py-6 md:px-8 max-w-7xl w-full mx-auto flex flex-col gap-4 md:gap-6">

          {/* A. THONG BAO & HOAT DONG NHOM */}
          <section className="grid grid-cols-1 xl:grid-cols-5 gap-4">

            {/* Notification Feed - 3/5 */}
            <div className="xl:col-span-3 bg-[#222] border border-[#333] rounded-3xl p-4 md:p-5 flex flex-col gap-3 select-none">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black text-indigo-400 uppercase tracking-widest">
                  🔔 Thông báo gần đây
                </h2>
                {recentNotifs.filter(n => !n.read).length > 0 && (
                  <button onClick={() => markAllRead()}
                    className="text-[10px] text-[#888] hover:text-indigo-400 transition-colors cursor-pointer">
                    Đánh dấu tất cả đã đọc
                  </button>
                )}
              </div>
              {recentNotifs.filter(n => ['defect_new', 'defect_update', 'revision_pending', 'revision_rejected', 'diary_critical', 'gate_pending'].includes(n.type)).length === 0 ? (
                <div className="flex-1 flex items-center justify-center py-4 text-slate-600">
                  <p className="text-xs italic">Chưa có thông báo nào</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5 max-h-[160px] lg:max-h-[260px] overflow-y-auto pr-1">
                  {recentNotifs.filter(n => ['defect_new', 'defect_update', 'revision_pending', 'revision_rejected', 'diary_critical', 'gate_pending'].includes(n.type)).slice(0, 12).map(n => {
                    const iconMap = { defect_new: "📍", defect_update: "🔄", revision_pending: "⏳", revision_approved: "✅", revision_rejected: "❌", diary_critical: "🚨", gate_pending: "🔔", gate_signed: "✍️", info: "ℹ️" };
                    const diff = Date.now() - n.timestamp;
                    const ago = diff < 60000 ? "Vừa xong" : diff < 3600000 ? `${Math.floor(diff/60000)} phút trước` : diff < 86400000 ? `${Math.floor(diff/3600000)} giờ trước` : new Date(n.timestamp).toLocaleDateString("vi-VN");
                    return (
                      <div key={n.id} onClick={() => markRead(n.id)}
                        className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${n.read ? "hover:bg-[#222]/40 opacity-60" : "bg-indigo-500/5 border border-indigo-500/15 hover:bg-indigo-500/10"}`}
                      >
                        <span className="text-base shrink-0 mt-0.5">{(iconMap as any)[n.type] || "🔔"}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold truncate ${n.read ? "text-[#aaa]" : "text-white"}`}>{n.title}</p>
                          <p className="text-[11px] text-[#888] truncate mt-0.5">{n.body}</p>
                          <p className="text-[10px] text-slate-600 mt-1">{ago}</p>
                        </div>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1.5 animate-pulse" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Team Activity - 2/5 */}
            <div className="xl:col-span-2 bg-[#222] border border-[#333] rounded-3xl p-4 md:p-5 flex flex-col gap-4 select-none">
              <h2 className="text-xs font-black text-emerald-400 uppercase tracking-widest">📊 Hoạt động nhóm</h2>
              <div className="grid grid-cols-2 gap-3">
                {([[projects.filter(p => !p.status || p.status === "active").length, "Công trình đang chạy", "🏗️"],
                   [markerNotes.filter(m => !(m.tags?.[0] === "Đã duyệt")).length, "Lỗi chưa xử lý", "🔴"],
                   [markerNotes.filter(m => m.tags?.[0] === "Đã duyệt").length, "Đã giải quyết", "✅"],
                   [recentNotifs.filter(n => !n.read).length, "Thông báo chưa đọc", "🔔"]
                ] as [number, string, string][]).map(([val, label, icon]) => (
                  <div key={label} className="bg-[#1a1a1a] rounded-2xl p-3 border border-[#333]">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-base">{icon}</span>
                      <span className="text-xl font-black text-white font-mono">{val}</span>
                    </div>
                    <p className="text-[10px] text-[#888] leading-tight">{label}</p>
                  </div>
                ))}
              </div>
            </div>

          </section>


          {/* B. MAIN PROJECT BOARDS SECTION (Danh mục bản vẽ tương tự Miro) */}
          <section className="flex flex-col gap-4">
            
            {/* Header filters and controls */}
            <div className="flex flex-wrap items-center gap-2 border-b border-[#333] pb-4">
              {/* Action Control Panel */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" />
                  <input
                    type="text"
                    placeholder="Tìm tên dự án, KTS, khách..."
                    value={dbSearchQuery}
                    onChange={(e) => setDbSearchQuery(e.target.value)}
                    className="bg-[#1a1a1a] border border-slate-850 rounded-xl pl-9 pr-4 py-1.5 text-xs w-full sm:w-[220px] text-[#e0e0e0] focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-600"
                  />
                </div>

                {/* Filter Star status */}
                <select
                  value={dbStatusFilter}
                  onChange={(e) => setDbStatusFilter(e.target.value)}
                  className="bg-[#222] border border-[#444] rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none cursor-pointer hover:border-slate-700 focus:border-indigo-500"
                >
                  <option value="all">Tất cả dự án mẫu</option>
                  <option value="starred">⭐ Dự án Đã Ghim Yêu Thích</option>
                </select>

                {/* Sort Selector */}
                <select
                  value={dbSortBy}
                  onChange={(e) => setDbSortBy(e.target.value)}
                  className="bg-[#222] border border-[#444] rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none cursor-pointer hover:border-slate-700 focus:border-indigo-500"
                >
                  <option value="newest">Ngày khởi tạo gần nhất</option>
                  <option value="progress">Tiến độ thiết kế giật đỉnh</option>
                  <option value="alphabet">Xếp tên bảng chữ cái A-Z</option>
                </select>

                {/* Grid / List Layout toggle */}
                <div className="flex items-center bg-[#222] border border-[#444] rounded-xl p-0.5">
                  <button
                    onClick={() => setDashboardLayout('grid')}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${dashboardLayout === 'grid' ? 'bg-[#333] text-indigo-400' : 'text-[#aaa] hover:text-white'}`}
                    title="Dạng lưới"
                  >
                    <Grid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDashboardLayout('list')}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${dashboardLayout === 'list' ? 'bg-[#333] text-indigo-400' : 'text-[#aaa] hover:text-white'}`}
                    title="Dạng bảng kê (Giống Miro)"
                  >
                    <ListIcon className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Create Board Button */}
                <button
                  onClick={() => {
                    setNewProjectName('');
                    setNewProjectClient('');
                    setNewProjectAddress('');
                    setNewProjectLeader('KTS. Võ Ngọc Quang');
                    setShowNewProjectModal(true);
                  }}
                  className="h-8 pl-3 pr-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl cursor-pointer flex items-center gap-1 shadow-md transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tạo dự án mới</span>
                </button>
              </div>
            </div>

            {/* C. RENDER CORES */}
            {sortedAndFiltered.length === 0 ? (
              <div className="bg-[#222]/10 border-2 border-[#333] border-dashed rounded-3xl p-16 text-center select-none">
                <Layout className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-[#aaa] font-bold">Không tìm thấy dự án phù hợp</p>
                <p className="text-xs text-slate-600 mt-1">Vui lòng nhập từ khóa khác hoặc click nút "Tạo dự án mới" để bắt đầu dập ghim lỗi và vẽ phối thảo.</p>
              </div>
            ) : dashboardLayout === 'grid' ? (
              /* GRID LAYOUT MODE */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {sortedAndFiltered.map((p) => {
                  const isStarred = favoriteProjectIds.includes(p.id);
                  return (
                    <div 
                      key={p.id}
                      className="bg-[#222] border border-[#333] hover:border-[#444] hover:bg-[#2a2a2a] rounded-2xl flex flex-col p-4 transition-all hover:-translate-y-0.5 group relative"
                    >
                      {/* Favorite star */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavoriteProject(p.id);
                        }}
                        className="absolute top-4 right-4 p-1.5 rounded-lg border border-slate-850 text-[#888] bg-[#111] hover:text-amber-400 transition-all z-10"
                        title="Ủy thác dự án mẫu yêu thích"
                      >
                        <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-amber-400 text-amber-400 font-bold' : 'text-[#888]'}`} />
                      </button>

                      <div className="flex-1 cursor-pointer" onClick={() => {
                        setActiveProjectId(p.id);
                        const related = floorPlans.filter(fp => fp.projectId === p.id);
                        if (related.length > 0) {
                          setActiveFloorPlanId(related[0].id);
                        }
                        localStorage.setItem('last_active_project_id_v2', p.id);
                        setWorkspaceView('profile');
                        setCurrentView('workspace');
                      }}>
                        <div className="flex items-center gap-1.5 mb-2 text-[10px] text-[#999]">
                          <span className="font-extrabold text-indigo-400 uppercase tracking-widest">KTS: {p.leader ? p.leader.replace('KTS. ', '') : ''}</span>
                        </div>
                        <h3 className="text-sm font-black text-white group-hover:text-indigo-400 transition-colors line-clamp-2 pr-6 mb-2" title={p.name}>
                          {p.name}
                        </h3>
                        {(() => {
                          const fpIds = (floorPlans || []).filter(fp => fp.projectId === p.id).map(fp => fp.id);
                          const pMarkers = (markerNotes || []).filter(m => fpIds.includes(m.floorPlanId));
                          const total = pMarkers.length;
                          const resolved = pMarkers.filter(m => m?.tags && m.tags[0] === 'Đã duyệt').length;
                          return (
                            <div className="mb-4">
                              <p className="text-xs text-rose-400 font-semibold line-clamp-1 mb-1">⚠️ {total} lỗi cần theo dõi</p>
                              <p className="text-[11px] text-emerald-500 font-bold line-clamp-1">✅ Đã xử lí {resolved} lỗi</p>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Progress bar and entering */}
                      <div className="border-t border-[#333] pt-3 mt-auto flex items-center justify-between">
                        <div className="w-[58%]">
                          <div className="flex items-center justify-between text-[9px] text-[#999] font-bold mb-1">
                            <span>Tiến độ</span>
                            <span className="text-amber-400 font-mono bg-[#222] px-1.5 py-0.5 rounded">{p.progress}%</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-[11px]">
                          <button
                            onClick={() => {
                              setActiveProjectId(p.id);
                              const related = floorPlans.filter(fp => fp.projectId === p.id);
                              if (related.length > 0) {
                                setActiveFloorPlanId(related[0].id);
                              }
                              localStorage.setItem('last_active_project_id_v2', p.id);
                              setWorkspaceView('profile');
                              setCurrentView('workspace');
                            }}
                            className="p-1 px-3 bg-indigo-500/10 hover:bg-indigo-500/25 border border-indigo-500/20 rounded-lg text-[9px] font-black text-indigo-300 transition-colors uppercase cursor-pointer flex items-center gap-1"
                          >
                            <span>Vào Board</span>
                          </button>
                          {activeUserRole.role === 'Admin' && (
                          <button
                            onClick={() => handleDeleteProject(p.id)}
                            className="p-1.5 text-[#888] hover:text-rose-400 bg-slate-950/20 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 rounded-lg transition-colors cursor-pointer"
                            title="Xóa dự án khỏi trình quản lý"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* TABLE LIST DIRECTORY VIEW (100% Miro vibe styling) */
              <div className="bg-[#1a1a1a]/30 border border-[#333] rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs select-none">
                    <thead className="hidden md:table-header-group">
                      <tr className="border-b border-[#333] bg-[#0b0f19] text-[#888] font-extrabold uppercase text-[10px] tracking-wider">
                        <th className="py-2 px-4 w-10"></th>
                        <th className="py-2 px-4 w-full">Dự Án Thiết Kế / Bản Vẽ</th>
                        <th className="py-2 px-4 whitespace-nowrap">Ngày Tạo</th>
                        <th className="py-2 px-4 text-right w-36">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/40">
                      {sortedAndFiltered.map((p, idx) => {
                        const isStarred = favoriteProjectIds.includes(p.id);
                        return (
                          <tr 
                            key={p.id}
                            className="hover:bg-[#1a1a1a]/50 transition-colors group cursor-pointer"
                            onClick={() => {
                              setActiveProjectId(p.id);
                              const related = floorPlans.filter(fp => fp.projectId === p.id);
                              if (related.length > 0) {
                                setActiveFloorPlanId(related[0].id);
                              }
                              localStorage.setItem('last_active_project_id_v2', p.id);
                              setWorkspaceView('profile');
                              setCurrentView('workspace');
                            }}
                          >
                            {/* Star toggler */}
                            <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => toggleFavoriteProject(p.id)}
                                className="text-[#888] hover:text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                                title={isStarred ? 'Hủy ghim yêu thích' : 'Ủy thác ghim lên đầu'}
                              >
                                <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-400 text-amber-400' : 'text-slate-700 hover:text-[#888]'}`} />
                              </button>
                            </td>

                            {/* Title, Members, Leader & Progress */}
                            <td className="py-3.5 px-4 w-full">
                              <div className="flex flex-col">
                                <div className="flex justify-between items-start gap-2">
                                  <span className="font-bold text-white group-hover:text-indigo-400 transition-colors text-sm break-words whitespace-normal">
                                    {p.name}
                                  </span>
                                  <span className="text-amber-400 font-mono text-[9px] font-bold bg-[#222] px-1.5 py-0.5 rounded whitespace-nowrap mt-0.5">{p.progress}%</span>
                                </div>
                                <span className="text-[9px] text-[#888] font-medium italic mt-0.5">{p.leader}</span>
                                {(() => {
                                  const fpIds = (floorPlans || []).filter(fp => fp.projectId === p.id).map(fp => fp.id);
                                  const pMarkers = (markerNotes || []).filter(m => fpIds.includes(m.floorPlanId));
                                  const total = pMarkers.length;
                                  const resolved = pMarkers.filter(m => m?.tags && m.tags[0] === 'Đã duyệt').length;
                                  return (
                                    <span className="text-[10px] mt-1 flex items-center gap-3">
                                      <span className="text-rose-400 font-bold flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 block" />
                                        {total} lỗi
                                      </span>
                                      <span className="text-emerald-500 font-bold flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 block" />
                                        {resolved} xong
                                      </span>
                                    </span>
                                  );
                                })()}
                              </div>
                            </td>



                            {/* Created time formatted */}
                            <td className="py-3.5 px-4 text-[#aaa] font-mono hidden md:table-cell">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-slate-600" />
                                <span>{p.createdAt ? new Date(p.createdAt).toLocaleDateString('vi-VN') : '03/06/2026'}</span>
                              </div>
                            </td>

                            {/* Row Buttons and Actions */}
                            <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setActiveProjectId(p.id);
                                    const related = floorPlans.filter(fp => fp.projectId === p.id);
                                    if (related.length > 0) {
                                      setActiveFloorPlanId(related[0].id);
                                    }
                                    localStorage.setItem('last_active_project_id_v2', p.id);
                                    setWorkspaceView('profile');
                                    setCurrentView('workspace');
                                  }}
                                  className="h-7 px-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-lg font-black text-[10px] tracking-wide shadow-sm transition-all cursor-pointer flex items-center gap-0.5 uppercase"
                                >
                                  <span>Vào Board</span>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                                {activeUserRole.role === 'Admin' && (
                                <button
                                  onClick={() => handleDeleteProject(p.id)}
                                  className="p-1 px-2 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/15 rounded-lg cursor-pointer transition-colors"
                                  title="Xoá vĩnh viễn"
                                >
                                  Xoá
                                </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* COMPREHENSIVE OVERLAY POPUP MODAL DIALOG (100% Client React, zero simulation) */}
        {showNewProjectModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 select-none">
            <div className="bg-[#1a1a1a] border border-[#444] rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
              <h2 className="text-base font-black text-white flex items-center gap-2 mb-2">
                🏛️ Khởi tạo dự án thiết kế mới
              </h2>
              <p className="text-xs text-[#aaa] mb-5">Hồ sơ dự án sẽ tự động sinh các mặt bản vẽ Sàn ốp lát, Trực trạng gạch khảo sát...</p>

              <form onSubmit={(e) => {
                e.preventDefault();
                if (!newProjectName.trim()) {
                  alert('Vui lòng nhập tên công trình dự án!');
                  return;
                }
                handleCreateProject(newProjectName, newProjectLeader, newProjectClient, newProjectAddress);
                setShowNewProjectModal(false);
              }} className="flex flex-col gap-4">
                
                {/* 1. Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-450">Tên dự án thiết kế <span className="text-rose-400">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Shophouse Sala Đại Quang Minh,..."
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="bg-[#222] border border-slate-850 focus:border-indigo-500 px-3.5 py-2.5 rounded-xl text-xs text-white focus:outline-none transition-colors"
                  />
                </div>

                {/* 2. Leader KTS */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-450">KTS Chủ Trì Thiết Kế</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: KTS. Võ Ngọc Quang"
                    value={newProjectLeader}
                    onChange={(e) => setNewProjectLeader(e.target.value)}
                    className="bg-[#222] border border-slate-850 focus:border-indigo-500 px-3.5 py-2.5 rounded-xl text-xs text-white focus:outline-none transition-colors"
                  />
                </div>

                {/* 3. Client */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-450">Khách Hàng Chủ Đầu Tư</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Chị Vy Nguyễn, Anh Tuấn..."
                    value={newProjectClient}
                    onChange={(e) => setNewProjectClient(e.target.value)}
                    className="bg-[#222] border border-slate-850 focus:border-indigo-500 px-3.5 py-2.5 rounded-xl text-xs text-white focus:outline-none transition-colors"
                  />
                </div>

                {/* 4. Address */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-slate-450">Địa Điểm Công Trình</label>
                  <textarea
                    rows={2}
                    placeholder="Ví dụ: Khu Sala, Mai Chí Thọ, Quận 2, TPHCM"
                    value={newProjectAddress}
                    onChange={(e) => setNewProjectAddress(e.target.value)}
                    className="bg-[#222] border border-slate-850 focus:border-indigo-500 px-3.5 py-2.5 rounded-xl text-xs text-white focus:outline-none resize-none transition-colors"
                  />
                </div>

                {/* Submit & Close Buttons */}
                <div className="flex items-center justify-end gap-2.5 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowNewProjectModal(false)}
                    className="px-4 py-2 bg-[#222] border border-slate-850 hover:bg-[#333] rounded-xl text-xs font-bold text-[#aaa] transition-colors cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-black rounded-xl text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    Khởi tạo Board
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* 10 Projects Management & Lessons Learned Reference Center */}
        <LessonsLearnedModal
          isOpen={showLessonsModal}
          onClose={() => setShowLessonsModal(false)}
          onImportMockBluePrint={handleImportMockBluePrint}
          liveProjects={projects}
          liveFloorPlans={floorPlans}
          liveMarkerNotes={markerNotes}
          liveAnnotations={annotations}
          onNavigateToRealProject={(projectId, floorPlanId, markerId) => {
             setActiveProjectId(projectId);
             setActiveFloorPlanId(floorPlanId);
             setSelectedMarkerId(markerId);
             setIsRightSidebarOpen(true);
             setCurrentView('workspace');
             setShowLessonsModal(false);
          }}
          onImportJSONBackup={handleImportJSONBackup}
        />
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#1c1c1c] flex flex-col font-sans text-white selection:bg-emerald-500/15 selection:text-emerald-300 relative overflow-hidden">
      
      {/* 1. BRAND PLATFORM HEADER (Vùng 1) - Removed per user request */}

      {/* XU DASHBOARD OVERLAY */}
      {showXUDashboard && (
        <div className="fixed inset-0 z-[200] bg-slate-950 overflow-y-auto">
          <XUDashboard
            projects={projects}
            floorPlans={floorPlans}
            markerNotes={markerNotes}
            onUpdateMarker={handleUpdateMarker}
            onOpenProject={(projectId) => {
              setActiveProjectId(projectId);
              const related = floorPlans.filter(fp => fp.projectId === projectId);
              if (related.length > 0) setActiveFloorPlanId(related[0].id);
              localStorage.setItem('last_active_project_id_v2', projectId);
              setWorkspaceView('pinmap');
              setCurrentView('workspace');
              setShowXUDashboard(false);
            }}
            onClose={() => setShowXUDashboard(false)}
          />
        </div>
      )}

      {/* CEO Dashboard removed — replaced by XUDashboard for Quản lý */}

      {/* PROGRESS VIEW OVERLAY */}
      {showProgressView && (
        <ProgressView
          projects={projects}
          floorPlans={floorPlans}
          markerNotes={markerNotes}
          onOpenProject={(projectId) => {
            setActiveProjectId(projectId);
            const related = floorPlans.filter(fp => fp.projectId === projectId);
            if (related.length > 0) setActiveFloorPlanId(related[0].id);
            localStorage.setItem('last_active_project_id_v2', projectId);
            setWorkspaceView('profile');
            setCurrentView('workspace');
            setShowProgressView(false);
            setActiveBottomTab('projects');
          }}
          onClose={() => { setShowProgressView(false); setActiveBottomTab('projects'); }}
        />
      )}

      {/* DEFECT LIST VIEW OVERLAY */}
      {showDefectList && (
        <DefectListView
          projects={projects}
          floorPlans={floorPlans}
          markerNotes={markerNotes}
          onUpdateMarker={handleUpdateMarker}
          onOpenProject={(projectId) => {
            setActiveProjectId(projectId);
            const related = floorPlans.filter(fp => fp.projectId === projectId);
            if (related.length > 0) setActiveFloorPlanId(related[0].id);
            localStorage.setItem('last_active_project_id_v2', projectId);
            setWorkspaceView('pinmap');
            setCurrentView('workspace');
            setShowDefectList(false);
            setActiveBottomTab('projects');
          }}
          onClose={() => setShowDefectList(false)}
        />
      )}

      {/* KNOWLEDGE HUB OVERLAY */}
      {showKnowledgeHub && (
        <KnowledgeHub
          projects={projects}
          floorPlans={floorPlans}
          markerNotes={markerNotes}
          onClose={() => { setShowKnowledgeHub(false); setActiveBottomTab('projects'); }}
        />
      )}

      {/* PROFILE VIEW OVERLAY */}
      {showProfileView && (
        <ProfileView
          activeUserRole={activeUserRole}
          userRolesList={userRolesList}
          projects={projects}
          markerNotes={markerNotes}
          onSetActiveUserRole={setActiveUserRole}
          onClose={() => { setShowProfileView(false); setActiveBottomTab('projects'); }}
        />
      )}

      {/* 2. MAIN LAYOUT DECK CONTAINER */}
      {currentView === 'workspace' && workspaceView === 'profile' ? (
        <>
          <ProjectProfile
            project={activeProject || null}
            floorPlans={projectFloorPlans}
            markers={projectMarkerNotes}
            onDeleteFloorPlan={handleDeleteFloorPlan}
            onUploadFile={(planType) => {
              setUploadTargetPlanType(planType);
              if (fileInputRef.current) fileInputRef.current.click();
            }}
            onTogglePinTarget={async (planId, isPinTarget) => {
              setFloorPlans(prev => prev.map(p => p.id === planId ? { ...p, isPinTarget } : p));
              const planToUpdate = floorPlans.find(p => p.id === planId);
              if (planToUpdate) {
                try {
                  await saveFloorPlan({ ...planToUpdate, isPinTarget });
                } catch (e) {
                  console.error('Failed to save pin target state', e);
                }
              }
            }}
            onOpenPinMap={(planId, markerId) => {
              setActiveFloorPlanId(planId);
              if (markerId) {
                setSelectedMarkerId(markerId);
                setIsRightSidebarOpen(true);
              }
              setWorkspaceView('pinmap');
            }}
            onQuickCapture={() => setIsGlobalCaptureOpen(true)}
          />
          <BottomNavBar 
            currentTab={activeBottomTab}
            onTabChange={(tab) => {
              setActiveBottomTab(tab);
              if (tab === 'projects') {
                setCurrentView('dashboard');
                setShowProgressView(false);
                setShowKnowledgeHub(false);
                setShowProfileView(false);
              }
              if (tab === 'progress') setShowProgressView(true);
              if (tab === 'notifications') setShowKnowledgeHub(true);
              if (tab === 'profile') setShowProfileView(true);
            }}
            onActionClick={() => setShowDefectList(true)}
            activeRole={activeUserRole.role}
          />
        </>
      ) : currentView === 'workspace' && workspaceView === 'report' ? (
        <ReportLayout
          project={activeProject || null}
          floorPlans={projectFloorPlans}
          markers={projectMarkerNotes}
          onNavigateToPin={(fpId, markerId) => {
            setActiveFloorPlanId(fpId);
            setSelectedMarkerId(markerId);
            setWorkspaceView('pinmap');
            setIsRightSidebarOpen(true);
          }}
        />
      ) : currentView === 'workspace' && workspaceView === 'pinmap' ? (
        <>
        <PinMapView
          initialPinMode={!!globalDraftFault}
          floorPlans={projectFloorPlans}
          activeFloorPlanId={activeFloorPlanId}
          setActiveFloorPlanId={setActiveFloorPlanId}
          markers={projectMarkerNotes}
          onNavigateToReport={() => {
            setWorkspaceView(prevWorkspaceViewRef.current);
          }}
          onClose={() => {
            setWorkspaceView(prevWorkspaceViewRef.current);
          }}
          onAddMarker={async (fpId, x, y, pageIndex) => {
            const initialTags = ['Chưa sửa'];
            if (pageIndex !== undefined) {
              initialTags.push(`page:${pageIndex}`);
            }
            // Add category tags from capture flow
            if (selectedDefectCategory) {
              initialTags.push(selectedDefectCategory.category);
              initialTags.push(selectedDefectCategory.subcategory);
            }
            const titleParts = selectedDefectCategory 
              ? `${selectedDefectCategory.category} — ${selectedDefectCategory.subcategory} #${projectMarkerNotes.length + 1}`
              : `Sự cố #${projectMarkerNotes.length + 1}`;
            const newMarker: MarkerNote = {
              id: `marker-${Date.now()}`,
              floorPlanId: fpId,
              x, y,
              title: titleParts,
              photoData: globalDraftFault?.photoData || null,
              audioData: globalDraftFault?.audioData || null,
              transcription: globalDraftFault?.transcription || '',
              textNotes: globalDraftFault?.textNotes || '',
              createdAt: Date.now(),
              comments: [],
              tags: initialTags,
            };
            try {
              await saveMarkerNote(newMarker);
              setMarkerNotes(prev => [...prev, newMarker]);
              setSelectedMarkerId(newMarker.id);
              // Clear draft after successful pin
              setGlobalDraftFault(null);
              setSelectedDefectCategory(null);
            } catch (e) { console.error(e); }
          }}
          onSelectMarker={setSelectedMarkerId}
          activeUserRole={activeUserRole}
          userRolesList={userRolesList}
          onSetActiveUserRole={setActiveUserRole}
          onOpenMiro={async (planId) => {
            const planToOpen = floorPlans.find(p => p.id === planId);
            if (planToOpen && (planToOpen.canvasX === undefined || planToOpen.canvasY === undefined)) {
              let maxCol = -1;
              floorPlans.filter(p => p.projectId === activeProjectId && p.canvasX !== undefined).forEach(p => {
                const col = Math.round(p.canvasX! / 2000);
                if (col > maxCol) maxCol = col;
              });
              const nextX = (maxCol + 1) * 2000;
              const updatedPlan = { ...planToOpen, canvasX: nextX, canvasY: 0 };
              try {
                await saveFloorPlan(updatedPlan);
                setFloorPlans(prev => prev.map(p => p.id === planId ? updatedPlan : p));
              } catch (e) { console.error(e); }
            }
            setActiveFloorPlanId(planId);
            setWorkspaceView('miro');
          }}
          onExtractPageToMiro={async (planId, pageIndex, pageDataUrl, pageName) => {
            let maxCol = -1;
            floorPlans.filter(p => p.projectId === activeProjectId && p.canvasX !== undefined).forEach(p => {
              const col = Math.round(p.canvasX! / 2000);
              if (col > maxCol) maxCol = col;
            });
            const nextX = (maxCol + 1) * 2000;

            // Create a new FloorPlan for this specific page (acting as an image)
            const id = `plan-${Date.now()}-${Math.floor(Math.random()*1000)}`;
            const newPlan: FloorPlan = {
              id,
              name: pageName,
              imageData: pageDataUrl, // The rendered high-res page image
              width: 1600,
              height: 1200,
              createdAt: Date.now(),
              projectId: activeProjectId || 'proj-1',
              planType: 'perspective', // defaults to perspective since it's an arbitrary extract
              isPinned: false,
              canvasX: nextX,
              canvasY: 0
            };
            try {
              await saveFloorPlan(newPlan);
              setFloorPlans(prev => [newPlan, ...prev]);
              setActiveFloorPlanId(id);
              setWorkspaceView('miro');
            } catch (e) {
              console.error("Lỗi khi trích xuất trang vào Miro:", e);
            }
          }}
          onUpdateMarker={handleUpdateMarker}
          onDeleteMarker={handleDeleteMarker}
          onTriggerCamera={() => setShowCameraModal(true)}
          selectedMarkerId={selectedMarkerId}
        />
        {/* RENDER MODAL FOR PINMAP */}
        {selectedMarker && (
          <MarkerDetailModal
            marker={selectedMarker}
            onUpdate={handleUpdateMarker}
            onDelete={(id) => {
              handleDeleteMarker(id);
              setSelectedMarkerId(null);
            }}
            onTriggerCamera={() => setShowCameraModal(true)}
            onClose={() => setSelectedMarkerId(null)}
          />
        )}
        </>
      ) : showReportPreview && activePlan ? (
        /* =========================================================
           REPORT PREVIEW & PRINT SUITE VIEW
           ========================================================= */
        <div className="flex-1 bg-white text-slate-900 max-w-4xl w-full mx-auto p-6 md:p-10 flex flex-col gap-6" id="printable-report-area">
          <div className="flex items-center justify-between border-b pb-4 border-slate-300">
            <div>
              <h2 className="text-xl font-black text-slate-950 tracking-tight">BÁO CÁO KHẢO SÁT & WHITEBOARD COLLABORATION</h2>
              <p className="text-xs text-[#888] mt-1">
                Tên dự án mặt bằng: <span className="font-bold text-slate-850">{activePlan.name}</span>
              </p>
              <p className="text-[10px] text-[#aaa] font-mono mt-0.5">Ngày xuất báo cáo: {new Date().toLocaleString('vi-VN')}</p>
            </div>
            
            <div className="flex items-center gap-2 print:hidden shrink-0">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                In / Xuất PDF
              </button>
              <button
                onClick={() => setShowReportPreview(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
              >
                Thoát
              </button>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-3.5">
            <div className="bg-slate-50 border rounded-xl p-3 shadow-sm">
              <span className="text-[9px] uppercase font-bold text-[#aaa] block leading-none">Chấm lỗi camera</span>
              <p className="text-base font-black text-slate-900 mt-1">{projectMarkerNotes.length} ghim</p>
            </div>
            <div className="bg-slate-50 border rounded-xl p-3 shadow-sm">
              <span className="text-[9px] uppercase font-bold text-[#aaa] block leading-none">Hình ảnh đính kèm</span>
              <p className="text-base font-black text-slate-900 mt-1">
                {projectMarkerNotes.filter(m => m.photoData).length} / {projectMarkerNotes.length} ảnh
              </p>
            </div>
            <div className="bg-slate-50 border rounded-xl p-3 shadow-sm">
              <span className="text-[9px] uppercase font-bold text-[#aaa] block leading-none">Whiteboard markup</span>
              <p className="text-base font-black text-slate-900 mt-1">{projectAnnotations.length} hình vẽ</p>
            </div>
          </div>

          {/* Detailed Points List Loop */}
          <div className="flex flex-col gap-6 mt-2">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b pb-2">Danh sách chi tiết các lỗi & phản hồi</h3>
            {projectMarkerNotes.length === 0 ? (
              <div className="bg-slate-50 border border-dashed rounded-xl p-8 text-center text-[#888] text-xs italic">
                Chưa có điểm ghim khảo sát nào được tạo.
              </div>
            ) : (
              projectMarkerNotes.map((m, idx) => (
                <div key={m.id} className="bg-white border border-slate-250 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row gap-5 relative page-break-inside-avoid">
                  <span className="absolute top-4 right-4 bg-[#222] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold font-mono">
                    {idx + 1}
                  </span>

                  {/* Photo Section */}
                  <div className="w-full md:w-56 shrink-0 flex flex-col gap-2">
                    {m.photoData ? (
                      <img
                        src={m.photoData}
                        className="w-full h-36 object-cover rounded-xl border border-slate-200"
                        alt={m.title}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-36 bg-slate-50 border border-dashed rounded-xl flex flex-col items-center justify-center text-center p-4">
                        <Camera className="w-6 h-6 text-slate-300 mb-1" />
                        <span className="text-[10px] text-[#aaa] font-medium">Chưa chụp ảnh</span>
                      </div>
                    )}
                    <div className="text-[9px] text-slate-450 font-mono text-center leading-none mt-1">
                      Toạ độ ghim: X: {Math.round(m.x)}% - Y: {Math.round(m.y)}%
                    </div>
                  </div>

                  {/* Detail text */}
                  <div className="flex-1 flex flex-col gap-3 min-w-0">
                    <div>
                      <h4 className="font-bold text-slate-950 text-base">{m.title}</h4>
                      <div className="text-[10px] text-[#aaa] mt-0.5">Thời gian khởi tạo: {new Date(m.createdAt).toLocaleDateString('vi-VN')}</div>
                    </div>

                    {m.transcription && (
                      <div className="bg-slate-50 p-2.5 rounded-xl border-l-[4px] border-l-emerald-500">
                        <span className="text-[9px] uppercase font-black text-emerald-600 block leading-none">Thuyết minh Việt hoá:</span>
                        <p className="text-xs text-slate-800 italic mt-1 leading-relaxed font-sans">
                          "{m.transcription}"
                        </p>
                      </div>
                    )}

                    {m.textNotes && (
                      <div>
                        <span className="text-[9px] uppercase font-bold text-[#aaa] tracking-wider">Mô tả gõ bổ túc:</span>
                        <p className="text-xs text-slate-800 mt-0.5 leading-relaxed">{m.textNotes}</p>
                      </div>
                    )}

                    {/* Threaded discussion comments in the index card */}
                    {m.comments && m.comments.length > 0 && (
                      <div className="border-t border-slate-100 pt-2.5 mt-1.5">
                        <span className="text-[9px] uppercase font-black text-indigo-700 block mb-1">Thảo luận giải quyết lỗi ({m.comments.length}):</span>
                        <div className="flex flex-col gap-2">
                          {m.comments.map(c => (
                            <div key={c.id} className="text-[11px] bg-slate-50 border border-slate-150 p-2 rounded-xl">
                              <span className="font-bold text-slate-800">{c.userName} ({c.userRole}): </span>
                              <span className="text-slate-700 font-sans">{c.content}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* =========================================================
           MAIN INTERACTIVE DESIGN INTERFACE
           ========================================================= */
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
          
          {/* MAIN CENTER WORKSPACE AREA */}
          <main className="flex-1 p-1.5 bg-[#222]/10 flex flex-col gap-1.5 overflow-hidden relative min-h-0">
            
            {/* Upload notifications banner */}
            {uploadProgress && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs rounded-xl flex items-center gap-2 animate-pulse font-bold z-10">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{uploadProgress}</span>
              </div>
            )}

            {/* Interactive blueprint graphic view canvas */}
            <div className="flex-1 min-h-[calc(100vh-180px)] lg:min-h-0">
              <FloorPlanViewer
                floorPlan={activePlan}
                floorPlans={projectFloorPlans}
                activeFloorPlanId={activeFloorPlanId}
                setActiveFloorPlanId={setActiveFloorPlanId}
                onUpdateFloorPlan={handleUpdateFloorPlan}
                markers={projectMarkerNotes}
                selectedMarkerId={selectedMarkerId}
                onSelectMarker={(id) => {
                  setSelectedMarkerId(id);
                  setSelectedAnnotationId(null);
                }}
                onAddMarker={handleAddMarker}
                onUploadFloorPlan={handleFloorPlanUpload}
                
                annotations={projectAnnotations}
                onAddAnnotation={handleAddAnnotation}
                onUpdateAnnotation={handleUpdateAnnotation}
                onDeleteAnnotation={handleDeleteAnnotation}
                selectedAnnotationId={selectedAnnotationId}
                onSelectAnnotation={(id) => {
                  setSelectedAnnotationId(id);
                  if (id) setSelectedMarkerId(null);
                }}
                
                activeWhiteboardTool={activeWhiteboardTool}
                setActiveWhiteboardTool={setActiveWhiteboardTool}
                activeUserRole={activeUserRole}
                userRolesList={userRolesList}
                currentColor={currentColor}
                setCurrentColor={setCurrentColor}
                onUndo={handleUndo}
                onRedo={handleRedo}
                canUndo={undoStack.length > 0}
                canRedo={redoStack.length > 0}
                activeProjectId={activeProjectId}
                onDeleteFloorPlan={handleDeleteFloorPlan}
                activeProject={activeProject}
                onUpdateMarker={handleUpdateMarker}
              />
            </div>
          </main>

          {/* ACTIVE RIGHT DETAIL COLLABORATION SIDEBAR */}
          {isRightSidebarOpen && (
            <aside className="relative w-full lg:w-[300px] xl:w-[320px] p-2 lg:pl-0 flex flex-col shrink-0">
              {/* Thin Vertical Collapse Button */}
              <div className="absolute left-[-10px] top-1/2 -translate-y-1/2 z-45 hidden lg:block">
                <button
                  onClick={() => setIsRightSidebarOpen(false)}
                  className="w-5 h-20 bg-slate-950 hover:bg-[#222] text-indigo-400 border border-r-0 border-[#444] rounded-l-2xl shadow-2xl font-black text-xs flex flex-col items-center justify-center gap-1 cursor-pointer hover:scale-105 active:scale-95 transition-all"
                  title="Thu gọn bảng phản hồi"
                >
                  <span>▶</span>
                  <span className="text-[7.5px] uppercase tracking-tighter text-indigo-400 font-extrabold block [writing-mode:vertical-lr] mt-1">Thu gọn</span>
                </button>
              </div>

              <MarkerDetailSidebar
                marker={selectedMarker}
                onUpdateMarker={handleUpdateMarker}
                onDeleteMarker={handleDeleteMarker}
                onTriggerCamera={() => setShowCameraModal(true)}
                onClose={() => {
                  setSelectedMarkerId(null);
                  setSelectedAnnotationId(null);
                  setIsRightSidebarOpen(false); // Automatically collapse to maximize Miro drawing workspace!
                }}
                
                selectedAnnotation={selectedAnnotation}
                onUpdateAnnotation={handleUpdateAnnotation}
                onDeleteAnnotation={handleDeleteAnnotation}
                
                activeUserRole={activeUserRole}
                userRolesList={userRolesList}
                onSetActiveUserRole={setActiveUserRole}

                markersList={projectMarkerNotes}
                onSelectMarker={(id) => {
                  setSelectedMarkerId(id);
                  setSelectedAnnotationId(null);
                  setIsRightSidebarOpen(true);
                }}
                onAddMarker={handleAddMarker}
              />
            </aside>
          )}

          {!isRightSidebarOpen && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2 z-35 hidden lg:block">
              <button
                onClick={() => setIsRightSidebarOpen(true)}
                className="w-5 h-20 bg-slate-950 hover:bg-[#222] text-indigo-400 border border-r-0 border-[#444] rounded-l-2xl shadow-2xl font-black text-xs flex flex-col items-center justify-center gap-1 cursor-pointer hover:scale-105 active:scale-95"
                title="Hiện bảng phản hồi bên phải"
              >
                <span>◀</span>
                <span className="text-[7.5px] uppercase tracking-tighter text-indigo-400 font-extrabold block [writing-mode:vertical-lr] mt-1">Chi tiết</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Hidden camera snapshot trigger popup */}
      {showCameraModal && (
        <CameraModal
          onCapture={handleCapturePhoto}
          onClose={() => setShowCameraModal(false)}
        />
      )}

      {/* Dowmark Operations diagram modal popup */}
      <OpsMapModal
        isOpen={showDowmarkModal}
        onClose={() => setShowDowmarkModal(false)}
        onSyncReload={loadData}
      />

      {/* Share / Collaboration modal */}
      <ShareProjModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        activePlan={activePlan}
        markerNotes={projectMarkerNotes}
        annotations={projectAnnotations}
        onImportSuccess={handleImportSuccess}
      />

      <LessonsLearnedModal
        isOpen={showLessonsModal}
        onClose={() => setShowLessonsModal(false)}
        onImportMockBluePrint={handleImportMockBluePrint}
        liveProjects={projects}
        liveFloorPlans={floorPlans}
        liveMarkerNotes={markerNotes}
        liveAnnotations={annotations}
        onNavigateToRealProject={(projectId, floorPlanId, markerId) => {
           setActiveProjectId(projectId);
           setActiveFloorPlanId(floorPlanId);
           setSelectedMarkerId(markerId);
           setIsRightSidebarOpen(true);
           setCurrentView('workspace');
           setShowLessonsModal(false);
        }}
        onImportJSONBackup={handleImportJSONBackup}
      />

      {/* Global Hidden File Uploader */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*,application/pdf" 
        multiple 
        onChange={handleGlobalFileChange} 
      />
      {/* Compression Prompt Modal */}
      {showCompressPrompt.show && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#333] rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-700 p-6 text-[#e0e0e0]">
            <h2 className="text-xl font-bold mb-4 text-white">Tệp Quá Lớn</h2>
            <p className="mb-4 text-sm text-slate-300">
              Tệp <strong>{showCompressPrompt.fileName}</strong> có dung lượng {(showCompressPrompt.fileSize).toFixed(1)}MB.
            </p>
            <p className="mb-6 text-sm text-slate-300">
              Hệ thống lưu trữ miễn phí hiện tại chỉ cho phép tối đa <strong>50MB</strong> mỗi tệp. Bạn có muốn mở trang <strong>iLovePDF</strong> để nén tệp này cho nhẹ bớt trước khi tải lên không?
            </p>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setShowCompressPrompt({show: false, fileName: '', fileSize: 0})}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium transition-colors"
              >
                Hủy bỏ
              </button>
              <a 
                href="https://www.ilovepdf.com/vi/giam-dung-l%C6%B0%E1%BB%A3ng-pdf" 
                target="_blank" 
                rel="noreferrer"
                onClick={() => setShowCompressPrompt({show: false, fileName: '', fileSize: 0})}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 rounded-lg text-white font-medium transition-colors flex items-center gap-2"
              >
                Mở trang Nén PDF <ExternalLink size={16} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Global Capture FAB */}
      {currentView === 'workspace' && workspaceView === 'report' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60]">
          <button
            onClick={() => setIsGlobalCaptureOpen(true)}
            className="flex items-center gap-2 px-6 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-full shadow-[0_10px_30px_rgba(16,185,129,0.5)] transition-transform hover:scale-105 active:scale-95 border-2 border-emerald-400"
          >
            <Camera className="w-6 h-6" />
            <span className="text-sm uppercase tracking-wide">📸 CHỤP LỖI NGAY</span>
          </button>
        </div>
      )}



      {/* Global Capture Modal */}
      {isGlobalCaptureOpen && (
        <GlobalCaptureModal
          onCaptureComplete={(draft) => {
            setGlobalDraftFault(draft);
            setIsGlobalCaptureOpen(false);
            setIsDefectCategorySelectorOpen(true); // Step 2: Pick category
          }}
          onClose={() => setIsGlobalCaptureOpen(false)}
        />
      )}

      {/* Defect Category Selector (Step 2 of capture flow) */}
      {isDefectCategorySelectorOpen && (
        <DefectCategorySelector
          onClose={() => setIsDefectCategorySelectorOpen(false)}
          onSelect={(category, subcategory) => {
            setIsDefectCategorySelectorOpen(false);
            setSelectedDefectCategory({ category: category.label, subcategory, planType: category.planType });
            
            // Auto-find matching floor plan in current project
            const projectPlans = floorPlans.filter(fp => fp.projectId === activeProjectId);
            
            // Prefer pinned plan of this category
            let matchingPlan = projectPlans.find(fp => fp.planType === category.planType && fp.isPinTarget);
            
            // Fallback to any plan of this category if no pinned plan exists
            if (!matchingPlan) {
              matchingPlan = projectPlans.find(fp => fp.planType === category.planType);
            }
            
            if (matchingPlan) {
              // Found matching plan → go straight to pinmap!
              setActiveFloorPlanId(matchingPlan.id);
              setCurrentView('workspace');
              setWorkspaceView('pinmap');
            } else {
              // No matching plan → fallback to manual selection
              setIsGlobalPinSelectorOpen(true);
            }
          }}
        />
      )}

      {/* Global Pin Selector Modal (Fallback when no matching plan found) */}
      {isGlobalPinSelectorOpen && (
        <GlobalPinSelectorModal
          projects={projects}
          floorPlans={floorPlans}
          activeProjectId={activeProjectId}
          onClose={() => setIsGlobalPinSelectorOpen(false)}
          onSelectDestination={(projectId, floorPlanId) => {
            setIsGlobalPinSelectorOpen(false);
            setActiveProjectId(projectId);
            setActiveFloorPlanId(floorPlanId);
            setCurrentView('workspace');
            setWorkspaceView('pinmap');
          }}
          onTriggerUpload={(projectId) => {
            setActiveProjectId(projectId);
            setUploadTargetPlanType(selectedDefectCategory?.planType || 'perspective');
            if (fileInputRef.current) fileInputRef.current.click();
            setIsGlobalPinSelectorOpen(false);
          }}
        />
      )}

    </div>
  );
}
