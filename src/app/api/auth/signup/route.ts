import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { Logger } from '@/lib/logger';

export async function POST(req: Request) {
    console.log("👉 Signup API hit!");
    try {
        const body = await req.json();
        console.log("👉 Body received:", body);
        const { name, email, password } = body;

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json({ error: "User already exists" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const isAdmin = email === process.env.ADMIN_EMAIL;

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: isAdmin ? "ADMIN" : "USER"
            }
        });

        // Log successful signup
        await Logger.success(`New user signed up: ${email}`, { userId: user.id, name: user.name });

        return NextResponse.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
    } catch (error: any) {
        console.error('Signup Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
