const fs = require('fs');
const path = 'src/pages/construction/ProjectManagement.tsx';
let content = fs.readFileSync(path, 'utf8');

const origSig = `  onReorderTasks,
  readOnly,
}: {
  tasks: CTask[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUpdateTask: (id: string, updates: Partial<CTask>) => void;
  onDeleteTask?: (id: string) => void;
  onCreateTask?: (category: string) => void;
  onReorderTasks?: (reordered: CTask[]) => void;
  readOnly?: boolean;
}) {`;

const newSig = `  onReorderTasks,
  readOnly,
  projectStartDate,
  projectEndDate,
  onUpdateProjectDates,
}: {
  tasks: CTask[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUpdateTask: (id: string, updates: Partial<CTask>) => void;
  onDeleteTask?: (id: string) => void;
  onCreateTask?: (category: string) => void;
  onReorderTasks?: (reordered: CTask[]) => void;
  readOnly?: boolean;
  projectStartDate?: string;
  projectEndDate?: string;
  onUpdateProjectDates?: (start?: string, end?: string) => void;
}) {`;

content = content.replace(new RegExp(origSig.replace(/\r?\n/g, '\\s*'), 'g'), newSig);

const origCall = `          onReorderTasks={reordered => setDisplayTasks(reordered)}
          readOnly={readOnly}
        />`;

const newCall = `          onReorderTasks={reordered => setDisplayTasks(reordered)}
          readOnly={readOnly}
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

content = content.replace(new RegExp(origCall.replace(/\r?\n/g, '\\s*'), 'g'), newCall);

fs.writeFileSync(path, content, 'utf8');
console.log('patch4 done');
