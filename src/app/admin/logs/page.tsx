"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import {
    Shield,
    Search,
    Loader2,
    FileText,
    AlertTriangle,
    Info,
    CheckCircle,
    XCircle,
    RotateCw,
    Trash2
} from 'lucide-react';
import axios from 'axios';
import { redirect } from 'next/navigation';

const LogIcon = ({ level }: { level: string }) => {
    switch (level) {
        case 'INFO': return <Info className="w-4 h-4 text-blue-400" />;
        case 'WARN': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
        case 'ERROR': return <XCircle className="w-4 h-4 text-red-400" />;
        case 'SUCCESS': return <CheckCircle className="w-4 h-4 text-green-400" />;
        default: return <FileText className="w-4 h-4 text-slate-400" />;
    }
};

const LogLevelBadge = ({ level }: { level: string }) => {
    let colorClass = "";
    switch (level) {
        case 'INFO': colorClass = "bg-blue-500/10 text-blue-400 border-blue-500/20"; break;
        case 'WARN': colorClass = "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"; break;
        case 'ERROR': colorClass = "bg-red-500/10 text-red-400 border-red-500/20"; break;
        case 'SUCCESS': colorClass = "bg-green-500/10 text-green-400 border-green-500/20"; break;
        default: colorClass = "bg-slate-500/10 text-slate-400 border-slate-500/20"; break;
    }

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
            {level}
        </span>
    );
};

export default function AdminLogsPage() {
    const { data: session, status } = useSession();
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

    const toggleLog = (id: string) => {
        const newExpanded = new Set(expandedLogs);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedLogs(newExpanded);
    };

    useEffect(() => {
        if (status === "unauthenticated") redirect('/login');
        if (session && (session as any).user.role !== 'ADMIN') {
            redirect('/');
        }
    }, [session, status]);

    useEffect(() => {
        if (session) {
            fetchLogs();
        }
    }, [session]);

    const fetchLogs = async () => {
        try {
            setRefreshing(true);
            const res = await axios.get('/api/admin/logs');
            setLogs(res.data.logs);
        } catch (error) {
            console.error('Failed to fetch logs:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const filteredLogs = logs.filter(log =>
        log.message?.toLowerCase().includes(search.toLowerCase()) ||
        log.level?.toLowerCase().includes(search.toLowerCase()) ||
        log.user?.email?.toLowerCase().includes(search.toLowerCase())
    );

    if (status === "loading" || loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto space-y-8 p-6 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">System Logs</h1>
                    <p className="text-slate-400">View application events and errors</p>
                </div>
                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search logs..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:ring-1 focus:ring-violet-500 outline-none text-sm w-64"
                        />
                    </div>
                    <button
                        onClick={fetchLogs}
                        disabled={refreshing}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                        <RotateCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            <div className="glass border border-white/10 rounded-3xl overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/5">
                            <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Level</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Message</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">User</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Time</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredLogs.map((log) => (
                            <tr key={log.id}
                                className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                                onClick={() => toggleLog(log.id)}
                            >
                                <td className="px-6 py-4 whitespace-nowrap align-top">
                                    <LogLevelBadge level={log.level} />
                                </td>
                                <td className="px-6 py-4">
                                    <div className={`text-sm text-slate-300 font-mono break-all ${expandedLogs.has(log.id) ? '' : 'line-clamp-2'}`} title={log.message}>
                                        {log.message}
                                    </div>
                                    {log.details && (
                                        <div className={`text-xs text-slate-500 mt-1 font-mono ${expandedLogs.has(log.id) ? 'bg-black/20 p-3 rounded-lg mt-2 overflow-x-auto whitespace-pre' : 'truncate max-w-md'}`}>
                                            {expandedLogs.has(log.id)
                                                ? JSON.stringify(log.details, null, 2)
                                                : JSON.stringify(log.details)}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                    {log.user ? (
                                        <div className="flex flex-col">
                                            <span className="text-slate-300">{log.user.name}</span>
                                            <span className="text-xs text-slate-500">{log.user.email}</span>
                                        </div>
                                    ) : (
                                        <span className="text-slate-600 italic">System</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-right">
                                    {new Date(log.createdAt).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredLogs.length === 0 && (
                    <div className="p-20 text-center space-y-3">
                        <FileText className="w-12 h-12 text-slate-600 mx-auto" />
                        <p className="text-slate-500">No logs found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
