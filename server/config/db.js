require('dotenv').config();
const mysql = require('mysql2');

const pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
});

// 기본 pool export (callback 지원)
// promise() 메소드로 promise 버전 사용 가능
module.exports = pool;