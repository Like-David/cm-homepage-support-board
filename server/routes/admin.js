const express = require('express');
const pool = require('../config/db');

const router = express.Router();
const db = pool.promise();

// 테스트 라우트
router.get('/test', (req, res) => {
    res.json({ message: 'Admin route is working!' });
});

// 재직증명서 목록 조회
router.get('/certificates', async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let whereClause = '';
        let queryParams = [];

        if (search) {
            whereClause = `WHERE (employee_name LIKE ? OR employee_number LIKE ? OR department LIKE ?)`;
            const searchTerm = `%${search}%`;
            queryParams = [searchTerm, searchTerm, searchTerm];
        }

        // 전체 개수 조회
        const [countResult] = await db.query(
            `SELECT COUNT(*) as total FROM certificates ${whereClause}`,
            queryParams
        );
        const total = countResult[0].total;

        // 목록 조회
        const [certificates] = await db.query(
            `SELECT * FROM certificates ${whereClause} ORDER BY issue_date DESC LIMIT ? OFFSET ?`,
            [...queryParams, parseInt(limit), offset]
        );

        res.json({
            data: certificates,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('재직증명서 목록 조회 오류:', error);
        res.status(500).json({
            message: '재직증명서 목록을 불러오는 중 오류가 발생했습니다.',
            error: 'SERVER_ERROR'
        });
    }
});

module.exports = router;
