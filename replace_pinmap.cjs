const fs = require('fs');
const target = 'c:/Users/DELL/.gemini/antigravity/scratch/dqh/task-manager-supabase/mirror-app/src/components/PinMapView.tsx';
let content = fs.readFileSync(target, 'utf8');

// Container
content = content.replace(/bg-white/g, 'bg-[#1a1a1a]');
content = content.replace(/bg-slate-100\/50/g, 'bg-[#141414]');
content = content.replace(/bg-slate-50/g, 'bg-[#111]');

// Borders
content = content.replace(/border-slate-200\/50/g, 'border-[#333]');
content = content.replace(/border-slate-200/g, 'border-[#333]');
content = content.replace(/border-slate-100/g, 'border-[#222]');
content = content.replace(/border-slate-300/g, 'border-[#444]');

// Text
content = content.replace(/text-slate-800/g, 'text-white');
content = content.replace(/text-slate-700/g, 'text-[#ccc]');
content = content.replace(/text-slate-600/g, 'text-[#aaa]');
content = content.replace(/text-slate-500/g, 'text-[#888]');
content = content.replace(/text-slate-400/g, 'text-[#666]');

// Backgrounds
content = content.replace(/bg-slate-100/g, 'bg-[#222]');
content = content.replace(/bg-slate-200/g, 'bg-[#333]');
content = content.replace(/bg-slate-800/g, 'bg-[#444]');
content = content.replace(/bg-slate-900\/80/g, 'bg-[#111]/80');
content = content.replace(/bg-slate-900\/90/g, 'bg-[#111]/90');
content = content.replace(/bg-rose-50/g, 'bg-[#2a1114]');
content = content.replace(/bg-white\/40/g, 'bg-white/20');
content = content.replace(/bg-white\/90/g, 'bg-[#222]/90');

// Hover
content = content.replace(/hover:bg-slate-100/g, 'hover:bg-[#333]');
content = content.replace(/hover:bg-slate-200/g, 'hover:bg-[#444]');
content = content.replace(/hover:text-slate-700/g, 'hover:text-white');
content = content.replace(/hover:border-slate-300/g, 'hover:border-[#555]');

fs.writeFileSync(target, content);
console.log('PinMapView.tsx updated!');
