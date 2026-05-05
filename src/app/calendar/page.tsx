"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import {
    ChevronLeft, ChevronRight, Plus, Loader2,
    Video, Image as ImageIcon, Type, CheckCircle2,
    Clock, XCircle, CalendarDays, Twitter, Facebook, Youtube,
    Instagram, Linkedin
} from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval,
    isSameDay, getDay, isSameMonth, isToday, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import Link from 'next/link';

const PLATFORM_COLORS: Record<string, string> = {
    twitter:   'bg-slate-800 text-slate-200 border-slate-600',
    facebook:  'bg-blue-900/60 text-blue-200 border-blue-700',
    youtube:   'bg-red-900/60 text-red-200 border-red-700',
    instagram: 'bg-pink-900/60 text-pink-200 border-pink-700',
    linkedin:  'bg-sky-900/60 text-sky-200 border-sky-700',
    tiktok:    'bg-slate-900 text-white border-slate-600',
};

const STATUS_DOT: Record<string, string> = {
    SCHEDULED:  'bg-violet-400',
    PUBLISHED:  'bg-emerald-400',
    PARTIAL:    'bg-orange-400',
    FAILED:     'bg-red-400',
    DRAFT:      'bg-slate-500',
    PUBLISHING: 'bg-yellow-400 animate-pulse',
};

const MEDIA_ICONS: Record<string, React.ElementType> = {
    video: Video,
    image: ImageIcon,
    text:  Type,
};

function PlatformBadge({ platform }: { platform: string }) {
    const cls = PLATFORM_COLORS[platform] || 'bg-slate-700 text-slate-300 border-slate-600';
    const ICONS: Record<string, React.ElementType> = {
        twitter: Twitter, facebook: Facebook, youtube: Youtube,
        instagram: Instagram, linkedin: Linkedin,
    };
    const Icon = ICONS[platform];
    return (
        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md border text-[10px] font-medium ${cls}`}>
            {Icon && <Icon className="w-2.5 h-2.5" />}
            {platform}
        </span>
    );
}

interface CalendarEvent {
    id: string;
    title: string;
    date: string;
    status: string;
    mediaType?: string;
    platforms: string[];
    body?: string;
}

interface EventDetailModal {
    event: CalendarEvent;
}

function EventDetailModal({ event, onClose }: EventDetailModal & { onClose: () => void }) {
    const MediaIcon = MEDIA_ICONS[event.mediaType || 'text'] || Type;
    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={onClose} />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
                style={{
                    background: 'linear-gradient(135deg, rgba(12,14,24,0.98) 0%, rgba(8,10,18,1) 100%)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '1.25rem',
                    boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
                    padding: '1.5rem',
                }}
            >
                {/* Status */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[event.status] || 'bg-slate-500'}`} />
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{event.status}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <MediaIcon className="w-3.5 h-3.5" />
                        {event.mediaType || 'text'}
                    </div>
                </div>

                {/* Title / body */}
                <h3 className="text-base font-semibold text-slate-100 mb-1 leading-snug">{event.title}</h3>
                {event.body && (
                    <p className="text-sm text-slate-400 mb-4 line-clamp-3">{event.body}</p>
                )}

                {/* Date */}
                <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
                    <CalendarDays className="w-4 h-4 text-violet-400" />
                    {format(parseISO(event.date), "EEEE, d MMMM yyyy • HH:mm", { locale: localeId })}
                </div>

                {/* Platforms */}
                {event.platforms.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-5">
                        {event.platforms.map(p => <PlatformBadge key={p} platform={p} />)}
                    </div>
                )}

                <div className="flex gap-3">
                    <Link
                        href="/posts"
                        className="flex-1 text-center py-2.5 rounded-xl text-sm font-medium text-slate-300 bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        Lihat Detail
                    </Link>
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 transition-colors"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </>
    );
}

