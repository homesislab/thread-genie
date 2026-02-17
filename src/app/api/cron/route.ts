import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTwitterClient } from '@/lib/twitter';
import { Logger } from '@/lib/logger';

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
            let accountIds: string[] = [];
            try {
                accountIds = JSON.parse(thread.platforms || '[]');
            } catch (e) {
                // Fallback if not JSON
                accountIds = thread.platforms ? [thread.platforms] : [];
            }
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
                        const client = await getTwitterClient(account.id);

                        // Use manual threading for consistency with post route and better control
                        let lastTweetId = undefined;

                        let threadContent: string[] = [];
                        try {
                            threadContent = JSON.parse(thread.content as string);
                        } catch (e) {
                            threadContent = [thread.content as string]; // Fallback if not JSON
                        }

                        for (const tweetText of threadContent) {
                            const params: any = { text: tweetText };
                            if (lastTweetId) {
                                params.reply = { in_reply_to_tweet_id: lastTweetId };
                            }
                            const postedTweet = await client.v2.tweet(params);
                            lastTweetId = postedTweet.data.id;
                        }

                        platformStatuses[accountId] = "POSTED";
                    } else if (account.provider === 'facebook') {
                        // Placeholder for Meta implementation
                        platformStatuses[accountId] = "META_NOT_IMPLEMENTED";
                        hasError = true;
                    }
                } catch (err: any) {
                    console.error(`Cron post failed for account ${accountId}:`, err);

                    // Log detailed error for cron debugging
                    await Logger.error(
                        `Cron: Failed to post thread to ${account.provider}`,
                        {
                            error: err.message,
                            twitterData: err.data,
                            accountId: account.id,
                            platform: account.provider
                        },
                        account.userId
                    );

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
