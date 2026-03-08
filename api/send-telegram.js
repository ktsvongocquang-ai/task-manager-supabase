import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { userId, message, taskUrl } = req.body;

        if (!userId || !message) {
            return res.status(400).json({ message: 'Missing userId or message' });
        }

        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (!botToken) {
            console.warn('TELEGRAM_BOT_TOKEN is not configured.');
            return res.status(500).json({ message: 'Telegram Bot Token is not configured' });
        }

        // Initialize Supabase client
        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            return res.status(500).json({ message: 'Supabase configuration is missing in environment variables' });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Fetch user's telegram_chat_id from Supabase
        const { data: profile, error: dbError } = await supabase
            .from('profiles')
            .select('telegram_chat_id')
            .eq('id', userId)
            .single();

        if (dbError) {
            console.error('Error fetching user profile:', dbError);
            return res.status(500).json({ message: 'Failed to fetch user profile' });
        }

        if (!profile || !profile.telegram_chat_id) {
            console.log(`User ${userId} does not have a telegram_chat_id configured.`);
            return res.status(200).json({ message: 'User does not have a Telegram Chat ID configured, skipped.' });
        }

        const chatId = profile.telegram_chat_id;

        // Construct the message
        let finalMessage = message;
        if (taskUrl) {
            finalMessage += `\n\n🔗 [Xem chi tiết công việc](${taskUrl})`;
        }

        // Send the message via Telegram Bot API
        const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const response = await fetch(telegramApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: finalMessage,
                parse_mode: 'Markdown',
            }),
        });

        const telegramData = await response.json();

        if (!response.ok) {
            console.error('Telegram API error:', telegramData);
            return res.status(500).json({ message: 'Failed to send Telegram message', details: telegramData });
        }

        return res.status(200).json({ message: 'Message sent successfully', ok: true });
    } catch (error) {
        console.error('Error in send-telegram API:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
