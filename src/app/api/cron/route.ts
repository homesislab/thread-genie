import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { dispatch } from '@/lib/publishers';
import { Logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (process.env.CRON_SECRET && key !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const processed = { threads: 0, posts: 0, errors: 0 };

    // ============================================
    // 1. Process scheduled Thread (legacy model)
    // ============================================
    try {
        const threads = await prisma.thread.findMany({
            where: { status: 'SCHEDULED', scheduledAt: { lte: new Date() } },
        });

        for (const thread of threads) {
            let accountIds: string[] = [];
            try { accountIds = JSON.parse(thread.platforms || '[]'); } catch { /* skip */ }

            const accounts = await prisma.account.findMany({ where: { id: { in: accountIds } } });
            let hasError = false;
            const platformStatuses: Record<string, string> = {};

            for (const account of accounts) {
                let content: any[] = [];
                try { content = JSON.parse(thread.content as string); } catch { content = [{ text: thread.content }]; }

                const result = await dispatch(account.provider, {
                    id: account.id,
                    provider: account.provider,
                    accessToken: account.access_token,
                    refreshToken: account.refresh_token,
                }, {
                    thread: content.map((t: any) => typeof t === 'string' ? { text: t } : t),
                    mediaBase64: thread.imageUrl || undefined,
                });

                platformStatuses[account.id] = result.success ? 'POSTED' : `ERROR: ${result.error}`;
                if (!result.success) hasError = true;

                await Logger[result.success ? 'success' : 'error'](
                    `Cron: ${result.success ? 'Posted' : 'Failed'} thread to ${account.provider}`,
                    { threadId: thread.id, error: result.error },
                    account.userId
                );
            }

            await prisma.thread.update({
                where: { id: thread.id },
                data: { status: hasError ? 'PARTIAL' : 'POSTED', platforms: JSON.stringify(platformStatuses) },
            });

            processed.threads++;
        }
    } catch (err: any) {
        console.error('Cron Thread Error:', err);
        processed.errors++;
    }

    // ============================================
    // 2. Process scheduled Post (new model)
    // ============================================
    try {
        const posts = await prisma.post.findMany({
            where: { status: 'SCHEDULED', scheduledAt: { lte: new Date() } },
            include: {
                results: { select: { channelId: true } }, // ambil channel yang sudah dipost
            },
        });

        for (const post of posts) {
            // Ambil channels yang belum dipost (dari PostResult)
            const postedChannelIds = post.results.map(r => r.channelId);

            // Cari channels dari PostResult yang statusnya PENDING, atau ambil semua via metadata
            const pendingChannelIds: string[] = (post.platformMeta as any)?.channelIds || [];
            const channelsToPost = pendingChannelIds.filter((id: string) => !postedChannelIds.includes(id));

            if (!channelsToPost.length) {
                await prisma.post.update({ where: { id: post.id }, data: { status: 'PUBLISHED', publishedAt: new Date() } });
                continue;
            }

            const channels = await prisma.socialChannel.findMany({
                where: { id: { in: channelsToPost }, isActive: true },
            });

            let hasError = false;

            for (const channel of channels) {
                let absoluteMediaUrl = post.mediaUrl;
                if (absoluteMediaUrl && absoluteMediaUrl.startsWith('/')) {
                    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
                    absoluteMediaUrl = `${baseUrl}${absoluteMediaUrl}`;
                }

                const result = await dispatch(channel.provider, channel, {
                    title: post.title || undefined,
                    text: post.body || undefined,
                    mediaUrl: absoluteMediaUrl || undefined,
                    mediaType: post.mediaType as any,
                    platformMeta: post.platformMeta as any,
                });

                await prisma.postResult.create({
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

                if (!result.success) hasError = true;

                await Logger[result.success ? 'success' : 'error'](
                    `Cron: ${result.success ? 'Published' : 'Failed'} post to ${channel.provider}`,
                    { postId: post.id, error: result.error },
                    post.userId
                );
            }

            const allResults = await prisma.postResult.findMany({ where: { postId: post.id } });
            const anySuccess = allResults.some(r => r.status === 'SUCCESS');
            const allSuccess = allResults.every(r => r.status === 'SUCCESS');

            await prisma.post.update({
                where: { id: post.id },
                data: {
                    status: allSuccess ? 'PUBLISHED' : (anySuccess ? 'PARTIAL' : 'FAILED'),
                    publishedAt: anySuccess ? new Date() : null,
                },
            });

            processed.posts++;
        }
    } catch (err: any) {
        console.error('Cron Post Error:', err);
        processed.errors++;
    }

    return NextResponse.json({ ok: true, processed });
}
