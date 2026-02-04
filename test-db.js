require('dotenv').config();
const mysql = require('mysql2/promise');

async function testPool() {
    const connectionString = process.env.DATABASE_URL;
    console.log("Testing POOL connection to:", connectionString.replace(/:.*@/, ":****@"));

    const pool = mysql.createPool(connectionString);

    try {
        console.log("Attempting to get connection from pool...");
        const start = Date.now();
        const connection = await pool.getConnection();
        console.log(`✅ Successfully got connection from pool in ${Date.now() - start}ms!`);
        const [rows] = await connection.execute('SELECT 1 + 1 AS solution');
        console.log("✅ Query successful. Solution is:", rows[0].solution);
        connection.release();
        await pool.end();
    } catch (error) {
        console.error("❌ Pool connection failed:");
        console.error(error.message);
        if (error.code) console.error("Error Code:", error.code);
    }
}

testPool();
