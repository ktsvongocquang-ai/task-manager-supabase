const fs = require('fs');
const path = 'src/pages/construction/ProjectManagement.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `          onReorderTasks={reordered => setDisplayTasks(reordered)}\r
          readOnly={readOnly}\r
        />`;

const targetUnix = `          onReorderTasks={reordered => setDisplayTasks(reordered)}\n          readOnly={readOnly}\n        />`;

const replacement = `          onReorderTasks={reordered => setDisplayTasks(reordered)}
          readOnly={readOnly}
          workflowStages={combinedStages}
          projectStartDate={project?.start_date}
          projectEndDate={project?.handover_date}
          onUpdateProjectDates={(start, end) => {
            if (projectId && onUpdateProject) {
              const updates: any = {};
              if (start !== undefined) updates.start_date = start;
              if (end !== undefined) updates.handover_date = end;
              if (Object.keys(updates).length > 0) {
                onUpdateProject(projectId, updates);
              }
            }
          }}
        />`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
} else if (content.includes(targetUnix)) {
    content = content.replace(targetUnix, replacement);
} else {
    console.log("NOT FOUND");
}

fs.writeFileSync(path, content, 'utf8');
console.log('Done patch 3');
