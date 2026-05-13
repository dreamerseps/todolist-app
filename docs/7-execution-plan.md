# 실행 계획서 - TodoListApp

**작성일:** 2026-05-13
**버전:** 1.0
**참조 문서:** PRD v1.2, ERD v1.0, 아키텍처 다이어그램 v1.1, 프로젝트 구조 원칙 v1.2

---

## 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0 | 2026-05-13 | yoseb lee | 최초 작성 — DB/BE/FE 전 영역 Task 분해, 완료 조건·의존성 정의 |

---

## 1. 개요

### 1.1 목표

TodoListApp MVP를 **데이터베이스 → 백엔드 → 프론트엔드** 순서의 단계별 구현을 통해 완성한다.

### 1.2 기술 스택

| 영역 | 기술 |
|------|------|
| **Frontend** | React 19, TypeScript, Zustand, TanStack Query, Vite |
| **Backend** | Node.js, Express, pg (ORM 없음) |
| **Database** | PostgreSQL 17 |
| **인증** | JWT — Access Token(15분) + Refresh Token(7일), 모두 Zustand 메모리 저장 |

### 1.3 핵심 비즈니스 규칙 (BR)

| 규칙 | 내용 |
|------|------|
| BR-01 | 모든 기능은 인증된 사용자만 사용 가능 |
| BR-02 | 사용자는 자신의 데이터만 접근 가능 |
| BR-03 | 기본 카테고리(업무·개인·기타)는 시스템 제공 |
| BR-04 | 사용자 정의 카테고리는 해당 사용자에게만 귀속 |
| BR-05 | 할일 등록 시 카테고리 필수 지정 |
| BR-06 | 할일 목록은 카테고리·기간·완료 여부로 필터링 가능 |
| BR-07 | 이메일 중복 등록 불가 |
| BR-08 | 할일이 1개 이상 속한 카테고리는 삭제 불가 |
| BR-09 | 이메일은 가입 후 변경 불가 |

---

## 2. 전체 구현 단계 (Phase)

```
Phase 1  │  DB 설정 및 레포지터리 구현  (DB-01 ~ DB-05)
Phase 2  │  BE 기반 설정               (BE-01 ~ BE-03)
Phase 3  │  BE 인증 API               (BE-04 ~ BE-06)
Phase 4  │  BE 비즈니스 API            (BE-07 ~ BE-10)
Phase 5  │  FE 기반 설정               (FE-01 ~ FE-04)
Phase 6  │  FE 인증 화면               (FE-05 ~ FE-07)
Phase 7  │  FE 할일 기능               (FE-08 ~ FE-13)
Phase 8  │  FE 카테고리·프로필·마무리   (FE-14 ~ FE-18)
```

---

## 3. 데이터베이스 (Phase 1)

> **전제:** `database/schema.sql` DDL은 완성됨. PostgreSQL 17 인스턴스가 로컬에 실행 중이어야 함.

---

### DB-01: PostgreSQL 연결 풀 설정

**설명:** pg 라이브러리로 연결 풀을 구성하고, 환경변수로부터 설정값을 로드한다. 백엔드 전체가 이 모듈을 통해 DB에 접근한다.

