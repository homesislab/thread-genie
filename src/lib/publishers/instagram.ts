import type { Publisher, SocialChannelData, PublishPayload, PublishResult } from './types';
import axios from 'axios';

const GRAPH_API_BASE = 'https://graph.facebook.com/v19.0';

export const InstagramPublisher: Publisher = {
    platform: 'instagram',

    async publish(channel: SocialChannelData, payload: PublishPayload): Promise<PublishResult> {
        const token = channel.accessToken;
        const igUserId = channel.channelId; // Instagram Business/Creator Account ID

        if (!token || !igUserId) {
            return { success: false, error: 'Instagram token or user ID missing.' };
        }

        try {
            // Jika video (Reels)
            if (payload.mediaType === 'video' && payload.mediaUrl) {
                // Step 1: Create media container
                const containerRes = await axios.post(`${GRAPH_API_BASE}/${igUserId}/media`, null, {
                    params: {
                        media_type: 'REELS',
                        video_url: payload.mediaUrl,
                        caption: payload.text || '',
                        access_token: token,
                    }
                });

                const creationId = containerRes.data.id;

                // For a real production app, we should poll the status of the container until it's ready:
                // GET /{creation_id}?fields=status_code
                // Tapi untuk demo ini, kita tunggu sebentar dan publish (atau bisa return status processing)
                // await new Promise(resolve => setTimeout(resolve, 5000));

                // Step 2: Publish media
                const publishRes = await axios.post(`${GRAPH_API_BASE}/${igUserId}/media_publish`, null, {
                    params: {
                        creation_id: creationId,
                        access_token: token,
                    }
                });

                return {
                    success: true,
                    externalId: publishRes.data.id,
                    externalUrl: `https://instagram.com/p/${publishRes.data.id}`,
                    raw: publishRes.data,
                };
            }
            // Jika gambar
            else if (payload.mediaType === 'image' && payload.mediaUrl) {
                const containerRes = await axios.post(`${GRAPH_API_BASE}/${igUserId}/media`, null, {
                    params: {
                        image_url: payload.mediaUrl,
                        caption: payload.text || '',
                        access_token: token,
                    }
                });

                const creationId = containerRes.data.id;

                const publishRes = await axios.post(`${GRAPH_API_BASE}/${igUserId}/media_publish`, null, {
                    params: {
                        creation_id: creationId,
                        access_token: token,
                    }
                });

                return {
                    success: true,
                    externalId: publishRes.data.id,
                    externalUrl: `https://instagram.com/p/${publishRes.data.id}`,
                    raw: publishRes.data,
                };
            } else {
                return { success: false, error: 'Instagram requires an image or video.' };
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.error?.message || err.message;
            return { success: false, error: `Instagram Graph API error: ${errorMsg}` };
        }
    }
};
