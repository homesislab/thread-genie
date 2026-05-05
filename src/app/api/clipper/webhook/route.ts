import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * POST /api/clipper/webhook
 * Dipanggil oleh project Clipper ketika clip selesai diproses.
 * Clipper kirim: { userId, title, videoUrl, thumbnailUrl, durationSec, fileSize, sourceProject, clipIndex, metadata }
 * Optional auth: set CLIPPER_WEBHOOK_SECRET di .env kedua project
 */
export async function POST(req: Request) {
    try {
        // Validasi secret (optional tapi dianjurkan)
        const secret = req.headers.get('x-clipper-secret');
        if (process.env.CLIPPER_WEBHOOK_SECRET && secret !== process.env.CLIPPER_WEBHOOK_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const {
            userId,
            title,
            videoUrl,
            thumbnailUrl,
            durationSec,
            fileSize,
            sourceProject,
            clipIndex,
            metadata,
        } = body;

        if (!userId || !videoUrl) {
            return NextResponse.json({ error: 'userId dan videoUrl wajib diisi' }, { status: 400 });
        }

        // Pastikan user ada di DB
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
        }

        const clip = await prisma.clipAsset.create({
            data: {
                userId,
                title: title || `Clip dari ${sourceProject || 'Clipper'}`,
                videoUrl,
                thumbnailUrl: thumbnailUrl || null,
                durationSec: durationSec ? parseFloat(durationSec) : null,
                fileSize: fileSize ? parseInt(fileSize) : null,
                sourceProject: sourceProject || null,
                clipIndex: clipIndex !== undefined ? parseInt(clipIndex) : null,
                status: 'READY',
                metadata: metadata || null,
            },
        });

        await Logger.success(
            `Clip "${clip.title}" diterima dari Clipper`,
            { clipId: clip.id, sourceProject, videoUrl },
            userId
        );

        return NextResponse.json({ success: true, clip });
    } catch (error: any) {
        console.error('Clipper Webhook Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to process webhook' }, { status: 500 });
    }
}
