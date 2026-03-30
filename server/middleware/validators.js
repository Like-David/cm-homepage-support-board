const { body, validationResult } = require('express-validator');

/**
 * 비밀번호 검증 규칙
 * - 8-20자 길이
 * - 최소 1개의 대문자
 * - 최소 1개의 소문자
 * - 최소 1개의 숫자
 * - 최소 1개의 특수문자
 */
const passwordValidation = () => {
    return body('password')
        .isLength({ min: 8, max: 20 })
        .withMessage('비밀번호는 8-20자여야 합니다.')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('비밀번호는 대소문자, 숫자, 특수문자를 포함해야 합니다.');
};

/**
 * 회원가입 입력 검증
 */
const registerValidation = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('이름은 필수입니다.')
        .isLength({ min: 2, max: 100 })
        .withMessage('이름은 2-100자여야 합니다.'),

    body('email')
        .trim()
        .notEmpty()
        .withMessage('이메일은 필수입니다.')
        .isEmail()
        .withMessage('유효한 이메일 형식이 아닙니다.')
        .normalizeEmail(),

    passwordValidation(),

    body('role')
        .optional()
        .isIn(['GUEST', 'EMPLOYEE', 'ADMIN'])
        .withMessage('유효하지 않은 역할입니다.')
];

/**
 * 로그인 입력 검증
 */
const loginValidation = [
    body('email')
        .trim()
        .notEmpty()
        .withMessage('이메일은 필수입니다.')
        .isEmail()
        .withMessage('유효한 이메일 형식이 아닙니다.')
        .normalizeEmail(),

    body('password')
        .notEmpty()
        .withMessage('비밀번호는 필수입니다.')
];

/**
 * 재직증명서 생성 입력 검증
 */
const certificateValidation = [
    body('employee_name')
        .trim()
        .notEmpty()
        .withMessage('임직원 이름은 필수입니다.')
        .isLength({ min: 2, max: 100 })
        .withMessage('임직원 이름은 2-100자여야 합니다.'),

    body('employee_number')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('사번은 50자 이하여야 합니다.'),

    body('department')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('부서명은 100자 이하여야 합니다.'),

    body('position')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('직급은 100자 이하여야 합니다.'),

    body('hire_date')
        .optional()
        .isISO8601()
        .withMessage('유효한 입사일 형식이 아닙니다.'),

    body('issue_date')
        .notEmpty()
        .withMessage('발급일은 필수입니다.')
        .isISO8601()
        .withMessage('유효한 발급일 형식이 아닙니다.'),

    body('purpose')
        .optional()
        .trim()
        .isLength({ max: 255 })
        .withMessage('용도는 255자 이하여야 합니다.'),

    body('pdf_url')
        .optional()
        .trim()
        .isURL()
        .withMessage('유효한 URL 형식이 아닙니다.')
        .isLength({ max: 500 })
        .withMessage('URL은 500자 이하여야 합니다.')
];

/**
 * 검증 결과 처리 미들웨어
 * 검증 에러가 있으면 400 상태 코드와 함께 에러 반환
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: '입력값 검증 실패',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

module.exports = {
    registerValidation,
    loginValidation,
    certificateValidation,
    validate
};
