import fetch from 'node-fetch';

async function listModels() {
    try {
        const res = await fetch('https://api.x.ai/v1/models', {
            headers: { 'Authorization': `Bearer ${process.env.XAI_API_KEY}` }
        });
        const data = await res.json();
        console.log(data);
    } catch (e) {
        console.error(e);
    }
}
listModels();
