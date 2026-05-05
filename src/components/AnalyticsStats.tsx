"use client";

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart3, CheckCircle2, XCircle, Clock, Clapperboard, Send } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function AnalyticsStats() {
    const { data: session } = useSession();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session) {
            axios.get('/api/analytics/overview')
                .then(res => setStats(res.data.overview))
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [session]);

    if (!session || loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="glass-card rounded-2xl p-4 animate-pulse h-24" />
                ))}
            </div>
        );
    }

    if (!stats) return null;

    const cards = [
        { label: 'Total Posts', value: stats.totalPosts, icon: Send, color: 'text-violet-400', bg: 'bg-violet-500/10' },
        { label: 'Published', value: stats.publishedPosts, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { label: 'Scheduled', value: stats.scheduledPosts, icon: Clock, color: 'text-orange-400', bg: 'bg-orange-500/10' },
        { label: 'Failed', value: stats.failedPosts, icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
        // { label: 'Clips Ready', value: stats.totalClips, icon: Clapperboard, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {cards.map((card, i) => (
                <div key={i} className="glass-card rounded-2xl p-4 flex items-center gap-4 transition-all hover:-translate-y-0.5">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.bg}`}>
                        <card.icon className={`w-6 h-6 ${card.color}`} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-slate-100">{card.value}</p>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{card.label}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
