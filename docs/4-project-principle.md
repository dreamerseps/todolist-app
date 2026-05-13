# 프로젝트 구조 설계 원칙 - TodoListApp

**작성일:** 2026-05-13  
**버전:** 1.0  
**참조 문서:** 
- 도메인 정의서 v1.0
- 제품 요구사항 정의서(PRD) v1.1
- 사용자 시나리오 문서 v1.0
- 유스케이스 다이어그램 v1.0

---

## 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0 | 2026-05-13 | yoseb lee | 최초 작성 — 전체 스택 공통 원칙, 의존성 레이어, 코드/네이밍 규칙, 테스트 원칙, 설정/보안/운영 원칙, 프론트엔드/백엔드 디렉토리 구조 정의 |
| 1.1 | 2026-05-13 | yoseb lee | 기술 스택 일관성 검토 반영 — axios interceptor 용어 정정, 백엔드 types/ 확장자 .ts→.js 일관화 |
| 1.2 | 2026-05-13 | yoseb lee | 인증 방식 변경 — Refresh Token 저장 위치를 httpOnly Cookie → Zustand 메모리로 변경, CORS credentials 비활성화 |

---

## 1. 전체 스택 공통 최상위 원칙

### 1.1 관심사 분리 (Separation of Concerns)

**원칙:** 각 계층과 모듈은 단 하나의 책임만 가지며, 다른 영역의 관심사와 명확하게 분리되어야 한다.

**근거:** 코드 유지보수성과 재사용성을 높이고, 한 영역의 변경이 다른 영역에 미치는 영향을 최소화한다.

**TodoListApp 적용 예시:**
- 프론트엔드: UI 렌더링(Component) ≠ 데이터 관리(Store) ≠ API 통신(API Client)
- 백엔드: 라우팅(Router) ≠ 요청 처리(Controller) ≠ 비즈니스 로직(Service) ≠ 데이터 접근(Repository)
- 예: 할일 목록 조회 시, Component는 UI 렌더링만 담당하고 로직은 Custom Hook(useGetTodos)에서 처리

### 1.2 단일 책임 원칙 (Single Responsibility Principle, SRP)

**원칙:** 하나의 함수, 클래스, 모듈은 변경의 이유가 하나만 있어야 한다.

**근거:** 코드의 응집도를 높이고 의존도를 낮춰서 테스트와 리팩토링이 용이해진다.

**TodoListApp 적용 예시:**
- `todoRepository.js`: PostgreSQL 쿼리만 담당 (SELECT, INSERT, UPDATE, DELETE)
- `todoService.js`: 비즈니스 로직만 담당 (검증, 필터링, 권한 확인)
- `todoController.js`: HTTP 요청/응답 처리만 담당
- 반례: 한 함수에서 DB 쿼리 + 비즈니스 로직 + HTTP 응답 구성하기 (금지)

### 1.3 인터페이스 기반 설계

**원칙:** TypeScript의 `interface`/`type`을 활용하여 명시적인 계약(contract)을 정의하고, 구현체는 이를 준수하도록 설계한다.

**근거:** 타입 안정성을 높이고, 코드 가독성을 개선하며, 추후 구현 교체가 용이해진다.

**TodoListApp 적용 예시:**
```typescript
// 프론트엔드: API 응답 타입 정의
type TodoItem = {
  id: string;
  userId: string;
  categoryId: string;
  title: string;
  description: string;
  dueDate: string | null;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
};

// 백엔드: API 응답 구조 정의
interface ApiResponse<T> {
  success: boolean;
  code: string;
  message: string;
  data?: T;
  detail?: string;
}
```

### 1.4 불변성(Immutability) 우선

**원칙:** 데이터는 가능한 한 불변으로 취급하며, 필요한 경우에만 새로운 객체를 생성한다.

**근거:** 상태 예측 가능성을 높이고, 버그 발생 확률을 줄이며, React의 렌더링 최적화를 활용할 수 있다.

**TodoListApp 적용 예시:**
```typescript
// 프론트엔드: Zustand 상태 업데이트
// 좋음: 새로운 배열/객체 생성
const addTodo = (todo: TodoItem) => {
  set(state => ({
    todos: [...state.todos, todo]
  }));
};

// 나쁨: 기존 배열 직접 변경
const addTodo = (todo: TodoItem) => {
  const state = get();
  state.todos.push(todo); // 절대 금지
};

// 백엔드: Object.assign 또는 spread 연산자 사용
const updatedTodo = { ...existingTodo, title: newTitle };
```

### 1.5 명시적 의존성 (Explicit Dependencies)

**원칙:** 함수/클래스가 의존하는 것들은 매개변수나 생성자를 통해 명시적으로 전달받으며, 숨겨진 전역 상태나 implicit 의존성을 금지한다.

**근거:** 코드의 흐름을 명확히 파악할 수 있고, 테스트 시 의존성 주입이 용이하며, 부수 효과(side effect)를 예측 가능하게 만든다.

**TodoListApp 적용 예시:**
```typescript
// 프론트엔드: Custom Hook의 명시적 의존성
function useFetchTodos(filterParams?: FilterParams) {
  // ✓ TanStack Query 의존성은 Hook 내부에서만 활용
  // ✓ filterParams는 매개변수로 명시적 수신
  const query = useQuery({
    queryKey: ['todos', filterParams],
    queryFn: () => apiClient.getTodos(filterParams),
  });
  return query;
}

// 백엔드: 서비스 계층의 명시적 의존성
class TodoService {
  constructor(
    private todoRepository: TodoRepository,
    private categoryRepository: CategoryRepository,
    private logger: Logger
  ) {}
  
  async updateTodo(todoId: string, userId: string, data: UpdateTodoDTO) {
    // 의존성이 모두 constructor를 통해 전달됨 (명시적)
    const todo = await this.todoRepository.findById(todoId);
    // ...
  }
}

// 반례: 전역 변수나 singleton 직접 접근 (금지)
const updatedTodo = updateTodo(todoId); // db 연결을 어디서 가져오는가? 불명확
```

---

## 2. 의존성 / 레이어 원칙

### 2.1 프론트엔드 레이어 구조

프론트엔드는 아래와 같은 단방향 의존성을 따른다:

```
UI Component (표현)
    ↓ (의존)
Custom Hook (로직)
    ↓ (의존)
TanStack Query (서버 상태 관리)
    ↓ (의존)
API Client (HTTP 통신)
    ↓ (의존)
Zustand Store (클라이언트 상태)
```

