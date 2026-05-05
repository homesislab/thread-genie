import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/** GET /api/channels — list semua channel yang terkoneksi */
export async function GET() {
    const session: any = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const channels = await prisma.socialChannel.findMany({
        where: { userId: session.user.id, isActive: true },
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            provider: true,
            displayName: true,
            avatarUrl: true,
            channelId: true,
            isActive: true,
            createdAt: true,
            // Jangan return token
        },
    });

    return NextResponse.json({ channels });
}

/** DELETE /api/channels?id=xxx — disconnect channel */
export async function DELETE(req: Request) {
    const session: any = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Channel ID required' }, { status: 400 });

    const channel = await prisma.socialChannel.findFirst({
        where: { id, userId: session.user.id },
    });

    if (!channel) return NextResponse.json({ error: 'Channel not found' }, { status: 404 });

    await prisma.socialChannel.update({
        where: { id },
        data: { isActive: false },
    });

    return NextResponse.json({ success: true });
}
