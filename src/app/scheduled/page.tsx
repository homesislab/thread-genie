"use client";

import React, { useEffect, useState } from 'react';
import {
    Calendar,
    Clock,
    Trash2,
    ExternalLink,
    CheckCircle2,
    AlertCircle,
    MessageSquare,
    Loader2,
    ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface Thread {
    id: string;
    content: string[];
    status: 'DRAFT' | 'SCHEDULED' | 'POSTED' | 'FAILED';
    scheduledAt: string | null;
    createdAt: string;
}

export default function ScheduledPage() {
    const { data: session } = useSession();
    const [threads, setThreads] = useState<Thread[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const fetchThreads = async () => {
        try {
            const response = await axios.get('/api/threads');
            // Filter out DRAFT threads for the scheduled page
            const filtered = response.data.threads.filter((t: any) => t.status !== 'DRAFT');
            setThreads(filtered);
        } catch (error) {
            console.error("Failed to fetch threads:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (session) {
            fetchThreads();
        }
    }, [session]);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this thread?")) return;
        setIsDeleting(id);
        try {
            await axios.delete('/api/threads', { data: { id } });
            setThreads(threads.filter(t => t.id !== id));
        } catch (error) {
            console.error("Failed to delete thread:", error);
            alert("Failed to delete thread.");
        } finally {
            setIsDeleting(null);
        }
    };

    const statusConfig = {
        SCHEDULED: { icon: Clock, color: "text-amber-400", bg: "bg-amber-400/10", label: "Scheduled" },
        POSTED: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-400/10", label: "Posted" },
        DRAFT: { icon: AlertCircle, color: "text-slate-400", bg: "bg-slate-400/10", label: "Draft" },
        FAILED: { icon: AlertCircle, color: "text-rose-400", bg: "bg-rose-400/10", label: "Failed" },
    };

    if (!session) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] text-slate-400">
                Please connect your X account to view your scheduled threads.
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <header className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-white">Scheduled <span className="text-gradient">Threads</span></h1>
                    <p className="text-slate-400">Manage your upcoming posts and publication history.</p>
                </div>
            </header>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4 text-slate-500">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p>Loading your threads...</p>
                </div>
            ) : threads.length === 0 ? (
                <div className="glass-card p-12 rounded-3xl border border-dashed border-white/5 flex flex-col items-center justify-center space-y-4 text-slate-500">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
                        <Calendar className="w-8 h-8" />
                    </div>
                    <p className="text-center max-w-xs">No threads found. Start by creating your first thread on the dashboard!</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    <AnimatePresence mode="popLayout">
                        {threads.map((thread) => {
                            const config = statusConfig[thread.status] || statusConfig.DRAFT;
                            return (
                                <motion.div
                                    key={thread.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="glass-card p-6 rounded-2xl group border border-white/5 hover:border-violet-500/20 transition-all duration-300"
                                >
                                    <div className="flex items-start justify-between gap-6">
                                        <div className="flex gap-4 flex-1">
                                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", config.bg)}>
                                                <config.icon className={cn("w-6 h-6", config.color)} />
                                            </div>

                                            <div className="space-y-3 flex-1 min-w-0">
                                                <div className="flex items-center gap-3">
                                                    <span className={cn("text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full", config.bg, config.color)}>
                                                        {config.label}
                                                    </span>
                                                    <span className="text-xs text-slate-500">
                                                        {thread.scheduledAt
                                                            ? `Scheduled for ${new Date(thread.scheduledAt).toLocaleString()}`
                                                            : `Created ${new Date(thread.createdAt).toLocaleDateString()}`
                                                        }
                                                    </span>
                                                </div>

                                                <p className="text-sm text-slate-300 line-clamp-2 leading-relaxed">
                                                    {(() => {
                                                        try {
                                                            const content = JSON.parse(thread.content as any);
                                                            const first = content[0];
                                                            return typeof first === 'string' ? first : (first?.text || "Empty thread");
                                                        } catch (e) {
                                                            return Array.isArray(thread.content) ? thread.content[0] : "Empty thread";
                                                        }
                                                    })()}
                                                </p>

                                                <div className="flex items-center gap-4 text-xs text-slate-500">
                                                    <span className="flex items-center gap-1">
                                                        <MessageSquare className="w-3 h-3" />
                                                        {(() => {
                                                            try {
                                                                return JSON.parse(thread.content as any).length;
                                                            } catch (e) {
                                                                return Array.isArray(thread.content) ? thread.content.length : 0;
                                                            }
                                                        })()} Tweets
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleDelete(thread.id)}
                                                disabled={isDeleting === thread.id}
                                                className="p-2.5 rounded-xl hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 transition-all"
                                            >
                                                {isDeleting === thread.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                            </button>
                                            <button className="p-2.5 rounded-xl hover:bg-white/5 text-slate-500 hover:text-white transition-all">
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
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
