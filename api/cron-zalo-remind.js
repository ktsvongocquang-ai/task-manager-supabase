export default async function handler(req, res) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Wake up the bot server and trigger the remind-all endpoint
    try {
        const response = await fetch('https://zalo-bot-server.onrender.com/api/remind-all', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        return res.status(200).json({ success: true, botServerResponse: data });
    } catch (e) {
        console.error('Failed to trigger Zalo Bot Server reminder:', e);
        return res.status(500).json({ success: false, error: e.message });
    }
}
