const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSQL() {
    const { data, error } = await supabase.rpc('execute_sql_query', {
        query: 'ALTER TABLE marketing_projects ADD COLUMN IF NOT EXISTS content_link TEXT;'
    });
    console.log(error || "Success");
}

runSQL();
