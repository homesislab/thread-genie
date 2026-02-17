const { PrismaClient } = require("@prisma/client");

async function testConnection() {
    console.log("DATABASE_URL:", process.env.DATABASE_URL);
    const prisma = new PrismaClient();
    try {
        console.log("Connecting to database...");
        const user = await prisma.user.findFirst();
        console.log("Connection successful! User found:", !!user);
    } catch (error) {
        console.error("Connection failed:");
        console.error(error.message);
        console.error("Stack trace:", error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

testConnection();
