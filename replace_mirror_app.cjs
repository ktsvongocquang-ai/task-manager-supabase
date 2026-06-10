const fs = require('fs');
const target = 'c:/Users/DELL/.gemini/antigravity/scratch/dqh/task-manager-supabase/mirror-app/src/App.tsx';
let content = fs.readFileSync(target, 'utf8');
content = content.replace(/bg-slate-900\/30/g, 'bg-[#222]');
content = content.replace(/border-slate-900\/60/g, 'border-[#333]');
content = content.replace(/bg-slate-950\/50/g, 'bg-[#1a1a1a]');
content = content.replace(/border-slate-900/g, 'border-[#333]');
content = content.replace(/border-slate-800/g, 'border-[#444]');
content = content.replace(/bg-\[#111827\]\/40/g, 'bg-[#222]');
content = content.replace(/bg-\[#111827\]\/75/g, 'bg-[#2a2a2a]');
content = content.replace(/bg-\[#111827\]/g, 'bg-[#1a1a1a]');
content = content.replace(/bg-slate-900/g, 'bg-[#222]');
content = content.replace(/text-slate-500/g, 'text-[#888]');
content = content.replace(/text-slate-400/g, 'text-[#aaa]');
content = content.replace(/text-slate-550/g, 'text-[#999]');
content = content.replace(/text-slate-100/g, 'text-white');
content = content.replace(/text-slate-200/g, 'text-[#e0e0e0]');
content = content.replace(/bg-slate-800/g, 'bg-[#333]');
content = content.replace(/bg-slate-950\/60/g, 'bg-[#111]');
fs.writeFileSync(target, content);
console.log('App.tsx updated!');

const targetNav = 'c:/Users/DELL/.gemini/antigravity/scratch/dqh/task-manager-supabase/mirror-app/src/components/BottomNavBar.tsx';
if (fs.existsSync(targetNav)) {
  let contentNav = fs.readFileSync(targetNav, 'utf8');
  contentNav = contentNav.replace(/bg-slate-950/g, 'bg-[#111]');
  contentNav = contentNav.replace(/border-slate-900/g, 'border-[#333]');
  contentNav = contentNav.replace(/text-slate-400/g, 'text-[#aaa]');
  contentNav = contentNav.replace(/text-slate-500/g, 'text-[#888]');
  contentNav = contentNav.replace(/bg-slate-900/g, 'bg-[#222]');
  fs.writeFileSync(targetNav, contentNav);
  console.log('BottomNavBar.tsx updated!');
}
