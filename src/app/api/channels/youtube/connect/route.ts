import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { google } from 'googleapis';

export const dynamic = 'force-dynamic';

/**
 * POST /api/channels/youtube/connect
 * Dipanggil setelah user login via Google OAuth (NextAuth).
 * Mengambil token dari Account table NextAuth, lalu fetch YouTube Channel milik user,
 * dan menyimpannya sebagai SocialChannel.
 */
export async function POST() {
    const session: any = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = session.user.id;

    // Ambil Google account dari NextAuth Account table
    const googleAccount = await prisma.account.findFirst({
        where: { userId, provider: 'google' },
    });

    if (!googleAccount?.access_token) {
        return NextResponse.json({
            error: 'Google account not connected. Please sign in with Google first.',
        }, { status: 400 });
    }

    try {
        const auth = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET
        );

        auth.setCredentials({
            access_token: googleAccount.access_token,
            refresh_token: googleAccount.refresh_token ?? undefined,
        });

        const youtube = google.youtube({ version: 'v3', auth });

        // Fetch channel user yang sedang login
        const response = await youtube.channels.list({
            part: ['snippet'],
            mine: true,
        });

        const channelsData = response.data.items || [];

        if (channelsData.length === 0) {
            return NextResponse.json({
                error: 'No YouTube Channel found for this Google account. Please create a channel first.',
                channels: [],
            }, { status: 200 });
        }

        const savedChannels = [];
        for (const channelItem of channelsData) {
            const channelId = channelItem.id;
            const snippet = channelItem.snippet;

            const channel = await prisma.socialChannel.upsert({
                where: {
                    userId_provider_channelId: {
                        userId,
                        provider: 'youtube',
                        channelId: channelId!,
                    },
                },
                create: {
                    userId,
                    provider: 'youtube',
                    channelId: channelId!,
                    displayName: snippet?.title || 'YouTube Channel',
                    avatarUrl: snippet?.thumbnails?.default?.url || null,
                    accessToken: googleAccount.access_token,
                    refreshToken: googleAccount.refresh_token,
                    isActive: true,
                },
                update: {
                    displayName: snippet?.title || 'YouTube Channel',
                    avatarUrl: snippet?.thumbnails?.default?.url || null,
                    accessToken: googleAccount.access_token,
                    refreshToken: googleAccount.refresh_token,
                    isActive: true,
                    updatedAt: new Date(),
                },
            });

            savedChannels.push({
                id: channel.id,
                name: channel.displayName,
                channelId: channel.channelId,
                avatarUrl: channel.avatarUrl,
            });
        }

        return NextResponse.json({
            success: true,
            message: `${savedChannels.length} YouTube Channel(s) connected.`,
            channels: savedChannels,
        });
    } catch (err: any) {
        console.error('YouTube connect error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
