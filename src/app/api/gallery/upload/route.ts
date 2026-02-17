import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from '@/lib/prisma';
import { Logger } from '@/lib/logger';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const base64 = buffer.toString('base64');
        const dataUri = `data:${file.type};base64,${base64}`;

        const userSession = session as any;
        const userId = userSession.user.id;

        const image = await prisma.image.create({
            data: {
                userId,
                url: dataUri,
                prompt: `Manual upload: ${file.name}`,
                provider: 'UPLOAD'
            }
        });

        await Logger.info(`Image uploaded manually to gallery`, { filename: file.name }, userId);

        return NextResponse.json({ success: true, image });
    } catch (error: any) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: error.message || "Failed to upload image" }, { status: 500 });
    }
}
