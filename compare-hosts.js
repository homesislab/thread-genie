const mysql = require('mysql2/promise');

async function test(host) {
    console.log(`Testing ${host}...`);
    const start = Date.now();
    try {
        const connection = await mysql.createConnection({
            host: host,
            user: 'thread_user',
            password: 'PasswordBaruAnda',
            database: 'threaddb',
            port: 3306,
            connectTimeout: 5000
        });
        console.log(`✅ ${host} connected in ${Date.now() - start}ms`);
        await connection.end();
        return true;
    } catch (err) {
        console.log(`❌ ${host} failed in ${Date.now() - start}ms: ${err.message}`);
        return false;
    }
}

async function run() {
    await test('127.0.0.1');
    await test('localhost');
}

run();
