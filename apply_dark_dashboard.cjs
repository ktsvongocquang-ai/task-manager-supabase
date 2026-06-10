const fs = require('fs');

const target = 'c:/Users/DELL/.gemini/antigravity/scratch/dqh/task-manager-supabase/mirror-app/src/App.tsx';
let content = fs.readFileSync(target, 'utf8');

// Import DarkDashboard at top
if (!content.includes('import DarkDashboard')) {
  content = content.replace(
    "import FloorPlanViewer from './components/FloorPlanViewer';", 
    "import DarkDashboard from './components/DarkDashboard';\nimport FloorPlanViewer from './components/FloorPlanViewer';"
  );
}

// Replace the dashboard rendering logic inside return (...)
// Find where it renders the dashboard: <div className="min-h-screen bg-[#111] text-[#e5e5e5] font-sans ...
// It's after `if (currentView === 'dashboard') {`
// Actually, earlier we saw `if (currentView === 'dashboard') { ... }` was evaluating variables. Then in `return (...)`:
//   {currentView === 'dashboard' && ( ... )}

// Let's replace the whole {currentView === 'dashboard' && ( ... )}
// The easiest way is using a regex, but HTML could have many nested divs.

// Wait, the variables evaluated inside `if (currentView === 'dashboard')` are no longer needed because DarkDashboard does it.
// Let's just do a string replacement for the return block.
const dashboardReturnStartStr = `{currentView === 'dashboard' && (`;
const workspaceReturnStartStr = `{currentView === 'workspace' && (`;

const dashboardStartIndex = content.indexOf(dashboardReturnStartStr);
const workspaceStartIndex = content.indexOf(workspaceReturnStartStr);

if (dashboardStartIndex > -1 && workspaceStartIndex > -1) {
  const replacement = `{currentView === 'dashboard' && (
        <DarkDashboard
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
        />
      )}
      
      `;
      
   content = content.substring(0, dashboardStartIndex) + replacement + content.substring(workspaceStartIndex);
   
   fs.writeFileSync(target, content);
   console.log('App.tsx updated successfully.');
} else {
   console.log('Could not find dashboard render block.');
}
