const fs = require('fs');
const lines = fs.readFileSync('old.tsx', 'utf16le').split('\n');
let capturing = false;
const extracted = [];

for (const line of lines) {
  if (line.includes('// ── Gantt Chart ──')) {
    capturing = true;
  }
  if (capturing && line.includes('// ── Task Detail Panel ──')) {
    break;
  }
  if (capturing) {
    extracted.push(line);
  }
}

fs.writeFileSync('src/pages/construction/Gantt.tsx', `import React, { useState, useMemo, useEffect, useRef, forwardRef } from 'react';
import { parseISO, format, addDays, differenceInDays, startOfDay, min, max } from 'date-fns';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import type { CTask, TaskStatus } from './types';
import { getTaskStart, getTaskEnd, getDateRange, getDaysBetween, parseDate } from './ProjectManagement';

` + extracted.join('\n').replace('function ConstructionGantt', 'export const ConstructionGantt = forwardRef(function ConstructionGantt').replace('readOnly?: boolean;\n}) {', 'readOnly?: boolean;\n}, ref: React.Ref<HTMLDivElement>) {').replace('export const ConstructionGantt = forwardRef(function ConstructionGantt(', 'export const ConstructionGantt = forwardRef(function ConstructionGantt(') + '\n);');
console.log('Done extracting Gantt.tsx from old.tsx');
