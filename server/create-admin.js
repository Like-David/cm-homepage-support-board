/**
 * 테스트용 관리자 계정 생성 스크립트
 * 실행: node server/create-admin.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const ADMIN = {
    name: '관리자',
    email: 'admin@cmi.com',
    password: 'Admin1234!@',
    role: 'ADMIN',
};

async function createAdmin() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306,
    });

    try {
        // 이미 존재하는지 확인
        const [existing] = await connection.execute(
            'SELECT id FROM users WHERE email = ?',
            [ADMIN.email]
        );

        if (existing.length > 0) {
            console.log(`⚠️  이미 존재하는 계정입니다: ${ADMIN.email}`);
            return;
        }

        const hashedPassword = await bcrypt.hash(ADMIN.password, 10);

        const [result] = await connection.execute(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [ADMIN.name, ADMIN.email, hashedPassword, ADMIN.role]
        );

        console.log('관리자 계정 생성 완료!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`   이메일  : ${ADMIN.email}`);
        console.log(`   비밀번호 : ${ADMIN.password}`);
        console.log(`   역할    : ${ADMIN.role}`);
        console.log(`   ID      : ${result.insertId}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━');
    } catch (err) {
        console.error('생성 실패:', err.message);
    } finally {
        await connection.end();
    }
}

createAdmin();
