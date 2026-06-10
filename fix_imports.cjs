const fs = require('fs');
const path = require('path');

function walk(dir) {
  fs.readdirSync(dir).forEach(file => {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) {
      walk(p);
    } else if (p.endsWith('.ts') || p.endsWith('.tsx')) {
      let c = fs.readFileSync(p, 'utf8');
      
      // We want to replace import { ... } from '../lib/supabase' or '../../lib/supabase' 
      // with import { ... } from 'relative/path/to/services/supabase'
      
      // Let's just do a naive replace:
      // If it has "from '../../lib/supabase'", change to "from '../../services/supabase'"
      // If it has "from '../lib/supabase'", change to "from '../services/supabase'"
      
      let modified = false;
      
      if (c.includes("from '../../lib/supabase'")) {
         c = c.replace(/from '\.\.\/\.\.\/lib\/supabase'/g, "from '../../services/supabase'");
         modified = true;
      }
      if (c.includes("from '../lib/supabase'")) {
         c = c.replace(/from '\.\.\/lib\/supabase'/g, "from '../services/supabase'");
         modified = true;
      }
      if (c.includes("from './lib/supabase'")) {
         c = c.replace(/from '\.\/lib\/supabase'/g, "from './services/supabase'");
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
