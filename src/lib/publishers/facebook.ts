import type { Publisher, SocialChannelData, PublishPayload, PublishResult } from './types';

const GRAPH_API_BASE = 'https://graph.facebook.com/v19.0';

async function graphPost(endpoint: string, token: string, body: Record<string, any>): Promise<any> {
    const res = await fetch(`${GRAPH_API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, access_token: token }),
    });
    const data = await res.json();
    if (!res.ok || data.error) {
        throw new Error(data.error?.message || `Facebook API error: ${res.status}`);
    }
    return data;
}

export const FacebookPublisher: Publisher = {
    platform: 'facebook',

    async publish(channel: SocialChannelData, payload: PublishPayload): Promise<PublishResult> {
        // Ambil page token dari metadata (disimpan saat connect)
        const pageToken: string = channel.metadata?.pageToken || channel.accessToken;
        const pageId: string = channel.channelId!;

        if (!pageToken || !pageId) {
            return { success: false, error: 'Facebook page token or page ID missing. Reconnect your Facebook account.' };
        }

        try {
            let result: any;

            if (payload.mediaType === 'video' && payload.mediaUrl) {
                // Upload video ke Facebook Page
                result = await graphPost(`/${pageId}/videos`, pageToken, {
                    description: payload.text || '',
                    file_url: payload.mediaUrl,
                });
            } else if (payload.mediaType === 'image' && payload.mediaUrl) {
                // Upload gambar ke Facebook Page
                result = await graphPost(`/${pageId}/photos`, pageToken, {
                    caption: payload.text || '',
                    url: payload.mediaUrl,
                });
            } else {
                // Post teks biasa
                result = await graphPost(`/${pageId}/feed`, pageToken, {
                    message: payload.text || '',
                });
            }

            const postId = result.id || result.post_id;
            return {
                success: true,
                externalId: postId,
                externalUrl: `https://facebook.com/${postId}`,
                raw: result,
            };
        } catch (err: any) {
            return { success: false, error: err.message };
        }
    },
};
