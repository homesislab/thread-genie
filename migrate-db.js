const { execSync } = require('child_process');
require('dotenv').config();

console.log("🚀 Starting Database Migration...");

try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL is not defined in .env file");
    }

    console.log("📡 Connecting to database...");

    // First, generate the Prisma client
    console.log("🛠️  Generating Prisma client...");
    execSync('npx prisma generate', { stdio: 'inherit' });

    // Then, push the schema to the database
    // Using db push for simplicity as it's often preferred in dev for quick iterations
    // if they want migrations history, they can use 'prisma migrate dev'
    console.log("📤 Pushing schema to database...");
    execSync('npx prisma db push', { stdio: 'inherit' });

    console.log("\n✅ Database migration completed successfully!");
    console.log("💡 You can now run 'npm run dev' to start the application.");

} catch (error) {
    console.error("\n❌ Database migration failed:");
    console.error(error.message);
    process.exit(1);
}
