import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const userSession = session as any;
        const userId = userSession.user.id;

        const threads = await prisma.thread.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ success: true, threads });
    } catch (error: any) {
        console.error("Fetch threads error:", error);
        return NextResponse.json({ error: "Failed to fetch threads" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id } = await req.json();
        const userSession = session as any;

        await prisma.thread.deleteMany({
            where: {
                id,
                userId: userSession.user.id
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: "Failed to delete thread" }, { status: 500 });
    }
}
