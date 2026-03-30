require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function setupDatabase() {
    let connection;
    try {
        console.log('📦 Starting database setup...');

        // Create promise-based connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306,
        });

        const sqlPath = path.join(__dirname, 'schema.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Split by semicolon and filter out empty statements
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const statement of statements) {
            console.log(`\n✅ Executing: ${statement.substring(0, 50)}...`);
            await connection.query(statement);
        }

        console.log('\n✅ Database setup completed successfully!');

        if (connection) await connection.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Database setup failed:', error);
        if (connection) await connection.end();
        process.exit(1);
    }
}

setupDatabase();