**각 레이어의 역할:**

| 레이어 | 책임 | 예시 |
|--------|------|------|
| **UI Component** | 화면 렌더링, 사용자 입력 수신 | `<TodoList />`, `<AddTodoForm />` |
| **Custom Hook** | 로직 재사용, 상태 로직 추상화 | `useFetchTodos()`, `useAddTodo()` |
| **TanStack Query** | 서버 상태 동기화, 캐싱, 재요청 | useQuery, useMutation |
| **API Client** | HTTP 요청 빌드 및 송신 | `apiClient.getTodos()` |
| **Zustand Store** | 글로벌 클라이언트 상태(토큰, 유저 정보 등) | `useAuthStore()` |

**단방향 의존성 규칙:**
- ✓ Component는 Custom Hook을 호출할 수 있다
- ✓ Custom Hook은 TanStack Query와 Zustand을 사용할 수 있다
- ✓ API Client는 Zustand(토큰 가져오기)에 접근할 수 있다
- ✗ Custom Hook이 Component를 호출하지 않는다 (역방향 의존 금지)
- ✗ API Client가 Component를 직접 수정하지 않는다
- ✗ TanStack Query가 Zustand을 무분별하게 변경하지 않는다

### 2.2 백엔드 레이어 구조

백엔드는 아래와 같은 단방향 의존성을 따른다:

```
HTTP Request
    ↓
Router (라우트 정의)
    ↓ (의존)
Middleware (JWT 검증, 에러 처리)
    ↓ (의존)
Controller (요청 처리, 응답 구성)
    ↓ (의존)
Service (비즈니스 로직, 검증)
    ↓ (의존)
Repository (DB 쿼리)
    ↓ (의존)
PostgreSQL (pg 라이브러리)
```

**각 레이어의 역할:**

| 레이어 | 책임 | 예시 |
|--------|------|------|
| **Router** | HTTP 메서드와 엔드포인트 정의 | `router.get('/todos', controller.getTodos)` |
| **Middleware** | 인증, 권한 검증, 에러 처리 | JWT 검증, CORS 설정 |
| **Controller** | 요청 파라미터 파싱, 서비스 호출, 응답 구성 | HTTP 요청 수신 → 서비스 호출 → 응답 반환 |
| **Service** | 핵심 비즈니스 로직, 검증, 도메인 규칙 | 할일 조회 + 필터링, 카테고리 삭제 가능 여부 확인 |
| **Repository** | SQL 쿼리 빌드 및 실행, DB 접근 | SELECT, INSERT, UPDATE, DELETE |

**단방향 의존성 규칙:**
- ✓ Router는 Middleware를 거쳐 Controller를 호출한다
- ✓ Controller는 Service를 호출한다
- ✓ Service는 Repository를 호출한다
- ✗ Repository가 Service로직을 포함하지 않는다 (데이터 접근만)
- ✗ Service가 HTTP 응답을 직접 구성하지 않는다
- ✗ Repository가 비즈니스 검증을 수행하지 않는다

### 2.3 레이어 간 데이터 흐름

**프론트엔드:**
```
User Input → Component → Custom Hook → TanStack Query → API Client → HTTP POST → 서버
← API Response → TanStack Query → Store 업데이트 → Component 리렌더링 ← 사용자 화면
```

**백엔드:**
```
HTTP Request → Router → Middleware(JWT) → Controller → Service → Repository → DB
← DB Response → Repository → Service(로직) → Controller(응답 구성) → HTTP Response
```

---

## 3. 코드 / 네이밍 원칙

### 3.1 파일명 규칙

| 대상 | 규칙 | 예시 |
|------|------|------|
| **React 컴포넌트** | PascalCase | `TodoList.tsx`, `AddTodoForm.tsx`, `Button.tsx` |
| **Custom Hook** | camelCase, `use` 접두사 | `useFetchTodos.ts`, `useAddTodo.ts` |
| **유틸리티 함수** | camelCase | `formatDate.ts`, `validateEmail.ts` |
| **상수 파일** | camelCase 또는 index | `constants.ts`, `apiEndpoints.ts` |
| **타입 정의** | index.ts 또는 정의 관련명 | `types/index.ts`, `types/todo.ts` |
| **백엔드 모듈** | camelCase + 목적 | `todoRepository.js`, `todoService.js`, `todos.router.js` |
| **설정/환경** | camelCase | `config.js`, `database.js` |

### 3.2 함수/변수명 규칙

**프론트엔드 & 백엔드 공통:**

| 대상 | 규칙 | 예시 |
|------|------|------|
| **일반 함수** | camelCase, 동사 시작 | `fetchTodos()`, `validateForm()`, `calculateTotal()` |
| **조건 판별 함수** | camelCase, `is`/`has` 접두사 | `isCompleted`, `hasPermission()`, `isValidEmail()` |
| **상수** | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`, `DEFAULT_PAGE_SIZE`, `API_BASE_URL` |
| **일반 변수** | camelCase | `todoList`, `userEmail`, `filterParams` |
| **boolean 변수** | camelCase, `is`/`has` 접두사 | `isLoading`, `hasError`, `shouldRefresh` |

**프론트엔드 특화:**

| 대상 | 규칙 | 예시 |
|------|------|------|
| **Store 액션** | camelCase, 동사 또는 상태명 | `setTodos()`, `addTodo()`, `clearFilter()` |
| **Query Key** | camelCase + 배열 요소 | `['todos']`, `['todos', userId, filterParams]` |
| **Event Handler** | camelCase, `handle` 접두사 | `handleAddTodo()`, `handleDeleteClick()` |

**백엔드 특화:**

| 대상 | 규칙 | 예시 |
|------|------|------|
| **Controller 메서드** | camelCase, 동사 시작 | `getTodos()`, `createTodo()`, `updateCategory()` |
| **Service 메서드** | camelCase, 동사 시작 | `fetchUserTodos()`, `validateCategoryDeletion()` |
| **Repository 메서드** | camelCase, `find`/`create`/`update`/`delete` | `findById()`, `createTodo()`, `updateByUserId()` |

### 3.3 TypeScript 타입/인터페이스 네이밍

**원칙:** `I` prefix를 사용하지 않으며, 타입과 인터페이스는 PascalCase를 따른다.

| 대상 | 규칙 | 예시 |
|------|------|------|
| **인터페이스 (API 응답)** | PascalCase, 목적 명시 | `TodoItem`, `UserProfile`, `ApiResponse<T>` |
| **타입 (조건부 타입)** | PascalCase, 용도 명시 | `TodoFilter`, `CategoryWithCount`, `PaginatedResult<T>` |
| **DTO (Data Transfer Object)** | PascalCase, `DTO` suffix | `CreateTodoDTO`, `UpdateCategoryDTO` |
| **요청 본문 타입** | PascalCase, `Request` suffix (선택) | `CreateTodoRequest` 또는 `CreateTodoDTO` |
| **응답 본문 타입** | PascalCase, `Response` suffix (선택) | `GetTodosResponse` 또는 `TodoItem[]` |

**반례 (금지):**
```typescript
// ✗ I prefix 사용 금지
interface ITodoItem { }
interface IUserProfile { }

