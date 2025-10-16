require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./config/db');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// DB 연결 테스트
db.getConnection((err, conn) => {
    if (err) {
        console.error('❌ DB 연결 실패:', err.message);
    } else {
        console.log('✅ DB 연결 성공!');
        conn.release();
    }
});

app.get('/', (req, res) => {
    res.send('Server is running...');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// 간단한 테스트용 엔드포인트
app.get('/api/posts', (req, res) => {
    db.query('SELECT * FROM posts ORDER BY created_at DESC', (err, rows) => {
        if (err) return res.status(500).send(err);
        res.json(rows);
    });
});

app.listen(3001, () => console.log('Server running on port 3001'));
