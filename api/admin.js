import { createClient } from '@supabase/supabase-js';

// Vercel serverless function (Runs in Node.js environment, not in the browser)
export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { action, payload } = req.body;

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
        return res.status(500).json({ error: 'Missing Supabase Admin credentials on the server.' });
    }

    // Initialize the Supabase client with the Service Role key
    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    try {
        if (action === 'update_password') {
            const { userId, newPassword } = payload;
            if (!userId || !newPassword) {
                return res.status(400).json({ error: 'Missing userId or newPassword' });
            }

            const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
                password: newPassword
            });

            if (error) throw error;
            return res.status(200).json({ success: true, user: data.user });
        }

        else if (action === 'create_user') {
            const { email, password, full_name } = payload;
            if (!email || !password) {
                return res.status(400).json({ error: 'Missing email or password' });
            }

            const { data, error } = await supabaseAdmin.auth.signUp({
                email,
                password,
                options: {
                    data: { full_name }
                }
            });

            if (error) throw error;
            return res.status(200).json({ success: true, user: data.user });
        }

        else {
            return res.status(400).json({ error: 'Unknown action' });
        }
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
}
