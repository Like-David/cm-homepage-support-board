require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./config/db');

const postRoutes = require('./routes/posts');

const app = express();
app.use(cors());
app.use(bodyParser.json());

db.getConnection((err, conn) => {
    if (err) console.error('❌ DB 연결 실패:', err.message);
    else {
        console.log('✅ DB 연결 성공!');
        conn.release();
    }
});

app.get('/', (req, res) => res.send('Server is running...'));

app.use('/api/posts', postRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
