import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Logger } from '@/lib/logger';

export async function GET(request: Request) {
    // ... (GET function remains same)
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const settings = await prisma.aISettings.findUnique({
            where: {
                userId: (session.user as any).id
            }
        });

        return NextResponse.json({ settings: settings || {} });

    } catch (error) {
        console.error("Error fetching AI settings:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { provider, apiKey, model, imageModel } = await request.json();

        // Basic validation
        if (!provider || !apiKey) {
            return NextResponse.json({ error: "Provider and API Key are required" }, { status: 400 });
        }

        const userId = (session.user as any).id;

        const defaultModel = provider === 'GEMINI' ? 'gemini-1.5-flash' : 'gpt-4o';
        const defaultImageModel = provider === 'GEMINI' ? 'gemini-2.5-flash-image' : 'dall-e-3';

        const settings = await prisma.aISettings.upsert({
            where: {
                userId: userId,
            },
            update: {
                provider,
                apiKey,
                model: model || defaultModel,
                imageModel: imageModel || defaultImageModel,
            },
            create: {
                userId: userId,
                provider,
                apiKey,
                model: model || defaultModel,
                imageModel: imageModel || defaultImageModel,
            },
        });

        await Logger.info(
            `AI settings updated for provider: ${provider}`,
            { provider, model: settings.model },
            userId
        );

        return NextResponse.json({ settings });

    } catch (error: any) {
        console.error("Error saving AI settings:", error);
        return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
}
