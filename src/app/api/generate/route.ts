import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { getGeminiModel } from '@/lib/gemini';
import { getOpenAIClient } from '@/lib/openai';

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

        const session: any = await getServerSession(authOptions);
        const userId = session?.user?.id;

        // Check user settings for AI Provider
        let provider = 'GEMINI';
        if (userId) {
            const settings = await prisma.aISettings.findUnique({
                where: { userId }
            });
            if (settings && settings.provider) {
                provider = settings.provider;
            }
        }

        let parsed = { thread: [] as string[] };

        if (provider === 'OPENAI') {
            const { client, model } = await getOpenAIClient(userId);
            const completion = await client.chat.completions.create({
                model: model,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: prompt }
                ],
                response_format: { type: "json_object" }
            });
            const text = completion.choices[0].message.content || '{"thread": []}';
            parsed = JSON.parse(text);
        } else {
            const model = await getGeminiModel(userId);
            const result = await model.generateContent({
                contents: [
                    {
                        role: "user",
                        parts: [{ text: `${systemPrompt}\n\nUser Prompt: ${prompt}` }],
                    },
                ],
            });
            const text = result.response.text();
            parsed = JSON.parse(text || '{"thread": []}');
        }

        if (userId && parsed.thread?.length > 0) {
            // Auto-save as DRAFT
            try {
                const threadContent = (parsed.thread || []).map((t: any) => {
                    if (typeof t === 'string') return { text: t, imageUrl: null };
                    return t;
                });

                const created = await prisma.thread.create({
                    data: {
                        content: JSON.stringify(threadContent),
                        status: "DRAFT",
                        userId: userId
                    }
                });
                return NextResponse.json({ thread: threadContent, threadId: created.id });
            } catch (dbErr) {
                console.error("Failed to auto-save thread draft:", dbErr);
            }

            await Logger.info(
                `Thread generated and saved as draft via ${provider}`,
                { prompt, tone, length, threadCount: parsed.thread?.length || 0 },
                userId
            );
        }

        return NextResponse.json({ thread: parsed.thread || [] });
    } catch (error: any) {
        console.error('AI Generation Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to generate thread' }, { status: 500 });
    }
}