export default function CalendarPage() {
    const { data: session, status } = useSession();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

    const fetchEvents = useCallback(async (month: Date) => {
        if (!session) return;
        setLoading(true);
        try {
            const monthStr = format(month, 'yyyy-MM');
            const res = await axios.get(`/api/calendar?month=${monthStr}`);
            setEvents(res.data.events || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [session]);

    useEffect(() => { fetchEvents(currentMonth); }, [currentMonth, fetchEvents]);

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDow = getDay(monthStart);
    const DAYS_FULL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const getEventsForDay = (day: Date) =>
        events.filter(e => e.date && isSameDay(parseISO(e.date), day));

    if (status === 'loading') {
        return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 text-violet-500 animate-spin" /></div>;
    }

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">Content Calendar</h1>
                    <p className="text-slate-500 text-sm mt-1">Kelola dan lihat jadwal posting kamu</p>
                </div>
                <Link
                    href="/composer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}
                >
                    <Plus className="w-4 h-4" />
                    Buat Post
                </Link>
            </div>

            {/* Calendar */}
            <div className="rounded-2xl border border-white/8 overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.02)' }}>
                {/* Month navigation */}
                <div className="flex items-center justify-between p-5 border-b border-white/8">
                    <button
                        onClick={() => setCurrentMonth(m => subMonths(m, 1))}
                        className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4 text-slate-400" />
                    </button>
                    <div className="text-center">
                        <h2 className="text-lg font-bold text-slate-100">
                            {format(currentMonth, 'MMMM yyyy', { locale: localeId })}
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">{events.length} post bulan ini</p>
                    </div>
                    <button
                        onClick={() => setCurrentMonth(m => addMonths(m, 1))}
                        className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                    >
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 border-b border-white/5">
                    {DAYS_FULL.map(d => (
                        <div key={d} className="py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Days grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-7">
                        {/* Leading empty cells */}
                        {Array.from({ length: startDow }).map((_, i) => (
                            <div key={`empty-${i}`} className="min-h-[110px] border-r border-b border-white/5 bg-black/10" />
                        ))}

                        {daysInMonth.map((day, idx) => {
                            const dayEvents = getEventsForDay(day);
                            const isCurrentDay = isToday(day);
                            const isLastCol = (startDow + idx + 1) % 7 === 0;

                            return (
                                <div
                                    key={day.toISOString()}
                                    className={`min-h-[110px] border-b border-white/5 p-2 transition-colors relative
                                        ${!isLastCol ? 'border-r border-white/5' : ''}
                                        ${isCurrentDay ? 'bg-violet-500/5' : 'hover:bg-white/[0.015]'}
                                    `}
                                >
                                    {/* Day number */}
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold mb-1 ${
                                        isCurrentDay
                                            ? 'text-white shadow-lg shadow-violet-500/30'
                                            : 'text-slate-500'
                                    }`}
                                        style={isCurrentDay ? { background: 'linear-gradient(135deg, #7c3aed, #ec4899)' } : {}}
                                    >
                                        {format(day, 'd')}
                                    </div>

                                    {/* Events */}
                                    <div className="space-y-1">
                                        {dayEvents.slice(0, 3).map(event => {
                                            const MediaIcon = MEDIA_ICONS[event.mediaType || 'text'] || Type;
                                            return (
                                                <button
                                                    key={event.id}
                                                    onClick={() => setSelectedEvent(event)}
                                                    className="w-full text-left px-2 py-1 rounded-lg text-[10px] font-medium truncate flex items-center gap-1 transition-all hover:opacity-80"
                                                    style={{
                                                        background: event.status === 'SCHEDULED'
                                                            ? 'rgba(124,58,237,0.25)'
                                                            : event.status === 'PUBLISHED'
                                                                ? 'rgba(16,185,129,0.20)'
                                                                : event.status === 'FAILED'
                                                                    ? 'rgba(239,68,68,0.20)'
                                                                    : 'rgba(100,116,139,0.15)',
                                                        border: `1px solid ${
                                                            event.status === 'SCHEDULED' ? 'rgba(124,58,237,0.3)'
                                                            : event.status === 'PUBLISHED' ? 'rgba(16,185,129,0.25)'
                                                            : event.status === 'FAILED' ? 'rgba(239,68,68,0.25)'
                                                            : 'rgba(100,116,139,0.2)'
                                                        }`,
                                                        color: event.status === 'SCHEDULED' ? '#c4b5fd'
                                                            : event.status === 'PUBLISHED' ? '#6ee7b7'
                                                            : event.status === 'FAILED' ? '#fca5a5'
                                                            : '#94a3b8',
                                                    }}
                                                >
                                                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[event.status] || 'bg-slate-500'}`} />
                                                    <MediaIcon className="w-2.5 h-2.5 flex-shrink-0" />
                                                    <span className="truncate">{event.title}</span>
                                                </button>
                                            );
                                        })}
                                        {dayEvents.length > 3 && (
                                            <p className="text-[10px] text-slate-600 px-2">+{dayEvents.length - 3} lainnya</p>
                                        )}
                                    </div>

                                    {/* Quick add button on hover */}
                                    <Link
                                        href={`/composer`}
                                        className="absolute bottom-1 right-1 w-5 h-5 rounded-md bg-white/0 hover:bg-violet-500/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-all group-hover:opacity-100"
                                    >
                                        <Plus className="w-3 h-3 text-violet-400" />
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                {[
                    { label: 'Scheduled', dot: 'bg-violet-400' },
                    { label: 'Published', dot: 'bg-emerald-400' },
                    { label: 'Partial', dot: 'bg-orange-400' },
                    { label: 'Failed', dot: 'bg-red-400' },
                ].map(item => (
                    <div key={item.label} className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${item.dot}`} />
                        {item.label}
                    </div>
                ))}
            </div>

            {/* Event detail modal */}
            {selectedEvent && (
                <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
            )}
        </div>
    );
}
