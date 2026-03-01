import { GoogleGenAI, Type, Schema } from '@google/genai';

// Initialize the Gemini SDK
// Requires process.env.GEMINI_API_KEY
const ai = new GoogleGenAI({});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { prompt, startDate } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Missing prompt text.' });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'Missing GEMINI_API_KEY in server environment.' });
        }

        // Define the expected output format for Gemini
        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                project_name: {
                    type: Type.STRING,
                    description: "A short, concise, and professional name for the project.",
                },
                project_description: {
                    type: Type.STRING,
                    description: "A detailed description explaining the scope and objectives of the project.",
                },
                tasks: {
                    type: Type.ARRAY,
                    description: "A list of actionable tasks to complete this project.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            task_name: {
                                type: Type.STRING,
                                description: "The title of the task (e.g., 'Thiết kế giao diện', 'Setup Database').",
                            },
                            description: {
                                type: Type.STRING,
                                description: "Detailed description of what needs to be done for this task.",
                            },
                            priority: {
                                type: Type.STRING,
                                description: "Priority level. Must be exactly one of: 'Thấp', 'Trung bình', 'Cao'.",
                            },
                            duration_days: {
                                type: Type.INTEGER,
                                description: "Estimated number of working days required to complete this task. Must be at least 1.",
                            },
                        },
                        required: ["task_name", "description", "priority", "duration_days"],
                    },
                },
            },
            required: ["project_name", "project_description", "tasks"],
        };

        const systemInstruction = `
        Bạn là một Giám đốc Dự án (Project Manager) cực kỳ chuyên nghiệp chuyên lập kế hoạch công việc.
        Nhiệm vụ của bạn là đọc yêu cầu của khách hàng, sau đó tự động phân tách nó thành một cấu trúc Dự án hoàn chỉnh, bao gồm Tên dự án, Mô tả chi tiết, và một danh sách các đầu việc (Tasks) rành mạch.
        Mỗi Task phải có Tên, Mô tả, Độ ưu tiên cụ thể và Số ngày làm việc dự kiến (duration_days).
        Hãy luôn trả lời bằng Tiếng Việt. Trả về đúng dữ liệu chuẩn JSON được mô tả.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Please create a project plan for the following request, assuming it starts around ${startDate || 'today'}:\n\n"${prompt}"`,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
                temperature: 0.2, // Low temperature for consistent JSON structure
            }
        });

        // Parse the returned JSON text mapping to our desired schema
        const generatedProject = JSON.parse(response.text);

        return res.status(200).json({ success: true, project: generatedProject });

    } catch (err) {
        console.error("Gemini Generation Error:", err);
        return res.status(500).json({ error: err.message || 'Internal Server Error during AI generation' });
    }
}
