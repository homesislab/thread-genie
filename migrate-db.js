const { execSync } = require('child_process');
require('dotenv').config();

console.log("🚀 Starting Database Migration...");

try {
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL is not defined in .env file");
    }

    console.log("📡 Connecting to database...");

    // Then, migrate the database
    // Using migrate dev to track schema changes
    console.log("uD83DuDCE4 Running database migrations...");

    // Forward arguments to prisma migrate dev
    const args = process.argv.slice(2).join(' ');
    const cmd = `npx prisma migrate dev ${args}`;
    console.log(`Running: ${cmd}`);

    // Execute command with inherited stdio to allow interaction
    execSync(cmd, { stdio: 'inherit' });

    console.log("\n✅ Database migration completed successfully!");
    console.log("💡 You can now run 'npm run dev' to start the application.");

} catch (error) {
    console.error("\n❌ Database migration failed:");
    console.error(error.message);
    process.exit(1);
}
