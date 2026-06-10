const fs = require('fs');
const path = require('path');

const newInMirror = [
  '/components/BottomNavBar.tsx',
  '/components/CameraModal.tsx',
  '/components/CEODashboard.tsx',
  '/components/ConfirmStamps.tsx',
  '/components/FloorPlanViewer.tsx',
  '/components/GlobalCaptureModal.tsx',
  '/components/GlobalPinSelectorModal.tsx',
  '/components/LessonsLearnedModal.tsx',
  '/components/MarkerDetailModal.tsx',
  '/components/MarkerDetailSidebar.tsx',
  '/components/modals/ImageGalleryModal.tsx',
  '/components/NotificationPanel.tsx',
  '/components/OpsMapModal.tsx',
  '/components/PinMapView.tsx',
  '/components/ProjectProfile.tsx',
  '/components/ReportLayout.tsx',
  '/components/ShareProjModal.tsx',
  '/components/ToastNotification.tsx',
  '/components/VoiceNoteRecorder.tsx',
  '/components/XUDashboard.tsx',
  '/lib/db.ts',
  '/lib/demoPlan.ts',
  '/lib/notifications.ts',
  '/utils/pdfUtils.ts',
  '/utils/uploadUtils.ts'
];

const mirrorDir = path.join(__dirname, 'mirror-app', 'src');
const mainDir = path.join(__dirname, 'src');

for (const relPath of newInMirror) {
  const src = path.join(mirrorDir, relPath);
  const dst = path.join(mainDir, relPath);
  
  // Ensure directory exists
  const dstDir = path.dirname(dst);
  if (!fs.existsSync(dstDir)) {
    fs.mkdirSync(dstDir, { recursive: true });
  }

  // Read and modify imports if necessary
  let content = fs.readFileSync(src, 'utf8');
  
  // Change '../types' to '../types/floorplan'
  content = content.replace(/from '\.\.\/types'/g, "from '../types/floorplan'");
  content = content.replace(/from '\.\/types'/g, "from './types/floorplan'");
  
  // Actually since some are in 'components/modals/ImageGalleryModal.tsx', we need to check relative paths carefully.
  // Better yet, just copy `mirror-app/src/types.ts` to `src/types.ts`? No, main app already might import `types` which defaults to `types/index.ts`. If we create `src/types.ts`, it might conflict. Let's create `src/types/floorplan.ts`.
  // The imports in mirror components are `from '../types'` (for level 1) or `from '../../types'` (for level 2).
  content = content.replace(/from '(\.\.\/)*types'/g, (match, p1) => {
    return `from '${p1 || './'}types/floorplan'`;
  });

  fs.writeFileSync(dst, content);
  console.log(`Copied ${relPath}`);
}

// Copy types.ts to types/floorplan.ts
let typesContent = fs.readFileSync(path.join(mirrorDir, 'types.ts'), 'utf8');
fs.writeFileSync(path.join(mainDir, 'types', 'floorplan.ts'), typesContent);
console.log('Copied types.ts to types/floorplan.ts');

console.log('Done copying files.');
