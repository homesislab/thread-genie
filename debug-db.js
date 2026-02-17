const mysql = require('mysql2/promise');

const credentialsToTest = [
    { user: 'thread_user', password: 'Rahasialah135', database: 'threaddb' },
    { user: 'root', password: '', database: 'threaddb' },
    { user: 'root', password: 'root', database: 'threaddb' },
    { user: 'root', password: 'password', database: 'threaddb' },
];

async function testCredentials(creds) {
    const { user, password, database } = creds;
    const connectionString = `mysql://${user}:${password}@127.0.0.1:3306/${database}`;
    console.log(`Testing: mysql://${user}:****@127.0.0.1:3306/${database}`);

    try {
        const connection = await mysql.createConnection({
            host: '127.0.0.1',
            user: user,
            password: password,
            database: database
        });
        console.log(`✅ SUCCESS: Connected as ${user}`);
        await connection.end();
        return true;
    } catch (error) {
        console.log(`❌ FAILED: ${user} - ${error.message} (Code: ${error.code})`);
        return false;
    }
}

async function run() {
    console.log("Starting credentials check...");
    for (const creds of credentialsToTest) {
        const success = await testCredentials(creds);
        if (success) {
            console.log("\nFound working credentials!");
            console.log(JSON.stringify(creds, null, 2));
            // We found one, but let's check others just in case or stop?
            // Let's stop to be efficient
            process.exit(0);
        }
    }
    console.log("\nNo working credentials found from the list.");
    process.exit(1);
}

run();
