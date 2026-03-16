const fs = require('fs');
const file = 'c:/Users/DELL/.gemini/antigravity/scratch/dqh/task-manager-supabase/src/pages/marketing/MarketingApp.tsx';
let data = fs.readFileSync(file, 'utf8');

// Fix the corrupted syntax created by PowerShell backtick escape sequence
// Example corruption: {(task.assignee_id || \)_id} -> should be: {task.assignee_id || ''}
// Note: we'll just fix all cases of (task.assignee_id || \) or similar.
data = data.replace(/\(task\.assignee_id \|\| \\\)_id\}/g, '{task.assignee_id || \'\'}');
data = data.replace(/\(\(task\.assignee_id \|\| \\\) \|\| \\\)\.split/g, '(task.assignee_id || \'\').split');
data = data.replace(/\(\(task\.assignee_id \|\| \\\) \|\| \\\)\.substring/g, '(task.assignee_id || \'\').substring');
data = data.replace(/\(task\.assignee_id \|\| \\\)/g, '(task.assignee_id || \'\')');
data = data.replace(/\(task\.output \|\| \\\'Khác\\\'\)/g, '(task.output || \'Khác\')');
data = data.replace(/\(task\.category \|\| \\\'Video ngắn\\\'\)/g, '(task.category || \'Video ngắn\')');


// We also had JSX syntax issues like <div>(task.category || 'Video ngắn')</div> where it's missing curly brackets
// Wait, the error is TS1127: Invalid character on line 637 etc.
// Let's just do a clean pass and see what else needs fixing.
// Since it's too risky to guess all corruption, I will fix them logically.

fs.writeFileSync(file, data);
console.log('Fixed JSX syntax.');
