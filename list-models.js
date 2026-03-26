import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

async function listModels() {
    console.log("Listing available models...");
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        const models = data.models.map(m => m.name).filter(n => n.includes('flash') || n.includes('pro'));
        console.log("Available Gemini Text Models:", models);
    } catch (e) {
        console.error(e);
    }
}
listModels();
