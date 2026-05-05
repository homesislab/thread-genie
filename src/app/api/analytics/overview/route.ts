import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/** GET /api/analytics/overview */
export async function GET() {
    const session: any = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = session.user.id;

    const [
        totalPosts,
        publishedPosts,
        scheduledPosts,
        failedPosts,
        totalChannels,
        totalClips,
        recentResults,
        platformBreakdown,
    ] = await Promise.all([
        prisma.post.count({ where: { userId } }),
        prisma.post.count({ where: { userId, status: 'PUBLISHED' } }),
        prisma.post.count({ where: { userId, status: 'SCHEDULED' } }),
        prisma.post.count({ where: { userId, status: 'FAILED' } }),
        prisma.socialChannel.count({ where: { userId, isActive: true } }),
        prisma.clipAsset.count({ where: { userId } }),
        // 10 most recent successful results
        prisma.postResult.findMany({
            where: { post: { userId }, status: 'SUCCESS' },
            orderBy: { publishedAt: 'desc' },
            take: 10,
            include: {
                post: { select: { title: true, body: true, mediaType: true } },
                channel: { select: { displayName: true, provider: true, avatarUrl: true } },
            },
        }),
        // Breakdown sukses per platform
        prisma.postResult.groupBy({
            by: ['platform'],
            where: { post: { userId }, status: 'SUCCESS' },
            _count: { id: true },
        }),
    ]);

    // Timeline: post per hari (30 hari terakhir)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const timelinePosts = await prisma.post.findMany({
        where: {
            userId,
            status: { in: ['PUBLISHED', 'PARTIAL'] },
            publishedAt: { gte: thirtyDaysAgo },
        },
        select: { publishedAt: true, status: true },
        orderBy: { publishedAt: 'asc' },
    });

    // Group by date
    const timelineMap: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        timelineMap[key] = 0;
    }
    for (const p of timelinePosts) {
        if (p.publishedAt) {
            const key = p.publishedAt.toISOString().slice(0, 10);
            if (key in timelineMap) timelineMap[key]++;
        }
    }

    const timeline = Object.entries(timelineMap).map(([date, count]) => ({ date, count }));

    return NextResponse.json({
        overview: {
            totalPosts,
            publishedPosts,
            scheduledPosts,
            failedPosts,
            totalChannels,
            totalClips,
        },
        platformBreakdown: platformBreakdown.map(p => ({
            platform: p.platform,
            count: p._count.id,
        })),
        recentResults,
        timeline,
    });
}
