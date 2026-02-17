"use client";

import React, { useState, useEffect } from 'react';
import {
    ScrollText,
    Trash2,
    MessageSquare,
    Loader2,
    ArrowRight,
    Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export default function ThreadsPage() {
    const { data: session } = useSession();
    const [threads, setThreads] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (session) {
            fetchThreads();
        }
    }, [session]);

    const fetchThreads = async () => {
        setIsLoading(true);
        try {
            const res = await axios.get('/api/threads');
            setThreads(res.data.threads || []);
        } catch (error) {
            console.error('Failed to fetch threads:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this thread?')) return;

        try {
            await axios.delete('/api/threads', { data: { id } });
            setThreads(threads.filter(t => t.id !== id));
        } catch (error) {
            console.error('Failed to delete thread:', error);
            alert('Failed to delete thread');
        }
    };

    const filteredThreads = threads.filter(t => {
        try {
            const tweets = JSON.parse(t.content);
            const searchText = tweets.map((tw: any) => typeof tw === 'string' ? tw : tw.text).join(' ').toLowerCase();
            return searchText.includes(searchTerm.toLowerCase());
        } catch (e) {
            return t.content.toLowerCase().includes(searchTerm.toLowerCase());
        }
    });

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                        <ScrollText className="text-blue-500" />
                        My <span className="text-gradient">Threads</span>
                    </h1>
                    <p className="text-slate-400">Manage and reuse your generated thread drafts.</p>
                </div>

                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search threads..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-full md:w-64 transition-all"
                    />
                </div>
            </header>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-40 space-y-4 text-slate-500">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                    <p className="text-lg">Loading your history...</p>
                </div>
            ) : filteredThreads.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-40 space-y-6 text-center glass-card rounded-3xl border-dashed border-white/5">
                    <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                        <MessageSquare className="w-10 h-10 text-slate-600" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-white">No threads found</h3>
                        <p className="text-slate-400 max-w-xs mx-auto">Start generating to see your history appear here.</p>
                    </div>
                    <Link
                        href="/"
                        className="text-blue-400 font-medium hover:text-blue-300 transition-colors"
                    >
                        Create new thread →
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredThreads.map((thread, index) => {
                            const tweets = JSON.parse(thread.content);
                            const firstTweet = tweets[0];
                            const preview = typeof firstTweet === 'string' ? firstTweet : (firstTweet?.text || "Empty thread");

                            return (
                                <motion.div
                                    key={thread.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="group relative flex flex-col glass-card border border-white/10 rounded-3xl overflow-hidden hover:border-blue-500/30 transition-all p-6 space-y-4 shadow-xl"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${thread.status === 'UPLOADED' || thread.status === 'POSTED'
                                                ? 'bg-green-500/20 text-green-400'
                                                : thread.status === 'SCHEDULED'
                                                    ? 'bg-purple-500/20 text-purple-400'
                                                    : 'bg-slate-500/20 text-slate-400'
                                                }`}>
                                                {thread.status}
                                            </div>
                                            <span className="text-[10px] text-slate-500 font-medium">
                                                {new Date(thread.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <button
                                            onClick={(e) => handleDelete(thread.id, e)}
                                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <div className="flex-1 space-y-2 min-h-[100px]">
                                        <p className="text-sm text-slate-200 line-clamp-4 italic leading-relaxed">
                                            "{preview}"
                                        </p>
                                        {tweets.length > 1 && (
                                            <p className="text-[10px] text-blue-500 font-bold">
                                                +{tweets.length - 1} more tweets
                                            </p>
                                        )}
                                    </div>

                                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                        {thread.imageUrl && (
                                            <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10">
                                                <img src={thread.imageUrl} alt="" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                        <Link
                                            href={`/threads/${thread.id}`}
                                            className="flex items-center gap-2 text-xs font-bold text-white hover:text-blue-400 transition-colors ml-auto group/btn"
                                        >
                                            View Details
                                            <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                        </Link>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
