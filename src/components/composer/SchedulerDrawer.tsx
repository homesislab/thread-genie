"use client";

import React, { useState } from 'react';
import { X, Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isBefore, startOfDay, getDay } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

interface SchedulerDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSchedule: (datetime: Date) => void;
    onPublishNow: () => void;
    isPublishing: boolean;
}

export function SchedulerDrawer({ isOpen, onClose, onSchedule, onPublishNow, isPublishing }: SchedulerDrawerProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedHour, setSelectedHour] = useState('10');
    const [selectedMinute, setSelectedMinute] = useState('00');

    const today = startOfDay(new Date());
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDow = getDay(monthStart); // 0=Sun

    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const handleSchedule = () => {
        if (!selectedDate) return;
        const dt = new Date(selectedDate);
        dt.setHours(parseInt(selectedHour), parseInt(selectedMinute), 0, 0);
        onSchedule(dt);
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed right-0 top-0 bottom-0 w-full max-w-sm z-50 flex flex-col"
                style={{
                    background: 'linear-gradient(180deg, rgba(10,12,20,0.98) 0%, rgba(8,10,18,1) 100%)',
                    borderLeft: '1px solid rgba(255,255,255,0.08)',
                    boxShadow: '-24px 0 64px rgba(0,0,0,0.5)',
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/8">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-violet-400" />
                        <h2 className="font-semibold text-slate-100">Schedule Post</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                    >
                        <X className="w-4 h-4 text-slate-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-6">
                    {/* Calendar */}
                    <div>
                        {/* Month nav */}
                        <div className="flex items-center justify-between mb-4">
                            <button
                                onClick={() => setCurrentMonth(m => subMonths(m, 1))}
                                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4 text-slate-400" />
                            </button>
                            <span className="text-sm font-semibold text-slate-200">
                                {format(currentMonth, 'MMMM yyyy', { locale: localeId })}
                            </span>
                            <button
                                onClick={() => setCurrentMonth(m => addMonths(m, 1))}
                                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                            >
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                            </button>
                        </div>

                        {/* Day headers */}
                        <div className="grid grid-cols-7 mb-2">
                            {DAYS.map(d => (
                                <div key={d} className="text-center text-[10px] font-semibold text-slate-600 py-1">{d}</div>
                            ))}
                        </div>

                        {/* Days grid */}
                        <div className="grid grid-cols-7 gap-1">
                            {/* Leading empty cells */}
                            {Array.from({ length: startDow }).map((_, i) => (
                                <div key={`empty-${i}`} />
                            ))}

                            {daysInMonth.map(day => {
                                const isPast = isBefore(day, today);
                                const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                                const isToday = isSameDay(day, today);

                                return (
                                    <button
                                        key={day.toISOString()}
                                        onClick={() => !isPast && setSelectedDate(day)}
                                        disabled={isPast}
                                        className={`
                                            aspect-square rounded-xl text-xs font-medium transition-all duration-150 flex items-center justify-center
                                            ${isSelected
                                                ? 'text-white shadow-lg shadow-violet-500/30'
                                                : isToday
                                                    ? 'text-violet-400 border border-violet-500/40 bg-violet-500/10'
                                                    : isPast
                                                        ? 'text-slate-700 cursor-not-allowed'
                                                        : 'text-slate-400 hover:bg-white/8 hover:text-white'
                                            }
                                        `}
                                        style={isSelected ? {
                                            background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                                        } : {}}
                                    >
                                        {format(day, 'd')}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Time picker */}
                    {selectedDate && (
                        <div className="p-4 rounded-2xl border border-white/8 bg-white/[0.02] space-y-3">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-violet-400" />
                                <span className="text-sm font-medium text-slate-200">Waktu</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <select
                                    value={selectedHour}
                                    onChange={e => setSelectedHour(e.target.value)}
                                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-violet-500"
                                >
                                    {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')).map(h => (
                                        <option key={h} value={h}>{h}:00</option>
                                    ))}
                                </select>
                                <span className="text-slate-500 font-bold">:</span>
                                <select
                                    value={selectedMinute}
                                    onChange={e => setSelectedMinute(e.target.value)}
                                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-violet-500"
                                >
                                    {['00', '15', '30', '45'].map(m => (
                                        <option key={m} value={m}>:{m}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="text-xs text-slate-500 text-center">
                                📅 {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: localeId })} pukul {selectedHour}:{selectedMinute}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer actions */}
                <div className="p-5 border-t border-white/8 space-y-3">
                    <button
                        onClick={handleSchedule}
                        disabled={!selectedDate || isPublishing}
                        className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}
                    >
                        <Calendar className="w-4 h-4" />
                        {selectedDate
                            ? `Schedule — ${format(selectedDate, 'd MMM', { locale: localeId })} ${selectedHour}:${selectedMinute}`
                            : 'Pilih tanggal dulu'
                        }
                    </button>
                    <button
                        onClick={onPublishNow}
                        disabled={isPublishing}
                        className="w-full py-2.5 rounded-xl text-sm text-slate-300 bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-40"
                    >
                        {isPublishing ? 'Publishing...' : 'Publish Sekarang'}
                    </button>
                </div>
            </div>
        </>
    );
}