// ✓ 올바른 형식
interface TodoItem { }
type TodoItem = { }
```

### 3.4 API 응답 타입 네이밍

**API 응답 구조:**
```typescript
// 프론트엔드에서 기대하는 형식
type ApiResponse<T> = {
  success: boolean;
  code: string; // 예: "SUCCESS", "TODO_NOT_FOUND", "UNAUTHORIZED"
  message: string; // 사용자 친화적 메시지
  data?: T; // 성공 시에만 존재
  detail?: string; // 개발자 용 상세 정보 (선택)
};

// 구체적 예시
type GetTodosResponse = ApiResponse<TodoItem[]>;
type CreateTodoResponse = ApiResponse<TodoItem>;
type ErrorResponse = ApiResponse<null>;
```

### 3.5 DB 컬럼명과 TypeScript 변수명 변환 규칙

**원칙:** PostgreSQL 테이블의 컬럼명은 `snake_case`이고, TypeScript 객체의 속성명은 `camelCase`로 자동 변환된다.

**DB 스키마 (snake_case):**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE todos (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  category_id UUID NOT NULL REFERENCES categories(id),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  due_date DATE,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**TypeScript 타입 (camelCase):**
```typescript
// Repository에서 반환하는 타입 (DB 그대로)
interface UserRow {
  id: string;
  email: string;
  password_hash: string; // Repository 계층에서는 스네이크 케이스 허용
  full_name: string;
  created_at: string;
  updated_at: string;
}

// Service에서 반환하는 타입 (변환됨)
interface User {
  id: string;
  email: string;
  passwordHash: string; // 또는 숨김 (password_hash 제외)
  fullName: string;
  createdAt: string;
  updatedAt: string;
}

// 프론트엔드에서 사용하는 타입 (camelCase)
type UserProfile = {
  id: string;
  email: string;
  name: string; // fullName → name으로 단순화 가능
  createdAt: string;
};
```

**변환 규칙:**
- Repository 계층: DB 컬럼명 그대로 사용 가능 (snake_case)
- Service 계층: camelCase로 변환하여 반환
- Controller 계층: Service에서 받은 camelCase 객체 그대로 응답
- 프론트엔드: API 응답을 camelCase로 수신 및 사용

**구현 헬퍼 (필요시):**
```typescript
// Utility: snake_case → camelCase 자동 변환
function toCamelCase(obj: any): any {
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  if (obj === null || typeof obj !== 'object') return obj;
  
  return Object.keys(obj).reduce((result, key) => {
    const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    result[camelKey] = toCamelCase(obj[key]);
    return result;
  }, {});
}

// 사용 예
const userRow = { id: '123', full_name: 'John Doe', created_at: '2026-05-13' };
const user = toCamelCase(userRow); // { id: '123', fullName: 'John Doe', createdAt: '2026-05-13' }
```

---

## 4. 테스트 / 품질 원칙

### 4.1 백엔드 테스트 범위

| 계층 | 테스트 유형 | 범위 | 예시 |
|------|-----------|------|------|
| **Repository** | 통합 테스트 (실제 DB) | pg 쿼리 실행 및 결과 검증 | `findById()`, `updateByUserId()` 등 SQL 정합성 확인 |
| **Service** | 단위 테스트 + 통합 테스트 | 비즈니스 로직, 검증, 에러 처리 | `updateTodo()` 권한 확인, 할일 필터링 로직 |
| **Controller** | 통합 테스트 (API 엔드포인트) | HTTP 요청/응답, 상태 코드, 에러 응답 | `GET /api/todos`, `POST /api/todos` 등 |
| **Middleware** | 통합 테스트 | JWT 검증, 에러 처리 | 토큰 만료 시 401 응답, 잘못된 토큰 등 |

**중요:** Repository 계층은 **실제 PostgreSQL 데이터베이스를 사용**하며, mocking은 금지한다.
- 원인: pg 라이브러리를 직접 사용하므로, 실제 쿼리 문법과 DB 동작을 검증해야 함

### 4.2 프론트엔드 테스트 범위

| 대상 | 테스트 유형 | 범위 | 예시 |
|------|-----------|------|------|
| **UI Component** | 렌더링 테스트 | 문자 렌더링, 클릭 이벤트, 조건부 렌더링 | `<TodoList />` 데이터 렌더링, 삭제 버튼 클릭 |
| **Custom Hook** | 단위 테스트 + 통합 테스트 | Hook 로직, TanStack Query 상호작용 | `useFetchTodos()` 데이터 로드, `useAddTodo()` 성공/실패 |
| **Zustand Store** | 단위 테스트 | 상태 업데이트, 액션 실행 | `setAuthToken()`, `clearAuthState()` |

**테스트 도구:**
- 컴포넌트: React Testing Library (RTL) 또는 Vitest
- Hook: @testing-library/react-hooks 또는 Vitest
- Store: Vitest + 직접 호출

### 4.3 커버리지 목표

| 계층 | 목표 | 주의사항 |
|------|------|---------|
| **백엔드 Service** | 70% 이상 | 핵심 비즈니스 로직 우선 |
| **백엔드 Controller** | 60% 이상 | HTTP 상태 코드, 에러 응답 확인 |
| **백엔드 Repository** | 80% 이상 | 실제 DB 연동 필수 (모든 CRUD 경로) |
| **프론트엔드 Component** | 50% 이상 | 주요 화면과 상호작용 우선 |
| **프론트엔드 Hook** | 70% 이상 | 데이터 페칭, 에러 처리 로직 |

**목표 달성 우선순위:**
1. Service 계층 (비즈니스 규칙 검증)
2. Repository 계층 (DB 쿼리 정합성)
3. Component 테스트 (주요 UI)
4. Hook 테스트 (상태 관리 로직)

---

## 5. 설정 / 보안 / 운영 원칙

### 5.1 환경변수 관리

**백엔드 `.env.example` 구조:**

```env
# 서버
NODE_ENV=development
PORT=3001

