import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { Logger } from '@/lib/logger';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// Max 500MB untuk video
export const config = {
    api: { bodyParser: false },
};

const ALLOWED_IMAGE = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO = ['video/mp4', 'video/mov', 'video/quicktime', 'video/webm', 'video/avi', 'video/mkv'];

/** POST /api/upload/media — Upload image atau video ke /public/uploads/ */
export async function POST(req: Request) {
    const session: any = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

        const isImage = ALLOWED_IMAGE.includes(file.type);
        const isVideo = ALLOWED_VIDEO.includes(file.type);

        if (!isImage && !isVideo) {
            return NextResponse.json(
                { error: `File type "${file.type}" not supported. Allowed: images (jpg, png, gif, webp) and videos (mp4, mov, webm, avi, mkv)` },
                { status: 400 }
            );
        }

        // Ukuran max: 10MB untuk image, 500MB untuk video
        const maxBytes = isImage ? 10 * 1024 * 1024 : 500 * 1024 * 1024;
        if (file.size > maxBytes) {
            return NextResponse.json(
                { error: `File terlalu besar. Max ${isImage ? '10MB' : '500MB'}` },
                { status: 400 }
            );
        }

        const mediaType = isImage ? 'image' : 'video';
        const subDir = isImage ? 'images' : 'videos';

        // Buat direktori jika belum ada
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', subDir);
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        // Generate nama file unik
        const ext = file.name.split('.').pop() || (isImage ? 'jpg' : 'mp4');
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/\s+/g, '_');
        const filename = `${session.user.id}_${timestamp}_${safeName}`;
        const filePath = path.join(uploadDir, filename);

        // Tulis file ke disk
        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(filePath, buffer);

        const publicUrl = `/uploads/${subDir}/${filename}`;

        await Logger.info(
            `${mediaType} uploaded to local storage`,
            { filename, size: file.size, type: file.type },
            session.user.id
        );

        return NextResponse.json({
            success: true,
            url: publicUrl,
            mediaType,
            filename,
            size: file.size,
            mimeType: file.type,
        });
    } catch (error: any) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
    }
}

/** GET /api/upload/media?type=video|image — List uploaded files milik user */
export async function GET(req: Request) {
    const session: any = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'all'; // 'image' | 'video' | 'all'

    try {
        const { readdir, stat } = await import('fs/promises');
        const results: any[] = [];

        const subDirs = type === 'image' ? ['images'] : type === 'video' ? ['videos'] : ['images', 'videos'];

        for (const subDir of subDirs) {
            const dir = path.join(process.cwd(), 'public', 'uploads', subDir);
            if (!existsSync(dir)) continue;

            const files = await readdir(dir);
            const userFiles = files.filter(f => f.startsWith(session.user.id + '_'));

            for (const file of userFiles) {
                const fileStat = await stat(path.join(dir, file));
                results.push({
                    filename: file,
                    url: `/uploads/${subDir}/${file}`,
                    mediaType: subDir === 'images' ? 'image' : 'video',
                    size: fileStat.size,
                    createdAt: fileStat.birthtime,
                });
            }
        }

        // Sort by newest first
        results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return NextResponse.json({ files: results });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
