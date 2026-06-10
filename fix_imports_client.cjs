const fs = require('fs');
const path = require('path');

function walk(dir) {
  fs.readdirSync(dir).forEach(file => {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) {
      walk(p);
    } else if (p.endsWith('.ts') || p.endsWith('.tsx')) {
      let c = fs.readFileSync(p, 'utf8');
      
      let modified = false;
      
      if (c.includes("from '../../lib/supabaseClient'")) {
         c = c.replace(/from '\.\.\/\.\.\/lib\/supabaseClient'/g, "from '../../services/supabase'");
         modified = true;
      }
      if (c.includes("from '../lib/supabaseClient'")) {
         c = c.replace(/from '\.\.\/lib\/supabaseClient'/g, "from '../services/supabase'");
         modified = true;
      }
      if (c.includes("from './lib/supabaseClient'")) {
         c = c.replace(/from '\.\/lib\/supabaseClient'/g, "from './services/supabase'");
         modified = true;
      }
      
      if (modified) {
        fs.writeFileSync(p, c);
        console.log('Fixed', p);
      }
    }
  });
}

walk('c:/Users/DELL/.gemini/antigravity/scratch/dqh/task-manager-supabase/src');
