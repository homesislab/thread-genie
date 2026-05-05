import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { promises as fs } from 'fs';
import path from 'path';
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

        // Check if it's a video
        if (!file.type.startsWith('video/')) {
            return NextResponse.json({ error: "File must be a video" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'videos');

        // Create directory if it doesn't exist
        await fs.mkdir(uploadDir, { recursive: true });

        const filePath = path.join(uploadDir, filename);
        await fs.writeFile(filePath, buffer);

        // Generate the URL (relative, which Next.js and fetch will understand if formatted properly)
        const videoUrl = `/uploads/videos/${filename}`;
        
        // Build the absolute URL for the publisher fetch
        const host = req.headers.get('host') || 'localhost:3000';
        const protocol = req.headers.get('x-forwarded-proto') || 'http';
        const absoluteVideoUrl = `${protocol}://${host}${videoUrl}`;

        const userSession = session as any;
        const userId = userSession.user.id;

        await Logger.info(`Video uploaded manually`, { filename }, userId);

        return NextResponse.json({ success: true, url: absoluteVideoUrl });
    } catch (error: any) {
        console.error("Video Upload error:", error);
        return NextResponse.json({ error: error.message || "Failed to upload video" }, { status: 500 });
    }
}
