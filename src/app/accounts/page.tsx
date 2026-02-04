"use client";

import React, { useState, useEffect } from 'react';
import { useSession, signIn } from "next-auth/react";
import {
    Twitter,
    Facebook,
    Plus,
    Trash2,
    Loader2
} from 'lucide-react';
import axios from 'axios';

export default function AccountsPage() {
    const { data: session, status } = useSession();
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session) {
            fetchAccounts();
        }
    }, [session]);

    const fetchAccounts = async () => {
        try {
            const res = await axios.get('/api/accounts');
            setAccounts(res.data.accounts);
        } catch (error) {
            console.error('Failed to fetch accounts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDisconnect = async (accountId: string) => {
        if (!confirm('Are you sure you want to disconnect this account?')) return;

        try {
            await axios.delete(`/api/accounts?id=${accountId}`);
            setAccounts(accounts.filter(a => a.id !== accountId));
        } catch (error) {
            alert('Failed to disconnect account');
        }
    };

    if (status === "loading" || (session && loading)) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-8 p-6">
            <div>
                <h1 className="text-3xl font-bold mb-2">Social Accounts</h1>
                <p className="text-slate-400">Manage your connected social media profiles</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* X Account Card */}
                <div className="glass border border-white/10 rounded-2xl p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                                <Twitter className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">X (Twitter)</h3>
                                <p className="text-xs text-slate-500">Post threads to X</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {accounts.filter(a => a.provider === 'twitter').map((account) => (
                            <div key={account.id} className="flex items-center justify-between bg-white/5 border border-white/5 rounded-xl px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <img src={account.user.image || `https://ui-avatars.com/api/?name=${account.user.name}`} className="w-8 h-8 rounded-full" />
                                    <span className="font-medium text-slate-200">{account.user.name || account.providerAccountId}</span>
                                </div>
                                <button
                                    onClick={() => handleDisconnect(account.id)}
                                    className="text-slate-500 hover:text-red-400 transition-colors p-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}

                        <button
                            onClick={() => signIn('twitter')}
                            className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 border-dashed rounded-xl py-3 text-slate-400 hover:text-white hover:bg-white/10 transition-all font-medium"
                        >
                            <Plus className="w-4 h-4" />
                            Add X Account
                        </button>
                    </div>
                </div>

                {/* Facebook/IG Card */}
                <div className="glass border border-white/10 rounded-2xl p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center">
                                <Facebook className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Meta Platform</h3>
                                <p className="text-xs text-slate-500">Post to FB & Instagram</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {accounts.filter(a => a.provider === 'facebook').map((account) => (
                            <div key={account.id} className="flex items-center justify-between bg-white/5 border border-white/5 rounded-xl px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <img src={account.user.image || `https://ui-avatars.com/api/?name=${account.user.name}`} className="w-8 h-8 rounded-full" />
                                    <span className="font-medium text-slate-200">{account.user.name || account.providerAccountId}</span>
                                </div>
                                <button
                                    onClick={() => handleDisconnect(account.id)}
                                    className="text-slate-500 hover:text-red-400 transition-colors p-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}

                        <button
                            onClick={() => signIn('facebook')}
                            className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 border-dashed rounded-xl py-3 text-slate-400 hover:text-white hover:bg-white/10 transition-all font-medium"
                        >
                            <Plus className="w-4 h-4" />
                            Connect Meta Business
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
