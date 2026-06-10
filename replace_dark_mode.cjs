const fs = require('fs');
const path = require('path');

function replaceFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Backgrounds
  content = content.replace(/bg-white/g, 'bg-[#222]');
  content = content.replace(/bg-slate-50/g, 'bg-[#1c1c1c]');
  content = content.replace(/bg-gray-50/g, 'bg-[#1c1c1c]');
  content = content.replace(/bg-slate-100/g, 'bg-[#2a2a2a]');
  content = content.replace(/bg-gray-100/g, 'bg-[#2a2a2a]');
  
  // Hovers
  content = content.replace(/hover:bg-slate-50/g, 'hover:bg-[#333]');
  content = content.replace(/hover:bg-gray-50/g, 'hover:bg-[#333]');
  content = content.replace(/hover:bg-slate-100/g, 'hover:bg-[#333]');
  content = content.replace(/hover:bg-gray-100/g, 'hover:bg-[#333]');
  
  // Borders
  content = content.replace(/border-slate-200/g, 'border-[#333]');
  content = content.replace(/border-gray-200/g, 'border-[#333]');
  content = content.replace(/border-slate-100/g, 'border-[#333]');
  content = content.replace(/border-gray-100/g, 'border-[#333]');
  
  // Text
  content = content.replace(/text-slate-800/g, 'text-slate-100');
  content = content.replace(/text-gray-800/g, 'text-slate-100');
  content = content.replace(/text-slate-900/g, 'text-slate-50');
  content = content.replace(/text-gray-900/g, 'text-slate-50');
  content = content.replace(/text-slate-700/g, 'text-slate-200');
  content = content.replace(/text-gray-700/g, 'text-slate-200');
  content = content.replace(/text-slate-500/g, 'text-slate-400');
  content = content.replace(/text-gray-500/g, 'text-slate-400');
  
  content = content.replace(/hover:text-slate-700/g, 'hover:text-slate-200');
  content = content.replace(/hover:text-gray-700/g, 'hover:text-slate-200');
  content = content.replace(/hover:text-slate-900/g, 'hover:text-slate-50');
  content = content.replace(/hover:text-gray-900/g, 'hover:text-slate-50');
  
  // Fix specific layout classes
  content = content.replace(/bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100/g, 'bg-[#1c1c1c]');
  
  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated', filePath);
  }
}

// Walk directories
function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      replaceFile(fullPath);
    }
  }
}

walk('c:/Users/DELL/.gemini/antigravity/scratch/dqh/task-manager-supabase/src/components');
walk('c:/Users/DELL/.gemini/antigravity/scratch/dqh/task-manager-supabase/src/pages');
