import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getOpenAIClient } from '@/lib/openai';
import { getImagenModel } from '@/lib/gemini';
import { prisma } from '@/lib/prisma';
import { Logger } from '@/lib/logger';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { prompt } = await req.json();

        if (!prompt) {
            return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
        }

        const userSession = session as any;
        const userId = userSession.user.id;

        // Get AI settings to know which provider to use
        const settings = await prisma.aISettings.findUnique({
            where: { userId },
        });

        const provider = settings?.provider || 'GEMINI';

        await Logger.info(`Generating AI image using ${provider}`, { prompt }, userId);

        if (provider === 'OPENAI') {
            const { client } = await getOpenAIClient(userId);
            const response = await client.images.generate({
                model: (settings?.imageModel as any) || "dall-e-3",
                prompt: prompt,
                n: 1,
                size: "1024x1024",
            });

            const imageUrl = response.data?.[0]?.url;

            if (!imageUrl) {
                throw new Error("No image URL returned from OpenAI");
            }

            if (userId) {
                await prisma.image.create({
                    data: {
                        userId,
                        url: imageUrl,
                        prompt: prompt,
                        provider: provider
                    }
                });

                await Logger.info(
                    `Image generated using AI`,
                    { prompt, provider, model: settings?.imageModel },
                    userId
                );
            }

            await Logger.success('AI image generated successfully (OpenAI)', { imageUrl }, userId);
        } else {
            // Default to Gemini/Imagen
            const model = await getImagenModel(userId);

            // Prompt Engineering: Ensure the model knows it MUST generate an image.
            // Reasoning models like Gemini 3 might try to chat instead if the prompt is just a statement.
            const enhancedPrompt = `GENERATE A HIGH-QUALITY, DETAILED IMAGE OF THE FOLLOWING: ${prompt}. 
            Do not provide any text explanation, only the image data.`;

            // For Imagen 3 in the Gemini SDK:
            const result = await model.generateContent(enhancedPrompt);
            const geminiResponse = await result.response;

            // Gemini returns the image data in the response
            // We'll convert it to a data URI for easy display

            const candidates = (geminiResponse as any).candidates;
            const parts = candidates?.[0]?.content?.parts || (geminiResponse as any).parts || [];

            // Find the first part that has inlineData (image)
            const imagePart = parts.find((p: any) => p.inlineData);
            const inlineData = imagePart?.inlineData;
            const bytes = inlineData?.data;
            const mimeType = inlineData?.mimeType || 'image/png';

            if (!bytes) {
                // Log the structure for debugging if it fails again
                console.error("Gemini Response Structure:", JSON.stringify(geminiResponse, null, 2));
                await Logger.error('No image data in Gemini response', {
                    response: JSON.stringify(geminiResponse).substring(0, 1000),
                    partsCount: parts.length,
                    hasParts: !!parts
                }, userId);
                throw new Error("No image data returned from Gemini Imagen. The model might have returned text instead of an image.");
            }

            const dataUri = `data:${mimeType};base64,${bytes}`;

            if (userId) {
                await prisma.image.create({
                    data: {
                        userId,
                        url: dataUri,
                        prompt: prompt,
                        provider: provider
                    }
                });

                // Link to thread if threadId provided
                const { threadId } = await req.json().catch(() => ({}));
                if (threadId) {
                    await prisma.thread.update({
                        where: { id: threadId, userId },
                        data: { imageUrl: dataUri }
                    });
                    console.log(`🔗 Linked image to thread ${threadId}`);
                }

                await Logger.info(
                    `Gemini image saved to gallery`,
                    { prompt, provider, model: settings?.imageModel, threadId },
                    userId
                );
            }

            await Logger.success('AI image generated successfully (Gemini)', { prompt, threadId: (await req.json().catch(() => ({}))).threadId }, userId);
            return NextResponse.json({ imageUrl: dataUri });
        }
    } catch (error: any) {
        console.error("Image generation error:", error);

        const userSession = session as any;
        await Logger.error(
            'Failed to generate AI image',
            { error: error.message, data: error.response?.data || error.data },
            userSession?.user?.id
        );

        return NextResponse.json(
            { error: error.message || "Failed to generate image" },
            { status: 500 }
        );
    }
}
