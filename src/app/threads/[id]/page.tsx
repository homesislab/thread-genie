"use client";

import React, { useState, useEffect, use } from 'react';
import {
    ArrowLeft,
    MessageSquare,
    Clock,
    Calendar,
    Share,
    Copy,
    Loader2,
    Sparkles,
    Trash2,
    ImageIcon,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ThreadDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const [thread, setThread] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCopying, setIsCopying] = useState(false);

    // Gallery state
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [galleryImages, setGalleryImages] = useState<any[]>([]);
    const [isFetchingGallery, setIsFetchingGallery] = useState(false);
    const [selectionTarget, setSelectionTarget] = useState<number | 'global' | null>(null);

    useEffect(() => {
        fetchThread();
    }, [resolvedParams.id]);

    const fetchThread = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get('/api/threads');
            const found = res.data.threads.find((t: any) => t.id === resolvedParams.id);
            if (found) {
                setThread(found);
            } else {
                router.push('/threads');
            }
        } catch (error) {
            console.error('Failed to fetch thread:', error);
            router.push('/threads');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchGallery = async () => {
        setIsFetchingGallery(true);
        try {
            const res = await axios.get('/api/gallery');
            setGalleryImages(res.data.images || []);
        } catch (error) {
            console.error('Failed to fetch gallery:', error);
        } finally {
            setIsFetchingGallery(false);
        }
    };

    const handleSelectImage = async (url: string) => {
        try {
            if (typeof selectionTarget === 'number') {
                const tweets = JSON.parse(thread.content);
                // Ensure array item is an object
                if (typeof tweets[selectionTarget] === 'string') {
                    tweets[selectionTarget] = { text: tweets[selectionTarget], imageUrl: url };
                } else {
                    tweets[selectionTarget].imageUrl = url;
                }

                await axios.post('/api/threads/update', {
                    id: thread.id,
                    content: JSON.stringify(tweets)
                });
                setThread({ ...thread, content: JSON.stringify(tweets) });
            } else {
                await axios.post('/api/threads/update', {
                    id: thread.id,
                    imageUrl: url
                });
                setThread({ ...thread, imageUrl: url });
            }
            setIsGalleryOpen(false);
            setSelectionTarget(null);
        } catch (error) {
            alert('Failed to update image');
        }
    };

    const handleOpenGallery = () => {
        setIsGalleryOpen(true);
        fetchGallery();
    };

    const handleCopy = () => {
        if (!thread) return;
        const tweets = JSON.parse(thread.content);
        const fullText = tweets.map((t: any) => typeof t === 'string' ? t : t.text).join('\n\n---\n\n');
        navigator.clipboard.writeText(fullText);
        setIsCopying(true);
        setTimeout(() => setIsCopying(false), 2000);
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this thread?')) return;
        try {
            await axios.delete('/api/threads', { data: { id: thread.id } });
            router.push('/threads');
        } catch (error) {
            alert('Failed to delete thread');
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                <p className="text-slate-400">Loading thread details...</p>
            </div>
        );
    }

    if (!thread) return null;

    const tweets = JSON.parse(thread.content);

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8 pb-20">
            <header className="flex items-center justify-between">
                <Link
                    href="/threads"
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-medium group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    Back to History
                </Link>

                <div className="flex gap-2">
                    <button
                        onClick={handleCopy}
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-white/5"
                        title="Copy All"
                    >
                        {isCopying ? <span className="text-xs font-bold text-green-400">Copied!</span> : <Copy size={20} />}
                    </button>
                    <button
                        onClick={handleDelete}
                        className="p-2.5 rounded-xl bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white transition-all border border-rose-500/20"
                        title="Delete"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <MessageSquare className="text-blue-500" size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Thread Content</h2>
                            <p className="text-sm text-slate-500">{tweets.length} posts generated</p>
                        </div>
                    </div>

                    <div className="space-y-4 relative">
                        {/* Connecting line */}
                        <div className="absolute left-6 top-10 bottom-10 w-0.5 bg-slate-800/30" />

                        {tweets.map((tweet: any, index: number) => {
                            const tweetText = typeof tweet === 'string' ? tweet : tweet.text;
                            const tweetImage = typeof tweet === 'object' ? tweet.imageUrl : null;

                            return (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="glass-card p-6 rounded-2xl border border-white/5 relative z-10 space-y-4"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                                {index + 1}
                                            </span>
                                            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-600">Tweet</span>
                                        </div>
                                    </div>
                                    <p className="text-slate-200 leading-relaxed italic">
                                        "{tweetText}"
                                    </p>

                                    {tweetImage && (
                                        <div className="relative group rounded-xl overflow-hidden border border-white/5 shadow-lg max-w-sm">
                                            <img src={tweetImage} alt="" className="w-full aspect-video object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        const newTweets = [...tweets];
                                                        if (typeof newTweets[index] === 'string') {
                                                            newTweets[index] = { text: newTweets[index], imageUrl: null };
                                                        }
                                                        newTweets[index].imageUrl = null;
                                                        handleSelectImage(''); // Helper to sync (this is a bit hacky, maybe manual update)
                                                        // Actually let's just do a proper update
                                                        axios.post('/api/threads/update', {
                                                            id: thread.id,
                                                            content: JSON.stringify(newTweets)
                                                        }).then(() => setThread({ ...thread, content: JSON.stringify(newTweets) }));
                                                    }}
                                                    className="p-2 rounded-full bg-rose-600 text-white shadow-lg"
                                                >
                                                    <X size={14} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectionTarget(index);
                                                        handleOpenGallery();
                                                    }}
                                                    className="p-2 rounded-full bg-blue-600 text-white shadow-lg"
                                                >
                                                    <ImageIcon size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {!tweetImage && (
                                        <button
                                            onClick={() => {
                                                setSelectionTarget(index);
                                                handleOpenGallery();
                                            }}
                                            className="px-4 py-2 rounded-lg border border-dashed border-white/10 text-slate-500 hover:text-blue-400 hover:border-blue-500/30 transition-all text-[10px] font-bold flex items-center gap-2 w-fit"
                                        >
                                            <ImageIcon size={14} />
                                            ADD IMAGE
                                        </button>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Sidebar / Info */}
                <div className="space-y-6">
                    <section className="glass-card p-6 rounded-3xl border border-white/5 space-y-6">
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Metadata</h3>

                        <div className="space-y-4 text-sm">
                            <div className="flex items-center gap-3">
                                <Clock size={16} className="text-slate-500" />
                                <div>
                                    <p className="text-slate-600 font-medium text-[10px] uppercase">Status</p>
                                    <p className="text-white font-bold">{thread.status}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Calendar size={16} className="text-slate-500" />
                                <div>
                                    <p className="text-slate-600 font-medium text-[10px] uppercase">Created At</p>
                                    <p className="text-white font-bold">{new Date(thread.createdAt).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        {thread.imageUrl ? (
                            <div className="space-y-3 pt-4 border-t border-white/5">
                                <p className="text-[10px] uppercase font-bold text-slate-600">Selected Image</p>
                                <div className="rounded-2xl overflow-hidden border border-white/10 group relative aspect-square">
                                    <img src={thread.imageUrl} alt="" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                                        <Link
                                            href={thread.imageUrl}
                                            target="_blank"
                                            className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs backdrop-blur-sm transition-all"
                                        >
                                            View Full
                                        </Link>
                                        <button
                                            onClick={handleOpenGallery}
                                            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition-all"
                                        >
                                            Change Image
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="pt-4 border-t border-white/5">
                                <button
                                    onClick={handleOpenGallery}
                                    className="w-full py-6 rounded-2xl border-2 border-dashed border-white/5 hover:border-blue-500/30 hover:bg-blue-500/5 text-slate-500 hover:text-blue-400 flex flex-col items-center gap-2 transition-all"
                                >
                                    <ImageIcon size={28} />
                                    <span className="text-xs font-bold font-mono">ADD IMAGE</span>
                                </button>
                            </div>
                        )}
                    </section>

                    <button
                        onClick={() => router.push(`/?id=${thread.id}`)}
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <Sparkles size={18} />
                        Use in Dashboard
                    </button>
                </div>
            </div>

            {/* Gallery Modal */}
            <AnimatePresence>
                {isGalleryOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsGalleryOpen(false)}
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-4xl max-h-[85vh] glass-card rounded-[2.5rem] border border-white/10 overflow-hidden flex flex-col shadow-2xl"
                        >
                            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                <div>
                                    <h3 className="text-2xl font-bold text-white">Select Image</h3>
                                    <p className="text-sm text-slate-400">Choose an image from your gallery for this thread.</p>
                                </div>
                                <button
                                    onClick={() => setIsGalleryOpen(false)}
                                    className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 transition-all border border-white/5"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-8 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 custom-scrollbar">
                                {isFetchingGallery && galleryImages.length === 0 && (
                                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-500">
                                        <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-500" />
                                        <p className="font-medium">Loading your gallery...</p>
                                    </div>
                                )}

                                {galleryImages.length === 0 && !isFetchingGallery && (
                                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-white/5 rounded-3xl">
                                        <ImageIcon size={48} className="mb-4 text-slate-700" />
                                        <p className="font-medium">Gallery is empty</p>
                                        <Link href="/gallery" className="text-blue-500 hover:underline mt-2 text-sm">Upload images first</Link>
                                    </div>
                                )}

                                {galleryImages.map((img) => (
                                    <button
                                        key={img.id}
                                        onClick={() => handleSelectImage(img.url)}
                                        className="relative aspect-square rounded-[1.5rem] overflow-hidden group border border-white/5 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all active:scale-95"
                                    >
                                        <img src={img.url} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                            <span className="px-4 py-2 rounded-full bg-white text-blue-600 text-[10px] font-black uppercase tracking-widest translate-y-2 group-hover:translate-y-0 transition-transform">SELECT</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
