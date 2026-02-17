import { TwitterApi } from 'twitter-api-v2';
import { prisma } from '@/lib/prisma';
import { Logger } from '@/lib/logger';

export async function getTwitterClient(accountId: string) {
    const account = await prisma.account.findUnique({
        where: { id: accountId },
    });

    if (!account || account.provider !== 'twitter') {
        throw new Error('Twitter account not found');
    }

    const { access_token, refresh_token, expires_at, userId } = account;

    // Check if token is expired (with a 5-minute buffer)
    const isExpired = expires_at ? (expires_at * 1000) <= Date.now() + 5 * 60 * 1000 : true;

    if (isExpired && refresh_token) {
        console.log(`Refreshing Twitter token for account ${accountId}...`);
        try {
            const client = new TwitterApi({
                clientId: process.env.TWITTER_CLIENT_ID!,
                clientSecret: process.env.TWITTER_CLIENT_SECRET!,
            });

            const {
                client: refreshedClient,
                accessToken,
                refreshToken: newRefreshToken,
                expiresIn,
            } = await client.refreshOAuth2Token(refresh_token);

            const newExpiresAt = Math.floor(Date.now() / 1000) + expiresIn;

            // Update database with new tokens
            await prisma.account.update({
                where: { id: accountId },
                data: {
                    access_token: accessToken,
                    refresh_token: newRefreshToken,
                    expires_at: newExpiresAt,
                },
            });

            await Logger.info(
                'Twitter token refreshed automatically',
                { accountId },
                userId
            );

            return refreshedClient;
        } catch (error: any) {
            console.error('Failed to refresh Twitter token:', error);
            await Logger.error(
                'Failed to refresh Twitter token',
                { accountId, error: error.message },
                userId
            );
            // If refresh fails, we might need a fresh login, but still return a client with old token to let the original request fail naturally/be handled
            throw new Error(`Token refresh failed: ${error.message}`);
        }
    }

    // Return client with current access token
    return new TwitterApi(access_token!);
}
