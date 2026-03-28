import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const variants = ["gemini-2.0-flash-exp", "gemini-2.0-flash-001", "gemini-2.0-flash"];
    
    for (const v of variants) {
        console.log(`Testing variant: ${v}...`);
        try {
            const model = genAI.getGenerativeModel({ model: v });
            const result = await model.generateContent("hello");
            console.log(`Success with ${v}:`, result.response.text());
        } catch (e) {
            console.error(`Error with ${v}:`, e.message);
        }
    }
}
listModels();
