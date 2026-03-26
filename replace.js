import fs from 'fs';
const file = 'c:\\Users\\DELL\\.gemini\\antigravity\\scratch\\dqh\\task-manager-supabase\\local-api-server.js';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/gemini-2\.0-flash/g, 'gemini-3-flash-preview');
fs.writeFileSync(file, content);
console.log('Successfully replaced all gemini-2.0-flash with gemini-3-flash-preview in local-api-server.js');
