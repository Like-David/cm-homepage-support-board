const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const router = express.Router();
const db = pool.promise();

// 테스트 라우트
router.get('/test', (req, res) => {
    res.json({ message: 'Auth route is working!' });
});

// 회원가입
router.post('/register', async (req, res) => {
    try {
        console.log('Register request body:', req.body);

        const { name, email, password, role = 'GUEST' } = req.body;

        // 필수 필드 검증
        if (!name || !email || !password) {
            return res.status(400).json({
                message: '모든 필드를 입력해주세요.',
                error: 'MISSING_FIELDS'
            });
        }

        // 이메일 형식 검증
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                message: '유효한 이메일 주소를 입력해주세요.',
                error: 'INVALID_EMAIL'
            });
        }

        // 비밀번호 강도 검증
        if (password.length < 8 || password.length > 20) {
            return res.status(400).json({
                message: '비밀번호는 8-20자여야 합니다.',
                error: 'INVALID_PASSWORD'
            });
        }

        // 이메일 중복 체크
        const [existingUsers] = await db.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                message: '이미 등록된 이메일입니다.',
                error: 'EMAIL_EXISTS'
            });
        }

        // 비밀번호 해싱
        const hashedPassword = await bcrypt.hash(password, 10);

        // 사용자 생성
        const [result] = await db.query(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, role]
        );

        console.log('User created successfully:', result.insertId);

        res.status(201).json({
            message: '회원가입이 완료되었습니다.',
            user: {
                id: result.insertId,
                name,
                email,
                role
            }
        });
    } catch (error) {
        console.error('회원가입 오류:', error);
        res.status(500).json({
            message: '회원가입 중 오류가 발생했습니다.',
            error: 'SERVER_ERROR',
            details: error.message
        });
    }
});

// 로그인
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: '이메일과 비밀번호를 입력해주세요.',
                error: 'MISSING_FIELDS'
            });
        }

        // 사용자 조회
        const [users] = await db.query(
            'SELECT id, name, email, password, role FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: '이메일 또는 비밀번호가 올바르지 않습니다.',
                error: 'INVALID_CREDENTIALS'
            });
        }

        const user = users[0];

        // 비밀번호 검증
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                message: '이메일 또는 비밀번호가 올바르지 않습니다.',
                error: 'INVALID_CREDENTIALS'
            });
        }

        // JWT 토큰 생성
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        // 비밀번호 제외하고 응답
        const { password: _, ...userWithoutPassword } = user;

        res.json({
            message: '로그인 성공',
            token,
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('로그인 오류:', error);
        res.status(500).json({
            message: '로그인 중 오류가 발생했습니다.',
            error: 'SERVER_ERROR'
        });
    }
});

// 현재 사용자 정보 조회
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                message: '인증 토큰이 필요합니다.',
                error: 'NO_TOKEN'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const [users] = await db.query(
            'SELECT id, name, email, role, created_at FROM users WHERE id = ?',
            [decoded.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: '사용자를 찾을 수 없습니다.',
                error: 'USER_NOT_FOUND'
            });
        }

        res.json({
            user: users[0]
        });
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({
                message: '유효하지 않은 토큰입니다.',
                error: 'INVALID_TOKEN'
            });
        }
        console.error('사용자 정보 조회 오류:', error);
        res.status(500).json({
            message: '사용자 정보 조회 중 오류가 발생했습니다.',
            error: 'SERVER_ERROR'
        });
    }
});

module.exports = router;
