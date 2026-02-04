import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const session: any = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { thread, scheduledAt, accountIds } = await req.json();

        if (!thread || !Array.isArray(thread) || thread.length === 0) {
            return NextResponse.json({ error: "Thread content is required" }, { status: 400 });
        }

        if (!scheduledAt) {
            return NextResponse.json({ error: "Schedule date is required" }, { status: 400 });
        }

        if (!accountIds || !Array.isArray(accountIds) || accountIds.length === 0) {
            return NextResponse.json({ error: "At least one account must be selected" }, { status: 400 });
        }

        const newThread = await prisma.thread.create({
            data: {
                content: thread,
                scheduledAt: new Date(scheduledAt),
                status: "SCHEDULED",
                userId: session.user.id,
                platforms: accountIds, // Store selected account IDs
            },
        });

        return NextResponse.json({ success: true, thread: newThread });
    } catch (error: any) {
        console.error('Scheduling Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to schedule thread' }, { status: 500 });
    }
}
