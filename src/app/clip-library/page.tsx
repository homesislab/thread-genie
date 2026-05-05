"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import {
    Clapperboard, Loader2, Play, Calendar, CheckCircle2,
    Clock, Send, Trash2, Search, Filter, Upload, ChevronDown,
    ExternalLink, Video, X, AlertCircle, Plus
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
    READY:     { label: 'Ready', dot: 'bg-emerald-400', badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25' },
    SCHEDULED: { label: 'Scheduled', dot: 'bg-violet-400', badge: 'bg-violet-500/15 text-violet-300 border-violet-500/25' },
    POSTED:    { label: 'Posted', dot: 'bg-slate-500', badge: 'bg-slate-500/15 text-slate-400 border-slate-500/25' },
};

function formatDuration(sec?: number | null) {
    if (!sec) return '--';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
}

function formatBytes(bytes?: number | null) {
    if (!bytes) return '--';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

interface Clip {
    id: string;
    title: string;
    videoUrl: string;
    thumbnailUrl?: string;
    durationSec?: number;
    fileSize?: number;
    sourceProject?: string;
    clipIndex?: number;
    status: string;
    createdAt: string;
}

function ClipCard({ clip, onSchedule, onDelete }: {
    clip: Clip;
    onSchedule: (clip: Clip) => void;
    onDelete: (id: string) => void;
}) {
    const [showVideo, setShowVideo] = useState(false);
    const statusCfg = STATUS_CONFIG[clip.status] || STATUS_CONFIG.READY;

    return (
        <div className="rounded-2xl border border-white/8 overflow-hidden group transition-all duration-200 hover:border-white/15"
            style={{ background: 'rgba(255,255,255,0.02)' }}>
            {/* Thumbnail / Preview */}
            <div className="relative aspect-video bg-black/60 overflow-hidden">
                {showVideo ? (
                    <video src={clip.videoUrl} controls autoPlay className="w-full h-full object-contain" />
                ) : clip.thumbnailUrl ? (
                    <img src={clip.thumbnailUrl} alt={clip.title} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Video className="w-12 h-12 text-slate-700" />
                    </div>
                )}

                {/* Play overlay */}
                {!showVideo && (
                    <button
                        onClick={() => setShowVideo(true)}
                        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                            <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
                        </div>
                    </button>
                )}

                {/* Duration badge */}
                {clip.durationSec && (
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-medium backdrop-blur-sm">
                        {formatDuration(clip.durationSec)}
                    </div>
                )}

                {/* Status badge */}
                <div className={`absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold backdrop-blur-sm ${statusCfg.badge}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                    {statusCfg.label}
                </div>
            </div>

            {/* Info */}
            <div className="p-4 space-y-3">
                <div>
                    <h3 className="text-sm font-semibold text-slate-100 leading-snug line-clamp-2">{clip.title}</h3>
                    {clip.sourceProject && (
                        <p className="text-xs text-slate-600 mt-0.5">
                            📁 {clip.sourceProject}{clip.clipIndex !== undefined ? ` · Clip #${clip.clipIndex + 1}` : ''}
                        </p>
                    )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-600">
                    <span>{formatBytes(clip.fileSize)}</span>
                    <span>{format(new Date(clip.createdAt), 'd MMM yyyy', { locale: localeId })}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    <button
                        onClick={() => onSchedule(clip)}
                        disabled={clip.status === 'POSTED'}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-40"
                        style={clip.status !== 'POSTED' ? {
                            background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                            color: 'white',
                        } : { background: 'rgba(255,255,255,0.05)', color: '#64748b' }}
                    >
                        <Calendar className="w-3.5 h-3.5" />
                        {clip.status === 'POSTED' ? 'Posted' : 'Schedule'}
                    </button>
                    <a
                        href={clip.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </a>
                    <button
                        onClick={() => onDelete(clip.id)}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-slate-500 transition-colors"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

function EmptyState({ filter }: { filter: string }) {
    return (
        <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-3xl bg-white/[0.03] border border-white/8 flex items-center justify-center mb-4">
                <Clapperboard className="w-9 h-9 text-slate-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-300 mb-2">
                {filter === 'all' ? 'Belum ada clip' : `Tidak ada clip dengan status "${filter}"`}
            </h3>
            <p className="text-sm text-slate-600 max-w-sm mb-6">
                {filter === 'all'
                    ? 'Clip dari project Clipper akan muncul di sini. Kirim webhook dari Clipper untuk memulai.'
                    : 'Coba filter status lain.'
                }
            </p>
            <div className="px-5 py-3 rounded-xl text-xs text-slate-500 border border-white/8 bg-white/[0.02] font-mono">
                POST /api/clipper/webhook
            </div>
            <p className="text-xs text-slate-700 mt-2">Endpoint untuk integrasi dengan Clipper</p>
        </div>
    );
}

export default function ClipLibraryPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [clips, setClips] = useState<Clip[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [deleting, setDeleting] = useState<string | null>(null);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

    const showToast = (type: 'success' | 'error', msg: string) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchClips = useCallback(async () => {
        if (!session) return;
        setLoading(true);
        try {
            const params = filter !== 'all' ? `?status=${filter}` : '';
            const res = await axios.get(`/api/clipper/clips${params}`);
            setClips(res.data.clips || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [session, filter]);

    useEffect(() => { fetchClips(); }, [fetchClips]);

    const handleSchedule = (clip: Clip) => {
        // Navigate ke composer dengan clip pre-filled via query params
        router.push(`/composer?clipId=${clip.id}&videoUrl=${encodeURIComponent(clip.videoUrl)}&title=${encodeURIComponent(clip.title)}&mode=video`);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Hapus clip ini?')) return;
        setDeleting(id);
        try {
            await axios.delete(`/api/clipper/clips?id=${id}`);
            setClips(c => c.filter(x => x.id !== id));
            showToast('success', 'Clip berhasil dihapus');
        } catch {
            showToast('error', 'Gagal menghapus clip');
        } finally {
            setDeleting(null);
        }
    };

    const filteredClips = clips.filter(c =>
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        (c.sourceProject?.toLowerCase().includes(search.toLowerCase()))
    );

    if (status === 'loading') {
        return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 text-violet-500 animate-spin" /></div>;
    }

    const FILTERS = [
        { key: 'all', label: 'All' },
        { key: 'READY', label: 'Ready' },
        { key: 'SCHEDULED', label: 'Scheduled' },
        { key: 'POSTED', label: 'Posted' },
    ];

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border text-sm font-medium backdrop-blur-xl ${
                    toast.type === 'success'
                        ? 'bg-emerald-900/80 border-emerald-500/30 text-emerald-200'
                        : 'bg-red-900/80 border-red-500/30 text-red-200'
                }`}>
                    {toast.type === 'success'
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        : <AlertCircle className="w-4 h-4 text-red-400" />
                    }
                    {toast.msg}
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                        <Clapperboard className="w-6 h-6 text-violet-400" />
                        Clip Library
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Video clips dari Clipper siap untuk di-schedule</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-xs text-slate-600 border border-white/8 rounded-xl px-4 py-2.5 font-mono bg-white/[0.02]">
                        Webhook: <span className="text-violet-400">POST /api/clipper/webhook</span>
                    </div>
                </div>
            </div>

            {/* Filters + Search */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Status filter tabs */}
                <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/8">
                    {FILTERS.map(f => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                filter === f.key
                                    ? 'text-white bg-violet-600'
                                    : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            {f.label}
                            {f.key !== 'all' && (
                                <span className="ml-1.5 opacity-60">
                                    {clips.filter(c => c.status === f.key).length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Cari clip..."
                        className="w-full pl-9 pr-4 py-2 bg-white/[0.03] border border-white/8 rounded-xl text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-violet-500 transition-colors"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                            <X className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300" />
                        </button>
                    )}
                </div>

                <span className="text-xs text-slate-600">{filteredClips.length} clip</span>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredClips.length === 0 ? (
                        <EmptyState filter={filter} />
                    ) : (
                        filteredClips.map(clip => (
                            <div key={clip.id} className={deleting === clip.id ? 'opacity-50 pointer-events-none' : ''}>
                                <ClipCard
                                    clip={clip}
                                    onSchedule={handleSchedule}
                                    onDelete={handleDelete}
                                />
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Integration guide */}
            {clips.length === 0 && !loading && (
                <div className="rounded-2xl border border-white/8 p-6"
                    style={{ background: 'rgba(255,255,255,0.01)' }}>
                    <h3 className="text-sm font-semibold text-slate-300 mb-4">🔗 Cara Integrasi dengan Clipper</h3>
                    <div className="space-y-3">
                        <div className="text-xs text-slate-500 font-mono bg-black/40 rounded-xl p-4 border border-white/5 overflow-x-auto whitespace-pre">{`// Dari project Clipper, kirim POST request setelah clip selesai:
fetch('http://localhost:3000/api/clipper/webhook', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-clipper-secret': process.env.CLIPPER_WEBHOOK_SECRET
  },
  body: JSON.stringify({
    userId: 'user-id-dari-thread-genie',
    title: 'Nama Clip',
    videoUrl: 'http://localhost:3000/uploads/videos/clip.mp4',
    thumbnailUrl: 'http://...',   // optional
    durationSec: 30.5,            // optional
    fileSize: 15728640,           // optional, bytes
    sourceProject: 'Project A',  // optional
    clipIndex: 0                  // optional
  })
})`}
                        </div>
                        <p className="text-xs text-slate-600">
                            Tambahkan <code className="bg-white/5 px-1 rounded">CLIPPER_WEBHOOK_SECRET</code> di file .env kedua project untuk keamanan.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
