# 📋 CM Homepage Support Board Server

## 🧱 프로젝트 개요
CM이노베이션 홈페이지의 고객지원 게시판 **백엔드 서버**입니다.  
Node.js(Express) + MySQL 기반으로 **게시글 CRUD API**를 제공합니다.

---

## ⚙️ 기술 스택
- **Backend**: Node.js (Express)
- **Database**: MySQL 8.0
- **ORM/Driver**: mysql2
- **환경 변수 관리**: dotenv
- **CORS / JSON 파서**: cors, express.json

---

## 🗂 폴더 구조
server/
┣ config/
┃ ┗ db.js
┣ controllers/
┃ ┗ postController.js
┣ models/
┃ ┗ postModel.js
┣ routes/
┃ ┗ postRoutes.js
┣ server.js
┣ .env
┣ package.json

yaml
코드 복사

---

## 🚀 실행 방법
```bash
# 패키지 설치
npm install

# 서버 실행
node server.js
🔗 주요 기능
게시글 등록 / 조회 / 수정 / 삭제

MySQL 연동 및 커넥션 풀 관리

환경 변수 기반 DB 연결 정보 설정

CORS 허용 및 JSON 파싱 자동화

🧩 API 엔드포인트 예시
메서드	경로	설명
GET	/api/posts	게시글 전체 조회
GET	/api/posts/:id	게시글 단건 조회
POST	/api/posts	게시글 등록
PUT	/api/posts/:id	게시글 수정
DELETE	/api/posts/:id	게시글 삭제