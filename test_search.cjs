const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test(modelName) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSyDvELWr8Zelu6F4gHgzhIjpkOxQyQxLFDI');
    const ai = genAI.getGenerativeModel({ 
        model: modelName, 
        tools: [{ googleSearch: {} }] 
    });

    try {
        const res = await ai.generateContent('Giá Vàng SJC hôm nay 26/03/2026 chính xác là bao nhiêu triệu đồng 1 lượng? Hãy tìm trên internet.');
        console.log(`[${modelName}]`, res.response.text());
    } catch(e) {
        console.log(`[${modelName}] ERROR:`, e.message);
    }
}

async function run() {
    await test('gemini-2.0-flash');
    await test('gemini-2.5-flash');
    await test('gemini-3-flash-preview');
}

run();
