import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { id, imageUrl, content } = await req.json();
        const userSession = session as any;
        const userId = userSession.user.id;

        const updated = await prisma.thread.update({
            where: { id, userId },
            data: {
                ...(imageUrl && { imageUrl }),
                ...(content && { content })
            }
        });

        return NextResponse.json({ success: true, thread: updated });
    } catch (error: any) {
        console.error("Update thread error:", error);
        return NextResponse.json({ error: "Failed to update thread" }, { status: 500 });
    }
}
