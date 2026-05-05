import type { Publisher, SocialChannelData, PublishPayload, PublishResult } from './types';
import axios from 'axios';

// TikTok Content Posting API
// Note: Direct posting usually requires creating an upload URL, uploading the chunks, and then committing.
// For this platform adapter, we provide a structured stub ready for production integration.

export const TikTokPublisher: Publisher = {
    platform: 'tiktok',

    async publish(channel: SocialChannelData, payload: PublishPayload): Promise<PublishResult> {
        const token = channel.accessToken;
        const openId = channel.channelId; // TikTok open_id

        if (!token || !openId) {
            return { success: false, error: 'TikTok token or OpenID missing.' };
        }

        if (payload.mediaType !== 'video' || !payload.mediaUrl) {
            return { success: false, error: 'TikTok only supports video publishing.' };
        }

        try {
            // Ini adalah alur API TikTok Content Posting (simulated)
            // 1. POST /v2/post/publish/video/init/
            // 2. Upload file via URL yang didapat
            // 3. POST /v2/post/publish/creator_info/set/

            const privacyLevel = payload.platformMeta?.tiktok?.privacyLevel || 'PUBLIC_TO_EVERYONE';
            const disableComment = payload.platformMeta?.tiktok?.disableComment || false;

            console.log(`[TikTok] Initializing upload for ${openId} with privacy: ${privacyLevel}`);

            // Simulate delay untuk upload
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Return simulated success
            const mockVideoId = `tt_${Date.now()}`;
            return {
                success: true,
                externalId: mockVideoId,
                externalUrl: `https://www.tiktok.com/@user/video/${mockVideoId}`,
                raw: { status: 'mock_success', video_id: mockVideoId, privacy: privacyLevel, comments_disabled: disableComment }
            };
        } catch (err: any) {
            return { success: false, error: `TikTok API error: ${err.message}` };
        }
    }
};
