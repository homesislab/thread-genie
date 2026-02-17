import OpenAI from 'openai';
import { prisma } from "@/lib/prisma";

const defaultApiKey = process.env.OPENAI_API_KEY;

export async function getOpenAIClient(userId?: string) {
    let apiKey = defaultApiKey;
    let modelName = "gpt-4o";

    if (userId) {
        const settings = await prisma.aISettings.findUnique({
            where: { userId },
        });
        if (settings && settings.provider === 'OPENAI' && settings.apiKey) {
            apiKey = settings.apiKey;
            modelName = settings.model || modelName;
        }
    }

    if (!apiKey) {
        throw new Error("OpenAI API Key not found. Please configure it in settings.");
    }

    const client = new OpenAI({ apiKey });
    return { client, model: modelName };
}
