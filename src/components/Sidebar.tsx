"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
    LayoutDashboard,
    CalendarDays,
    BarChart3,
    Settings,
    Shield,
    LogOut,
    ScrollText,
    Image as ImageIcon,
    Zap,
    BookOpen,
    Clapperboard,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const Sidebar = () => {
    const pathname = usePathname();
    const { data: session } = useSession();
    const userRole = (session?.user as any)?.role || 'USER';
    const userName = (session?.user as any)?.name || 'User';
    const userEmail = (session?.user as any)?.email || '';

    const navGroups = [
        {
            label: 'Workspace',
            items: [
                { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
                { icon: Zap, label: 'Compose', href: '/composer' },
                { icon: ScrollText, label: 'Posts', href: '/posts' },
                { icon: CalendarDays, label: 'Calendar', href: '/calendar' },
            ]
        },
        {
            label: 'Media',
            items: [
                { icon: ImageIcon, label: 'Gallery', href: '/gallery' },
                { icon: Clapperboard, label: 'Clip Library', href: '/clip-library' },
            ]
        },
        {
            label: 'Accounts',
            items: [
                { icon: BarChart3, label: 'Channels', href: '/accounts' },
                { icon: Settings, label: 'Settings', href: '/settings' },
            ]
        },
    ];

    if (userRole === 'ADMIN') {
        navGroups.push({
            label: 'Admin',
            items: [
                { icon: Shield, label: 'Users', href: '/admin/users' },
                { icon: BookOpen, label: 'System Logs', href: '/admin/logs' },
            ]
        });
    }

    return (
        <aside className="fixed left-0 top-0 bottom-0 w-60 hidden md:flex flex-col"
            style={{
                background: 'linear-gradient(180deg, rgba(8, 10, 16, 0.95) 0%, rgba(5, 7, 12, 0.98) 100%)',
                backdropFilter: 'blur(24px)',
                borderRight: '1px solid rgba(255,255,255,0.06)',
            }}>

            {/* Logo */}
            <div className="px-5 pt-7 pb-6">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center pulse-glow"
                        style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}>
                        <Zap className="w-4 h-4 text-white" fill="white" />
                    </div>
                    <span className="font-bold text-base tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        Thread<span className="text-gradient">Genie</span>
                    </span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-5 overflow-y-auto pb-4">
                {navGroups.map((group) => (
                    <div key={group.label}>
                        <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                            {group.label}
                        </p>
                        <div className="space-y-0.5">
                            {group.items.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                                            isActive
                                                ? "nav-active text-violet-300"
                                                : "text-slate-500 hover:text-slate-200 hover:bg-white/5"
                                        )}
                                    >
                                        {isActive && (
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                                                style={{ background: 'linear-gradient(to bottom, #a78bfa, #7c3aed)' }} />
                                        )}
                                        <item.icon className={cn(
                                            "w-4 h-4 transition-colors flex-shrink-0",
                                            isActive ? "text-violet-400" : "group-hover:text-slate-200"
                                        )} />
                                        <span className="text-sm font-medium">{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* User Profile + Sign Out */}
            <div className="px-3 pb-5 space-y-2">
                <div className="flex items-center gap-3 px-3 py-3 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)' }}>
                        {userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-200 truncate">{userName}</p>
                        <p className="text-[10px] text-slate-600 truncate">{userEmail}</p>
                    </div>
                </div>
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-400/5 transition-all group"
                >
                    <LogOut className="w-4 h-4 group-hover:text-red-400" />
                    <span className="text-sm font-medium">Sign Out</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
