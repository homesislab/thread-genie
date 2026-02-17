import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";

const defaultApiKey = process.env.GEMINI_API_KEY;

export async function getGeminiModel(userId?: string) {
    let apiKey = defaultApiKey;
    let modelName = "gemini-1.5-flash";

    if (userId) {
        const settings = await prisma.aISettings.findUnique({
            where: { userId },
        });
        if (settings && settings.provider === 'GEMINI' && settings.apiKey) {
            apiKey = settings.apiKey;
            modelName = settings.model || modelName;
        }
    }

    if (!apiKey) {
        throw new Error("Gemini API Key not found. Please configure it in settings.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
            temperature: 0.7,
            topP: 0.8,
            topK: 40,
            maxOutputTokens: 2048,
            responseMimeType: "application/json",
        },
    });
}
