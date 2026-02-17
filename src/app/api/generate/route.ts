import { NextResponse } from 'next/server';
import { getGeminiModel } from '@/lib/gemini';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const { prompt, tone, length } = await req.json();

        if (!prompt) {
            return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
        }

        const systemPrompt = `You are an expert Twitter/X thread writer known for creating viral, high-engagement content.
Your goal is to transform the user's idea into a compelling thread.

Guidelines:
- Start with a strong hook that stops the scroll.
- Use simple, punchy language.
- Each tweet should be under 280 characters.
- Use 🧵, ✨, and other relevant emojis sparingly.
- Tone: ${tone || 'Professional'}
- Length: ${length || 'Medium (3-5 tweets)'}
- Format the output as a JSON object with a "thread" key containing an array of strings.

Example Output:
{
  "thread": ["Hook tweet here", "Tweet 2 context", "Key takeaway", "Call to action"]
}`;

        const session = await getServerSession(authOptions);
        const userId = session?.user?.id; // Assuming session has user.id

        const model = await getGeminiModel(userId);

        const result = await model.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [{ text: `${systemPrompt}\n\nUser Prompt: ${prompt}` }],
                },
            ],
        });

        const response = result.response;
        const text = response.text();
        const parsed = JSON.parse(text || '{"thread": []}');

        return NextResponse.json({ thread: parsed.thread || [] });
    } catch (error: any) {
        console.error('Gemini Generation Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to generate thread' }, { status: 500 });
    }
}
