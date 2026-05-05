"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
    Type, Image as ImageIcon, Video, MessageSquareMore,
    Send, Calendar, Loader2, AlertCircle, X,
    Plus, Trash2, ChevronDown, CheckCircle2
} from 'lucide-react';
import { VideoUploader } from '@/components/composer/VideoUploader';
import { ImageUploader } from '@/components/composer/ImageUploader';
import { PlatformSelector } from '@/components/composer/PlatformSelector';
import { SchedulerDrawer } from '@/components/composer/SchedulerDrawer';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

type Mode = 'text' | 'image' | 'video' | 'thread';

const MODES = [
    { key: 'text', label: 'Text', icon: Type },
    { key: 'image', label: 'Image', icon: ImageIcon },
    { key: 'video', label: 'Video', icon: Video },
    { key: 'thread', label: 'Thread', icon: MessageSquareMore },
] as const;

const YT_CATEGORIES = [
    { id: '1', label: 'Film & Animation' },
    { id: '10', label: 'Music' },
    { id: '17', label: 'Sports' },
    { id: '20', label: 'Gaming' },
    { id: '22', label: 'People & Blogs' },
    { id: '23', label: 'Comedy' },
    { id: '24', label: 'Entertainment' },
    { id: '25', label: 'News & Politics' },
    { id: '26', label: 'Howto & Style' },
    { id: '27', label: 'Education' },
    { id: '28', label: 'Science & Technology' },
];

