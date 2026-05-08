const express = require('express');
const router = express.Router();
const db = require('../config/db');
const crypto = require('crypto');

// POST /api/cert-verify — issue new cert record, return UUID
router.post('/', (req, res) => {
    const { name, accNo, nowDate } = req.body;
    if (!name || !accNo) {
        return res.status(400).json({ error: '이름과 계좌번호가 필요합니다.' });
    }
    const id = crypto.randomUUID();
    const issuedAt = (nowDate && /^\d{4}-\d{2}-\d{2}$/.test(nowDate))
        ? nowDate
        : new Date().toISOString().split('T')[0];
    db.query(
        'INSERT INTO rx_cert_issues (id, name, acc_no, issued_at) VALUES (?, ?, ?, ?)',
        [id, name, accNo, issuedAt],
        (err) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id });
        }
    );
});

// GET /api/cert-verify/:id — look up cert by UUID
router.get('/:id', (req, res) => {
    const { id } = req.params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        return res.status(400).json({ error: '잘못된 요청입니다.' });
    }
    db.query(
        'SELECT id, name, acc_no, issued_at, created_at FROM rx_cert_issues WHERE id = ?',
        [id],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            if (rows.length === 0) return res.status(404).json({ error: '해당 증명서를 찾을 수 없습니다.' });
            res.json(rows[0]);
        }
    );
});

module.exports = router;
