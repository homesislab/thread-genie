import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { dispatch } from '@/lib/publishers';
import { Logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/** POST /api/posts — buat dan optionally publish post */
export async function POST(req: Request) {
    const session: any = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = session.user.id;
    const body = await req.json();

    const {
        title,
        body: postBody,
        text,          // alias untuk body
        thread,        // array tweet (Twitter)
        mediaUrl,
        mediaType,
        platformMeta,
        channelIds,    // array SocialChannel.id
        scheduledAt,
        publishNow = false,
    } = body;

    const content = postBody || text || (thread ? thread.map((t: any) => (typeof t === 'string' ? t : t.text)).join('\n') : '');

    // Simpan Post ke DB
    const post = await prisma.post.create({
        data: {
            userId,
            title: title || null,
            body: content,
            mediaUrl: mediaUrl || null,
            mediaType: mediaType || (mediaUrl ? 'image' : 'text'),
            platformMeta: platformMeta || {},
            status: scheduledAt ? 'SCHEDULED' : (publishNow ? 'PUBLISHING' : 'DRAFT'),
            scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        },
    });

    if (!publishNow || !channelIds?.length) {
        return NextResponse.json({ success: true, post });
    }

    // --- Publish Now ---
    const channels = await prisma.socialChannel.findMany({
        where: { id: { in: channelIds }, userId, isActive: true },
    });

    const results = [];
    let hasError = false;

    for (const channel of channels) {
        let absoluteMediaUrl = mediaUrl;
        if (absoluteMediaUrl && absoluteMediaUrl.startsWith('/')) {
            const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
            absoluteMediaUrl = `${baseUrl}${absoluteMediaUrl}`;
        }

        const payload = {
            title,
            text: content,
            thread,
            mediaUrl: absoluteMediaUrl,
            mediaType,
            platformMeta,
        };

        const result = await dispatch(channel.provider, channel, payload);

        const postResult = await prisma.postResult.create({
            data: {
                postId: post.id,
                channelId: channel.id,
                platform: channel.provider,
                status: result.success ? 'SUCCESS' : 'FAILED',
                externalId: result.externalId || null,
                errorMsg: result.error || null,
                publishedAt: result.success ? new Date() : null,
            },
        });

        results.push({ channel: channel.displayName, platform: channel.provider, ...result });
        if (!result.success) hasError = true;

        await Logger[result.success ? 'success' : 'error'](
            `${result.success ? 'Published' : 'Failed to publish'} to ${channel.provider}`,
            { postId: post.id, channelId: channel.id, error: result.error },
            userId
        );
    }

    const finalStatus = hasError
        ? (results.some(r => r.success) ? 'PARTIAL' : 'FAILED')
        : 'PUBLISHED';

    await prisma.post.update({
        where: { id: post.id },
        data: { status: finalStatus, publishedAt: finalStatus === 'PUBLISHED' ? new Date() : null },
    });

    return NextResponse.json({
        success: !hasError || results.some(r => r.success),
        post: { ...post, status: finalStatus },
        results,
    });
}

/** GET /api/posts — list posts milik user */
export async function GET(req: Request) {
    const session: any = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const posts = await prisma.post.findMany({
        where: {
            userId: session.user.id,
            ...(status ? { status } : {}),
        },
        include: {
            results: {
                include: { channel: { select: { displayName: true, provider: true, avatarUrl: true } } },
            },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
    });

    return NextResponse.json({ posts });
}
