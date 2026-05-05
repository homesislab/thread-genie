"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import axios from 'axios';
import { Loader2, CheckCircle2, XCircle, Clock, ExternalLink } from 'lucide-react';

export default function PostsPage() {
    const { data: session, status } = useSession();
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session) {
            axios.get('/api/posts').then(res => {
                setPosts(res.data.posts || []);
                setLoading(false);
            }).catch(err => {
                console.error(err);
                setLoading(false);
            });
        }
    }, [session]);

    if (status === 'loading' || loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 text-violet-500 animate-spin" /></div>;

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'PUBLISHED':
            case 'SUCCESS': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
            case 'FAILED': return <XCircle className="w-4 h-4 text-red-400" />;
            case 'PARTIAL': return <Clock className="w-4 h-4 text-orange-400" />;
            default: return <Clock className="w-4 h-4 text-slate-400" />;
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Posts</h1>
                    <p className="text-slate-400 text-sm mt-1">History of your published and scheduled posts</p>
                </div>
                <a href="/composer" className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-medium transition-colors">
                    New Post
                </a>
            </div>

            <div className="space-y-4">
                {posts.length === 0 ? (
                    <div className="glass border border-white/10 rounded-2xl p-12 text-center text-slate-400">
                        No posts found. Start by creating a new post in the Composer.
                    </div>
                ) : (
                    posts.map(post => (
                        <div key={post.id} className="glass border border-white/10 rounded-2xl p-5 space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        {getStatusIcon(post.status)}
                                        <span className="text-xs font-semibold tracking-wider text-slate-300">
                                            {post.status}
                                        </span>
                                        <span className="text-xs text-slate-500">• {new Date(post.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-slate-200 text-sm whitespace-pre-wrap line-clamp-3">
                                        {post.title ? <span className="font-bold block mb-1">{post.title}</span> : null}
                                        {post.body}
                                    </p>
                                </div>
                            </div>

                            {/* Platform Results */}
                            {post.results && post.results.length > 0 && (
                                <div className="pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {post.results.map((res: any) => (
                                        <div key={res.id} className="flex items-center justify-between bg-black/20 rounded-lg p-2.5 text-sm">
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(res.status)}
                                                <span className="truncate max-w-[120px]">{res.channel?.displayName || res.platform}</span>
                                            </div>
                                            {res.status === 'SUCCESS' && res.externalId && res.platform === 'twitter' && (
                                                <a href={`https://x.com/i/web/status/${res.externalId}`} target="_blank" rel="noreferrer" className="text-violet-400 hover:text-violet-300">
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                            )}
                                            {res.status === 'SUCCESS' && res.externalId && res.platform === 'youtube' && (
                                                <a href={`https://youtube.com/watch?v=${res.externalId}`} target="_blank" rel="noreferrer" className="text-violet-400 hover:text-violet-300">
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                            )}
                                            {res.status === 'FAILED' && (
                                                <span className="text-xs text-red-400 truncate max-w-[100px]" title={res.errorMsg}>Error</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
