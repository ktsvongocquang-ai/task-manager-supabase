/* eslint-disable no-undef */
import { GoogleGenerativeAI } from '@google/generative-ai';

export const config = {
    maxDuration: 60,
};

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({error: 'Method Not Allowed'});
    
    const API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY not configured on server.' });
    }

    try {
        const { system_instruction, contents, generationConfig } = req.body;
        const ai = new GoogleGenerativeAI(API_KEY);
        const model = ai.getGenerativeModel({ 
            model: 'gemini-2.5-flash',
            systemInstruction: system_instruction?.parts?.[0]?.text
        });
        
        const response = await model.generateContent({
            contents,
            generationConfig
        });

        return res.status(200).json({
            candidates: [{
                content: {
                    parts: [{ text: response.response.text() }]
                }
            }]
        });
    } catch (err) {
        console.error("Gemini Proxy Error:", err);
        return res.status(500).json({ error: err.message });
    }
}
