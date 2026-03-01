const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8');
const getEnv = (key) => {
    const match = env.match(new RegExp(`${key}=(.*)`));
    return match ? match[1].trim().replace(/['"]/g, '') : null;
};

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const ANON_KEY = getEnv('VITE_SUPABASE_ANON_KEY');
const SERVICE_KEY = getEnv('VITE_SUPABASE_SERVICE_ROLE_KEY');

async function testAdminBypass() {
    try {
        console.log("URL:", SUPABASE_URL);
        console.log("ANON:", ANON_KEY?.substring(0, 10) + '...');
        console.log("SERVICE:", SERVICE_KEY?.substring(0, 10) + '...');
        console.log("Testing API endpoint bypassing Kong service_key browser restrictions...");

        const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${SERVICE_KEY}`,
                'apikey': ANON_KEY, // The trick: pass the ANON key to Kong!
                'Content-Type': 'application/json',
                'Origin': 'http://localhost:5173' // Mock browser origin
            }
        });

        console.log(`Status: ${res.status}`);
        const data = await res.json();
        if (res.ok) {
            console.log("SUCCESS! Found users:", data.users?.length || data.length);
        } else {
            console.error("FAILED:", data);
        }
    } catch (err) {
        console.error("Error:", err);
    }
}

testAdminBypass();