**완료 조건:**
- [ ] `backend/src/config/database.js` 생성 — `pg.Pool` 인스턴스 초기화
- [ ] `.env.example`에 DB 연결 변수 정의 (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`)
- [ ] 필수 환경변수 누락 시 서버 시작 불가 처리
- [ ] `checkConnection()` 함수 구현 (`SELECT 1` 쿼리로 연결 확인)
- [ ] `closePool()` 함수 구현 (프로세스 종료 시 풀 정리)

**의존하는 Task:** 없음
**예상 소요 시간:** 1.5시간

---

### DB-02: 시드 데이터 — 기본 카테고리 초기화

**설명:** 기본 카테고리 3개(업무·개인·기타)를 DB에 삽입하는 시드 스크립트를 작성한다. 멱등성을 보장하여 중복 실행해도 데이터가 중복 생성되지 않는다.

**완료 조건:**
- [ ] `database/seed.sql` 작성 — `INSERT ... ON CONFLICT DO NOTHING` 으로 멱등성 보장
- [ ] `database/seed.js` 작성 — Node.js 실행 스크립트 (`node database/seed.js`)
- [ ] 시드 실행 후 `categories` 테이블에 `is_default=true` 레코드 3건 확인
- [ ] 재실행 시 중복 생성 없음 확인
- [ ] `package.json`에 `"db:seed": "node database/seed.js"` 스크립트 추가

**의존하는 Task:** DB-01
**예상 소요 시간:** 1시간

---

### DB-03: User 레포지터리 구현

**설명:** `users` 테이블에 대한 쿼리 함수를 작성한다. 모든 쿼리는 Parameterized Query(`$1`, `$2`)로 SQL Injection을 방지한다.

**완료 조건:**
- [ ] `backend/src/repositories/userRepository.js` 생성
- [ ] `findByEmail(email)` — 로그인·중복 검증용 단건 조회
- [ ] `findById(id)` — 인증 미들웨어·프로필 조회용
- [ ] `create({ email, passwordHash, name })` — 회원가입, 생성된 user 객체 반환
- [ ] `updateName(id, name)` — 이름 수정
- [ ] `updatePasswordHash(id, passwordHash)` — 비밀번호 변경
- [ ] 모든 함수에서 password_hash 컬럼을 응답에서 제외하는 헬퍼 적용

**의존하는 Task:** DB-01
**예상 소요 시간:** 2시간

---

### DB-04: Category 레포지터리 구현

**설명:** `categories` 테이블에 대한 쿼리 함수를 작성한다. 기본 카테고리(`user_id IS NULL`)와 사용자 정의 카테고리를 모두 처리한다.

**완료 조건:**
- [ ] `backend/src/repositories/categoryRepository.js` 생성
- [ ] `findAllByUserId(userId)` — 기본 카테고리 + 해당 사용자의 사용자 정의 카테고리 목록 반환
- [ ] `findById(id)` — 단건 조회 (소유권 확인용)
- [ ] `create(userId, name)` — 사용자 정의 카테고리 생성
- [ ] `updateName(id, name)` — 이름 수정
- [ ] `deleteById(id)` — 삭제
- [ ] `countTodos(categoryId)` — 해당 카테고리의 할일 개수 반환 (BR-08 검증용)

**의존하는 Task:** DB-01
**예상 소요 시간:** 2시간

---

### DB-05: Todo 레포지터리 구현

**설명:** `todos` 테이블에 대한 CRUD 쿼리 함수를 작성한다. 필터링·정렬·페이지네이션을 동적으로 처리하며, user_id 기반 접근 제어를 모든 쿼리에 적용한다.

**완료 조건:**
- [ ] `backend/src/repositories/todoRepository.js` 생성
- [ ] `findAllByUserId(userId, { categoryId, from, to, isCompleted, sort, page, limit })` — 필터·정렬·페이지네이션 지원
  - [ ] `sort=created_at_desc`(기본) / `sort=due_date_asc` 지원
  - [ ] 페이지당 기본 20건, 최대 100건
- [ ] `findById(id, userId)` — 단건 조회 (소유권 확인 포함)
- [ ] `create(userId, { title, description, dueDate, categoryId })` — 할일 생성
- [ ] `update(id, userId, fields)` — 부분 업데이트 (변경된 필드만 SET)
- [ ] `deleteById(id, userId)` — 삭제
- [ ] 총 건수 반환 쿼리 (`countByUserId`)로 페이지네이션 메타 계산

**의존하는 Task:** DB-01
**예상 소요 시간:** 3시간

---

## 4. 백엔드 (Phase 2 ~ 4)

---

### BE-01: 프로젝트 초기화 및 디렉토리 구조 생성

**설명:** 백엔드 Node.js 프로젝트를 초기화하고, 아키텍처 설계에 따른 디렉토리 구조를 생성한다.

**완료 조건:**
- [ ] `backend/` 디렉토리 생성, `npm init -y` 실행
- [ ] 의존성 설치: `express`, `pg`, `bcryptjs`, `jsonwebtoken`, `cors`, `dotenv`
- [ ] 개발 의존성 설치: `nodemon`
- [ ] 디렉토리 생성: `src/config`, `src/middlewares`, `src/modules/{auth,users,categories,todos}`, `src/repositories`, `src/utils`
- [ ] `src/app.js` (Express 앱), `src/server.js` (서버 시작) 파일 생성
- [ ] `package.json` scripts 추가: `"dev": "nodemon src/server.js"`, `"start": "node src/server.js"`
- [ ] `.gitignore`에 `node_modules/`, `.env` 추가

**의존하는 Task:** 없음
**예상 소요 시간:** 1시간

---

### BE-02: 공통 유틸리티 구현 (JWT, bcrypt, 에러 클래스, 검증)

**설명:** 인증과 검증에 필요한 공통 유틸 함수들을 구현한다. 프로젝트 전반에서 재사용한다.

**완료 조건:**
- [ ] `src/utils/jwt.js` — `signAccessToken(payload)`, `signRefreshToken(payload)`, `verifyToken(token, secret)` 구현
  - [ ] Access Token: 15분, Refresh Token: 7일 만료
  - [ ] JWT 환경변수: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- [ ] `src/utils/bcrypt.js` — `hashPassword(plain)`, `comparePassword(plain, hash)` 구현 (rounds=10)
- [ ] `src/utils/errors.js` — 커스텀 에러 클래스 정의
  - [ ] `AppError(message, statusCode, code)` 베이스 클래스
  - [ ] `BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError` 서브 클래스
- [ ] `src/utils/validate.js` — `isValidEmail(email)`, `isValidPassword(pw)` (8자 이상), `isRequired(value)` 구현

**의존하는 Task:** BE-01
**예상 소요 시간:** 2시간

---

### BE-03: Express 앱 기반 설정 (미들웨어, 에러 핸들러)

**설명:** CORS, JSON 파서, JWT 인증 미들웨어, 전역 에러 핸들러를 `app.js`에 등록한다.

**완료 조건:**
- [ ] `src/middlewares/errorHandler.js` — 전역 에러 핸들러 미들웨어 구현
  - [ ] 표준 응답 포맷: `{ success, code, message, data? }`
  - [ ] 개발 환경(`NODE_ENV=development`)에서만 스택 트레이스 출력
- [ ] `src/middlewares/authenticate.js` — JWT 검증 미들웨어
  - [ ] `Authorization: Bearer <token>` 헤더 파싱
  - [ ] 토큰 유효 시 `req.user = { id, email }` 설정
  - [ ] 토큰 만료/불일치 시 `UnauthorizedError` 발생
- [ ] `src/app.js` 미들웨어 등록 순서: CORS → JSON Parser → 라우터 → 에러 핸들러
  - [ ] CORS: `credentials: false`, 허용 origin은 환경변수 `CORS_ORIGIN`
- [ ] `GET /health` 엔드포인트 추가 (DB 연결 상태 반환)

**의존하는 Task:** BE-01, BE-02
**예상 소요 시간:** 2시간

---

### BE-04: 인증 API — 회원가입 · 로그인

**설명:** 회원가입(`POST /api/auth/register`)과 로그인(`POST /api/auth/login`) 엔드포인트를 구현한다.

**완료 조건:**
- [ ] `src/modules/auth/auth.service.js`
  - [ ] `register({ email, password, name })` — 이메일 중복 확인(BR-07) → bcrypt 해싱 → user 생성 → 생성된 user 반환
  - [ ] `login({ email, password })` — user 조회 → bcrypt 비교 → Access/Refresh Token 발급
- [ ] `src/modules/auth/auth.controller.js` — 입력값 검증 → 서비스 호출 → JSON 응답
  - [ ] 회원가입 성공: `201` + `{ id, email, name }`
  - [ ] 로그인 성공: `200` + `{ accessToken, refreshToken, user: { id, email, name } }`
- [ ] `src/modules/auth/auth.router.js` — 라우트 정의
- [ ] `app.js`에 `app.use('/api/auth', authRouter)` 마운트

**의존하는 Task:** BE-02, BE-03, DB-03
**예상 소요 시간:** 2.5시간

---

### BE-05: 인증 API — 토큰 갱신 · 로그아웃

**설명:** Refresh Token으로 새 Access Token을 발급하는 엔드포인트와 로그아웃 엔드포인트를 구현한다.

**완료 조건:**
- [ ] `POST /api/auth/refresh`
  - [ ] 요청 본문: `{ refreshToken }`
  - [ ] Refresh Token 검증 → 새 Access Token 발급
  - [ ] 성공: `200` + `{ accessToken }`
  - [ ] 만료/오류: `401` UnauthorizedError
- [ ] `POST /api/auth/logout`
  - [ ] `authenticate` 미들웨어 적용
  - [ ] 성공: `200` + `{ message: '로그아웃되었습니다' }`
  - [ ] (백엔드는 별도 토큰 저장 없음 — 프론트엔드가 Zustand 상태를 직접 제거)
- [ ] curl/Postman으로 회원가입 → 로그인 → 토큰 갱신 → 로그아웃 전체 흐름 테스트

**의존하는 Task:** BE-04
**예상 소요 시간:** 1.5시간

---

### BE-06: 사용자 정보 API

**설명:** 현재 사용자 정보 조회 및 수정 엔드포인트를 구현한다. 이메일은 읽기 전용(BR-09).

**완료 조건:**
- [ ] `GET /api/users/me` — 인증 필요, `{ id, email, name, createdAt }` 반환 (password_hash 제외)
- [ ] `PATCH /api/users/me` — 이름 또는 비밀번호 수정
  - [ ] 이름 변경: `{ name }` 수신 → 길이 검증(1~100자) → 업데이트
  - [ ] 비밀번호 변경: `{ currentPassword, newPassword }` 수신 → 현재 비밀번호 검증 → 해싱 → 업데이트
  - [ ] 이메일 수정 요청 시 `400` BadRequestError (BR-09)
- [ ] `src/modules/users/` 디렉토리에 service, controller, router 분리
- [ ] `app.js`에 마운트: `app.use('/api/users', usersRouter)`

**의존하는 Task:** BE-03, BE-02, DB-03
**예상 소요 시간:** 2시간

---

### BE-07: 카테고리 API

**설명:** 카테고리 CRUD 엔드포인트를 구현한다. 기본 카테고리 보호(BR-03)와 할일 존재 시 삭제 불가(BR-08) 비즈니스 규칙을 적용한다.

**완료 조건:**
- [ ] `GET /api/categories` — 기본 카테고리 + 사용자 정의 카테고리 목록 반환
- [ ] `POST /api/categories` — 사용자 정의 카테고리 생성 (`{ name }`, 이름 필수·1~50자)
- [ ] `PATCH /api/categories/:id` — 이름 수정
  - [ ] `is_default=true` 카테고리 수정 시 `400` 오류
  - [ ] 다른 사용자 카테고리 수정 시 `403` 오류 (BR-02)
- [ ] `DELETE /api/categories/:id`
  - [ ] `is_default=true` 삭제 시 `400` 오류 (BR-03)
  - [ ] 할일이 1건 이상 존재 시 `422` 오류, 메시지: "할일이 속한 카테고리는 삭제할 수 없습니다" (BR-08)
  - [ ] 다른 사용자 카테고리 삭제 시 `403` 오류 (BR-02)
- [ ] 모든 엔드포인트에 `authenticate` 미들웨어 적용

**의존하는 Task:** BE-03, DB-04
**예상 소요 시간:** 3시간

---

### BE-08: 할일 조회 API

**설명:** 필터링·정렬·페이지네이션을 지원하는 할일 목록 조회 및 단건 조회 엔드포인트를 구현한다(BR-06).

**완료 조건:**
- [ ] `GET /api/todos` — 쿼리 파라미터 처리
  - [ ] `category_id`, `from`, `to`, `is_completed`, `sort`, `page`, `limit` 파라미터 파싱·검증
  - [ ] `from > to`인 경우 `400` 오류
  - [ ] 응답: `{ todos: [...], total, page, pageSize, totalPages }`
- [ ] `GET /api/todos/:id` — 단건 조회
  - [ ] 존재하지 않거나 다른 사용자 소유인 경우 `404`
- [ ] 모든 엔드포인트에 `authenticate` 미들웨어 적용

**의존하는 Task:** BE-03, DB-05
**예상 소요 시간:** 2시간

---

### BE-09: 할일 생성 · 수정 · 삭제 API

**설명:** 할일 CUD 엔드포인트를 구현한다. 카테고리 필수(BR-05)와 소유권 검증(BR-02)을 적용한다.

**완료 조건:**
- [ ] `POST /api/todos` — 할일 생성
  - [ ] 요청 본문: `{ title (필수), description?, dueDate?, categoryId (필수) }`
  - [ ] `categoryId` 미전달 또는 접근 불가한 카테고리 지정 시 `400` (BR-05)
  - [ ] 성공: `201` + 생성된 todo 객체
- [ ] `PATCH /api/todos/:id` — 할일 수정 (부분 업데이트)
  - [ ] 요청 본문: `{ title?, description?, dueDate?, categoryId?, isCompleted? }`
  - [ ] 다른 사용자 소유 시 `403` (BR-02)
- [ ] `DELETE /api/todos/:id` — 할일 삭제
  - [ ] 다른 사용자 소유 또는 없는 ID: `404`
- [ ] `src/modules/todos/` 디렉토리에 service, controller, router 분리
- [ ] `app.js`에 마운트: `app.use('/api/todos', todosRouter)`

**의존하는 Task:** BE-03, DB-04, DB-05
**예상 소요 시간:** 3시간

---

### BE-10: 백엔드 통합 검증

**설명:** 모든 API 엔드포인트를 시나리오 기반으로 테스트하여 비즈니스 규칙 준수 여부를 검증한다.

**완료 조건:**
- [ ] 회원가입 → 로그인 → 할일 전체 흐름(CRUD) Postman/curl 테스트 완료
- [ ] BR-02: 다른 사용자 데이터 접근 차단 확인
- [ ] BR-05: categoryId 없는 할일 등록 시 400 반환 확인
- [ ] BR-07: 이메일 중복 가입 시 409 반환 확인
- [ ] BR-08: 할일이 있는 카테고리 삭제 시 422 반환 확인
- [ ] BR-09: PATCH /api/users/me에서 이메일 변경 시 400 반환 확인
- [ ] 토큰 갱신 흐름: 만료된 Access Token → Refresh Token으로 갱신 확인

**의존하는 Task:** BE-05, BE-06, BE-07, BE-08, BE-09
**예상 소요 시간:** 2시간

---

## 5. 프론트엔드 (Phase 5 ~ 8)

---

### FE-01: 프로젝트 초기화 및 디렉토리 구조 생성

**설명:** Vite + React 19 + TypeScript로 프로젝트를 초기화하고 디렉토리 구조를 생성한다.

**완료 조건:**
- [ ] `npm create vite@latest frontend -- --template react-ts` 실행
- [ ] 의존성 설치: `zustand`, `@tanstack/react-query`, `axios`, `react-router-dom`
- [ ] `vite.config.ts`에 경로 별칭 설정: `@` → `src/`
- [ ] `tsconfig.json`에 `strict: true`, `baseUrl: "./src"` 설정
- [ ] 디렉토리 생성: `src/api`, `src/components`, `src/features/{auth,todos,categories,profile}`, `src/hooks`, `src/pages`, `src/stores`, `src/types`, `src/utils`, `src/constants`
- [ ] `.env.example` 생성: `VITE_API_BASE_URL=http://localhost:3001/api`
- [ ] `npm run dev`로 정상 실행 확인

**의존하는 Task:** 없음
**예상 소요 시간:** 1.5시간

---

### FE-02: 공통 타입 및 상수 정의

**설명:** 도메인 모델, API 응답, 검증 규칙 타입을 중앙에서 관리한다.

**완료 조건:**
- [ ] `src/types/common.ts` — `ApiResponse<T>` 제네릭 타입 정의
- [ ] `src/types/user.ts` — `User`, `LoginRequest`, `SignupRequest`, `UpdateProfileRequest`
- [ ] `src/types/category.ts` — `Category`, `CategoryCreateRequest`
- [ ] `src/types/todo.ts` — `TodoItem`, `TodoFilter`, `TodoCreateRequest`, `TodoUpdateRequest`, `PaginatedResponse<T>`
- [ ] `src/constants/routes.ts` — 라우트 경로 상수 (`LOGIN`, `SIGNUP`, `TODOS`, `CATEGORIES`, `PROFILE`)
- [ ] `src/constants/api.ts` — API 엔드포인트 상수
- [ ] `src/constants/defaults.ts` — `PAGE_SIZE=20`, `DEFAULT_SORT='created_at_desc'`

**의존하는 Task:** FE-01
**예상 소요 시간:** 1.5시간

---

### FE-03: API 클라이언트 및 Zustand 인증 Store 구현

**설명:** axios 인스턴스와 JWT 자동 갱신 interceptor를 구현하고, 인증 상태를 관리하는 Zustand Store를 생성한다.

**완료 조건:**
- [ ] `src/stores/authStore.ts` 구현
  - [ ] 상태: `accessToken`, `refreshToken`, `user`, `isAuthenticated`
  - [ ] 액션: `setAuth({ accessToken, refreshToken, user })`, `clearAuth()`
  - [ ] 초기값은 모두 null (메모리 기반 — 새로고침 시 초기화)
- [ ] `src/api/client.ts` — axios 인스턴스 생성
  - [ ] 요청 interceptor: 모든 요청에 `Authorization: Bearer <accessToken>` 자동 주입
  - [ ] 응답 interceptor: `401` 수신 시 Refresh Token으로 새 Access Token 발급 후 원본 요청 재시도
  - [ ] Refresh Token도 만료된 경우: `clearAuth()` 호출 후 로그인 페이지로 리다이렉트
- [ ] TanStack Query `QueryClient` 생성 및 `main.tsx`에서 `QueryClientProvider` 적용

**의존하는 Task:** FE-02
**예상 소요 시간:** 2.5시간

---

### FE-04: API 함수 및 React Router 설정

**설명:** 각 도메인별 API 함수를 작성하고, 라우터와 ProtectedRoute를 구성한다.

**완료 조건:**
- [ ] `src/api/auth.api.ts` — `signup()`, `login()`, `refreshToken()`, `logout()`
- [ ] `src/api/users.api.ts` — `getMe()`, `updateProfile()`, `changePassword()`
- [ ] `src/api/categories.api.ts` — `getCategories()`, `createCategory()`, `updateCategory()`, `deleteCategory()`
- [ ] `src/api/todos.api.ts` — `getTodos(filters)`, `getTodoById(id)`, `createTodo()`, `updateTodo()`, `deleteTodo()`
- [ ] `src/components/ProtectedRoute.tsx` — `isAuthenticated` 확인, 미인증 시 `/login` 리다이렉트
- [ ] `src/App.tsx` 라우트 정의:
  - [ ] 공개: `/login`, `/signup`
  - [ ] 보호: `/todos`, `/categories`, `/profile` (ProtectedRoute 적용)
  - [ ] `/` → `/todos` 리다이렉트
  - [ ] `*` → 404 페이지

**의존하는 Task:** FE-02, FE-03
**예상 소요 시간:** 2시간

---

### FE-05: 공통 UI 컴포넌트 구현

**설명:** 프로젝트 전반에서 재사용할 기본 UI 컴포넌트를 구현한다.

**완료 조건:**
- [ ] `src/components/Button/Button.tsx` — `variant`(primary/secondary/danger), `size`(sm/md/lg), `isLoading`, `disabled` props 지원
- [ ] `src/components/Input/Input.tsx` — label, error 메시지, type 지원
- [ ] `src/components/Modal/Modal.tsx` — 확인 다이얼로그용, `title`, `children`, `onConfirm`, `onCancel` props
- [ ] `src/components/Select/Select.tsx` — `options: { value, label }[]`, `placeholder` props
- [ ] `src/components/Spinner/Spinner.tsx` — 로딩 인디케이터
- [ ] `src/components/Toast/Toast.tsx` + `src/stores/uiStore.ts` — 성공·에러·경고 토스트 메시지 시스템
- [ ] `src/components/Header/Header.tsx` — 로고, 사용자명, 드롭다운 메뉴(프로필 이동, 로그아웃)

**의존하는 Task:** FE-03
**예상 소요 시간:** 4시간

---

### FE-06: 인증 화면 — 로그인 · 회원가입

**설명:** 로그인과 회원가입 페이지를 구현한다. 폼 검증, 에러 표시, 성공 후 리다이렉트를 포함한다.

**완료 조건:**
- [ ] `src/features/auth/hooks/useLogin.ts` — `useMutation` 로그인, 성공 시 `setAuth()` + `/todos` 리다이렉트
- [ ] `src/features/auth/hooks/useSignup.ts` — `useMutation` 회원가입, 성공 시 `/login` 리다이렉트
- [ ] `src/pages/LoginPage.tsx` — 이메일·비밀번호 필드, 로그인 버튼, 회원가입 링크
  - [ ] 클라이언트 검증: 이메일 형식, 비밀번호 1자 이상 입력 여부
  - [ ] API 오류 메시지 표시
- [ ] `src/pages/SignupPage.tsx` — 이름·이메일·비밀번호·비밀번호 확인 필드
  - [ ] 클라이언트 검증: 이메일 형식, 비밀번호 8자 이상, 비밀번호 일치
  - [ ] 이메일 중복 오류(409) 시 "이미 사용 중인 이메일입니다" 표시
- [ ] `src/features/auth/hooks/useLogout.ts` — `clearAuth()` + `/login` 리다이렉트

**의존하는 Task:** FE-04, FE-05
**예상 소요 시간:** 3시간

---

### FE-07: 할일 목록 페이지 기본 구현

**설명:** 할일 목록을 조회하고 표시하는 메인 페이지를 구현한다. 로딩·빈 목록·에러 상태를 처리한다.

**완료 조건:**
- [ ] `src/features/todos/hooks/useFetchTodos.ts` — `useQuery`로 할일 목록 조회, 필터 파라미터 지원
- [ ] `src/features/todos/components/TodoList.tsx` — 할일 아이템 목록 렌더링
- [ ] `src/features/todos/components/TodoItem.tsx` — 단일 아이템: 완료 체크박스, 제목, 카테고리, 마감일, 수정·삭제 버튼
  - [ ] 완료된 할일: 제목에 취소선(`line-through`) 스타일
- [ ] `src/pages/TodosPage.tsx` — 헤더 + 필터 영역 + 목록 + 페이지네이션 레이아웃
- [ ] 로딩 중: `Spinner` 컴포넌트 표시
- [ ] 빈 목록: "등록된 할일이 없습니다" 메시지 표시
- [ ] API 에러 시: 에러 메시지 표시

**의존하는 Task:** FE-04, FE-05
**예상 소요 시간:** 3시간

---

### FE-08: 할일 필터링 · 정렬 · 페이지네이션

**설명:** 할일 목록에 필터링·정렬·페이지네이션 기능을 추가한다(BR-06).

**완료 조건:**
- [ ] `src/features/todos/hooks/useTodoFilter.ts` — 필터 상태 관리, URL 쿼리 파라미터 동기화
- [ ] `src/features/todos/components/TodoFilter.tsx` — 필터 UI
  - [ ] 카테고리 Select (기본 + 사용자 정의 카테고리 목록)
  - [ ] 기간 필터: 시작일(from)·종료일(to) date input
  - [ ] 완료 여부: 전체·완료·미완료 탭 또는 라디오 버튼
  - [ ] 필터 초기화 버튼
- [ ] `src/features/todos/components/TodoSortOptions.tsx` — 정렬 드롭다운
  - [ ] "최신순(기본)", "마감일 빠른 순" 옵션
- [ ] `src/features/todos/components/TodoPagination.tsx` — 이전/다음 버튼, 현재 페이지 표시
  - [ ] 총 페이지 수, 현재 페이지 강조
- [ ] 필터·정렬·페이지 변경 시 `useFetchTodos` 재호출

**의존하는 Task:** FE-07
**예상 소요 시간:** 3시간

---

### FE-09: 할일 CRUD — 추가 · 수정 · 삭제 · 완료 토글

**설명:** 할일 추가, 수정, 삭제, 완료 상태 토글 기능을 구현한다.

**완료 조건:**
- [ ] `src/features/todos/hooks/useAddTodo.ts` — `useMutation`, 성공 후 목록 쿼리 무효화
- [ ] `src/features/todos/hooks/useUpdateTodo.ts` — `useMutation`, 수정 및 완료 토글 모두 처리
- [ ] `src/features/todos/hooks/useDeleteTodo.ts` — `useMutation`, 삭제 확인 Modal 포함
- [ ] `src/features/todos/components/AddTodoModal.tsx` — 할일 추가 모달
  - [ ] 필드: 제목(필수), 설명(선택), 카테고리 Select(필수, BR-05), 마감일(선택)
  - [ ] 클라이언트 검증: 제목·카테고리 필수 확인
- [ ] `src/features/todos/components/EditTodoModal.tsx` — 할일 수정 모달
  - [ ] 기존 데이터 폼에 pre-fill
- [ ] TodoItem에서 체크박스 클릭 → `useUpdateTodo` 호출하여 `isCompleted` 토글
- [ ] 추가·수정·삭제 성공 시 Toast 메시지 표시

**의존하는 Task:** FE-07, FE-05
**예상 소요 시간:** 3.5시간

---

### FE-10: 카테고리 관리 페이지

**설명:** 카테고리 목록 조회 및 CRUD 페이지를 구현한다. 기본 카테고리 보호와 할일 존재 시 삭제 불가 처리를 포함한다.

**완료 조건:**
- [ ] `src/features/categories/hooks/useFetchCategories.ts` — `useQuery`로 카테고리 목록 조회
- [ ] `src/features/categories/hooks/useAddCategory.ts` — 카테고리 추가 `useMutation`
- [ ] `src/features/categories/hooks/useUpdateCategory.ts` — 이름 수정 `useMutation`
- [ ] `src/features/categories/hooks/useDeleteCategory.ts` — 삭제 `useMutation`
- [ ] `src/pages/CategoriesPage.tsx` — 카테고리 목록 + 추가 버튼
- [ ] `src/features/categories/components/CategoryItem.tsx`
  - [ ] 기본 카테고리(`isDefault=true`): 수정·삭제 버튼 비활성화, 시각적 구분
  - [ ] 삭제 클릭 시 확인 Modal 표시
  - [ ] 삭제 실패(422) 시: "할일이 속한 카테고리는 삭제할 수 없습니다" Toast 표시

**의존하는 Task:** FE-04, FE-05
**예상 소요 시간:** 3시간

---

### FE-11: 프로필 관리 페이지

**설명:** 사용자 이름 수정과 비밀번호 변경 페이지를 구현한다. 이메일은 읽기 전용으로 표시한다(BR-09).

**완료 조건:**
- [ ] `src/features/profile/hooks/useGetProfile.ts` — `useQuery`로 사용자 정보 조회
- [ ] `src/features/profile/hooks/useUpdateProfile.ts` — 이름 수정 `useMutation`
- [ ] `src/features/profile/hooks/useChangePassword.ts` — 비밀번호 변경 `useMutation`
- [ ] `src/pages/ProfilePage.tsx` — 사용자 정보 폼 + 비밀번호 변경 폼
  - [ ] 이메일 필드: `disabled` 처리, "(변경 불가)" 안내 텍스트 표시
  - [ ] 비밀번호 변경: 현재 비밀번호·새 비밀번호·확인 필드
  - [ ] 클라이언트 검증: 새 비밀번호 8자 이상, 비밀번호 일치
- [ ] 수정 성공 시: Zustand authStore의 `user.name` 업데이트

**의존하는 Task:** FE-04, FE-05
**예상 소요 시간:** 2.5시간

---

### FE-12: 반응형 디자인 (모바일 대응)

**설명:** 모든 페이지를 모바일 웹 환경에서 사용 가능하도록 반응형으로 구현한다. PRD 기준: 375px 이상 지원.

**완료 조건:**
- [ ] 모바일(< 768px) 기준 레이아웃 조정
  - [ ] 로그인·회원가입: 폼 너비 100%, 버튼 full-width
  - [ ] 할일 목록: 카드형 레이아웃 (테이블 → 카드 전환)
  - [ ] 필터 UI: 펼침/접힘 토글 방식으로 변경
  - [ ] Header: 메뉴가 아이콘 버튼으로 압축
- [ ] 태블릿(768px ~ 1024px) 레이아웃 확인
- [ ] 데스크톱(1024px+) 레이아웃 확인
- [ ] iOS Safari, Android Chrome에서 주요 기능 동작 확인

**의존하는 Task:** FE-06, FE-07, FE-10, FE-11
**예상 소요 시간:** 3시간

---

### FE-13: 공통 에러 처리 및 통합 검증

**설명:** API 에러를 일관되게 처리하고, 전체 사용자 시나리오를 통합 테스트한다.

**완료 조건:**
- [ ] axios 응답 interceptor에서 네트워크 에러 처리 (오프라인 감지)
- [ ] TanStack Query `onError` 콜백에서 Toast 메시지 표시
- [ ] 통합 시나리오 테스트:
  - [ ] SCN-01: 회원가입 → 로그인 → 할일 추가 → 로그아웃 흐름
  - [ ] SCN-02: 로그인 후 페이지 새로고침 → 재로그인 요구 확인 (메모리 토큰)
  - [ ] SCN-03: 할일 필터링(카테고리·기간·완료 여부) 조합 동작 확인
  - [ ] SCN-04: 할일 있는 카테고리 삭제 시 에러 메시지 확인
  - [ ] SCN-05: 다른 탭에서 토큰 만료 후 자동 갱신 실패 시 로그인 페이지 이동 확인
- [ ] 반응형 UI 최종 확인 (모바일·태블릿·데스크톱)

**의존하는 Task:** FE-09, FE-10, FE-11, FE-12
**예상 소요 시간:** 2.5시간

---

## 6. 의존성 맵

```
[DB]
DB-01 ──────────────────── DB-02
     └── DB-03
     └── DB-04
     └── DB-05

[BE]
BE-01 ── BE-02 ── BE-03 ──┬── BE-04 ── BE-05
                           ├── BE-06  (DB-03)
                           ├── BE-07  (DB-04)
                           ├── BE-08 ─┐
                           └── BE-09 ─┴── BE-10

[FE]
FE-01 ── FE-02 ── FE-03 ── FE-04 ──┬── FE-05 ──┬── FE-06
                                    │            ├── FE-07 ── FE-08 ── FE-09
                                    │            ├── FE-10
                                    │            └── FE-11
                                    └─────────────── FE-12 ── FE-13
```

---

## 7. Task 요약 및 예상 일정

### Task 목록 (총 28개)

| ID | 영역 | Task 제목 | 예상 시간 | 의존성 |
|----|------|----------|----------|--------|
| DB-01 | DB | PostgreSQL 연결 풀 설정 | 1.5h | 없음 |
| DB-02 | DB | 시드 데이터 — 기본 카테고리 초기화 | 1h | DB-01 |
| DB-03 | DB | User 레포지터리 구현 | 2h | DB-01 |
| DB-04 | DB | Category 레포지터리 구현 | 2h | DB-01 |
| DB-05 | DB | Todo 레포지터리 구현 | 3h | DB-01 |
| BE-01 | BE | 프로젝트 초기화 및 디렉토리 구조 생성 | 1h | 없음 |
| BE-02 | BE | 공통 유틸리티 구현 | 2h | BE-01 |
| BE-03 | BE | Express 앱 기반 설정 | 2h | BE-01, BE-02 |
| BE-04 | BE | 인증 API — 회원가입·로그인 | 2.5h | BE-02, BE-03, DB-03 |
| BE-05 | BE | 인증 API — 토큰 갱신·로그아웃 | 1.5h | BE-04 |
| BE-06 | BE | 사용자 정보 API | 2h | BE-03, DB-03 |
| BE-07 | BE | 카테고리 API | 3h | BE-03, DB-04 |
| BE-08 | BE | 할일 조회 API | 2h | BE-03, DB-05 |
| BE-09 | BE | 할일 생성·수정·삭제 API | 3h | BE-03, DB-04, DB-05 |
| BE-10 | BE | 백엔드 통합 검증 | 2h | BE-05~09 |
| FE-01 | FE | 프로젝트 초기화 및 디렉토리 구조 생성 | 1.5h | 없음 |
| FE-02 | FE | 공통 타입 및 상수 정의 | 1.5h | FE-01 |
| FE-03 | FE | API 클라이언트 및 Zustand 인증 Store | 2.5h | FE-02 |
| FE-04 | FE | API 함수 및 React Router 설정 | 2h | FE-02, FE-03 |
| FE-05 | FE | 공통 UI 컴포넌트 구현 | 4h | FE-03 |
| FE-06 | FE | 인증 화면 — 로그인·회원가입 | 3h | FE-04, FE-05 |
| FE-07 | FE | 할일 목록 페이지 기본 구현 | 3h | FE-04, FE-05 |
| FE-08 | FE | 할일 필터링·정렬·페이지네이션 | 3h | FE-07 |
| FE-09 | FE | 할일 CRUD — 추가·수정·삭제·토글 | 3.5h | FE-07, FE-05 |
| FE-10 | FE | 카테고리 관리 페이지 | 3h | FE-04, FE-05 |
| FE-11 | FE | 프로필 관리 페이지 | 2.5h | FE-04, FE-05 |
| FE-12 | FE | 반응형 디자인 | 3h | FE-06, FE-07, FE-10, FE-11 |
| FE-13 | FE | 공통 에러 처리 및 통합 검증 | 2.5h | FE-09~12 |

### 예상 총 소요 시간

| 영역 | Task 수 | 예상 시간 |
|------|--------|----------|
| **DB** | 5개 | **9.5시간** |
| **BE** | 10개 | **21시간** |
| **FE** | 13개 | **35시간** |
| **합계** | **28개** | **65.5시간** |

> 병렬 작업 가정 시 (DB-03·04·05 동시, BE-06·07·08 동시, FE-06·07·10·11 동시) 실제 경과 시간 단축 가능.

### 권장 개발 순서 (혼자 순차 개발 기준)

```
주차 1  │  DB-01~05 + BE-01~03  (기반 구축)
주차 2  │  BE-04~10             (API 전체 완성)
주차 3  │  FE-01~07             (FE 기반 + 인증 + 목록)
주차 4  │  FE-08~13             (기능 완성 + 반응형 + 검증)
```

---

## 8. 완료 기준 체크리스트 (최종)

### 데이터베이스
- [ ] `database/schema.sql` 실행 시 에러 없이 테이블·인덱스·트리거 생성
- [ ] `npm run db:seed` 실행 시 기본 카테고리 3건 생성 (멱등성 보장)
- [ ] User·Category·Todo 레포지터리 함수가 Parameterized Query로 구현됨

### 백엔드
- [ ] `npm run dev` 시 서버 정상 시작, `GET /health` 200 응답
- [ ] 인증 API 4개 모두 동작 (회원가입·로그인·토큰갱신·로그아웃)
- [ ] 카테고리 CRUD API 모두 동작 + BR-03·BR-08 적용 확인
- [ ] 할일 CRUD·필터링 API 모두 동작 + BR-02·BR-05·BR-06 적용 확인
- [ ] 사용자 정보 수정 API 동작 + BR-09 적용 확인
- [ ] 모든 보호 엔드포인트에 JWT 인증 적용 (미인증 시 401)

### 프론트엔드
- [ ] `npm run dev` 시 앱 정상 실행
- [ ] 회원가입 → 로그인 → 할일 CRUD → 로그아웃 전체 흐름 동작
- [ ] 페이지 새로고침 시 로그인 페이지로 이동 (메모리 토큰 초기화)
- [ ] Access Token 만료 시 Refresh Token으로 자동 갱신 동작
- [ ] 카테고리 관리 페이지: 기본 카테고리 보호, 삭제 제약 처리
- [ ] 할일 필터링(카테고리·기간·완료 여부) 조합 동작
- [ ] 모바일(375px) 기준 레이아웃 정상 표시

---

## 참고 자료

- **PRD:** `docs/2-prd.md` (v1.2) — 기능 요구사항, API 스펙
- **ERD:** `docs/6-erd.md` (v1.0) — 엔티티·관계 정의
- **아키텍처:** `docs/5-arch-diagram.md` (v1.1) — 레이어 구조
- **프로젝트 구조:** `docs/4-project-principle.md` (v1.2) — 디렉토리·네이밍 규칙
- **DDL:** `database/schema.sql` — 테이블·인덱스·트리거 정의
