export type Platform =
    | 'twitter'
    | 'facebook'
    | 'youtube'
    | 'instagram'
    | 'tiktok'
    | 'linkedin';

export interface SocialChannelData {
    id: string;
    provider: string;
    channelId?: string | null;
    displayName?: string | null;
    accessToken?: string | null;
    refreshToken?: string | null;
    expiresAt?: Date | null;
    metadata?: any;
}

/**
 * Payload konten yang dikirim ke semua platform.
 * Setiap platform akan mengambil field yang relevan.
 */
export interface PublishPayload {
    // Teks konten (thread untuk Twitter, caption untuk FB/IG, deskripsi untuk YT)
    text?: string;

    // Array tweet untuk Twitter threading
    thread?: Array<{ text: string; imageUrl?: string | null }>;

    // YouTube-specific
    title?: string;
    tags?: string[];
    privacyStatus?: 'public' | 'private' | 'unlisted';
    categoryId?: string; // YouTube category (default: "22" = People & Blogs)

    // Media
    mediaUrl?: string;     // URL ke file video atau gambar
    mediaType?: 'image' | 'video';
    mediaBase64?: string;  // Base64 image untuk Twitter

    // Metadata extra per platform (dari platformMeta JSON di Post)
    platformMeta?: {
        facebook?: { isReel?: boolean };
        instagram?: { isReel?: boolean };
        tiktok?: { privacyLevel?: string; disableComment?: boolean };
        linkedin?: { visibility?: string };
        [key: string]: any;
    };
}

export interface PublishResult {
    success: boolean;
    externalId?: string;    // ID post di platform (tweet ID, video ID, dll)
    externalUrl?: string;   // URL langsung ke post/video
    error?: string;
    raw?: any;              // Raw response dari API platform
}

/**
 * Interface yang harus diimplementasi oleh semua platform adapter.
 */
export interface Publisher {
    platform: Platform;
    publish(channel: SocialChannelData, payload: PublishPayload): Promise<PublishResult>;
}
