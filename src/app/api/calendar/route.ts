import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/** GET /api/calendar?month=2026-05 — posts untuk bulan tertentu */
export async function GET(req: Request) {
    const session: any = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month'); // format: "2026-05"

    let startDate: Date;
    let endDate: Date;

    if (month) {
        const [year, mon] = month.split('-').map(Number);
        startDate = new Date(year, mon - 1, 1);
        endDate = new Date(year, mon, 0, 23, 59, 59);
    } else {
        // Default: bulan ini
        const now = new Date();
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    const posts = await prisma.post.findMany({
        where: {
            userId: session.user.id,
            OR: [
                { scheduledAt: { gte: startDate, lte: endDate } },
                { publishedAt: { gte: startDate, lte: endDate } },
            ],
        },
        include: {
            results: {
                include: {
                    channel: { select: { displayName: true, provider: true, avatarUrl: true } },
                },
            },
        },
        orderBy: { scheduledAt: 'asc' },
    });

    // Format untuk calendar
    const events = posts.map(post => {
        const platforms = post.results.length > 0
            ? [...new Set(post.results.map(r => r.platform))]
            : (post as any).platformMeta?.channelIds ? ['multi'] : [];

        return {
            id: post.id,
            title: post.title || post.body?.slice(0, 60) || 'Post',
            date: post.scheduledAt || post.publishedAt,
            status: post.status,
            mediaType: post.mediaType,
            platforms,
            body: post.body?.slice(0, 100),
            results: post.results,
        };
    });

    return NextResponse.json({ events, startDate, endDate });
}
