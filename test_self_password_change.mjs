import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Helper to read .env
function getEnv() {
    const rawArgs = fs.readFileSync('.env', 'utf-8');
    const lines = rawArgs.split(/\r?\n/);
    const env = {};
    for (const line of lines) {
        if (!line || line.startsWith('#')) continue;
        const [key, ...rest] = line.split('=');
        env[key] = rest.join('=');
    }
    return env;
}

const env = getEnv();
// We only use the standard client (anon key) to simulate app behavior
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_SERVICE_ROLE_KEY);


async function testSelfPasswordChange() {
    console.log("=== Testing Self Password Change for Employee ===");

    // 1. Log in with admin and find an employee
    console.log("Fetching an employee profile...");
    const { data: profiles, error: pErr } = await supabaseAdmin.from('profiles').select('*').eq('role', 'Nhân viên').limit(1);

    if (pErr || !profiles || profiles.length === 0) {
        console.log("Error fetching employee:", pErr);
        return;
    }

    const employee = profiles[0];
    const initialEmail = employee.email;
    const testPassword1 = "TestPass123!@#";
    const testPassword2 = "NewPass456!@#";

    console.log(`Found employee: ${employee.full_name} (${initialEmail})`);

    // 2. Set their password to testPassword1 using Admin (to ensure we know it)
    console.log(`Setting initial password via Admin to: ${testPassword1}`);
    await supabaseAdmin.auth.admin.updateUserById(employee.id, { password: testPassword1 });

    // 3. Log into Supabase as the Employee
    console.log(`Logging in as ${initialEmail} with standard Client...`);
    const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
        email: initialEmail,
        password: testPassword1
    });

    if (loginErr) {
        console.error("Login failed:", loginErr.message);
        return;
    }
    console.log("Login successful! Access Token Acquired.");

    // 4. Try to change their own password (acting as the employee)
    console.log(`Attempting to change own password to: ${testPassword2} via standard Client (auth.updateUser)...`);
    const { data: updateData, error: updateErr } = await supabase.auth.updateUser({
        password: testPassword2
    });

    if (updateErr) {
        console.error("Standard user password change FAILED:", updateErr.message);
        return;
    }
    console.log("Password updated successfully!");

    // 5. Sign out
    await supabase.auth.signOut();

    // 6. Verify we can log in with the NEW password
    console.log("Verifying new password by logging in again...");
    const { data: verifyData, error: verifyErr } = await supabase.auth.signInWithPassword({
        email: initialEmail,
        password: testPassword2
    });

    if (verifyErr) {
        console.error("Verification login failed! The password change might not have worked.", verifyErr.message);
    } else {
        console.log("Verification login successful! The self-password change feature WORKS.");
    }

    // Clean up
    await supabase.auth.signOut();
}

testSelfPasswordChange();
