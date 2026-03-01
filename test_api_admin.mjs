import handler from './api/admin.js';
import fs from 'fs';

// Manually load .env since we are running standalone
const env = fs.readFileSync('.env', 'utf8').split('\n');
env.forEach(line => {
    const match = line.match(/(.*)=(.*)/);
    if (match) {
        process.env[match[1].trim()] = match[2].trim().replace(/['"]/g, '');
    }
});

async function runMockReqRes() {
    console.log("Testing api/admin.js handler...");

    const getEnv = (k) => process.env[k];
    const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
    const SERVICE_KEY = getEnv('VITE_SUPABASE_SERVICE_ROLE_KEY');

    // Manually fetch a user to get their ID
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
        headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY }
    });
    const usersData = await res.json();
    const testUser = usersData.users ? usersData.users.find(u => u.email === 'minh@dqh.vn') : usersData.find(u => u.email === 'minh@dqh.vn');

    if (!testUser) {
        console.error("Could not find test user minh@dqh.vn");
        return;
    }

    // Mock Express Req/Res
    const mockReq = {
        method: 'POST',
        body: {
            action: 'update_password',
            payload: {
                userId: testUser.id,
                newPassword: 'SuperSafePassword123!'
            }
        }
    };

    const mockRes = {
        statusCode: 200,
        responseData: null,
        status: function (code) {
            this.statusCode = code;
            return this;
        },
        json: function (data) {
            this.responseData = data;
            return this;
        }
    };

    console.log(`Sending Mock Request to Serverless Function for user: ${testUser.id}`);

    try {
        await handler(mockReq, mockRes);
        console.log(`Response Status: ${mockRes.statusCode}`);
        console.log("Response Body:", mockRes.responseData);

        if (mockRes.statusCode === 200 && mockRes.responseData.success) {
            console.log("✅ 100% SUCCESS: Serverless API proxy updated password correctly.");
        } else {
            console.error("❌ FAILED: API proxy did not return success.");
        }
    } catch (e) {
        console.error("❌ EXCEPTION during handler execution:", e);
    }
}

runMockReqRes();
