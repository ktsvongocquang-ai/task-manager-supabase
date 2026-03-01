import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const getEnv = (key) => {
    const match = env.match(new RegExp(`${key}=(.*)`));
    return match ? match[1].trim().replace(/['"]/g, '') : null;
};

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SERVICE_KEY = getEnv('VITE_SUPABASE_SERVICE_ROLE_KEY');

async function testHeader(headersToTest, label) {
    console.log(`\n--- Testing ${label} ---`);
    try {
        const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${SERVICE_KEY}`,
                'apikey': SERVICE_KEY,
                'Content-Type': 'application/json',
                ...headersToTest
            }
        });

        console.log(`Status: ${res.status}`);
        if (!res.ok) {
            const data = await res.json();
            console.error("Error Response:", data);
        }
    } catch (err) {
        console.error("Exception:", err);
    }
}

async function runTests() {
    await testHeader({ 'Origin': 'http://localhost:5173' }, 'Only Origin');
    await testHeader({ 'Referer': 'http://localhost:5173/' }, 'Only Referer');
    await testHeader({ 'Origin': 'http://localhost:5173', 'Referer': 'http://localhost:5173/' }, 'Origin + Referer');
    await testHeader({
        'Origin': 'http://localhost:5173',
        'Referer': 'http://localhost:5173/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }, 'Origin + Referer + Chrome Browser User-Agent');

    // Simulate full browser headers
    await testHeader({
        "accept": "*/*",
        "accept-language": "en-US,en;q=0.9",
        "sec-ch-ua": "\"Not A(Brand\";v=\"99\", \"Google Chrome\";v=\"121\", \"Chromium\";v=\"121\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "cross-site",
        "Referer": "http://localhost:5173/",
        "Origin": "http://localhost:5173",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
    }, 'Full Browser Cors Request');
}

runTests();
