import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/** GET /api/channels/facebook/pages — list Facebook Pages milik user yang sudah terkoneksi */
export async function GET() {
    const session: any = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const pages = await prisma.socialChannel.findMany({
        where: {
            userId: session.user.id,
            provider: 'facebook',
            isActive: true,
        },
        select: {
            id: true,
            channelId: true,
            displayName: true,
            avatarUrl: true,
            createdAt: true,
        },
        orderBy: { displayName: 'asc' },
    });

    return NextResponse.json({ pages });
}
