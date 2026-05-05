"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useSession, signIn } from "next-auth/react";
import {
    Twitter, Facebook, Youtube, Instagram, Linkedin,
    Plus, Trash2, Loader2, CheckCircle2, AlertCircle,
    RefreshCw, Zap
} from 'lucide-react';
import axios from 'axios';

type Channel = {
    id: string;
    provider: string;
    displayName: string | null;
    avatarUrl: string | null;
    channelId: string | null;
    isActive: boolean;
};

type PlatformConfig = {
    key: string;
    label: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    borderColor: string;
    description: string;
    connectFn: () => void;
    available: boolean;
    comingSoon?: boolean;
};

export default function ChannelsPage() {
    const { data: session, status } = useSession();
    const [channels, setChannels] = useState<Channel[]>([]);
    const [loading, setLoading] = useState(true);
    const [connectingFb, setConnectingFb] = useState(false);
    const [connectingYt, setConnectingYt] = useState(false);
    const [disconnecting, setDisconnecting] = useState<string | null>(null);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const fetchChannels = useCallback(async () => {
        try {
            const res = await axios.get('/api/channels');
            setChannels(res.data.channels || []);
        } catch {
            console.error('Failed to fetch channels');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (session) fetchChannels();
    }, [session, fetchChannels]);

    const handleConnectFacebook = async () => {
        setConnectingFb(true);
        try {
            // Step 1: Cek apakah sudah ada FB OAuth di NextAuth
            const res = await axios.post('/api/channels/facebook/connect');
            if (res.data.success) {
                showToast(`✅ ${res.data.message}`);
                fetchChannels();
            } else {
                // Belum login FB — arahkan ke OAuth dulu
                await signIn('facebook', { callbackUrl: '/accounts?connect=facebook' });
            }
        } catch (err: any) {
            const msg = err?.response?.data?.error || 'Failed to connect Facebook';
            if (msg.includes('not connected')) {
                await signIn('facebook', { callbackUrl: '/accounts?connect=facebook' });
            } else {
                showToast(msg, 'error');
            }
        } finally {
            setConnectingFb(false);
        }
    };

    const handleConnectYouTube = async () => {
        setConnectingYt(true);
        try {
            const res = await axios.post('/api/channels/youtube/connect');
            if (res.data.success) {
                showToast(`✅ ${res.data.message}`);
                fetchChannels();
            } else {
                await signIn('google', { callbackUrl: '/accounts?connect=youtube' });
            }
        } catch (err: any) {
            const msg = err?.response?.data?.error || 'Failed to connect YouTube';
            if (msg.includes('not connected')) {
                await signIn('google', { callbackUrl: '/accounts?connect=youtube' });
            } else {
                showToast(msg, 'error');
            }
        } finally {
            setConnectingYt(false);
        }
    };

    const handleDisconnect = async (channelId: string) => {
        if (!confirm('Disconnect this channel?')) return;
        setDisconnecting(channelId);
        try {
            await axios.delete(`/api/channels?id=${channelId}`);
            setChannels(prev => prev.filter(c => c.id !== channelId));
            showToast('Channel disconnected');
        } catch {
            showToast('Failed to disconnect', 'error');
        } finally {
            setDisconnecting(null);
        }
    };

    // Auto-connect after OAuth redirect
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const connectParam = params.get('connect');

        if (connectParam === 'facebook' && session) {
            axios.post('/api/channels/facebook/connect').then(res => {
                if (res.data.success) {
                    showToast(`✅ ${res.data.message}`);
                    fetchChannels();
                    window.history.replaceState({}, '', '/accounts');
                }
            }).catch(() => {});
        } else if (connectParam === 'youtube' && session) {
            axios.post('/api/channels/youtube/connect').then(res => {
                if (res.data.success) {
                    showToast(`✅ ${res.data.message}`);
                    fetchChannels();
                    window.history.replaceState({}, '', '/accounts');
                }
            }).catch(() => {});
        }
    }, [session, fetchChannels]);

    const platforms: PlatformConfig[] = [
        {
            key: 'twitter',
            label: 'X (Twitter)',
            icon: Twitter,
            color: 'text-white',
            bgColor: 'bg-white/10',
            borderColor: 'border-white/20',
            description: 'Post threads ke X',
            connectFn: () => signIn('twitter'),
            available: true,
        },
        {
            key: 'facebook',
            label: 'Facebook Page',
            icon: Facebook,
            color: 'text-blue-400',
            bgColor: 'bg-blue-600/10',
            borderColor: 'border-blue-500/20',
            description: 'Post ke Facebook Page',
            connectFn: handleConnectFacebook,
            available: true,
        },
        {
            key: 'youtube',
            label: 'YouTube',
            icon: Youtube,
            color: 'text-red-400',
            bgColor: 'bg-red-600/10',
            borderColor: 'border-red-500/20',
            description: 'Upload video ke YouTube',
            connectFn: handleConnectYouTube,
            available: true,
        },
        {
            key: 'instagram',
            label: 'Instagram',
            icon: Instagram,
            color: 'text-pink-400',
            bgColor: 'bg-pink-600/10',
            borderColor: 'border-pink-500/20',
            description: 'Post & Reels ke Instagram',
            connectFn: () => {},
            available: false,
            comingSoon: true,
        },
        {
            key: 'linkedin',
            label: 'LinkedIn',
            icon: Linkedin,
            color: 'text-sky-400',
            bgColor: 'bg-sky-600/10',
            borderColor: 'border-sky-500/20',
            description: 'Post ke LinkedIn',
            connectFn: () => {},
            available: false,
            comingSoon: true,
        },
    ];

    if (status === 'loading' || (session && loading)) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 p-6">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all
                    ${toast.type === 'success' ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'}`}>
                    {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-violet-600/20 rounded-xl flex items-center justify-center">
                        <Zap className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Connected Channels</h1>
                        <p className="text-slate-400 text-sm">Kelola akun sosmed yang terhubung untuk publish konten</p>
                    </div>
                </div>

                {/* Summary badges */}
                <div className="flex gap-2 mt-4 flex-wrap">
                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300">
                        {channels.length} channel terhubung
                    </span>
                    <span className="px-3 py-1 rounded-full bg-violet-600/10 border border-violet-500/20 text-xs text-violet-300">
                        {platforms.filter(p => !p.comingSoon).length} platform aktif
                    </span>
                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-500">
                        {platforms.filter(p => p.comingSoon).length} coming soon
                    </span>
                </div>
            </div>

            {/* Platform Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {platforms.map((platform) => {
                    const Icon = platform.icon;
                    const connected = channels.filter(c => c.provider === platform.key);
                    const isConnecting = (platform.key === 'facebook' && connectingFb) ||
                                         (platform.key === 'youtube' && connectingYt);

                    return (
                        <div
                            key={platform.key}
                            className={`relative glass border rounded-2xl p-5 space-y-4 transition-all
                                ${platform.comingSoon ? 'opacity-60' : ''}
                                ${platform.borderColor}`}
                        >
                            {/* Coming Soon Badge */}
                            {platform.comingSoon && (
                                <span className="absolute top-4 right-4 text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-500">
                                    Coming Soon
                                </span>
                            )}

                            {/* Platform Header */}
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 ${platform.bgColor} rounded-xl flex items-center justify-center`}>
                                    <Icon className={`w-5 h-5 ${platform.color}`} />
                                </div>
                                <div>
                                    <h3 className="font-semibold">{platform.label}</h3>
                                    <p className="text-xs text-slate-500">{platform.description}</p>
                                </div>
                            </div>

                            {/* Connected accounts */}
                            <div className="space-y-2">
                                {connected.map((ch) => (
                                    <div
                                        key={ch.id}
                                        className="flex items-center justify-between bg-white/5 border border-white/5 rounded-xl px-3 py-2"
                                    >
                                        <div className="flex items-center gap-2">
                                            {ch.avatarUrl ? (
                                                <img src={ch.avatarUrl} className="w-7 h-7 rounded-full" alt="" />
                                            ) : (
                                                <div className={`w-7 h-7 ${platform.bgColor} rounded-full flex items-center justify-center`}>
                                                    <Icon className={`w-3.5 h-3.5 ${platform.color}`} />
                                                </div>
                                            )}
                                            <span className="text-sm font-medium text-slate-200 truncate max-w-[140px]">
                                                {ch.displayName || ch.channelId}
                                            </span>
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                                        </div>
                                        <button
                                            onClick={() => handleDisconnect(ch.id)}
                                            disabled={disconnecting === ch.id}
                                            className="text-slate-600 hover:text-red-400 transition-colors p-1"
                                            title="Disconnect"
                                        >
                                            {disconnecting === ch.id
                                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                : <Trash2 className="w-3.5 h-3.5" />
                                            }
                                        </button>
                                    </div>
                                ))}

                                {/* Connect Button */}
                                {!platform.comingSoon && (
                                    <button
                                        onClick={platform.connectFn}
                                        disabled={isConnecting}
                                        className={`w-full flex items-center justify-center gap-2 border border-dashed rounded-xl py-2.5 text-sm font-medium transition-all
                                            ${platform.borderColor} text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-50`}
                                    >
                                        {isConnecting
                                            ? <><RefreshCw className="w-4 h-4 animate-spin" /> Connecting...</>
                                            : <><Plus className="w-4 h-4" /> Connect {platform.label}</>
                                        }
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
