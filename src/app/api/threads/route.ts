import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const session: any = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');

        const threads = await prisma.thread.findMany({
            where: {
                userId: session.user.id,
                ...(status ? { status } : {}),
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json({ threads });
    } catch (error: any) {
        console.error('Fetch Threads Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session: any = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await req.json();

        if (!id) {
            return NextResponse.json({ error: "Thread ID is required" }, { status: 400 });
        }

        // Ensure the thread belongs to the user
        const thread = await prisma.thread.findUnique({
            where: { id },
        });

        if (!thread || thread.userId !== session.user.id) {
            return NextResponse.json({ error: "Thread not found or unauthorized" }, { status: 404 });
        }

        await prisma.thread.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Delete Thread Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
