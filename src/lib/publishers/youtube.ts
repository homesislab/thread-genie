import type { Publisher, SocialChannelData, PublishPayload, PublishResult } from './types';
import { Readable } from 'stream';

/**
 * YouTube Publisher Adapter
 * Requires: googleapis package & YouTube Data API v3 enabled in Google Cloud.
 * Credentials: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET di .env
 */
export const YouTubePublisher: Publisher = {
    platform: 'youtube',

    async publish(channel: SocialChannelData, payload: PublishPayload): Promise<PublishResult> {
        if (!channel.accessToken) {
            return { success: false, error: 'YouTube access token missing. Reconnect your Google/YouTube account.' };
        }

        if (!payload.mediaUrl && !payload.mediaType) {
            return { success: false, error: 'YouTube requires a video file. Please upload a video.' };
        }

        if (!payload.title) {
            return { success: false, error: 'YouTube requires a video title.' };
        }

        try {
            // Dynamic import agar tidak break jika googleapis belum diinstall
            const { google } = await import('googleapis');

            const auth = new google.auth.OAuth2(
                process.env.GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET
            );
            auth.setCredentials({
                access_token: channel.accessToken,
                refresh_token: channel.refreshToken ?? undefined,
            });

            const youtube = google.youtube({ version: 'v3', auth });

            // Fetch video dari mediaUrl dan upload
            const videoResponse = await fetch(payload.mediaUrl!);
            if (!videoResponse.ok) {
                return { success: false, error: `Failed to fetch video from URL: ${payload.mediaUrl}` };
            }
            
            // Convert Web ReadableStream to Node.js Readable stream since googleapis expects Node streams
            const videoStream = Readable.fromWeb(videoResponse.body as any);

            const meta = payload.platformMeta?.youtube || {};

            const uploadRes = await youtube.videos.insert({
                part: ['snippet', 'status'],
                requestBody: {
                    snippet: {
                        title: payload.title,
                        description: payload.text || '',
                        tags: payload.tags || meta.tags || [],
                        categoryId: meta.categoryId || '22', // 22 = People & Blogs
                    },
                    status: {
                        privacyStatus: payload.privacyStatus || meta.privacyStatus || 'public',
                    },
                },
                media: {
                    mimeType: 'video/*',
                    body: videoStream,
                },
            });

            const videoId = uploadRes.data.id;
            return {
                success: true,
                externalId: videoId ?? undefined,
                externalUrl: videoId ? `https://youtube.com/watch?v=${videoId}` : undefined,
                raw: uploadRes.data,
            };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    },
};
