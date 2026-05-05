"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import axios from 'axios';
import { Twitter, Facebook, Youtube, Send, Loader2, Image as ImageIcon, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function OmnichannelComposer() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [channels, setChannels] = useState<any[]>([]);
    const [selectedChannels, setSelectedChannels] = useState<string[]>([]);

    const [textContent, setTextContent] = useState('');
    const [title, setTitle] = useState(''); // Untuk YT
    const [mediaUrl, setMediaUrl] = useState(''); // Simplifikasi, nanti pakai uploader
    const [mediaType, setMediaType] = useState<'text' | 'image' | 'video'>('text');

    const [isPublishing, setIsPublishing] = useState(false);

    useEffect(() => {
        if (session) {
            axios.get('/api/channels').then(res => setChannels(res.data.channels || []));
        }
    }, [session]);

    const toggleChannel = (channelId: string) => {
        setSelectedChannels(prev =>
            prev.includes(channelId) ? prev.filter(id => id !== channelId) : [...prev, channelId]
        );
    };

    const handlePublish = async () => {
        if (selectedChannels.length === 0) return alert('Pilih minimal 1 channel tujuan!');
        if (!textContent && mediaType !== 'video') return alert('Tulis sesuatu untuk diposting!');

        const isYoutubeSelected = channels.some(c => selectedChannels.includes(c.id) && c.provider === 'youtube');
        if (isYoutubeSelected && (!title || mediaType !== 'video')) {
            return alert('YouTube butuh video URL dan judul!');
        }

        setIsPublishing(true);
        try {
            await axios.post('/api/posts', {
                text: textContent,
                title: isYoutubeSelected ? title : undefined,
                mediaUrl: mediaUrl || undefined,
                mediaType: mediaUrl ? mediaType : 'text',
                channelIds: selectedChannels,
                publishNow: true
            });
            alert('Post berhasil dipublish/dijadwalkan!');
            router.push('/posts');
        } catch (err: any) {
            alert('Error: ' + (err.response?.data?.error || err.message));
        } finally {
            setIsPublishing(false);
        }
    };

    if (status === 'loading') return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin" /></div>;

    const hasYoutube = channels.some(c => selectedChannels.includes(c.id) && c.provider === 'youtube');

    return (
        <div className="max-w-5xl mx-auto space-y-6 p-6">
            <h1 className="text-3xl font-bold">Compose Post</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Kiri: Editor */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="glass border rounded-2xl p-6 space-y-4">
                        {hasYoutube && (
                            <div>
                                <label className="block text-sm font-medium mb-1">Video Title (Required for YouTube)</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="Catchy title..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium mb-1">Post Content / Description</label>
                            <textarea
                                value={textContent}
                                onChange={e => setTextContent(e.target.value)}
                                placeholder="What do you want to share today?"
                                rows={6}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500 resize-none"
                            />
                        </div>

                        {/* Simple Media Input (bisa diganti uploader nanti) */}
                        <div className="p-4 border border-dashed border-white/20 rounded-xl bg-white/5 space-y-3">
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" checked={mediaType === 'text'} onChange={() => setMediaType('text')} /> Text Only
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" checked={mediaType === 'image'} onChange={() => setMediaType('image')} /> Add Image
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" checked={mediaType === 'video'} onChange={() => setMediaType('video')} /> Add Video
                                </label>
                            </div>

                            {mediaType !== 'text' && (
                                <input
                                    type="text"
                                    value={mediaUrl}
                                    onChange={e => setMediaUrl(e.target.value)}
                                    placeholder={`Paste ${mediaType} URL here...`}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm"
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Kanan: Channel Selection & Actions */}
                <div className="space-y-4">
                    <div className="glass border rounded-2xl p-6">
                        <h3 className="font-semibold mb-3">Publish To</h3>
                        {channels.length === 0 ? (
                            <p className="text-sm text-slate-400">No channels connected. Go to Channels setting first.</p>
                        ) : (
                            <div className="space-y-2">
                                {channels.map(channel => (
                                    <label key={channel.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/5 hover:bg-white/5 cursor-pointer transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={selectedChannels.includes(channel.id)}
                                            onChange={() => toggleChannel(channel.id)}
                                            className="w-4 h-4 rounded text-violet-500 focus:ring-violet-500 bg-white/10 border-white/20"
                                        />
                                        <div className="flex items-center gap-2">
                                            {channel.provider === 'twitter' && <Twitter className="w-4 h-4 text-white" />}
                                            {channel.provider === 'facebook' && <Facebook className="w-4 h-4 text-blue-400" />}
                                            {channel.provider === 'youtube' && <Youtube className="w-4 h-4 text-red-400" />}
                                            <span className="text-sm font-medium">{channel.displayName}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="glass border rounded-2xl p-6 space-y-3">
                        <button
                            onClick={handlePublish}
                            disabled={isPublishing || selectedChannels.length === 0}
                            className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-xl font-medium transition-all disabled:opacity-50"
                        >
                            {isPublishing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            Publish Now
                        </button>
                        <button className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-xl font-medium transition-all text-slate-300">
                            <Calendar className="w-4 h-4" /> Schedule (WIP)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
