import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/** GET /api/clipper/clips — List semua clip asset milik user */
export async function GET(req: Request) {
    const session: any = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // READY | SCHEDULED | POSTED
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '24');

    const clips = await prisma.clipAsset.findMany({
        where: {
            userId: session.user.id,
            ...(status ? { status } : {}),
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
    });

    const total = await prisma.clipAsset.count({
        where: {
            userId: session.user.id,
            ...(status ? { status } : {}),
        },
    });

    return NextResponse.json({ clips, total, page, limit });
}

/** DELETE /api/clipper/clips?id=xxx — Hapus clip */
export async function DELETE(req: Request) {
    const session: any = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Clip ID required' }, { status: 400 });

    const clip = await prisma.clipAsset.findFirst({
        where: { id, userId: session.user.id },
    });

    if (!clip) return NextResponse.json({ error: 'Clip not found' }, { status: 404 });

    await prisma.clipAsset.delete({ where: { id } });

    return NextResponse.json({ success: true });
}
