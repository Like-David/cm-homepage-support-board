const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');

// 게시글 목록 조회 (검색 + 페이징)
router.get('/', (req, res) => {

    console.log('✅ NEW LIST API HIT', req.query);

    console.log('[GET /posts]', req.query);

    const keyword = String(req.query.keyword ?? '').trim();
    const page = Number(req.query.page ?? 1);
    const pageSize = Number(req.query.pageSize ?? 10);

    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 10;
    const offset = (safePage - 1) * safePageSize;

    const whereSql = keyword ? 'WHERE title LIKE ? OR author LIKE ?' : '';
    const whereParams = keyword ? [`%${keyword}%`, `%${keyword}%`] : [];

    const countSql = `SELECT COUNT(*) AS total FROM posts ${whereSql}`;
    db.query(countSql, whereParams, (countErr, countRows) => {
        if (countErr) return res.status(500).send(countErr);

        const totalElements = countRows[0].total;
        const totalPages = Math.max(1, Math.ceil(totalElements / safePageSize));

        const listSql = `
            SELECT id, title, author, created_at, status, views
            FROM posts
                     ${whereSql}
            ORDER BY created_at DESC
                LIMIT ? OFFSET ?
        `;
        db.query(listSql, [...whereParams, safePageSize, offset], (err, rows) => {
            if (err) return res.status(500).send(err);

            res.json({
                content: rows,
                page: safePage,
                pageSize: safePageSize,
                totalElements,
                totalPages,
            });
        });
    });
});

// 게시글 작성
router.post('/', async (req, res) => {
    const { title, content, author, password } = req.body;

    if (!title || !content || !author || !password) {
        return res.status(400).send('모든 필드를 입력해주세요.');
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = 'INSERT INTO posts (title, content, author, password) VALUES (?, ?, ?, ?)';
        db.query(query, [title, content, author, hashedPassword], (err, result) => {
            if (err) return res.status(500).send(err);
            res.status(201).send({ id: result.insertId, message: '게시글이 성공적으로 작성되었습니다.' });
        });
    } catch (error) {
        res.status(500).send('서버 오류가 발생했습니다.');
    }
});

// 게시글 상세 보기 (비밀번호 확인)
router.post('/:id/verify', (req, res) => {
    const { password } = req.body;
    const { id } = req.params;

    if (!password) {
        return res.status(400).send('비밀번호를 입력해주세요.');
    }

    db.query('SELECT * FROM posts WHERE id = ?', [id], async (err, rows) => {
        if (err) return res.status(500).send(err);
        if (rows.length === 0) return res.status(404).send('게시글을 찾을 수 없습니다.');

        const post = rows[0];
        const isMatch = await bcrypt.compare(password, post.password);

        if (!isMatch) {
            return res.status(401).send('비밀번호가 일치하지 않습니다.');
        }

        db.query('UPDATE posts SET views = views + 1 WHERE id = ?', [id]);

        // 비밀번호 일치 시, 비밀번호 필드를 제외한 게시글 정보 반환
        const { password: _, ...postDetails } = post;
        res.json(postDetails);
    });
});

// 게시글 삭제
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
        return res.status(400).send('비밀번호를 입력해주세요.');
    }

    db.query('SELECT password FROM posts WHERE id = ?', [id], async (err, rows) => {
        if (err) return res.status(500).send(err);
        if (rows.length === 0) return res.status(404).send('게시글을 찾을 수 없습니다.');

        const post = rows[0];
        const isMatch = await bcrypt.compare(password, post.password);

        if (!isMatch) {
            return res.status(401).send('비밀번호가 일치하지 않습니다.');
        }

        db.query('DELETE FROM posts WHERE id = ?', [id], (deleteErr) => {
            if (deleteErr) return res.status(500).send(deleteErr);
            res.status(200).send({ message: '게시글이 성공적으로 삭제되었습니다.' });
        });
    });
});

// 게시글 수정
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { title, content, password } = req.body;

    if (!title || !content || !password) {
        return res.status(400).send('제목, 내용, 비밀번호를 모두 입력해주세요.');
    }

    db.query('SELECT password FROM posts WHERE id = ?', [id], async (err, rows) => {
        if (err) return res.status(500).send(err);
        if (rows.length === 0) return res.status(404).send('게시글을 찾을 수 없습니다.');

        const post = rows[0];
        const isMatch = await bcrypt.compare(password, post.password);

        if (!isMatch) {
            return res.status(401).send('비밀번호가 일치하지 않습니다.');
        }

        const updateQuery = 'UPDATE posts SET title = ?, content = ? WHERE id = ?';
        db.query(updateQuery, [title, content, id], (updateErr) => {
            if (updateErr) return res.status(500).send(updateErr);
            res.status(200).send({ message: '게시글이 성공적으로 수정되었습니다.' });
        });
    });
});

// 게시글 답변 상태 변경
router.patch('/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // '답변대기' or '답변완료'

    if (!['답변대기', '답변완료'].includes(status)) {
        return res.status(400).send('유효하지 않은 상태입니다.');
    }

    db.query('UPDATE posts SET status = ? WHERE id = ?', [status, id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.status(200).send({ message: `상태가 '${status}'(으)로 변경되었습니다.` });
    });
});

module.exports = router;
