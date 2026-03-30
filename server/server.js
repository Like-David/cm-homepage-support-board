require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const pool = require('./config/db');

console.log('Loading routes...');
const postRoutes = require('./routes/posts');
console.log('Posts routes loaded:', typeof postRoutes);
const authRoutes = require('./routes/auth');
console.log('Auth routes loaded:', typeof authRoutes, authRoutes);
const adminRoutes = require('./routes/admin');
console.log('Admin routes loaded:', typeof adminRoutes);

const app = express();
app.use(cors());
app.use(bodyParser.json());

// DB 연결 테스트
pool.getConnection((err, conn) => {
    if (err) console.error('❌ DB 연결 실패:', err.message);
    else {
        console.log('✅ DB 연결 성공!');
        conn.release();
    }
});

app.get('/', (req, res) => res.send('Server is running...'));

console.log('Registering routes...');
app.use('/api/posts', postRoutes);
console.log('Posts route registered');
app.use('/api/auth', authRoutes);
console.log('Auth route registered');
app.use('/api/admin', adminRoutes);
console.log('Admin route registered');

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Available routes:');
    console.log('  POST /api/auth/register');
    console.log('  POST /api/auth/login');
    console.log('  GET  /api/auth/me');
    console.log('  GET  /api/auth/test');
});
