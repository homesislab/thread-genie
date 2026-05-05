import type { Platform, Publisher, SocialChannelData, PublishPayload, PublishResult } from './types';
import { TwitterPublisher } from './twitter';
import { FacebookPublisher } from './facebook';
import { YouTubePublisher } from './youtube';
import { InstagramPublisher } from './instagram';
import { TikTokPublisher } from './tiktok';
import { LinkedInPublisher } from './linkedin';

/** Registry semua platform adapter */
const PUBLISHERS: Record<Platform, Publisher> = {
    twitter: TwitterPublisher,
    facebook: FacebookPublisher,
    youtube: YouTubePublisher,
    instagram: InstagramPublisher,
    tiktok: TikTokPublisher,
    linkedin: LinkedInPublisher,
};

/**
 * Dispatch publish ke adapter yang sesuai berdasarkan platform.
 */
export async function dispatch(
    platform: string,
    channel: SocialChannelData,
    payload: PublishPayload
): Promise<PublishResult> {
    const publisher = PUBLISHERS[platform as Platform];

    if (!publisher) {
        return { success: false, error: `Platform "${platform}" is not supported yet.` };
    }

    return publisher.publish(channel, payload);
}

export { PUBLISHERS };
export type { Platform, Publisher, SocialChannelData, PublishPayload, PublishResult };
