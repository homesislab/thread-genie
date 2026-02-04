require('dotenv').config();
const mysql = require('mysql2/promise');

async function listUsers() {
    const connectionString = process.env.DATABASE_URL;
    try {
        const connection = await mysql.createConnection(connectionString);
        console.log("Connected to database.");
        const [rows] = await connection.execute('SELECT id, name, email, role FROM User');
        console.log("Users in database:");
        console.table(rows);
        await connection.end();
    } catch (error) {
        console.error("Error listing users:", error.message);
    }
}

listUsers();