# 데이터베이스
DB_HOST=localhost
DB_PORT=5432
DB_NAME=todolist_app
DB_USER=postgres
DB_PASSWORD=your_secure_password

# JWT
JWT_ACCESS_SECRET=your_access_token_secret_key_min_32_chars
JWT_REFRESH_SECRET=your_refresh_token_secret_key_min_32_chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# 보안
BCRYPT_ROUNDS=10
CORS_ORIGIN=http://localhost:3000

# 로깅
LOG_LEVEL=info
```

**프론트엔드 `.env.example` 구조:**

```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_APP_NAME=TodoListApp
VITE_APP_VERSION=1.0.0
```

**규칙:**
- 민감 정보(비밀키, 비밀번호, DB 접속)는 환경변수로 관리
- `.env` 파일은 `.gitignore`에 추가 (`.env.example`은 커밋)
- 프론트엔드 환경변수는 `VITE_` prefix 사용
- 백엔드는 `process.env` 또는 config 파일에서 로드

**접근 패턴:**
```javascript
// 백엔드
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'todolist_app',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
};

// 프론트엔드 (Vite)
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
```

### 5.2 JWT 비밀키 및 토큰 설정

**Access Token:**
- 만료 시간: **15분** (보안)
- 저장 위치: **메모리 (Zustand Store)** (CSRF 공격 방지)
- 포함 정보: `userId`, `email` (민감 정보 제외)

**Refresh Token:**
- 만료 시간: **7일** (사용 편의성)
- 저장 위치: **메모리 (Zustand Store)** (구현 단순화)
- 포함 정보: `userId` (최소한의 정보)
- 주의: 페이지 새로고침 시 토큰이 초기화되어 재로그인이 필요하다.

**토큰 발급 및 갱신:**
```javascript
// 백엔드: 로그인 시
const accessToken = jwt.sign(
  { userId, email },
  process.env.JWT_ACCESS_SECRET,
  { expiresIn: '15m' } // 15분
);

const refreshToken = jwt.sign(
  { userId },
  process.env.JWT_REFRESH_SECRET,
  { expiresIn: '7d' } // 7일
);

// 백엔드: 두 토큰 모두 JSON 응답으로 반환
res.json({ accessToken, refreshToken });

// 프론트엔드: 토큰 갱신 (axios interceptor)
if (error.response.status === 401) {
  // Zustand Store에서 Refresh Token 조회
  const { refreshToken } = useAuthStore.getState();
  const { data } = await apiClient.post('/auth/refresh', { refreshToken });
  // 새 Access Token을 Zustand Store에 저장
  useAuthStore.setState({ accessToken: data.accessToken });
}
```

### 5.3 bcrypt 해싱 설정

**규칙:**
- bcrypt Rounds: **10** (기본값, 약 100ms 소요)
- 모든 패스워드는 저장 전 해싱 필수
- 로그인 시 입력 패스워드와 저장된 해시를 `bcrypt.compare()`로 검증

**구현:**
```javascript
// 회원가입 시
const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '10');
const passwordHash = await bcrypt.hash(password, saltRounds);
// DB에 passwordHash 저장

// 로그인 시
const isPasswordValid = await bcrypt.compare(inputPassword, storedPasswordHash);
if (!isPasswordValid) {
  throw new UnauthorizedError('이메일 또는 비밀번호가 올바르지 않습니다');
}
```

### 5.4 CORS 설정 원칙

**백엔드 CORS 정책:**

```javascript
import cors from 'cors';

const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: false, // Cookie 미사용 (토큰은 Zustand 메모리 저장)
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
```

**규칙:**
- 프로덕션에서는 `CORS_ORIGIN` 환경변수로 화이트리스트 지정
- 개발 환경: `http://localhost:3000`
- `credentials: false` — 토큰은 Zustand 메모리에만 저장하므로 Cookie 불필요

### 5.5 에러 응답 표준 포맷

**모든 API 응답은 아래 구조를 따른다:**

```typescript
// 성공 응답 (200)
{
  "success": true,
  "code": "SUCCESS",
  "message": "할일이 등록되었습니다",
  "data": { /* 실제 응답 데이터 */ }
}

// 클라이언트 오류 (400, 404 등)
{
  "success": false,
  "code": "TODO_NOT_FOUND",
  "message": "요청한 할일을 찾을 수 없습니다",
  "detail": "ID: 123e4567-e89b-12d3-a456-426614174000"
}

// 인증 오류 (401)
{
  "success": false,
  "code": "UNAUTHORIZED",
  "message": "인증이 필요합니다",
  "detail": "유효한 JWT 토큰이 없습니다"
}

// 권한 오류 (403)
{
  "success": false,
  "code": "FORBIDDEN",
  "message": "접근 권한이 없습니다",
  "detail": "해당 리소스에 접근할 수 없습니다"
}

// 서버 오류 (500)
{
  "success": false,
  "code": "INTERNAL_SERVER_ERROR",
  "message": "서버 오류가 발생했습니다",
  "detail": "[프로덕션 환경에서는 생략]"
}
```

**에러 코드 정의:**

| 코드 | HTTP 상태 | 설명 |
|------|----------|------|
| SUCCESS | 200 | 성공 |
| CREATED | 201 | 리소스 생성 성공 |
| BAD_REQUEST | 400 | 잘못된 요청 (입력 검증 실패) |
| UNAUTHORIZED | 401 | 인증 필요 (토큰 없음 또는 만료) |
| FORBIDDEN | 403 | 권한 부족 (BR-02 위반 등) |
| NOT_FOUND | 404 | 리소스 없음 |
| CONFLICT | 409 | 충돌 (중복 이메일, BR-07 위반 등) |
| UNPROCESSABLE_ENTITY | 422 | 처리 불가 (비즈니스 규칙 위반, BR-08 등) |
| INTERNAL_SERVER_ERROR | 500 | 서버 오류 |

