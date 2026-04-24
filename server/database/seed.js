require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const SEED_POSTS = [
    {
        title: '[공지] CM Innovation 고객지원 게시판 이용 안내',
        author: '관리자',
        content: `안녕하세요. CM Innovation 고객지원 게시판입니다.

본 게시판은 제품 도입, 기술 지원, 설치·운영 관련 문의를 남겨주시는 공간입니다.

■ 이용 안내
- 문의 작성 시 제품명, 운영 환경(OS, 브라우저 등)을 함께 기재해 주시면 빠른 답변이 가능합니다.
- 비밀번호를 설정하여 작성하시면 작성자 본인만 내용을 확인할 수 있습니다.
- 긴급 기술 지원이 필요하신 경우 기술지원 전화(0505-998-0888)로 연락 주세요.

■ 운영 시간
평일 09:00 ~ 18:00 (점심 12:00 ~ 13:00 제외, 주말·공휴일 휴무)

감사합니다.`,
        password: 'admin1234',
        status: '답변완료',
    },
    {
        title: '[공지] RX-Cert 전자증명서 솔루션 v2.5 업데이트 안내',
        author: '관리자',
        content: `RX-Cert 전자증명서 솔루션 v2.5 업데이트가 완료되었습니다.

■ 주요 변경 사항
- PDF 렌더링 성능 개선 (로딩 속도 약 30% 향상)
- 전자서명 검증 로직 보안 강화
- IE 11 지원 종료 (Chrome, Edge, Firefox 권장)
- 모바일 환경 미리보기 레이아웃 개선

■ 업데이트 적용 방법
기존 설치 환경에서 설치 파일을 재실행하시면 자동으로 업데이트됩니다.
업데이트 중 문제가 발생하시면 기술지원팀으로 연락 주세요.`,
        password: 'admin1234',
        status: '답변완료',
    },
    {
        title: 'Report Express 설치 후 실행이 되지 않습니다',
        author: '홍길동',
        content: `안녕하세요.
Report Express를 설치했는데 실행 시 "응답 없음" 오류가 반복적으로 발생합니다.

운영 환경:
- OS: Windows 10 Pro (22H2)
- 브라우저: Chrome 최신 버전
- 백신: V3 365

재설치를 시도해도 동일 현상이 반복됩니다. 확인 부탁드립니다.`,
        password: 'user1234',
        status: '답변완료',
    },
    {
        title: 'RX-Loan 대출 약정 시스템 연동 관련 문의',
        author: '김철수',
        content: `안녕하세요.

당사 내부 LOS(대출 심사 시스템)와 RX-Loan 연동을 검토 중입니다.
API 연동 방식 및 지원 여부를 확인하고 싶습니다.

현재 사용 중인 LOS 벤더사 정보를 공유드릴 수 있으니 담당자 연락 부탁드립니다.`,
        password: 'user1234',
        status: '답변대기',
    },
    {
        title: '인쇄 시 여백이 너무 넓게 출력되는 문제',
        author: '이영희',
        content: `안녕하세요.

RX-Cert를 통해 증명서 출력 시 상하 여백이 과도하게 넓게 출력됩니다.
프린터 설정에서 여백을 조정해도 동일하게 출력됩니다.

프린터 모델: HP LaserJet Pro M404dn
용지 크기: A4

해결 방법 안내 부탁드립니다.`,
        password: 'user1234',
        status: '답변완료',
    },
];

async function seed() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3306,
        });

        const [existing] = await connection.query('SELECT COUNT(*) AS cnt FROM posts');
        if (existing[0].cnt > 0) {
            console.log(`ℹ️  posts 테이블에 이미 ${existing[0].cnt}개의 게시글이 있습니다. seed를 건너뜁니다.`);
            return;
        }

        for (const post of SEED_POSTS) {
            const hashed = await bcrypt.hash(post.password, 10);
            await connection.query(
                'INSERT INTO posts (title, content, author, password, status) VALUES (?, ?, ?, ?, ?)',
                [post.title, post.content, post.author, hashed, post.status]
            );
            console.log(`✅ 삽입 완료: ${post.title.substring(0, 30)}...`);
        }

        console.log('\n✅ Seed 완료!');
    } catch (err) {
        console.error('❌ Seed 실패:', err);
    } finally {
        if (connection) await connection.end();
    }
}

seed();
