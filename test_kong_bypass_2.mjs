import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const getEnv = (key) => {
    const match = env.match(new RegExp(`${key}=(.*)`));
    return match ? match[1].trim().replace(/['"]/g, '') : null;
};

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SERVICE_KEY = getEnv('VITE_SUPABASE_SERVICE_ROLE_KEY');

async function testAdminBypass() {
    try {
        const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${SERVICE_KEY}`,
                'apikey': SERVICE_KEY,
                'Content-Type': 'application/json',
                'Origin': 'https://task-manager-supabase-mkxx.vercel.app'
            }
        });

        console.log(`Status: ${res.status}`);
        const text = await res.text();
        console.log("Response:", text);
    } catch (err) {
        console.error("Error:", err);
    }
}

testAdminBypass();