**백엔드 구현:**
```javascript
// 에러 핸들러 미들웨어
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || '서버 오류가 발생했습니다';
  const detail = process.env.NODE_ENV === 'development' ? err.stack : undefined;

  res.status(statusCode).json({
    success: false,
    code,
    message,
    detail,
  });
});
```

### 5.6 로깅 원칙

**요청/응답 로깅:**
- 모든 API 요청은 timestamp, method, path, status code 기록
- 민감 정보(비밀번호, 토큰)는 로깅 제외
- 응답 시간(response time) 기록

**에러 로깅:**
- 모든 서버 오류는 ERROR 레벨로 기록
- 스택 트레이스 포함
- 요청 ID를 통해 추적 가능하게 구성

**로깅 레벨:**
| 레벨 | 용도 | 예시 |
|------|------|------|
| DEBUG | 상세 디버깅 정보 | 쿼리 실행 시간, 중간 처리 과정 |
| INFO | 일반 정보 | API 요청, 사용자 가입/로그인 |
| WARN | 경고 | 재시도 시도, 성능 저하 |
| ERROR | 오류 | 예외 발생, 데이터 무결성 오류 |

**구현 예시:**
```javascript
// 요청 로깅 미들웨어
app.use((req, res, next) => {
  const startTime = Date.now();
  const requestId = generateRequestId();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info({
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id, // 인증된 경우만
    });
  });

  next();
});

// 에러 로깅
logger.error({
  requestId,
  error: err.message,
  stack: err.stack,
  statusCode: err.statusCode,
});
```

---

## 6. 프론트엔드 디렉토리 구조

```
frontend/
├── src/
│   ├── api/                          # API 클라이언트 및 엔드포인트
│   │   ├── index.ts                  # axios 인스턴스 내보내기
│   │   ├── client.ts                 # axios 설정 및 interceptor
│   │   ├── auth.api.ts               # POST /auth/signup, /auth/login 등
│   │   ├── users.api.ts              # GET /users/me, PATCH /users/me
│   │   ├── categories.api.ts         # GET/POST/PATCH/DELETE /categories
│   │   └── todos.api.ts              # GET/POST/PATCH/DELETE /todos
│   │
│   ├── components/                   # 공통 UI 컴포넌트 (재사용 가능)
│   │   ├── Button/                   # Button 컴포넌트
│   │   │   ├── Button.tsx
│   │   │   ├── Button.module.css
│   │   │   └── index.ts
│   │   ├── Input/                    # Input 컴포넌트
│   │   ├── Modal/                    # Modal 컴포넌트
│   │   ├── Loading/                  # Loading 스피너
│   │   ├── Checkbox/                 # Checkbox 컴포넌트
│   │   ├── Select/                   # Select/Dropdown 컴포넌트
│   │   └── Header/                   # 헤더 (네비게이션, 로그아웃 등)
│   │
│   ├── features/                     # 도메인별 기능 모듈 (Vertical Slicing)
│   │   ├── auth/                     # 인증 (회원가입, 로그인, 로그아웃)
│   │   │   ├── components/           # 인증 관련 컴포넌트
│   │   │   │   ├── SignupForm.tsx
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   └── ProtectedRoute.tsx
│   │   │   ├── hooks/                # 인증 관련 Custom Hook
│   │   │   │   ├── useSignup.ts
│   │   │   │   ├── useLogin.ts
│   │   │   │   └── useLogout.ts
│   │   │   ├── types/                # 인증 타입
│   │   │   │   └── index.ts
│   │   │   └── index.ts              # 모듈 export
│   │   │
│   │   ├── todos/                    # 할일 관리 (CRUD, 목록, 필터)
│   │   │   ├── components/
│   │   │   │   ├── TodoList.tsx      # 할일 목록 컴포넌트
│   │   │   │   ├── TodoItem.tsx      # 할일 아이템 컴포넌트
│   │   │   │   ├── AddTodoForm.tsx   # 할일 추가 폼
│   │   │   │   ├── EditTodoForm.tsx  # 할일 수정 폼
│   │   │   │   ├── TodoFilter.tsx    # 필터 UI
│   │   │   │   └── TodoPagination.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useFetchTodos.ts  # 할일 목록 조회
│   │   │   │   ├── useFetchTodo.ts   # 할일 단건 조회
│   │   │   │   ├── useAddTodo.ts     # 할일 등록
│   │   │   │   ├── useUpdateTodo.ts  # 할일 수정
│   │   │   │   ├── useDeleteTodo.ts  # 할일 삭제
│   │   │   │   └── useTodoFilter.ts  # 필터 로직
│   │   │   ├── types/
│   │   │   │   ├── index.ts
│   │   │   │   └── filter.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── categories/               # 카테고리 관리
│   │   │   ├── components/
│   │   │   │   ├── CategoryList.tsx
│   │   │   │   ├── CategoryForm.tsx  # 추가/수정 폼
│   │   │   │   └── CategoryItem.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useFetchCategories.ts
│   │   │   │   ├── useAddCategory.ts
│   │   │   │   ├── useUpdateCategory.ts
│   │   │   │   └── useDeleteCategory.ts
│   │   │   ├── types/
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   └── profile/                  # 개인 정보 수정
│   │       ├── components/
│   │       │   ├── ProfileForm.tsx
│   │       │   └── ChangePasswordForm.tsx
│   │       ├── hooks/
│   │       │   ├── useUpdateProfile.ts
│   │       │   └── useChangePassword.ts
│   │       ├── types/
│   │       │   └── index.ts
│   │       └── index.ts
│   │
│   ├── hooks/                        # 공통 Custom Hook
│   │   ├── useAuth.ts                # 인증 상태 조회
│   │   ├── useApiError.ts            # API 에러 처리
│   │   ├── useAsync.ts               # 비동기 작업 공통 로직
│   │   └── useQueryParams.ts         # URL 쿼리 파라미터 파싱
│   │
│   ├── pages/                        # 라우트 단위 페이지 컴포넌트
│   │   ├── LoginPage.tsx             # /login
│   │   ├── SignupPage.tsx            # /signup
│   │   ├── TodosPage.tsx             # /todos (주요 대시보드)
│   │   ├── CategoriesPage.tsx        # /categories
│   │   ├── ProfilePage.tsx           # /profile
│   │   ├── NotFoundPage.tsx          # /404
│   │   └── index.ts
│   │
│   ├── stores/                       # Zustand 상태 관리
│   │   ├── authStore.ts              # 사용자 인증 상태 (토큰, 사용자 정보)
│   │   ├── uiStore.ts                # UI 상태 (로딩, 모달, 토스트 알림)
│   │   └── index.ts
│   │
│   ├── types/                        # TypeScript 공통 타입
│   │   ├── index.ts                  # 전체 타입 export
│   │   ├── common.ts                 # ApiResponse 등 공통 타입
│   │   ├── todo.ts                   # Todo 관련 타입
│   │   ├── category.ts               # Category 관련 타입
│   │   └── user.ts                   # User 관련 타입
│   │
│   ├── utils/                        # 순수 유틸리티 함수
│   │   ├── formatDate.ts             # 날짜 포맷팅
│   │   ├── validateEmail.ts          # 이메일 검증
│   │   ├── validatePassword.ts       # 비밀번호 검증
│   │   └── storage.ts                # localStorage 유틸
│   │
│   ├── constants/                    # 상수 정의
│   │   ├── routes.ts                 # 라우트 경로
│   │   │   // export const ROUTES = { LOGIN: '/login', SIGNUP: '/signup', ... }
│   │   ├── api.ts                    # API 엔드포인트
│   │   │   // export const API_ENDPOINTS = { AUTH: { SIGNUP: '/auth/signup', ... } }
│   │   └── validation.ts             # 검증 규칙
│   │       // export const PASSWORD_MIN_LENGTH = 8
│   │
│   ├── App.tsx                       # 라우트 정의 및 레이아웃
│   ├── App.css
│   └── main.tsx                      # 진입점
│
├── .env.example                       # 환경변수 예시
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### 6.1 features/ 내부 구조 상세 설명

**todos/ 모듈을 예시로:**

```
features/todos/
├── components/
│   ├── TodoList.tsx
│   │   // 할일 목록 렌더링, useFetchTodos() 호출
│   │   // 필터/정렬 상태를 props로 수신
│   │   // 아이템 삭제, 완료 토글 이벤트 처리
│   │
│   ├── TodoItem.tsx
│   │   // 개별 할일 아이템 렌더링
│   │   // onDelete, onToggle 등 콜백 props
│   │   // 체크박스, 제목, 카테고리, 마감일 표시
│   │
│   ├── AddTodoForm.tsx
│   │   // 할일 추가 폼 UI
│   │   // useAddTodo() Hook 사용
│   │   // 성공 시 목록 갱신
│   │
│   ├── EditTodoForm.tsx
│   │   // 할일 수정 폼 UI
│   │   // useUpdateTodo() Hook 사용
│   │   // 기존 할일 데이터 표시
│   │
│   ├── TodoFilter.tsx
│   │   // 필터 UI (카테고리, 기간, 완료 여부)
│   │   // useTodoFilter() Hook으로 필터 상태 관리
│   │   // 필터 변경 시 URLSearchParams 업데이트
│   │
│   ├── TodoSortOptions.tsx
│   │   // 정렬 옵션 드롭다운
│   │   // "등록일시 내림차순", "마감일 오름차순" 등
│   │
│   └── TodoPagination.tsx
│       // 페이지네이션 UI
│       // 페이지 번호, 다음/이전 버튼
│
├── hooks/
│   ├── useFetchTodos.ts
│   │   // 할일 목록 조회
│   │   // useQuery() + filterParams, sort, page를 queryKey에 포함
│   │   // return { data, isLoading, error, refetch }
│   │
│   ├── useFetchTodo.ts
│   │   // 개별 할일 조회 (편집 시)
│   │   // useQuery({ queryKey: ['todos', id] })
│   │
│   ├── useAddTodo.ts
│   │   // 할일 등록
│   │   // useMutation() + useQueryClient().invalidateQueries()
│   │
│   ├── useUpdateTodo.ts
│   │   // 할일 수정
│   │   // useMutation() + invalidateQueries(['todos'])
│   │
│   ├── useDeleteTodo.ts
│   │   // 할일 삭제
│   │   // useMutation() + invalidateQueries(['todos'])
│   │
│   └── useTodoFilter.ts
│       // 필터 상태 관리
│       // URLSearchParams와 Zustand 동기화
│       // return { filters, setFilters, clearFilters }
│
├── types/
│   ├── index.ts
│   │   // export * from './filter'
│   │   // export type TodoItem, TodoCreateRequest, etc.
│   │
│   └── filter.ts
│       // type TodoFilter = { categoryId?: string; fromDate?: string; ... }
│
└── index.ts
    // export { TodoList, AddTodoForm, ... } from './components'
    // export { useFetchTodos, useAddTodo, ... } from './hooks'
