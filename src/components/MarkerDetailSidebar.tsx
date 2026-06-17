import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { MarkerNote, WhiteboardAnnotation, CommentReply, UserRoleProfile } from '../types/floorplan';
import {
  Trash2, Camera, Mic, Volume2, Calendar, FileText, Check, 
  Edit3, X, Play, Pause, AlertCircle, MessageSquare, Send, User, ShieldAlert,
  Sparkles, Image as ImageIcon, Lightbulb
} from 'lucide-react';
import VoiceNoteRecorder from './VoiceNoteRecorder';
import ImageGalleryModal from './modals/ImageGalleryModal';
import { compressImage } from '../utils/pdfUtils';
import { uploadImageToStorage } from '../services/supabase';

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

interface MarkerDetailSidebarProps {
  marker: MarkerNote | null;
  onUpdateMarker: (updated: MarkerNote) => void;
  onDeleteMarker: (id: string) => void;
  onTriggerCamera: () => void;
  onClose: () => void;
  
  // Whiteboard Annotations
  selectedAnnotation: WhiteboardAnnotation | null;
  onUpdateAnnotation: (updated: WhiteboardAnnotation) => void;
  onDeleteAnnotation: (id: string) => void;
  
  // Custom Multi-User / Role settings
  activeUserRole: UserRoleProfile;
  userRolesList: UserRoleProfile[];
  onSetActiveUserRole: (role: UserRoleProfile) => void;

  // New features for unified layout list
  markersList?: MarkerNote[];
  onSelectMarker?: (id: string | null) => void;
  onAddMarker?: (x: number, y: number) => void;
}

