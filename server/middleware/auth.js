const jwt = require('jsonwebtoken');

/**
 * JWT 토큰 검증 미들웨어
 * Authorization 헤더의 Bearer 토큰을 검증하고 사용자 정보를 req.user에 추가
 */
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            message: '인증 토큰이 필요합니다.',
            error: 'NO_TOKEN'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                message: '유효하지 않거나 만료된 토큰입니다.',
                error: 'INVALID_TOKEN'
            });
        }

        // 토큰에서 추출한 사용자 정보를 req.user에 저장
        // user = { id, email, role }
        req.user = user;
        next();
    });
};

/**
 * 역할 기반 권한 체크 미들웨어
 * @param {...string} allowedRoles - 허용된 역할 목록 (예: 'EMPLOYEE', 'ADMIN')
 * @returns {Function} Express 미들웨어 함수
 */
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                message: '인증이 필요합니다.',
                error: 'NOT_AUTHENTICATED'
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: '접근 권한이 없습니다.',
                error: 'INSUFFICIENT_PERMISSIONS',
                requiredRoles: allowedRoles,
                userRole: req.user.role
            });
        }

        next();
    };
};

module.exports = {
    authenticateToken,
    requireRole
};