```

**각 파일의 책임:**

| 파일 | 책임 |
|------|------|
| `components/*.tsx` | UI 렌더링만. 비즈니스 로직은 Hook에 위임 |
| `hooks/useFetch*.ts` | TanStack Query로 데이터 페칭 |
| `hooks/useAdd/Update/Delete*.ts` | useMutation + invalidateQueries |
| `hooks/useFilter.ts` | 필터 상태 관리 및 URL 동기화 |
| `types/index.ts` | 도메인 타입 정의 |

---

## 7. 백엔드 디렉토리 구조

```
backend/
├── src/
│   ├── config/                       # 설정 및 초기화
│   │   ├── database.js               # PostgreSQL 연결 설정 (pg 라이브러리)
│   │   ├── environment.js            # 환경변수 로드
│   │   └── index.js                  # 설정 export
│   │
│   ├── middlewares/                  # 미들웨어
│   │   ├── errorHandler.js           # 에러 핸들러
│   │   ├── authenticateToken.js      # JWT 검증 미들웨어
│   │   ├── requestLogger.js          # 요청 로깅
│   │   └── corsHandler.js            # CORS 설정
│   │
│   ├── modules/                      # 도메인별 모듈 (Vertical Slicing)
│   │   ├── auth/                     # 인증
│   │   │   ├── auth.router.js        # 라우트 정의
│   │   │   ├── auth.controller.js    # HTTP 요청/응답 처리
│   │   │   ├── auth.service.js       # 비즈니스 로직
│   │   │   ├── auth.types.js         # 타입 정의
│   │   │   └── index.js
│   │   │
│   │   ├── users/                    # 사용자 정보
│   │   │   ├── users.router.js
│   │   │   ├── users.controller.js
│   │   │   ├── users.service.js
│   │   │   ├── users.types.js
│   │   │   └── index.js
│   │   │
│   │   ├── categories/               # 카테고리
│   │   │   ├── categories.router.js
│   │   │   ├── categories.controller.js
│   │   │   ├── categories.service.js
│   │   │   ├── categories.types.js
│   │   │   └── index.js
│   │   │
│   │   └── todos/                    # 할일
│   │       ├── todos.router.js
│   │       ├── todos.controller.js
│   │       ├── todos.service.js
│   │       ├── todos.types.js
│   │       └── index.js
│   │
│   ├── repositories/                 # 데이터 접근 계층 (DB 쿼리)
│   │   ├── userRepository.js         # User 테이블 CRUD
│   │   ├── categoryRepository.js     # Category 테이블 CRUD
│   │   ├── todoRepository.js         # Todo 테이블 CRUD
│   │   └── index.js
│   │
│   ├── utils/                        # 공통 유틸리티
│   │   ├── jwt.js                    # JWT 생성, 검증
│   │   ├── bcrypt.js                 # 비밀번호 해싱, 검증
│   │   ├── validate.js               # 입력 검증 함수
│   │   ├── errors.js                 # 에러 클래스 정의
│   │   └── logger.js                 # 로깅 유틸
│   │
│   ├── types/                        # 공통 타입 (JSDoc 또는 별도 .d.ts 관리)
│   │   ├── index.js
│   │   ├── common.js                 # ApiResponse, AuthPayload 등 (JSDoc 타입)
│   │   └── database.js               # Row 타입 (DB 컬럼명, JSDoc 타입)
│   │
│   ├── app.js                        # Express 앱 초기화
│   │   // express() 생성
│   │   // 미들웨어 등록 (CORS, JSON parser, logger, errorHandler)
│   │   // 라우트 등록 (auth, users, categories, todos)
│   │
│   └── server.js                     # 서버 진입점
│       // app 시작, PORT에서 listen
│       // 환경변수 로드 및 DB 연결
│
├── db/
│   ├── schema.sql                    # 테이블 생성 DDL
│   │   // CREATE TABLE users (...)
│   │   // CREATE TABLE categories (...)
│   │   // CREATE TABLE todos (...)
│   │
│   └── seed.sql                      # 기본 데이터 (기본 카테고리)
│       // INSERT INTO categories (...) VALUES ('업무', true), ('개인', true), ...
│
├── tests/                            # 테스트 파일 (선택)
│   ├── unit/
│   │   ├── services/
│   │   │   └── todos.service.test.js
│   │   └── utils/
│   │       └── jwt.test.js
│   │
│   └── integration/
│       ├── endpoints/
│       │   ├── auth.test.js
│       │   ├── todos.test.js
│       │   └── categories.test.js
│       │
│       └── repositories/
│           ├── todoRepository.test.js (실제 DB 사용)
│           └── categoryRepository.test.js
│
├── .env.example                      # 환경변수 예시
├── .gitignore
├── package.json
├── tsconfig.json (TypeScript 사용 시)
└── README.md
```

### 7.1 modules/ 내부 구조 상세 설명

**todos/ 모듈을 예시로:**

```
modules/todos/
├── todos.router.js
│   // Express Router 정의
│   // const router = express.Router();
│   // router.get('/', authenticateToken, controller.getTodos);
│   // router.post('/', authenticateToken, controller.createTodo);
│   // router.patch('/:id', authenticateToken, controller.updateTodo);
│   // router.delete('/:id', authenticateToken, controller.deleteTodo);
│   // module.exports = router;
│
├── todos.controller.js
│   // HTTP 요청/응답 처리
│   // exports.getTodos = async (req, res, next) => {
│   //   try {
│   //     const userId = req.user.id;
│   //     const { categoryId, from, to, isCompleted, sort, page, limit } = req.query;
│   //     const result = await service.fetchTodos(userId, { categoryId, from, to, ... });
│   //     res.json({ success: true, code: 'SUCCESS', data: result });
│   //   } catch (err) {
│   //     next(err);
│   //   }
│   // };
│
├── todos.service.js
│   // 비즈니스 로직
│   // class TodoService {
│   //   async fetchTodos(userId, filters) {
│   //     // 필터 검증
│   //     if (filters.from && filters.to) {
│   //       validate(filters.from <= filters.to, '기간 검증');
│   //     }
│   //     // Repository 호출
│   //     const todos = await todoRepository.findByUserId(userId, filters);
│   //     return todos;
│   //   }
│   //   
│   //   async createTodo(userId, data) {
│   //     // BR-05: 카테고리 필수
│   //     validate(data.categoryId, '카테고리는 필수');
│   //     // BR-02: 권한 확인 (카테고리 소유권)
│   //     const category = await categoryRepository.findById(data.categoryId);
│   //     validate(category.userId === userId || category.isDefault, '카테고리 권한');
│   //     // Repository 호출
│   //     const todo = await todoRepository.create(userId, data);
│   //     return todo;
│   //   }
│   // }
│
├── todos.types.js
│   // 타입 정의 (TypeScript 또는 JSDoc)
│   // /**
│   //  * @typedef {Object} TodoItem
│   //  * @property {string} id
│   //  * @property {string} userId
│   //  * @property {string} categoryId
│   //  * @property {string} title
│   //  * @property {string | null} description
│   //  * @property {string | null} dueDate
│   //  * @property {boolean} isCompleted
│   //  * @property {string} createdAt
│   //  * @property {string} updatedAt
│   //  */
│
└── index.js
    // module.exports = { router, service, controller };
    // 또는 명시적으로 가져온 모듈 export
