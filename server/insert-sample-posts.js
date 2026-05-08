/**
 * 샘플 게시글 삽입 스크립트
 * 실행: node server/insert-sample-posts.js
 * 비밀번호: cmi0720!@
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const POST_PASSWORD = 'cmi0720!@';

// created_at을 N일 전으로 설정하는 헬퍼
function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 19).replace('T', ' ');
}

const SAMPLE_POSTS = [
    {
        title: '[견적] CM-200 시리즈 대량 도입 견적 요청',
        content: 'CM-200 50대 도입 예정입니다. 납기, 단가, 무상AS 기간 안내 요청. 옵션: 확장 모듈 2EA, 설치 교육 포함 여부 문의',
        author: '박민수(구매팀)',
        status: '답변대기',
        created_at: daysAgo(13),
    },
    {
        title: '[기술] 라인3 PLC 연동 중 통신 오류(E502)',
        content: 'PLC와 컨트롤러 사이에 간헐적 타임아웃이 발생합니다. 발생시간: 10/17 09:12. 로그 공유 가능, 원격 점검 요청',
        author: '김지현(생산기술)',
        status: '답변대기',
        created_at: daysAgo(12),
    },
    {
        title: '[납품] CM-100A 15대 납기 일정 문의',
        content: '10월 말 설치 일정 가능 여부 확인 부탁드립니다. 현장: 평택 2공장 라인 증설',
        author: '이도윤(설비)',
        status: '답변대기',
        created_at: daysAgo(11),
    },
    {
        title: '[A/S] ReportExpress 리포트 미리보기 오류',
        content: '전자문서 리포트 미리보기 시 "데이터 소스 연결 실패" 오류가 발생합니다. 특정 사용자 계정에서만 발생 중입니다.',
        author: '이정민(품질관리)',
        status: '답변대기',
        created_at: daysAgo(10),
    },
    {
        title: '[문의] RX-Cert 솔루션 라이선스 만료 알림 관련',
        content: '서버 로그에 "RX-Cert license expired" 메시지가 주기적으로 표시됩니다. 라이선스 갱신 절차 안내 부탁드립니다.',
        author: '최은지(시스템운영)',
        status: '답변대기',
        created_at: daysAgo(9),
    },
    {
        title: '[기술] PDF 변환 시 한글 깨짐 현상',
        content: '리포트 내 한글이 PDF 변환 후 □□□로 표시됩니다. 폰트 설정 또는 인코딩 관련 점검 요청드립니다.',
        author: '박지호(개발팀)',
        status: '답변대기',
        created_at: daysAgo(8),
    },
    {
        title: '[계정] 관리자 로그인 실패',
        content: '관리자 콘솔에서 ID/PW 입력 시 "계정이 잠겼습니다" 메시지가 출력됩니다. 비밀번호 초기화 요청드립니다.',
        author: '이수빈(운영지원)',
        status: '답변대기',
        created_at: daysAgo(7),
    },
    {
        title: '[납품] RX-Loan 모듈 납품 일정 조율 요청',
        content: '11월 초 도입 예정인 RX-Loan 모듈 납품 및 설치 일정 조율 요청드립니다. 서울본사 / 2층 전산실 환경입니다.',
        author: '한유진(총무팀)',
        status: '답변대기',
        created_at: daysAgo(6),
    },
    {
        title: '[기술] Viewer 모듈 이미지 깨짐',
        content: '전자문서 뷰어에서 PNG 이미지가 깨지거나 확대 시 노이즈가 발생합니다. 뷰어 버전: 2.1.5 / 브라우저: Chrome 129.',
        author: '김도윤(기술지원)',
        status: '답변대기',
        created_at: daysAgo(5),
    },
    {
        title: '[계약] 유지보수 계약 연장 문의',
        content: 'ReportExpress Enterprise 유지보수 계약이 이번 달 만료 예정입니다. 연장 견적 요청드립니다.',
        author: '장혜원(경영지원)',
        status: '답변대기',
        created_at: daysAgo(4),
    },
    {
        title: '[API] 전자서명 검증 API 응답 지연',
        content: '전자서명 검증 API 호출 시 평균 응답시간이 3초 이상 소요됩니다. 서버 부하 상태 점검 부탁드립니다.',
        author: '윤재민(개발팀)',
        status: '답변대기',
        created_at: daysAgo(3),
    },
    {
        title: '[보안] 인증서 자동 갱신 실패',
        content: '서버 인증서 자동 갱신 작업이 실패합니다. 로그: renewal failed - certbot process timeout. 원인 확인 요청드립니다.',
        author: '정가은(인프라관리)',
        status: '답변대기',
        created_at: daysAgo(2),
    },
    {
        title: '[문의] 클라우드 서버 마이그레이션 일정 확인',
        content: '현재 사내 On-premise 환경을 클라우드로 이전 예정입니다. 데이터 이전 및 서비스 중단 시간 협의 요청드립니다.',
        author: '송지훈(IT기획)',
        status: '답변대기',
        created_at: daysAgo(1),
    },
];

async function insertPosts() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306,
    });

    try {
        const hashedPassword = await bcrypt.hash(POST_PASSWORD, 10);
        console.log(`비밀번호 해싱 완료: ${POST_PASSWORD}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        for (const post of SAMPLE_POSTS) {
            await connection.execute(
                'INSERT INTO posts (title, content, author, password, created_at, views, status) VALUES (?, ?, ?, ?, ?, 0, ?)',
                [post.title, post.content, post.author, hashedPassword, post.created_at, post.status]
            );
            console.log(`✅ ${post.title.substring(0, 40)}`);
        }

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`\n✅ 총 ${SAMPLE_POSTS.length}개 게시글 삽입 완료!`);
        console.log(`   조회 비밀번호: ${POST_PASSWORD}`);
    } catch (err) {
        console.error('❌ 삽입 실패:', err.message);
    } finally {
        await connection.end();
    }
}

insertPosts();
