export interface FloorPlan {
  id: string;
  name: string;
  imageData: string; // Base64 or ObjectURL of the floor plan drawing
  width: number;
  height: number;
  createdAt: number;
  canvasX?: number; // Manual coordinate on whiteboard canvas
  canvasY?: number; // Manual coordinate on whiteboard canvas
  projectId?: string; // Parent project reference ID
  planType?: string; // Strict categorization
  isPinned?: boolean; // Pinned to the top navigation dashboard bar
  documentGroupId?: string; // Grouping ID for multi-page documents (like PDFs) - deprecated but kept for backwards compatibility
  pageIndex?: number; // 0-based page index within the document - deprecated
  pageCount?: number; // Total number of pages in the document
  pdfData?: string; // Raw base64 PDF data for on-demand rendering
  canvasScale?: number; // Scale factor for resizing on canvas (default 1.0)
  isLocked?: boolean; // Lock movement and editing
  zIndex?: number; // Layering order (Bring to front/Send to back)
  isPinTarget?: boolean; // Mark as a preferred target for pinning defects
}

export interface Project {
  id: string;
  name: string;
  client: string;
  leader: string;
  address: string;
  status: 'active' | 'archived';
  progress: number; // e.g. 70% completed
  createdAt: number;
}

export interface CommentReply {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  content: string;
  createdAt: number;
}

export interface MarkerNote {
  id: string;
  floorPlanId: string;
  x: number; // Percentage X coordinate (0 to 100) on the floor plan
  y: number; // Percentage Y coordinate (0 to 100) on the floor plan
  title: string;
  photoData: string | null; // Captured photo as Base64 string
  audioData: string | null; // Recorded voice as Base64 string or Blob
  transcription: string; // Translated/voice-transcribed text note
  textNotes: string; // Manual notes typed by the user (optional)
  createdAt: number;
  comments?: CommentReply[]; // Simulated threaded communication
  tags?: string[];
  conceptPhotoData?: string | null; // Proposed concept / illustrative image
  conceptNotes?: string; // Brief design concept/solution note
  severity?: 'critical' | 'high' | 'medium' | 'low'; // Mức độ
  assignee?: string; // Người chịu trách nhiệm
}

export interface WhiteboardAnnotation {
  id: string;
  floorPlanId: string;
  type: 'sticky' | 'rect' | 'ellipse' | 'arrow' | 'pen' | 'text' | 'line' | 'elbow-arrow' | 'block-arrow' | 'rhombus' | 'triangle' | 'diagram' | 'frame' | 'cloud';
  x: number; // Percentage coordinates
  y: number;
  width: number; // Percentage or absolute relative size
  height: number;
  color: string; // Color code
  content: string; // Text for stickies and text boxes
  points?: string; // Path or serialized coordinates for freehand pen / arrows
  createdAt: number;
  userName: string; // Captured who created this
  comments?: CommentReply[];
  endX?: number; // For arrow coordinates
  endY?: number; // For arrow coordinates
  strokeWidth?: number; // Custom stroke width (thickness, e.g. from 1 to 12)
  strokeDash?: 'solid' | 'dashed' | 'dotted'; // Line style
  lineType?: 'straight' | 'elbow' | 'curved'; // Connector style
  isLocked?: boolean; // Locked element to prevent editing/movement
  opacity?: number; // Solid opacity fill
  lineJump?: boolean; // Extra jump arc on intersections
  zIndex?: number; // Custom layer ordering
}

export interface UserRoleProfile {
  id: string;
  name: string;
  role: string;
  color: string;
  avatarUrl?: string;
  email?: string;
  tag?: string;
  hasConstruction?: boolean;
}

export interface ApplicationState {
  floorPlans: FloorPlan[];
  activeFloorPlanId: string | null;
  notes: MarkerNote[];
  selectedMarkerId: string | null;
  cursorMode: 'pick' | 'pan';
}