```

**auth/ 모듈:**

```
modules/auth/
├── auth.router.js
│   // POST /auth/signup
│   // POST /auth/login
│   // POST /auth/refresh
│   // POST /auth/logout
│
├── auth.controller.js
│   // signup(req, res, next)
│   // login(req, res, next)
│   // refreshToken(req, res, next)
│   // logout(req, res, next)
│
├── auth.service.js
│   // signupUser(email, name, password)
│   //   - 이메일 중복 확인 (BR-07)
│   //   - 비밀번호 해싱
│   //   - User 생성
│   //
│   // loginUser(email, password)
│   //   - 이메일로 User 조회
│   //   - 비밀번호 검증
│   //   - Access Token + Refresh Token 발급
│   //
│   // refreshAccessToken(refreshToken)
│   //   - Refresh Token 검증
│   //   - 새 Access Token 발급
│   //
│   // logoutUser(userId)
│   //   - Refresh Token 무효화 (선택)
│
├── auth.types.js
│   // SignupRequest, LoginRequest, AuthResponse 등
│
└── index.js
```

### 7.2 repositories/ 상세 설명

```
repositories/
├── userRepository.js
│   // class UserRepository {
│   //   async findById(id) {
│   //     const query = 'SELECT * FROM users WHERE id = $1';
│   //     const result = await db.query(query, [id]);
│   //     return result.rows[0];
│   //   }
│   //   
│   //   async findByEmail(email) {
│   //     const query = 'SELECT * FROM users WHERE email = $1';
│   //     const result = await db.query(query, [email]);
│   //     return result.rows[0];
│   //   }
│   //   
│   //   async create(user) {
│   //     const { email, password_hash, full_name } = user;
│   //     const query = `
│   //       INSERT INTO users (id, email, password_hash, full_name, created_at, updated_at)
│   //       VALUES ($1, $2, $3, $4, NOW(), NOW())
│   //       RETURNING *
│   //     `;
│   //     const result = await db.query(query, [uuid(), email, password_hash, full_name]);
│   //     return result.rows[0];
│   //   }
│   //   
│   //   async updatePassword(userId, passwordHash) {
│   //     const query = `
│   //       UPDATE users SET password_hash = $1, updated_at = NOW()
│   //       WHERE id = $2
│   //       RETURNING *
│   //     `;
│   //     const result = await db.query(query, [passwordHash, userId]);
│   //     return result.rows[0];
│   //   }
│   // }
│
├── categoryRepository.js
│   // async findById(categoryId, userId?)
│   // async findByUserId(userId) - 사용자의 기본 + 사용자정의 카테고리
│   // async create(userId, name)
│   // async update(categoryId, name)
│   // async delete(categoryId)
│   // async hasAssociatedTodos(categoryId) - BR-08 검증용
│
├── todoRepository.js
│   // async findByUserId(userId, filters?, sort?, pagination?)
│   //   - snake_case 컬럼명 그대로 반환 (Service에서 변환)
│   //   - 필터: categoryId, dueDate range, isCompleted
│   //   - 정렬: created_at DESC, due_date ASC
│   //   - 페이지네이션: LIMIT, OFFSET
│   //
│   // async findById(todoId, userId) - 권한 확인 포함
│   // async create(userId, todoData)
│   // async update(todoId, userId, updateData)
│   // async delete(todoId, userId)
│   // async toggleCompletion(todoId, userId)
│
└── index.js
    // 모든 Repository export
