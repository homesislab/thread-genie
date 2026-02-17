import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getTwitterClient } from '@/lib/twitter';
import { prisma } from '@/lib/prisma';
import { Logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const session: any = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { thread, accountIds, imageUrl } = await req.json();

        if (!thread || !Array.isArray(thread) || thread.length === 0) {
            return NextResponse.json({ error: "Thread content is required" }, { status: 400 });
        }

        if (!accountIds || !Array.isArray(accountIds) || accountIds.length === 0) {
            return NextResponse.json({ error: "At least one account must be selected" }, { status: 400 });
        }

        const results = [];
        const errors = [];

        // Fetch account details for all selected accounts
        const accounts = await prisma.account.findMany({
            where: {
                id: { in: accountIds },
                userId: session.user.id
            }
        });

        for (const account of accounts) {
            try {
                if (account.provider === 'twitter') {
                    const client = await getTwitterClient(account.id);

                    // Manual Threading for Free Tier Compatibility
                    let lastTweetId = undefined;
                    const tweetResults = [];

                    for (const item of thread) {
                        const tweetText = typeof item === 'string' ? item : item.text;
                        const tweetImageUrl = typeof item === 'object' ? item.imageUrl : null;

                        let tweetMediaId = undefined;

                        // Use tweet-specific image or fallback to global imageUrl
                        const finalImageUrl = tweetImageUrl || imageUrl;

                        if (finalImageUrl) {
                            try {
                                let base64 = finalImageUrl;
                                if (finalImageUrl.startsWith('data:')) {
                                    base64 = finalImageUrl.split(',')[1];
                                }
                                const uploadRes = await client.v1.uploadMedia(Buffer.from(base64, 'base64'), { type: 'png' });
                                tweetMediaId = uploadRes;
                            } catch (mediaErr) {
                                console.error("Failed to upload media for specific tweet:", mediaErr);
                            }
                        }

                        const params: any = { text: tweetText };
                        if (lastTweetId) {
                            params.reply = { in_reply_to_tweet_id: lastTweetId };
                        }

                        if (tweetMediaId) {
                            params.media = { media_ids: [tweetMediaId] };
                        }

                        const postedTweet = await client.v2.tweet(params);
                        lastTweetId = postedTweet.data.id;
                        tweetResults.push(postedTweet);
                    }

                    const res = tweetResults;
                    console.log(`✅ Success posting to Twitter (${account.providerAccountId})`);

                    await Logger.success(
                        `Successfully posted thread to Twitter`,
                        { accountId: account.id, providerAccountId: account.providerAccountId, platform: 'twitter' },
                        session.user.id
                    );

                    results.push({ accountId: account.id, platform: 'twitter', success: true, data: res });
                } else if (account.provider === 'facebook') {
                    // Meta/Facebook Posting Logic (Placeholder for Graph API integration)
                    // You would use the account.access_token here with FB Graph API
                    results.push({
                        accountId: account.id,
                        platform: 'facebook',
                        success: false,
                        error: "Facebook posting logic is being implemented. Please use Graph API with the connected access token."
                    });
                }
            } catch (err: any) {
                console.error(`Posting failed for account ${account.id}:`, err);
                if (err.data) console.error("Twitter Error Data:", JSON.stringify(err.data, null, 2));

                await Logger.error(
                    `Failed to post thread to ${account.provider}`,
                    {
                        error: err.message,
                        twitterData: err.data, // Include detailed error from Twitter
                        accountId: account.id,
                        platform: account.provider
                    },
                    session.user.id
                );

                errors.push({ accountId: account.id, error: err.message });
            }
        }

        return NextResponse.json({
            success: results.some(r => r.success),
            results,
            errors,
            partial: errors.length > 0 && results.length > 0
        });
    } catch (error: any) {
        console.error('Posting Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to post thread' }, { status: 500 });
    }
}
