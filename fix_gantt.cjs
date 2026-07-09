const fs = require('fs');
const path = 'src/pages/construction/ProjectManagement.tsx';
let content = fs.readFileSync(path, 'utf8');

const origSig1 = `  onReorderTasks,
  readOnly,
}: {`;
const newSig1 = `  onReorderTasks,
  readOnly,
  projectStartDate,
  projectEndDate,
  onUpdateProjectDates,
}: {`;

const origSig2 = `  onCreateTask?: (category: string) => void;
  onReorderTasks?: (reordered: CTask[]) => void;
  readOnly?: boolean;
}) {`;
const newSig2 = `  onCreateTask?: (category: string) => void;
  onReorderTasks?: (reordered: CTask[]) => void;
  readOnly?: boolean;
  projectStartDate?: string;
  projectEndDate?: string;
  onUpdateProjectDates?: (start?: string, end?: string) => void;
}) {`;

const origCall = `          onReorderTasks={reordered => setDisplayTasks(reordered)}
          readOnly={readOnly}
        />`;
const newCall = `          onReorderTasks={reordered => setDisplayTasks(reordered)}
          readOnly={readOnly}
          projectStartDate={project?.start_date}
          projectEndDate={project?.handover_date}
          onUpdateProjectDates={(start, end) => {
            if (projectId && onUpdateProject) {
              const updates = {};
              if (start !== undefined) updates.start_date = start;
              if (end !== undefined) updates.handover_date = end;
              if (Object.keys(updates).length > 0) {
                onUpdateProject(projectId, updates);
              }
            }
          }}
        />`;

function normalizeSpaces(str) {
    return str.replace(/\r\n/g, '\n').trim();
}

let c = normalizeSpaces(content);

let s1 = normalizeSpaces(origSig1);
let n1 = normalizeSpaces(newSig1);
c = c.replace(s1, n1);

let s2 = normalizeSpaces(origSig2);
let n2 = normalizeSpaces(newSig2);
c = c.replace(s2, n2);

let s3 = normalizeSpaces(origCall);
let n3 = normalizeSpaces(newCall);
c = c.replace(s3, n3);

// But wait, the original file has spaces and indents, if I replace the normalized string, I will lose formatting!
// So let's replace directly on `content` by making a regex that ignores whitespace differences.
function makeRegex(str) {
    let escaped = str.replace(/[.*+?^$\{\}()|\[\]\\]/g, '\\$&');
    let wsIgnored = escaped.replace(/\s+/g, '\\s*');
    return new RegExp(wsIgnored, 'g');
}

content = content.replace(makeRegex(origSig1), newSig1);
content = content.replace(makeRegex(origSig2), newSig2);
content = content.replace(makeRegex(origCall), newCall);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed gantt successfully!');
