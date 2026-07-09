const fs = require('fs');

const path = 'src/pages/construction/ProjectManagement.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  `  onReorderTasks,
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
}) {`,
  `  onReorderTasks,
  readOnly,
  projectStartDate,
  projectEndDate,
  onUpdateProjectDates,
  workflowStages,
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
  workflowStages?: any[];
}) {`
);

fs.writeFileSync(path, content, 'utf8');
console.log('Patch2 done');
