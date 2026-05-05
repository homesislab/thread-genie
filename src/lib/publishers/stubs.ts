import type { Publisher, SocialChannelData, PublishPayload, PublishResult } from './types';

/** Instagram publisher — coming soon via Meta Graph API */
export const InstagramPublisher: Publisher = {
    platform: 'instagram',
    async publish(_channel: SocialChannelData, _payload: PublishPayload): Promise<PublishResult> {
        return { success: false, error: 'Instagram publishing coming soon.' };
    },
};

/** TikTok publisher — coming soon via TikTok Content Posting API */
export const TikTokPublisher: Publisher = {
    platform: 'tiktok',
    async publish(_channel: SocialChannelData, _payload: PublishPayload): Promise<PublishResult> {
        return { success: false, error: 'TikTok publishing coming soon.' };
    },
};

/** LinkedIn publisher — coming soon via LinkedIn API */
export const LinkedInPublisher: Publisher = {
    platform: 'linkedin',
    async publish(_channel: SocialChannelData, _payload: PublishPayload): Promise<PublishResult> {
        return { success: false, error: 'LinkedIn publishing coming soon.' };
    },
};
