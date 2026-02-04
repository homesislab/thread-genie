import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TwitterApi } from 'twitter-api-v2';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (process.env.CRON_SECRET && key !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const threadsToPost = await prisma.thread.findMany({
            where: {
                status: "SCHEDULED",
                scheduledAt: {
                    lte: new Date(),
                },
            },
        });

        const results = [];

        for (const thread of threadsToPost) {
            const accountIds = thread.platforms as string[] || [];
            const platformStatuses: Record<string, string> = {};
            let hasError = false;

            if (accountIds.length === 0) {
                console.warn(`No accounts selected for thread ${thread.id}`);
                await prisma.thread.update({
                    where: { id: thread.id },
                    data: { status: "FAILED" },
                });
                continue;
            }

            const accounts = await prisma.account.findMany({
                where: { id: { in: accountIds } }
            });

            for (const accountId of accountIds) {
                const account = accounts.find(a => a.id === accountId);
                if (!account) {
                    platformStatuses[accountId] = "ACCOUNT_NOT_FOUND";
                    hasError = true;
                    continue;
                }

                try {
                    if (account.provider === 'twitter') {
                        const client = new TwitterApi(account.access_token!);
                        await client.v2.tweetThread(thread.content as string[]);
                        platformStatuses[accountId] = "POSTED";
                    } else if (account.provider === 'facebook') {
                        // Placeholder for Meta implementation
                        platformStatuses[accountId] = "META_NOT_IMPLEMENTED";
                        hasError = true;
                    }
                } catch (err: any) {
                    console.error(`Cron post failed for account ${accountId}:`, err);
                    platformStatuses[accountId] = `ERROR: ${err.message}`;
                    hasError = true;
                }
            }

            // Update thread status
            await prisma.thread.update({
                where: { id: thread.id },
                data: {
                    status: hasError ? "PARTIAL" : "POSTED",
                    platforms: platformStatuses
                },
            });

            results.push({ id: thread.id, platformStatuses });
        }

        return NextResponse.json({ processed: threadsToPost.length, results });
    } catch (error: any) {
        console.error('Cron Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
