const fs = require('fs');

const target = 'c:/Users/DELL/.gemini/antigravity/scratch/dqh/task-manager-supabase/src/pages/projects/PrototypeBoard.tsx';
let content = fs.readFileSync(target, 'utf8');

// Update imports
content = content.replace(/from '\.\//g, "from '../../");

// Rename export default function App() to export const PrototypeBoard = () => {
content = content.replace(/export default function App\(\) {/g, `import { useParams, useNavigate } from 'react-router-dom';\nexport const PrototypeBoard = () => {\n  const { id } = useParams();\n  const navigate = useNavigate();`);

// Change default state to bypass dashboard
content = content.replace(/const \[currentView, setCurrentView\] = useState<'dashboard' \| 'workspace'>\('dashboard'\);/g, `const [currentView, setCurrentView] = useState<'dashboard' | 'workspace'>('workspace');`);

// Add an effect to set activeProjectId from URL
content = content.replace(/useEffect\(\(\) => {\n    loadData\(\);\n  }, \[\]\);/, `useEffect(() => {\n    loadData().then(() => {\n      if (id) {\n        setActiveProjectId(id);\n        const projs = localStorage.getItem('dqh_prototype_projects') ? JSON.parse(localStorage.getItem('dqh_prototype_projects') || '[]') : [];\n        if (!projs.find(p => p.id === id)) {\n           // If this is a project from Supabase not in IndexedDB, maybe create a stub?\n           // For now, let it be.\n        }\n      }\n    });\n  }, [id]);`);

// Fix "Quay lại" buttons that go to 'dashboard' to navigate('/projects') instead
content = content.replace(/setCurrentView\('dashboard'\)/g, `navigate('/projects')`);

fs.writeFileSync(target, content);
