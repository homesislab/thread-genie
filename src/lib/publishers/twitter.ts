import { TwitterApi } from 'twitter-api-v2';
import { prisma } from '@/lib/prisma';
import { Logger } from '@/lib/logger';
import type { Publisher, SocialChannelData, PublishPayload, PublishResult } from './types';

/**
 * Ambil Twitter client dengan auto-refresh token.
 * Masih support existing Account model untuk backward compat.
 */
async function getTwitterClient(accountId: string): Promise<TwitterApi> {
    const account = await prisma.account.findUnique({ where: { id: accountId } });

    if (!account || account.provider !== 'twitter') {
        throw new Error('Twitter account not found');
    }

    const { access_token, refresh_token, expires_at, userId } = account;
    const isExpired = expires_at ? (expires_at * 1000) <= Date.now() + 5 * 60 * 1000 : true;

    if (isExpired && refresh_token) {
        const client = new TwitterApi({
            clientId: process.env.TWITTER_CLIENT_ID!,
            clientSecret: process.env.TWITTER_CLIENT_SECRET!,
        });
        const { client: refreshedClient, accessToken, refreshToken: newRefreshToken, expiresIn } =
            await client.refreshOAuth2Token(refresh_token);
        const newExpiresAt = Math.floor(Date.now() / 1000) + expiresIn;
        await prisma.account.update({
            where: { id: accountId },
            data: { access_token: accessToken, refresh_token: newRefreshToken, expires_at: newExpiresAt },
        });
        await Logger.info('Twitter token refreshed automatically', { accountId }, userId);
        return refreshedClient;
    }

    return new TwitterApi(access_token!);
}

export const TwitterPublisher: Publisher = {
    platform: 'twitter',

    async publish(channel: SocialChannelData, payload: PublishPayload): Promise<PublishResult> {
        try {
            // channelId di SocialChannel = accountId di Account table (untuk compat)
            const client = await getTwitterClient(channel.id);

            const thread = payload.thread ?? (payload.text ? [{ text: payload.text }] : []);
            if (thread.length === 0) {
                return { success: false, error: 'No content to tweet' };
            }

            let lastTweetId: string | undefined;
            const tweetIds: string[] = [];

            for (const item of thread) {
                const tweetText = item.text;
                const imageUrl = item.imageUrl || payload.mediaBase64;
                let mediaId: string | undefined;

                if (imageUrl) {
                    try {
                        let base64 = imageUrl;
                        if (imageUrl.startsWith('data:')) base64 = imageUrl.split(',')[1];
                        mediaId = await client.v1.uploadMedia(Buffer.from(base64, 'base64'), { type: 'png' });
                    } catch (e) {
                        console.warn('Twitter media upload failed, skipping image:', e);
                    }
                }

                const params: any = { text: tweetText };
                if (lastTweetId) params.reply = { in_reply_to_tweet_id: lastTweetId };
                if (mediaId) params.media = { media_ids: [mediaId] };

                const posted = await client.v2.tweet(params);
                lastTweetId = posted.data.id;
                tweetIds.push(posted.data.id);
            }

            return {
                success: true,
                externalId: tweetIds[0],
                externalUrl: `https://x.com/i/web/status/${tweetIds[0]}`,
                raw: tweetIds,
            };
        } catch (err: any) {
            return { success: false, error: err.message, raw: err.data };
        }
    },
};
