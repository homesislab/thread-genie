import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { TwitterApi } from 'twitter-api-v2';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const session: any = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { thread, accountIds } = await req.json();

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
                    const client = new TwitterApi(account.access_token!);
                    // Manual Threading for Free Tier Compatibility
                    // v2.tweetThread might perform checks that trigger 402/Limits
                    let lastTweetId = undefined;
                    const tweetResults = [];

                    for (const tweetText of thread) {
                        const params: any = { text: tweetText };
                        if (lastTweetId) {
                            params.reply = { in_reply_to_tweet_id: lastTweetId };
                        }

                        const postedTweet = await client.v2.tweet(params);
                        lastTweetId = postedTweet.data.id;
                        tweetResults.push(postedTweet);
                    }

                    const res = tweetResults;
                    console.log(`✅ Success posting to Twitter (${account.providerAccountId})`);
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
