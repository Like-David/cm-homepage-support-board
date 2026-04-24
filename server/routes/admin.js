const express = require('express');
const pool = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
const db = pool.promise();

// 테스트 라우트
router.get('/test', (req, res) => {
    res.json({ message: 'Admin route is working!' });
});

// 사용자 목록 조회 (ADMIN 전용)
router.get('/users', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    try {
        const { search = '', role = 'ALL' } = req.query;

        let conditions = [];
        let params = [];

        if (search) {
            conditions.push('(name LIKE ? OR email LIKE ?)');
            params.push(`%${search}%`, `%${search}%`);
        }

        if (role !== 'ALL') {
            conditions.push('role = ?');
            params.push(role);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const [users] = await db.query(
            `SELECT id, name, email, role, created_at FROM users ${whereClause} ORDER BY created_at DESC`,
            params
        );

        res.json({ data: users, total: users.length });
    } catch (error) {
        console.error('사용자 목록 조회 오류:', error);
        res.status(500).json({ message: '사용자 목록을 불러오는 중 오류가 발생했습니다.' });
    }
});

// 사용자 역할 변경 (ADMIN 전용)
router.patch('/users/:id/role', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!['GUEST', 'EMPLOYEE', 'ADMIN'].includes(role)) {
            return res.status(400).json({ message: '유효하지 않은 역할입니다.' });
        }

        await db.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);

        res.json({ message: '역할이 변경되었습니다.' });
    } catch (error) {
        console.error('역할 변경 오류:', error);
        res.status(500).json({ message: '역할 변경 중 오류가 발생했습니다.' });
    }
});

// 사용자 삭제 (ADMIN 전용)
router.delete('/users/:id', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;

        // 자기 자신은 삭제 불가
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ message: '자신의 계정은 삭제할 수 없습니다.' });
        }

        await db.query('DELETE FROM users WHERE id = ?', [id]);

        res.json({ message: '사용자가 삭제되었습니다.' });
    } catch (error) {
        console.error('사용자 삭제 오류:', error);
        res.status(500).json({ message: '사용자 삭제 중 오류가 발생했습니다.' });
    }
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

// 재직증명서 생성 (EMPLOYEE, ADMIN)
router.post('/certificates', authenticateToken, async (req, res) => {
    try {
        const { employee_name, department, position, purpose, issue_date } = req.body;

        if (!employee_name || !purpose || !issue_date) {
            return res.status(400).json({ message: '필수 항목이 누락되었습니다.' });
        }

        const [result] = await db.query(
            `INSERT INTO certificates (user_id, employee_name, department, position, purpose, issue_date)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [req.user.id, employee_name, department || '', position || '', purpose, issue_date]
        );

        res.status(201).json({ message: '재직증명서가 발급되었습니다.', id: result.insertId });
    } catch (error) {
        console.error('재직증명서 생성 오류:', error);
        res.status(500).json({ message: '발급 중 오류가 발생했습니다.' });
    }
});

// 재직증명서 상세 조회
router.get('/certificates/:id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM certificates WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: '이력을 찾을 수 없습니다.' });
        res.json({ data: rows[0] });
    } catch (error) {
        console.error('재직증명서 상세 조회 오류:', error);
        res.status(500).json({ message: '조회 중 오류가 발생했습니다.' });
    }
});

// 재직증명서 삭제 (ADMIN 전용)
router.delete('/certificates/:id', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    try {
        await db.query('DELETE FROM certificates WHERE id = ?', [req.params.id]);
        res.json({ message: '삭제되었습니다.' });
    } catch (error) {
        console.error('재직증명서 삭제 오류:', error);
        res.status(500).json({ message: '삭제 중 오류가 발생했습니다.' });
    }
});

// 통계 (ADMIN 전용)
router.get('/statistics', authenticateToken, requireRole('ADMIN'), async (req, res) => {
    try {
        // 전체 사용자 수
        const [[{ totalUsers }]] = await db.query('SELECT COUNT(*) AS totalUsers FROM users');

        // 전체 게시글 수
        const [[{ totalPosts }]] = await db.query('SELECT COUNT(*) AS totalPosts FROM posts');

        // 재직증명서 발급 수
        const [[{ totalCertificates }]] = await db.query('SELECT COUNT(*) AS totalCertificates FROM certificates');

        // 이번 달 재직증명서 발급 수
        const [[{ newCertificatesThisMonth }]] = await db.query(
            `SELECT COUNT(*) AS newCertificatesThisMonth FROM certificates
             WHERE issue_date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')`
        );

        // 저번 달 재직증명서 발급 수
        const [[{ newCertificatesLastMonth }]] = await db.query(
            `SELECT COUNT(*) AS newCertificatesLastMonth FROM certificates
             WHERE issue_date >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01')
               AND issue_date <  DATE_FORMAT(CURDATE(), '%Y-%m-01')`
        );

        // 이번 주 신규 가입자
        const [[{ newUsersThisWeek }]] = await db.query(
            `SELECT COUNT(*) AS newUsersThisWeek FROM users
             WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)`
        );

        // 저번 주 신규 가입자
        const [[{ newUsersLastWeek }]] = await db.query(
            `SELECT COUNT(*) AS newUsersLastWeek FROM users
             WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) + 7 DAY)
               AND created_at <  DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY)`
        );

        // 이번 달 신규 게시글
        const [[{ newPostsThisMonth }]] = await db.query(
            `SELECT COUNT(*) AS newPostsThisMonth FROM posts
             WHERE created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')`
        );

        // 저번 달 신규 게시글
        const [[{ newPostsLastMonth }]] = await db.query(
            `SELECT COUNT(*) AS newPostsLastMonth FROM posts
             WHERE created_at >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01')
               AND created_at <  DATE_FORMAT(CURDATE(), '%Y-%m-01')`
        );

        // 역할별 사용자 분포
        const [roleDistribution] = await db.query(
            'SELECT role, COUNT(*) AS count FROM users GROUP BY role ORDER BY FIELD(role, "ADMIN", "EMPLOYEE", "GUEST")'
        );

        // 최근 가입 사용자 5명
        const [recentUsers] = await db.query(
            'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 5'
        );

        // 인기 게시글 Top 5 (조회수 기준)
        const [topPosts] = await db.query(
            'SELECT id, title, author, views FROM posts ORDER BY views DESC LIMIT 5'
        );

        // 게시글 답변 현황
        const [postStatus] = await db.query(
            "SELECT status, COUNT(*) AS count FROM posts GROUP BY status"
        );

        res.json({
            summary: {
                totalUsers,
                totalPosts,
                totalCertificates,
                newUsersThisWeek,
                newUsersLastWeek,
                newPostsThisMonth,
                newPostsLastMonth,
                newCertificatesThisMonth,
                newCertificatesLastMonth,
            },
            roleDistribution,
            recentUsers,
            topPosts,
            postStatus,
        });
    } catch (error) {
        console.error('통계 조회 오류:', error);
        res.status(500).json({ message: '통계 데이터를 불러오는 중 오류가 발생했습니다.' });
    }
});

module.exports = router;
