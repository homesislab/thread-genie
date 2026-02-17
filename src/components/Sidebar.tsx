"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
    LayoutDashboard,
    Calendar,
    BarChart3,
    Settings,
    Shield,
    LogOut,
    ScrollText
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

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
        { icon: Calendar, label: 'Scheduled', href: '/scheduled' },
        { icon: BarChart3, label: 'Accounts', href: '/accounts' },
        { icon: Settings, label: 'Settings', href: '/settings' },
    ];

    // Only show admin link if user is ADMIN
    if (userRole === 'ADMIN') {
        navItems.push({ icon: Shield, label: 'Admin', href: '/admin/users' });
        navItems.push({ icon: ScrollText, label: 'System Logs', href: '/admin/logs' });
    }

    return (
        <aside className="fixed left-0 top-0 bottom-0 w-64 glass border-r border-white/10 pt-24 pb-8 px-4 flex flex-col justify-between hidden md:flex">
            <div className="space-y-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-violet-600/10 text-violet-400 border border-violet-500/20"
                                    : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                            )}
                        >
                            <item.icon className={cn(
                                "w-5 h-5 transition-colors",
                                isActive ? "text-violet-400" : "group-hover:text-white"
                            )} />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>

            <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-400/5 transition-all"
            >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Sign Out</span>
            </button>
        </aside>
    );
};

export default Sidebar;
