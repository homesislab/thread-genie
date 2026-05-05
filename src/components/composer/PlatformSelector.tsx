"use client";

import React from 'react';
import { Twitter, Facebook, Youtube, Instagram, Linkedin } from 'lucide-react';

interface Channel {
    id: string;
    provider: string;
    displayName: string;
    avatarUrl?: string;
    channelId?: string;
}

interface PlatformSelectorProps {
    channels: Channel[];
    selected: string[];
    onChange: (ids: string[]) => void;
    mode?: 'text' | 'image' | 'video' | 'thread';
}

const PLATFORM_CONFIG: Record<string, {
    icon: React.ElementType;
    color: string;
    bgColor: string;
    label: string;
    videoOnly?: boolean;
}> = {
    twitter: {
        icon: Twitter,
        color: 'text-white',
        bgColor: 'bg-black',
        label: 'X (Twitter)',
    },
    facebook: {
        icon: Facebook,
        color: 'text-white',
        bgColor: 'bg-[#1877F2]',
        label: 'Facebook',
    },
    youtube: {
        icon: Youtube,
        color: 'text-white',
        bgColor: 'bg-[#FF0000]',
        label: 'YouTube',
        videoOnly: true,
    },
    instagram: {
        icon: Instagram,
        color: 'text-white',
        bgColor: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400',
        label: 'Instagram',
    },
    linkedin: {
        icon: Linkedin,
        color: 'text-white',
        bgColor: 'bg-[#0A66C2]',
        label: 'LinkedIn',
    },
    tiktok: {
        icon: () => (
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.79 1.52V6.76a4.85 4.85 0 01-1.02-.07z" />
            </svg>
        ),
        color: 'text-white',
        bgColor: 'bg-black',
        label: 'TikTok',
    },
};

export function PlatformSelector({ channels, selected, onChange, mode = 'text' }: PlatformSelectorProps) {
    const toggle = (id: string) => {
        onChange(
            selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]
        );
    };

    if (channels.length === 0) {
        return (
            <div className="text-center py-6 px-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3">
                    <Youtube className="w-6 h-6 text-slate-500" />
                </div>
                <p className="text-sm text-slate-400 font-medium">Belum ada channel</p>
                <p className="text-xs text-slate-600 mt-1">Hubungkan akun di halaman Channels</p>
                <a
                    href="/accounts"
                    className="mt-3 inline-block text-xs text-violet-400 hover:text-violet-300 underline underline-offset-2"
                >
                    Kelola Channels →
                </a>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {channels.map(channel => {
                const config = PLATFORM_CONFIG[channel.provider];
                if (!config) return null;

                const isVideoOnly = config.videoOnly;
                const isDisabled = isVideoOnly && mode !== 'video';
                const isSelected = selected.includes(channel.id);
                const Icon = config.icon;

                return (
                    <button
                        key={channel.id}
                        onClick={() => !isDisabled && toggle(channel.id)}
                        disabled={isDisabled}
                        title={isDisabled ? 'YouTube hanya untuk konten video' : undefined}
                        className={`
                            w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-150 text-left
                            ${isSelected && !isDisabled
                                ? 'border-violet-500/50 bg-violet-500/10'
                                : 'border-white/5 bg-white/[0.02] hover:bg-white/5'
                            }
                            ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                    >
                        {/* Platform icon */}
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${config.bgColor}`}>
                            <Icon className={`w-4 h-4 ${config.color}`} />
                        </div>

                        {/* Name */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-200 truncate">{channel.displayName}</p>
                            <p className="text-xs text-slate-500">{config.label}{isVideoOnly ? ' · Video only' : ''}</p>
                        </div>

                        {/* Checkbox */}
                        <div className={`
                            w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all
                            ${isSelected && !isDisabled
                                ? 'bg-violet-500 border-violet-500'
                                : 'border-white/20 bg-transparent'
                            }
                        `}>
                            {isSelected && !isDisabled && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
