import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

async function checkAdmin() {
    const session: any = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
        return false;
    }
    return true;
}

export async function GET() {
    try {
        if (!(await checkAdmin())) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const users = await prisma.user.findMany({
            include: {
                _count: {
                    select: {
                        accounts: true,
                        threads: true,
                    }
                }
            },
            orderBy: {
                role: 'asc'
            }
        });

        return NextResponse.json({ users });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        if (!(await checkAdmin())) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { userId, role } = await req.json();

        if (!userId || !role) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        const updated = await prisma.user.update({
            where: { id: userId },
            data: { role },
        });

        return NextResponse.json({ success: true, user: updated });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        if (!(await checkAdmin())) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        await prisma.user.delete({
            where: { id: userId },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
