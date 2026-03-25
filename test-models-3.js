import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const models = [
        'gemini-2.5-flash-lite',
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-2.0-flash-lite-preview-0205',
        'gemini-1.5-flash-8b'
    ];
    
    console.log("--- START MODEL TEST ---");
    for (const modelName of models) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hi");
            console.log(`✅ ${modelName}: SUCCESS`);
        } catch (err) {
            console.log(`❌ ${modelName}: FAILED - ${err.message}`);
        }
    }
    console.log("--- END MODEL TEST ---");
}

listModels();