export default function ComposerPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    // Mode
    const [mode, setMode] = useState<Mode>('text');

    // Channels
    const [channels, setChannels] = useState<any[]>([]);
    const [selectedChannels, setSelectedChannels] = useState<string[]>([]);

    // Content
    const [textContent, setTextContent] = useState('');
    const [title, setTitle] = useState('');
    const [mediaUrl, setMediaUrl] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [ytPrivacy, setYtPrivacy] = useState<'public' | 'private' | 'unlisted'>('public');
    const [ytCategory, setYtCategory] = useState('22');
    const [fbIsReel, setFbIsReel] = useState(false);

    // Thread mode
    const [tweets, setTweets] = useState(['']);

    // Scheduler
    const [showScheduler, setShowScheduler] = useState(false);
    const [scheduledAt, setScheduledAt] = useState<Date | null>(null);

    // State
    const [isPublishing, setIsPublishing] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

    useEffect(() => {
        if (session) {
            axios.get('/api/channels').then(res => setChannels(res.data.channels || []));
        }
    }, [session]);

    // Derived
    const hasYoutube = channels.some(c => selectedChannels.includes(c.id) && c.provider === 'youtube');
    const hasTwitter = channels.some(c => selectedChannels.includes(c.id) && c.provider === 'twitter');
    const hasFacebook = channels.some(c => selectedChannels.includes(c.id) && c.provider === 'facebook');
    const charCount = mode === 'thread' ? tweets[tweets.length - 1]?.length || 0 : textContent.length;
    const maxChars = hasTwitter ? 280 : 63206;

    // ─────────────────────────────────────────────
    // Handlers
    // ─────────────────────────────────────────────
    const showToast = (type: 'success' | 'error', msg: string) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 4000);
    };

    const handleTagKeyDown = (e: React.KeyboardEvent) => {
        if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
            e.preventDefault();
            const cleaned = tagInput.trim().replace(/^#/, '');
            if (!tags.includes(cleaned)) setTags(t => [...t, cleaned]);
            setTagInput('');
        }
        if (e.key === 'Backspace' && !tagInput && tags.length) {
            setTags(t => t.slice(0, -1));
        }
    };

    const buildPayload = (publishNow: boolean, schedAt?: Date) => {
        const channelIds = selectedChannels;
        const isVideo = mode === 'video';
        const isImage = mode === 'image';
        const isThread = mode === 'thread';

        const platformMeta: any = { channelIds };
        if (hasYoutube) {
            platformMeta.youtube = { privacyStatus: ytPrivacy, tags, categoryId: ytCategory };
        }
        if (hasFacebook && isVideo) {
            platformMeta.facebook = { isReel: fbIsReel };
        }

        return {
            title: hasYoutube ? title : undefined,
            body: isThread ? undefined : textContent,
            text: isThread ? undefined : textContent,
            thread: isThread ? tweets.map(t => ({ text: t })) : undefined,
            mediaUrl: (isVideo || isImage) ? mediaUrl : undefined,
            mediaType: isVideo ? 'video' : isImage ? 'image' : 'text',
            tags: hasYoutube ? tags : undefined,
            platformMeta,
            channelIds,
            publishNow,
            scheduledAt: schedAt ? schedAt.toISOString() : undefined,
        };
    };

    const handlePublish = async (publishNow: boolean, schedAt?: Date) => {
        if (selectedChannels.length === 0) return showToast('error', 'Pilih minimal 1 channel!');

        if (hasYoutube && mode !== 'video') {
            return showToast('error', 'YouTube hanya mendukung konten video. Switch ke mode Video atau unselect YouTube.');
        }

        if (hasYoutube && !title.trim()) {
            return showToast('error', 'YouTube membutuhkan judul video!');
        }

        if ((mode === 'video' || mode === 'image') && !mediaUrl) {
            return showToast('error', `Upload ${mode} terlebih dahulu!`);
        }

        if (mode !== 'thread' && !textContent.trim() && mode === 'text') {
            return showToast('error', 'Tulis sesuatu untuk diposting!');
        }

        setIsPublishing(true);
        setShowScheduler(false);

        try {
            await axios.post('/api/posts', buildPayload(publishNow, schedAt));

            if (publishNow) {
                showToast('success', '🚀 Post berhasil dipublish!');
            } else {
                showToast('success', `📅 Dijadwalkan: ${format(schedAt!, 'dd MMM yyyy HH:mm', { locale: localeId })}`);
            }

            setTimeout(() => router.push('/posts'), 1800);
        } catch (err: any) {
            showToast('error', err.response?.data?.error || 'Gagal publish. Coba lagi.');
        } finally {
            setIsPublishing(false);
        }
    };

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-medium transition-all ${toast.type === 'success'
                    ? 'bg-emerald-900/80 border-emerald-500/30 text-emerald-200 backdrop-blur-xl'
                    : 'bg-red-900/80 border-red-500/30 text-red-200 backdrop-blur-xl'
                    }`}>
                    {toast.type === 'success'
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        : <AlertCircle className="w-4 h-4 text-red-400" />
                    }
                    {toast.msg}
                </div>
            )}

            {/* Page header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-100">Compose Post</h1>
                <p className="text-slate-500 text-sm mt-1">Publish ke berbagai platform sekaligus</p>
            </div>

            {/* Mode tabs */}
            <div className="flex gap-1 p-1 rounded-2xl bg-white/[0.03] border border-white/8 w-fit">
                {MODES.map(m => {
                    const Icon = m.icon;
                    const isActive = mode === m.key;
                    return (
                        <button
                            key={m.key}
                            onClick={() => setMode(m.key as Mode)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                ? 'text-white shadow-lg shadow-violet-500/20'
                                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                                }`}
                            style={isActive ? { background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' } : {}}
                        >
                            <Icon className="w-4 h-4" />
                            {m.label}
                        </button>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
                {/* ── LEFT: Editor ── */}
                <div className="space-y-4">
                    <div
                        className="rounded-2xl border border-white/8 p-6 space-y-5"
                        style={{ background: 'rgba(255,255,255,0.02)' }}
                    >
                        {/* YouTube title */}
                        {hasYoutube && (
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                    Judul Video <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    maxLength={100}
                                    placeholder="Judul video yang menarik..."
                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors text-sm"
                                />
                                <p className="text-xs text-slate-600 mt-1 text-right">{title.length}/100</p>
                            </div>
                        )}

                        {/* Video uploader */}
                        {mode === 'video' && (
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                    Video
                                </label>
                                <VideoUploader
                                    onUploaded={(url) => setMediaUrl(url)}
                                    onClear={() => setMediaUrl('')}
                                    currentUrl={mediaUrl || undefined}
                                />
                            </div>
                        )}

                        {/* Image uploader */}
                        {mode === 'image' && (
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                    Gambar
                                </label>
                                <ImageUploader
                                    onUploaded={(url) => setMediaUrl(url)}
                                    onClear={() => setMediaUrl('')}
                                    currentUrl={mediaUrl || undefined}
                                />
                            </div>
                        )}

                        {/* Text content */}
                        {mode !== 'thread' ? (
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                    {mode === 'video' ? 'Deskripsi' : mode === 'image' ? 'Caption' : 'Konten'}
                                </label>
                                <div className="relative">
                                    <textarea
                                        value={textContent}
                                        onChange={e => setTextContent(e.target.value)}
                                        placeholder={
                                            mode === 'video' ? 'Tambahkan deskripsi video...'
                                                : mode === 'image' ? 'Tulis caption gambar...'
                                                    : 'Apa yang ingin kamu bagikan hari ini?'
                                        }
                                        rows={mode === 'video' ? 4 : 6}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors resize-none text-sm leading-relaxed"
                                    />
                                    <div className={`absolute bottom-3 right-3 text-xs ${charCount > maxChars * 0.9 ? 'text-orange-400' : 'text-slate-600'}`}>
                                        {charCount}/{maxChars}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Thread builder */
                            <div className="space-y-3">
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                    Tweet Thread
                                </label>
                                {tweets.map((tweet, idx) => (
                                    <div key={idx} className="flex gap-3">
                                        <div className="flex flex-col items-center">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                                {idx + 1}
                                            </div>
                                            {idx < tweets.length - 1 && (
                                                <div className="w-0.5 flex-1 mt-2 bg-white/10 min-h-[1rem]" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="relative">
                                                <textarea
                                                    value={tweet}
                                                    onChange={e => {
                                                        const updated = [...tweets];
                                                        updated[idx] = e.target.value;
                                                        setTweets(updated);
                                                    }}
                                                    placeholder={idx === 0 ? "Tweet pertama..." : `Tweet ${idx + 1}...`}
                                                    rows={3}
                                                    maxLength={280}
                                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors resize-none text-sm"
                                                />
                                                <div className={`absolute bottom-2 right-3 text-xs ${tweet.length > 250 ? 'text-orange-400' : 'text-slate-600'}`}>
                                                    {tweet.length}/280
                                                </div>
                                            </div>
                                            {tweets.length > 1 && (
                                                <button
                                                    onClick={() => setTweets(t => t.filter((_, i) => i !== idx))}
                                                    className="mt-1 text-xs text-slate-600 hover:text-red-400 flex items-center gap-1 transition-colors"
                                                >
                                                    <Trash2 className="w-3 h-3" /> Hapus tweet ini
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <button
                                    onClick={() => setTweets(t => [...t, ''])}
                                    className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 transition-colors py-2"
                                >
                                    <Plus className="w-4 h-4" /> Tambah tweet
                                </button>
                            </div>
                        )}

                        {/* YouTube extra settings */}
                        {hasYoutube && mode === 'video' && (
                            <div className="p-4 rounded-xl border border-white/8 bg-black/20 space-y-4">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-red-500"><path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" /></svg>
                                    YouTube Settings
                                </p>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-slate-500 mb-1">Privacy</label>
                                        <div className="relative">
                                            <select
                                                value={ytPrivacy}
                                                onChange={e => setYtPrivacy(e.target.value as any)}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500 appearance-none pr-8"
                                            >
                                                <option value="public">🌍 Public</option>
                                                <option value="unlisted">🔗 Unlisted</option>
                                                <option value="private">🔒 Private</option>
                                            </select>
                                            <ChevronDown className="absolute right-2 top-2.5 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-500 mb-1">Category</label>
                                        <div className="relative">
                                            <select
                                                value={ytCategory}
                                                onChange={e => setYtCategory(e.target.value)}
                                                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-violet-500 appearance-none pr-8"
                                            >
                                                {YT_CATEGORIES.map(c => (
                                                    <option key={c.id} value={c.id}>{c.label}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-2 top-2.5 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                {/* Tags */}
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Tags</label>
                                    <div className="flex flex-wrap gap-1.5 p-2 bg-black/40 border border-white/10 rounded-lg min-h-[40px]">
                                        {tags.map(tag => (
                                            <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-violet-500/20 text-violet-300 text-xs">
                                                #{tag}
                                                <button onClick={() => setTags(t => t.filter(x => x !== tag))}>
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                        <input
                                            type="text"
                                            value={tagInput}
                                            onChange={e => setTagInput(e.target.value)}
                                            onKeyDown={handleTagKeyDown}
                                            placeholder={tags.length === 0 ? "Ketik tag, tekan Enter..." : ""}
                                            className="flex-1 min-w-[120px] bg-transparent text-xs text-slate-300 placeholder-slate-600 outline-none"
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-600 mt-1">Pisahkan dengan Enter atau koma</p>
                                </div>
                            </div>
                        )}

                        {/* Facebook Reels toggle */}
                        {hasFacebook && mode === 'video' && (
                            <label className="flex items-center gap-3 p-3 rounded-xl bg-[#1877F2]/10 border border-[#1877F2]/20 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={fbIsReel}
                                    onChange={e => setFbIsReel(e.target.checked)}
                                    className="w-4 h-4 rounded text-violet-500"
                                />
                                <div>
                                    <p className="text-sm font-medium text-slate-200">Post sebagai Facebook Reels</p>
                                    <p className="text-xs text-slate-500">Video vertikal pendek (&lt;90 detik)</p>
                                </div>
                            </label>
                        )}
                    </div>
                </div>

                {/* ── RIGHT: Channels + Actions ── */}
                <div className="space-y-4">
                    {/* Channel selector */}
                    <div
                        className="rounded-2xl border border-white/8 p-5"
                        style={{ background: 'rgba(255,255,255,0.02)' }}
                    >
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Publish To</h3>
                        <PlatformSelector
                            channels={channels}
                            selected={selectedChannels}
                            onChange={setSelectedChannels}
                            mode={mode}
                        />
                    </div>

                    {/* Scheduled at badge */}
                    {scheduledAt && (
                        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-violet-500/10 border border-violet-500/30">
                            <Calendar className="w-4 h-4 text-violet-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-violet-300">Dijadwalkan:</p>
                                <p className="text-xs text-violet-400">{format(scheduledAt, 'dd MMM yyyy, HH:mm', { locale: localeId })}</p>
                            </div>
                            <button onClick={() => setScheduledAt(null)} className="text-slate-500 hover:text-red-400">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Action buttons */}
                    <div
                        className="rounded-2xl border border-white/8 p-5 space-y-3"
                        style={{ background: 'rgba(255,255,255,0.02)' }}
                    >
                        <button
                            onClick={() => handlePublish(true)}
                            disabled={isPublishing || selectedChannels.length === 0}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}
                        >
                            {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            Publish Sekarang
                        </button>

                        <button
                            onClick={() => setShowScheduler(true)}
                            disabled={isPublishing || selectedChannels.length === 0}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm text-slate-300 bg-white/5 hover:bg-white/10 border border-white/8 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Calendar className="w-4 h-4" />
                            {scheduledAt ? 'Ubah Jadwal' : 'Jadwalkan'}
                        </button>

                        {selectedChannels.length === 0 && (
                            <p className="text-xs text-center text-slate-600">Pilih minimal 1 channel</p>
                        )}
                    </div>

                    {/* Tips */}
                    <div className="rounded-2xl border border-white/5 p-4 space-y-2"
                        style={{ background: 'rgba(255,255,255,0.01)' }}>
                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Tips</p>
                        <ul className="space-y-1.5 text-xs text-slate-600">
                            {mode === 'video' && (
                                <>
                                    <li>🎬 YouTube butuh judul &amp; file video</li>
                                    <li>📱 Gunakan video vertikal untuk Reels</li>
                                </>
                            )}
                            {mode === 'thread' && (
                                <li>🧵 Setiap tweet max 280 karakter</li>
                            )}
                            {mode === 'image' && (
                                <li>🖼️ Rasio 1:1 bagus untuk semua platform</li>
                            )}
                            <li>⏰ Schedule posting di jam prime time</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Scheduler Drawer */}
            <SchedulerDrawer
                isOpen={showScheduler}
                onClose={() => setShowScheduler(false)}
                onSchedule={(dt) => {
                    setScheduledAt(dt);
                    handlePublish(false, dt);
                }}
                onPublishNow={() => handlePublish(true)}
                isPublishing={isPublishing}
            />
        </div>
    );
}