export default function MarkerDetailSidebar({
  marker,
  onUpdateMarker,
  onDeleteMarker,
  onTriggerCamera,
  onClose,
  
  selectedAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  
  activeUserRole,
  userRolesList,
  onSetActiveUserRole,

  markersList = [],
  onSelectMarker,
  onAddMarker
}: MarkerDetailSidebarProps) {
  // Title / general states
  const [title, setTitle] = useState<string>('');
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [manualText, setManualText] = useState<string>('');
  const [showVoiceRecorder, setShowVoiceRecorder] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [playbackAudioUrl, setPlaybackAudioUrl] = useState<string | null>(null);

  // Concept & Analysis States
  const [activeTab, setActiveTab] = useState<'survey' | 'concept'>('survey');
  const [conceptNotes, setConceptNotes] = useState<string>('');
  const conceptImageInputRef = useRef<HTMLInputElement>(null);
  const surveyImageInputRef = useRef<HTMLInputElement>(null);

  // Discussion comments states
  const [newCommentText, setNewCommentText] = useState<string>('');

  // Gallery state
  const [galleryImages, setGalleryImages] = useState<string[] | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);

  // Synchronize state with selected marker
  useEffect(() => {
    if (marker) {
      setTitle(marker.title);
      setManualText(marker.textNotes || '');
      setConceptNotes(marker.conceptNotes || '');
      setIsEditingTitle(false);
      setShowVoiceRecorder(false);
      setIsPlayingAudio(false);

      if (marker.audioData) {
        try {
          const base64Content = marker.audioData.split(',')[1] || marker.audioData;
          const byteCharacters = atob(base64Content);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);
          setPlaybackAudioUrl(url);
          return () => {
            URL.revokeObjectURL(url);
          };
        } catch (e) {
          console.error('Lỗi phân tích âm thanh playback:', e);
          setPlaybackAudioUrl(null);
        }
      } else {
        setPlaybackAudioUrl(null);
      }
    } else {
      setPlaybackAudioUrl(null);
    }
  }, [marker]);

  // Handle saving comment replies
  function handleAddComment() {
    if (!newCommentText.trim()) return;

    const newReply: CommentReply = {
      id: `reply-${Date.now()}`,
      userId: activeUserRole.id,
      userName: activeUserRole.name,
      userRole: activeUserRole.role,
      content: newCommentText.trim(),
      createdAt: Date.now()
    };

    if (marker) {
      const existingComments = marker.comments || [];
      const updatedMarker = {
        ...marker,
        comments: [...existingComments, newReply]
      };
      onUpdateMarker(updatedMarker);
    } else if (selectedAnnotation) {
      const existingComments = selectedAnnotation.comments || [];
      const updatedAnnotation = {
        ...selectedAnnotation,
        comments: [...existingComments, newReply]
      };
      onUpdateAnnotation(updatedAnnotation);
    }

    setNewCommentText('');
  }

  function handleSaveTextNote() {
    if (marker) {
      onUpdateMarker({
        ...marker,
        textNotes: manualText
      });
    }
  }

  function handleSaveConceptNotes() {
    if (marker) {
      onUpdateMarker({
        ...marker,
        conceptNotes: conceptNotes
      });
    }
  }

  async function handleSurveyImageUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !marker) return;

    try {
      // 1. Compress image
      const dataUrl = await compressImage(file);
      // 2. Convert back to File for upload
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const compressedFile = new File([blob], 'photo.webp', { type: 'image/webp' });
      // 3. Upload to Supabase
      const publicUrl = await uploadImageToStorage(compressedFile);
      
      // 4. Update Marker
      const newPhotos = [...parseImages(marker.photoData), publicUrl];
      onUpdateMarker({
        ...marker,
        photoData: JSON.stringify(newPhotos)
      });
    } catch (err: any) {
      console.error(err);
      alert(`Tải ảnh thất bại: ${err?.message || JSON.stringify(err)}`);
    }
  }

  function handleConceptImageUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !marker) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      onUpdateMarker({
        ...marker,
        conceptPhotoData: reader.result as string
      });
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveConceptImage() {
    if (marker) {
      onUpdateMarker({
        ...marker,
        conceptPhotoData: null
      });
    }
  }

  function handleSaveTitle() {
    if (marker && title.trim()) {
      onUpdateMarker({
        ...marker,
        title: title.trim()
      });
      setIsEditingTitle(false);
    }
  }

  function handleSaveVoiceData(audioBase64: string | null, transcription: string) {
    if (marker) {
      onUpdateMarker({
        ...marker,
        audioData: audioBase64 || marker.audioData,
        transcription: transcription || marker.transcription
      });
      setShowVoiceRecorder(false);
    }
  }

  function handleToggleSavedAudio() {
    const audioEl = document.getElementById('saved-marker-player') as HTMLAudioElement;
    if (!audioEl) return;
    
    if (isPlayingAudio) {
      audioEl.pause();
      setIsPlayingAudio(false);
    } else {
      audioEl.play().catch(e => console.error('Audio play error:', e));
      setIsPlayingAudio(true);
    }
  }

  // Determine standard title and details for layout render
  const objectType = marker ? 'pins' : selectedAnnotation ? 'whiteboard' : 'none';

  if (objectType === 'none') {
    return (
      <div className="bg-white border border-slate-200/80 h-full flex flex-col shadow-xl overflow-hidden rounded-2xl min-h-[400px]">
        {/* Header */}
        <div className="p-3 bg-slate-50 border-b border-slate-150 flex items-center justify-between text-slate-800 select-none">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-600 rounded-lg">
              <AlertCircle className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-xs font-bold text-slate-900">
              Hồ sơ sự cố ({markersList.length})
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 bg-white">
          {markersList.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12 select-none bg-white">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 border border-dashed border-slate-200 mb-3">
                <Camera className="w-5 h-5 animate-pulse" />
              </div>
              <h4 className="text-xs font-bold text-slate-705 text-slate-800">Chưa ghim điểm lỗi hiện trường</h4>
              <p className="text-[11px] text-slate-500 mt-1 max-w-[200px] leading-relaxed">
                Nhấp nút ghim máy ảnh trên thanh vẽ để định vị lỗi nứt, thấm dột.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-1.5 overflow-y-auto pr-0.5">
                {markersList.map((m, idx) => (
                  <div
                    key={m.id}
                    onClick={() => onSelectMarker?.(m.id)}
                    className="p-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-150 hover:border-slate-200 rounded-xl text-left cursor-pointer transition-all flex items-center gap-2.5 group"
                  >
                    {m.photoData ? (
                      <img
                        src={m.photoData}
                        className="w-9 h-9 object-cover rounded-lg shrink-0 border border-slate-200 bg-slate-50"
                        alt=""
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-9 h-9 bg-slate-100 text-slate-400 border border-slate-150 rounded-lg shrink-0 flex items-center justify-center group-hover:bg-slate-50 transition-colors">
                        <Camera className="w-4 h-4" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-bold text-slate-800 truncate">
                        #{idx + 1}. {m.title}
                      </h5>
                      <span className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                        {m.transcription || m.textNotes || 'Chưa mô tả'}
                      </span>
                      <div className="flex items-center gap-1.5 mt-1">
                        {(() => {
                          const status = m.tags && m.tags[0] ? m.tags[0] : 'Chưa sửa';
                          const statusConfig: Record<string, string> = {
                            'Chưa sửa': 'bg-rose-50 text-rose-600 border-rose-200',
                            'Đang sửa': 'bg-amber-50 text-amber-600 border-amber-200',
                            'Đã duyệt': 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          };
                          return (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${statusConfig[status] || statusConfig['Chưa sửa']}`}>
                              {status}
                            </span>
                          );
                        })()}
                        {m.comments && m.comments.length > 0 && (
                          <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                            <MessageSquare className="w-3 h-3" />{m.comments.length}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>


      </div>
    );
  }

  const renderCommentsSection = () => {
    const threadComments = marker ? (marker.comments || []) : (selectedAnnotation?.comments || []);
    return (
      <div className="flex flex-col gap-3.5 border-t border-slate-100 pt-4 mt-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span className="flex items-center gap-1.5 text-indigo-700">
            <MessageSquare className="w-4 h-4" />
            Trao đổi ({threadComments.length})
          </span>

        </div>

        {/* User role selector */}
        <div className="flex items-center gap-2 text-xs">
          <div style={{ backgroundColor: activeUserRole.color }} className="w-2 h-2 rounded-full shrink-0" />
          <select
            value={activeUserRole.id}
            onChange={(e) => {
              const selectedProfile = userRolesList.find(r => r.id === e.target.value);
              if (selectedProfile) onSetActiveUserRole(selectedProfile);
            }}
            className="text-[10px] bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-400 flex-1"
          >
            {userRolesList.map(r => (
              <option key={r.id} value={r.id}>{r.name} — {r.role}</option>
            ))}
          </select>
        </div>

        {/* Comments reply flow list */}
        <div className="max-h-[220px] overflow-y-auto pr-1 flex flex-col gap-2.5 scrollbar-thin">
          {threadComments.length === 0 ? (
            <p className="text-[11px] text-slate-400 italic text-center py-2">Chưa có bình luận nào. Hãy gửi lời khuyên hoặc báo cáo tiến độ bằng cách chọn vai bên trên!</p>
          ) : (
            threadComments.map((comment) => {
              const matchedRole = userRolesList.find(r => r.id === comment.userId);
              const customCol = matchedRole?.color || '#6366f1';
              return (
                <div key={comment.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-150 relative text-[11px] leading-relaxed">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: customCol }} />
                      {comment.userName}
                    </span>
                    <span className="text-[8.5px] text-slate-400 font-mono">
                      {new Date(comment.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500 block mb-1">
                    [{comment.userRole}]
                  </span>
                  <p className="text-slate-700 break-words font-sans">{comment.content}</p>
                </div>
              );
            })
          )}
        </div>

        {/* Quick Comment Input */}
        <div className="flex items-center gap-1.5 mt-1">
          <input
            type="text"
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddComment();
            }}
            placeholder={`Bình luận với tư cách ${activeUserRole.name}...`}
            className="flex-1 bg-slate-50 border border-slate-200 focus:bg-white text-xs px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800"
          />
          <button
            onClick={handleAddComment}
            className="p-2 bg-indigo-600 hover:bg- indigo-500 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl cursor-pointer shadow-md transition-colors"
            title="Gửi phản hồi nhanh"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl h-full flex flex-col shadow-xl overflow-hidden min-h-[480px]">
      
      {/* Sidebar Header */}
      <div className="p-3 bg-slate-50 border-b border-slate-150 flex items-center justify-between text-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-600 text-white rounded-lg">
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-slate-900">
            {marker ? 'Chi tiết sự cố' : `Nhãn: ${selectedAnnotation?.type}`}
          </span>
        </div>
        <button
          onClick={() => {
            if (onSelectMarker) {
              onSelectMarker(null);
            } else {
              onClose();
            }
          }}
          className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Sidebar main body context scrollable */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        
        {/* VIEW A: IF THE ACTIVE SELECTION IS CAMERA NOTES PIN POINT */}
        {marker && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Tiêu đề:</label>
              {isEditingTitle ? (
                <div className="flex items-center gap-1.5 mt-1">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleSaveTitle}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                    className="flex-1 bg-white border border-emerald-500 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none text-slate-800"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveTitle}
                    className="p-2 bg-emerald-100 hover:bg-emerald-200 rounded-xl text-emerald-700 transition-colors cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 mt-1">
                  <h4 className="font-bold text-slate-800 text-xs leading-tight flex-1 break-words">{title}</h4>
                  <button
                    onClick={() => setIsEditingTitle(true)}
                    className="p-1 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded transition-colors cursor-pointer"
                    title="Sửa tiêu đề ghim lỗi"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-1">
                <Calendar className="w-3 h-3" />
                <span>{new Date(marker.createdAt).toLocaleDateString('vi-VN')}</span>
              </div>
              
              {/* Interactive Status Selector */}
              <div className="flex items-center flex-wrap gap-2 mt-3 pt-2 border-t border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-500">Trạng thái:</span>
                <div className="flex gap-1.5">
                  {[
                    { value: 'Chưa sửa', label: '🔴 Chưa sửa', color: 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100', active: 'bg-rose-500 text-white border-rose-500 shadow-sm' },
                    { value: 'Đang sửa', label: '🟡 Đang sửa', color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100', active: 'bg-amber-500 text-white border-amber-500 shadow-sm' },
                    { value: 'Đã duyệt', label: '🟢 Đã duyệt', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100', active: 'bg-emerald-500 text-white border-emerald-500 shadow-sm' }
                  ].map(st => {
                    const currentStatus = marker.tags && marker.tags[0] ? marker.tags[0] : 'Chưa sửa';
                    const isActive = currentStatus === st.value;
                    return (
                      <button
                        key={st.value}
                        onClick={() => {
                          const newTags = [...(marker.tags || [])];
                          newTags[0] = st.value; // Store status in tags[0]
                          onUpdateMarker({
                            ...marker,
                            tags: newTags
                          });
                        }}
                        className={`text-[10px] px-2.5 py-1 border rounded-lg font-bold transition-all cursor-pointer ${isActive ? st.active : st.color}`}
                      >
                        {st.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* UNIFIED FORM - Photo + Voice + Notes (merged from tabs) */}
            <div className="flex flex-col gap-4">
                {/* Photo Field capture zone */}
                <div className="flex flex-col gap-1.5 border-t border-slate-100 pt-3">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Hình ảnh / Video thực địa ({parseImages(marker.photoData).length}):</span>
                    <div className="flex gap-2.5">
                      <button 
                        type="button"
                        onClick={() => surveyImageInputRef.current?.click()}
                        className="text-[10px] text-indigo-650 hover:underline font-bold cursor-pointer"
                      >
                        Tải ảnh 📥
                      </button>
                      <button 
                        type="button"
                        onClick={onTriggerCamera}
                        className="text-[10px] text-indigo-650 hover:underline font-bold cursor-pointer"
                      >
                        Chụp ảnh 📷
                      </button>
                    </div>
                  </label>

                  <input
                    type="file"
                    ref={surveyImageInputRef}
                    onChange={handleSurveyImageUpload}
                    accept="image/*"
                    className="hidden"
                  />

                  {parseImages(marker.photoData).length > 0 ? (
                    <div className="flex gap-2 overflow-x-auto pb-2 snap-x scrollbar-thin">
                      {parseImages(marker.photoData).map((pUrl, idx) => (
                        <div key={idx} className="relative group shrink-0 w-40 h-40 snap-center">
                          <img
                            src={pUrl}
                            alt={`Hiện trường ${idx + 1}`}
                            className="w-full h-full object-cover rounded-xl border border-slate-200 cursor-pointer hover:opacity-90"
                            referrerPolicy="no-referrer"
                            onClick={() => {
                              setGalleryImages(parseImages(marker.photoData));
                              setGalleryIndex(idx);
                            }}
                          />
                          <button
                            onClick={() => {
                              const newPhotos = parseImages(marker.photoData).filter((_, i) => i !== idx);
                              onUpdateMarker({ 
                                ...marker, 
                                photoData: newPhotos.length > 0 ? JSON.stringify(newPhotos) : null 
                              });
                            }}
                            className="absolute top-1.5 right-1.5 bg-slate-900/85 hover:bg-red-600 text-white p-1.5 rounded-full transition-colors cursor-pointer"
                            title="Gỡ ảnh"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="w-full border-2 border-dashed border-slate-200 bg-slate-50 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                      <Camera className="w-6 h-6 text-slate-400 mb-2" />
                      <span className="text-xs font-bold text-slate-700 mb-2">Chưa tải hình ảnh hiện trường</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => surveyImageInputRef.current?.click()}
                          className="px-3.5 py-1.5 bg-indigo-50 border border-indigo-150 text-indigo-700 hover:bg-indigo-100/80 font-bold text-[10.5px] rounded-lg cursor-pointer transition-all flex items-center gap-1 shadow-sm"
                        >
                          📁 Đính kèm tệp ảnh
                        </button>
                        <button
                          type="button"
                          onClick={onTriggerCamera}
                          className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-150 text-emerald-700 hover:bg-emerald-100/80 font-bold text-[10.5px] rounded-lg cursor-pointer transition-all flex items-center gap-1 shadow-sm"
                        >
                          📷 Chụp từ Webcam
                        </button>
                      </div>
                      <span className="text-[9px] text-slate-400 mt-2.5">Hỗ trợ đính kèm tệp ảnh hiện trường thực tế từ thiết bị của bạn</span>
                    </div>
                  )}
                </div>

                {/* Sound Transcript Recorder Zone */}
                <div className="flex flex-col gap-1.5 border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Ghi âm:</label>
                    {!showVoiceRecorder && (
                      <button
                        onClick={() => setShowVoiceRecorder(true)}
                        className="text-[10px] font-bold text-emerald-600 hover:text-emerald-500 cursor-pointer flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100"
                      >
                        <Mic className="w-3 h-3" />
                        Bắt đầu thu âm
                      </button>
                    )}
                  </div>

                  {showVoiceRecorder ? (
                    <VoiceNoteRecorder
                      initialText={marker.transcription || ''}
                      onSave={handleSaveVoiceData}
                      onCancel={() => setShowVoiceRecorder(false)}
                    />
                  ) : (
                    <div className="bg-slate-50 border border-slate-205 rounded-xl p-3 flex flex-col gap-2 shadow-inner">
                      {playbackAudioUrl ? (
                        <div className="flex items-center gap-2.5 bg-white border border-slate-150 rounded-xl p-2 shadow-sm">
                          <button
                            onClick={handleToggleSavedAudio}
                            className="p-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-full cursor-pointer"
                          >
                            {isPlayingAudio ? (
                              <Pause className="w-3.5 h-3.5 fill-black" />
                            ) : (
                              <Play className="w-3.5 h-3.5 fill-black" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-slate-800">Thuyết minh đính kèm</p>
                            <p className="text-[8.5px] text-slate-500 italic">Click nghe âm thanh đã lưu</p>
                          </div>
                          <audio
                            id="saved-marker-player"
                            src={playbackAudioUrl}
                            onEnded={() => setIsPlayingAudio(false)}
                            className="hidden"
                          />
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 italic text-center py-1">Chưa thu âm thuyết minh cho ghim này.</p>
                      )}

                      {marker.transcription && (
                        <div className="bg-white border border-slate-100 rounded-lg p-2.5 text-[11px] text-slate-700 italic border-l-4 border-l-emerald-500 leading-relaxed shadow-sm font-sans">
                          "{marker.transcription}"
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Manual text notes typed */}
                <div className="flex flex-col gap-1.5 border-t border-slate-100 pt-3">
                  <label className="text-xs font-bold text-slate-700">Ghi chú kỹ thuật:</label>
                  <textarea
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                    onBlur={handleSaveTextNote}
                    placeholder="Ví dụ: Trần bê tông có vết ố ẩm mốc góc tường do thấm nước từ nhà vệ sinh tầng trên. Hệ MEP thô rỉ sét nhẹ..."
                    rows={3}
                    className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-555/20 text-slate-800 shadow-inner resize-none font-sans"
                  />
                  {manualText !== (marker.textNotes || '') && (
                    <div className="flex justify-end">
                      <button
                        onClick={handleSaveTextNote}
                        className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10px] rounded-lg cursor-pointer transition-colors shadow-sm"
                      >
                        ✓ Lưu mô tả
                      </button>
                    </div>
                  )}
                </div>

              {/* Concept Photo - inline after notes */}
              <div className="flex flex-col gap-1.5 border-t border-slate-100 pt-3">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Ảnh minh họa / Concept:</span>
                  {marker.conceptPhotoData && (
                    <button 
                      onClick={() => conceptImageInputRef.current?.click()}
                      className="text-[10px] text-indigo-600 hover:underline font-bold"
                    >
                      Đổi ảnh
                    </button>
                  )}
                </label>
                <input type="file" ref={conceptImageInputRef} onChange={handleConceptImageUpload} accept="image/*" className="hidden" />
                {marker.conceptPhotoData ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 group/img">
                    <img src={marker.conceptPhotoData} alt="Concept" className="w-full max-h-[140px] object-cover block" referrerPolicy="no-referrer" />
                    <div className="absolute top-1.5 right-1.5 opacity-0 group-hover/img:opacity-100 transition-opacity">
                      <button onClick={handleRemoveConceptImage} className="p-1 bg-slate-900/50 backdrop-blur rounded text-white hover:text-rose-400 cursor-pointer"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => conceptImageInputRef.current?.click()} className="w-full border border-dashed border-slate-200 hover:border-indigo-300 bg-slate-50 hover:bg-indigo-50/30 rounded-xl p-3 flex items-center justify-center gap-2 text-xs text-slate-500 hover:text-indigo-600 transition-all cursor-pointer">
                    <ImageIcon className="w-4 h-4" /> Đính kèm ảnh concept
                  </button>
                )}
              </div>

              {/* Concept Notes - inline */}
              <div className="flex flex-col gap-1.5 border-t border-slate-100 pt-3">
                <label className="text-xs font-bold text-slate-700">Đề xuất concept:</label>
                <textarea
                  value={conceptNotes || ''}
                  onChange={(e) => setConceptNotes(e.target.value)}
                  onBlur={handleSaveConceptNotes}
                  placeholder="Mô tả ý tưởng, vật liệu, tone màu..."
                  rows={3}
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 resize-none"
                />
                {conceptNotes !== (marker.conceptNotes || '') && (
                  <div className="flex justify-end">
                    <button onClick={handleSaveConceptNotes} className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-lg cursor-pointer">✓ Lưu</button>
                  </div>
                )}
              </div>
            </div>

            {/* Multi-role Discussion comments thread */}
            {renderCommentsSection()}
          </>
        )}

        {/* VIEW B: IF THE ACTIVE SELECTION IS WHITEBOARD ANNOTATION */}
        {selectedAnnotation && (
          <>
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-3 flex flex-col gap-2">
              <span className="text-[9px] uppercase tracking-wider font-bold text-indigo-700">Loại đối tượng nhãn dán</span>
              <h5 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: selectedAnnotation.color }} />
                {selectedAnnotation.type.toUpperCase()}
              </h5>
              <div className="text-[10px] text-slate-500 leading-normal flex flex-col gap-0.5 mt-1 font-mono">
                <span>Tác giả vẽ: {selectedAnnotation.userName}</span>
                <span>Tạo lúc: {new Date(selectedAnnotation.createdAt).toLocaleTimeString('vi-VN')}</span>
              </div>
            </div>

            {/* Content text editing for stickies and pure text labels */}
            {(selectedAnnotation.type === 'sticky' || selectedAnnotation.type === 'text') && (
              <div className="flex flex-col gap-1.5 border-t border-slate-100 pt-3">
                <label className="text-xs font-bold text-slate-700">Nội dung văn bản viết trong giấy dán:</label>
                <textarea
                  value={selectedAnnotation.content}
                  onChange={(e) => {
                    onUpdateAnnotation({
                      ...selectedAnnotation,
                      content: e.target.value
                    });
                  }}
                  rows={4}
                  placeholder="Hãy viết gì đó lên giấy nhớ..."
                  className="w-full text-xs p-3 bg-white border border-indigo-200/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-100 text-slate-800 leading-relaxed shadow-sm font-sans"
                />
              </div>
            )}

            {/* Shape annotations info panel */}
            {(selectedAnnotation.type === 'rect' || selectedAnnotation.type === 'ellipse' || selectedAnnotation.type === 'arrow' || selectedAnnotation.type === 'pen') && (
              <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 text-[11px] text-slate-600 leading-relaxed">
                <p className="font-bold text-slate-800 mb-1">Miro Vector Markup Component</p>
                Đây là một nét vẽ vector được vẽ trùm lên bản vẽ để đánh dấu điểm lỗi. Bạn có thể kéo thả di chuyển nét vẽ, đổi màu bút, hoặc trao đổi với nhóm về khu vực này ở khung bình luận.
              </div>
            )}

            {/* Multi-role comments specifically for this annotation component! */}
            {renderCommentsSection()}
          </>
        )}
      </div>

      {/* FOOTER OPERATIONS */}
      <div className="p-4 bg-slate-50 border-t border-slate-205 flex items-center justify-between shrink-0">
        <button
          onClick={() => {
            if (marker) {
              onDeleteMarker(marker.id);
            } else if (selectedAnnotation) {
              onDeleteAnnotation(selectedAnnotation.id);
            }
          }}
          className="flex items-center gap-1 px-3 py-2 text-[11px] font-bold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-xl transition-all cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Xóa khỏi bản vẽ
        </button>

        {marker && onAddMarker && (
          <button
            onClick={() => {
              onAddMarker(marker.x, marker.y);
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95 border border-emerald-500 hover:border-emerald-400"
            title="Tạo thêm 1 lỗi khác chồng lên ngay tại vị trí này"
          >
            <span>➕ Thêm lỗi ở đây</span>
          </button>
        )}

        <button
          onClick={() => {
            if (onSelectMarker) {
              onSelectMarker(null);
            } else {
              onClose();
            }
          }}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 font-bold text-xs text-white rounded-xl transition-colors cursor-pointer"
        >
          Xong
        </button>
      </div>

      {galleryImages && (
        <ImageGalleryModal
          images={galleryImages}
          initialIndex={galleryIndex}
          onClose={() => setGalleryImages(null)}
        />
      )}
    </div>
  );
}
