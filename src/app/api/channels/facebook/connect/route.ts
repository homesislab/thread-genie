import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const GRAPH_API = 'https://graph.facebook.com/v19.0';

/**
 * POST /api/channels/facebook/connect
 * Dipanggil setelah user login via Facebook OAuth (NextAuth).
 * Mengambil token dari Account table NextAuth, lalu fetch Pages milik user,
 * dan menyimpannya sebagai SocialChannel.
 */
export async function POST() {
    const session: any = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = session.user.id;

    // Ambil Facebook account dari NextAuth Account table
    const fbAccount = await prisma.account.findFirst({
        where: { userId, provider: 'facebook' },
    });

    if (!fbAccount?.access_token) {
        return NextResponse.json({
            error: 'Facebook account not connected. Please sign in with Facebook first.',
        }, { status: 400 });
    }

    const userToken = fbAccount.access_token;

    try {
        let activeToken = userToken;

        // Attempt to exchange short-lived token for a long-lived token
        if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
            const exchangeUrl = `${GRAPH_API}/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.FACEBOOK_CLIENT_ID}&client_secret=${process.env.FACEBOOK_CLIENT_SECRET}&fb_exchange_token=${userToken}`;
            const exchangeRes = await fetch(exchangeUrl);
            const exchangeData = await exchangeRes.json();
            
            if (exchangeData.access_token) {
                activeToken = exchangeData.access_token;
                // Update the Account table with the long-lived token
                await prisma.account.updateMany({
                    where: { userId, provider: 'facebook' },
                    data: { access_token: activeToken },
                });
            } else {
                console.warn('Failed to exchange Facebook token:', exchangeData);
                const errMsg = exchangeData.error?.message || '';
                if (errMsg.includes('Error validating application') || errMsg.includes('Session has expired') || errMsg.includes('Invalid OAuth access token')) {
                    await prisma.account.deleteMany({
                        where: { userId, provider: 'facebook' },
                    });
                    return NextResponse.json({ error: 'Facebook account not connected. ' + errMsg }, { status: 400 });
                }
            }
        }

        // 1. Fetch Facebook Pages yang dimiliki user
        const pagesRes = await fetch(
            `${GRAPH_API}/me/accounts?fields=id,name,picture,access_token&access_token=${activeToken}`
        );
        const pagesData = await pagesRes.json();

        if (pagesData.error) {
            const errMsg = pagesData.error.message || '';
            if (errMsg.includes('Error validating application') || errMsg.includes('Session has expired') || errMsg.includes('Invalid OAuth access token')) {
                await prisma.account.deleteMany({
                    where: { userId, provider: 'facebook' },
                });
                return NextResponse.json({ error: 'Facebook account not connected. ' + errMsg }, { status: 400 });
            }
            return NextResponse.json({ error: errMsg }, { status: 400 });
        }

        const pages: Array<{ id: string; name: string; picture?: any; access_token: string }> =
            pagesData.data || [];

        if (pages.length === 0) {
            return NextResponse.json({
                error: 'No Facebook Pages found. Make sure you are an admin of at least one Facebook Page.',
                pages: [],
            }, { status: 200 });
        }

        // 2. Upsert setiap Page sebagai SocialChannel
        const savedChannels = [];
        for (const page of pages) {
            const avatarUrl = page.picture?.data?.url || null;

            const channel = await prisma.socialChannel.upsert({
                where: {
                    userId_provider_channelId: {
                        userId,
                        provider: 'facebook',
                        channelId: page.id,
                    },
                },
                create: {
                    userId,
                    provider: 'facebook',
                    channelId: page.id,
                    displayName: page.name,
                    avatarUrl,
                    accessToken: activeToken,       // user token (fallback)
                    metadata: { pageToken: page.access_token }, // page-specific token
                    isActive: true,
                },
                update: {
                    displayName: page.name,
                    avatarUrl,
                    accessToken: activeToken,
                    metadata: { pageToken: page.access_token },
                    isActive: true,
                    updatedAt: new Date(),
                },
            });

            savedChannels.push({
                id: channel.id,
                name: page.name,
                pageId: page.id,
                avatarUrl,
            });
        }

        return NextResponse.json({
            success: true,
            message: `${savedChannels.length} Facebook Page(s) connected.`,
            channels: savedChannels,
        });
    } catch (err: any) {
        console.error('Facebook connect error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
