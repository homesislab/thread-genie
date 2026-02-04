const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

console.log("Testing Prisma Connection...");
console.log("Testing Prisma Connection with HARDCODED URL...");
// Hardcoded for testing
const url = "mysql://thread_user:PasswordBaruAnda@127.0.0.1:3306/threaddb";
console.log("DATABASE_URL:", url);

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: url
        }
    },
    log: ['query', 'info', 'warn', 'error'],
});

async function main() {
    try {
        console.log("Connecting...");
        await prisma.$connect();
        console.log("✅ Custom Prisma Client Connected Successfully!");

        // Try a simple query
        const count = await prisma.user.count();
        console.log("User count:", count);

        await prisma.$disconnect();
    } catch (e) {
        console.error("❌ Connection failed:", e);
        process.exit(1);
    }
}

main();
