"use client";

import React from 'react';
import Link from 'next/link';
import { Sparkles, Twitter, LogOut, User } from 'lucide-react';
import { signIn, signOut, useSession } from "next-auth/react";

const Navbar = () => {
    const { data: session } = useSession();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10 px-6 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                        <Sparkles className="text-white w-6 h-6" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white">
                        Thread<span className="text-gradient">Genie</span>
                    </span>
                </Link>

                <div className="flex items-center gap-6">
                    <Link href="/dashboard" className="text-sm font-medium text-slate-300 hover:text-white transition-colors hidden sm:block">
                        Dashboard
                    </Link>

                    {session ? (
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                                {session.user?.image ? (
                                    <img src={session.user.image} alt="User" className="w-5 h-5 rounded-full" />
                                ) : (
                                    <User className="w-4 h-4 text-slate-400" />
                                )}
                                <span className="text-sm font-medium text-white">{session.user?.name}</span>
                            </div>
                            <button
                                onClick={() => signOut()}
                                className="p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-red-400 transition-colors"
                                title="Sign Out"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => signIn('twitter')}
                            className="flex items-center gap-2 px-5 py-2 rounded-full bg-white text-black text-sm font-semibold hover:bg-slate-200 transition-all active:scale-95"
                        >
                            <Twitter className="w-4 h-4 fill-current" />
                            Connect X
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