```

---

## 8. 요약 및 체크리스트

### 프로젝트 구조 설계 검증 체크리스트

| 항목 | 확인 | 설명 |
|------|------|------|
| **원칙** | | |
| 관심사 분리 | ✓ | 각 계층은 단일 책임을 가짐 |
| SRP 준수 | ✓ | 함수/클래스가 변경의 이유 1개만 가짐 |
| 인터페이스 기반 | ✓ | Type/Interface 명시적 정의 |
| 불변성 우선 | ✓ | 데이터 변경 시 새로운 객체 생성 |
| 명시적 의존성 | ✓ | 모든 의존성이 매개변수로 전달됨 |
| **레이어** | | |
| 단방향 의존성 | ✓ | 역방향 의존 금지 |
| Component → Hook → API | ✓ | 프론트엔드 계층 의존성 순서 |
| Router → Controller → Service → Repository | ✓ | 백엔드 계층 의존성 순서 |
| **코드 스타일** | | |
| 파일명: PascalCase (컴포넌트) | ✓ | TodoList.tsx |
| 파일명: camelCase (나머지) | ✓ | useFetchTodos.ts |
| 함수명: camelCase + 동사 | ✓ | fetchTodos(), createTodo() |
| boolean 변수: is/has prefix | ✓ | isCompleted, hasPermission |
| 상수: UPPER_SNAKE_CASE | ✓ | MAX_PAGE_SIZE, API_BASE_URL |
| Type: PascalCase, I prefix 금지 | ✓ | TodoItem (not ITodoItem) |
| **테스트** | | |
| Repository 실제 DB 사용 | ✓ | pg 쿼리 검증 |
| Service 단위테스트 | ✓ | 비즈니스 로직 검증 |
| Controller 통합테스트 | ✓ | API 엔드포인트 검증 |
| Component 렌더링 테스트 | ✓ | UI 렌더링 및 이벤트 |
| **보안** | | |
| 환경변수 관리 | ✓ | .env (미커밋), .env.example (커밋) |
| JWT 비밀키 | ✓ | 환경변수로 관리, min 32 chars |
| bcrypt Rounds | ✓ | 10으로 설정 |
| Password 해싱 | ✓ | bcrypt.hash() 사용 |
| CORS 화이트리스트 | ✓ | 환경변수로 지정 |
| Zustand 메모리 저장 | ✓ | Access Token + Refresh Token 모두 메모리 보관 |
| **에러 처리** | | |
| 표준 ApiResponse 포맷 | ✓ | success, code, message, data |
| 에러 코드 정의 | ✓ | UNAUTHORIZED, FORBIDDEN 등 |
| 로깅 | ✓ | 요청/응답, 에러 기록 |
| **디렉토리** | | |
| frontend/src 구조 | ✓ | api, components, features, hooks, pages, stores, types, utils, constants |
| backend/src 구조 | ✓ | config, middlewares, modules, repositories, utils, types |
| features vertical slicing | ✓ | auth, todos, categories, profile 각각 components, hooks, types |
| modules 독립성 | ✓ | 각 모듈이 router, controller, service, types 포함 |

---

## 참고 자료

- **프론트엔드 기술 스택**
  - React 19 공식 문서
  - Zustand 상태 관리
  - TanStack Query 서버 상태 관리
  - TypeScript 타입 시스템

- **백엔드 기술 스택**
  - Node.js + Express 공식 문서
  - pg (PostgreSQL 클라이언트) 사용 가이드
  - bcrypt 해싱
  - JWT (jsonwebtoken)

- **소프트웨어 설계**
  - Clean Architecture (Robert C. Martin)
  - Domain-Driven Design (Eric Evans)
  - SOLID 원칙

이 문서는 TodoListApp의 전체 개발 팀이 준수해야 할 구조 설계 원칙을 정의합니다. 질문이나 예외 사항은 팀 리드에게 협의하세요.
