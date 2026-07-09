const fs = require('fs');
const lines = fs.readFileSync('old.tsx', 'utf8').split('\n');
let capturing = false;
const extracted = [];

for (const line of lines) {
  if (line.includes('// ── Gantt Chart ──')) {
    capturing = true;
    continue; // skip the header comment itself
  }
  if (capturing && line.includes('// ── Task Detail Panel ──')) {
    break;
  }
  if (capturing) {
    extracted.push(line);
  }
}

let content = extracted.join('\n');
content = content.replace('function ConstructionGantt(', 'export const ConstructionGantt = React.forwardRef(function ConstructionGantt(');
content = content.replace('readOnly?: boolean;\n}) {', 'readOnly?: boolean;\n}, ref: React.Ref<HTMLDivElement>) {');
content += '\n);';

fs.writeFileSync('src/pages/construction/Gantt.tsx', `import React, { useState, useMemo, useEffect, useRef } from 'react';
import { parseISO, format, addDays, differenceInDays, startOfDay, min, max } from 'date-fns';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import type { CTask, TaskStatus } from './types';
import { getTaskStart, getTaskEnd, getDateRange, getDaysBetween, parseDate } from './ProjectManagement';

` + content);
console.log('Done extracting Gantt.tsx from old.tsx');
