const fs = require('fs');
async function test() {
    const envContent = fs.readFileSync('.env', 'utf-8');
    const match = envContent.match(/XAI_API_KEY=([^\r\n]+)/);
    if (!match) return console.log('No key');
    
    const requestBody = {
        model: 'grok-4.20-reasoning',
        input: [
            { role: 'system', content: 'You are Grok.' },
            { role: 'user', content: 'What is the exact vn-index right now? use web_search' }
        ],
        tools: [{ type: 'web_search' }]
    };

    const response = await fetch('https://api.x.ai/v1/responses', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${match[1]}`
        },
        body: JSON.stringify(requestBody)
    });
    const xaiData = await response.json();
    fs.writeFileSync('grok_test.json', JSON.stringify(xaiData, null, 2));
    console.log('Success, check grok_test.json');
}
test();
