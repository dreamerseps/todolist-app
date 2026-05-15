# 프론트엔드 통합 가이드 - TodoListApp

**작성일:** 2026-05-14  
**버전:** 1.1  
**참조 문서:** 프로젝트 구조 설계 원칙 v1.5, swagger/swagger.json v1.0

## 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|----------|
| 1.0 | 2026-05-14 | yoseb lee | 최초 작성 |
| 1.1 | 2026-05-14 | yoseb lee | 구현 코드 기준 업데이트 — axios interceptor 실제 변환 방향 명시, 페이지네이션 응답 구조 수정(`pagination` → flat 필드), authStore `setUser` 액션 추가, 토큰 갱신 요청 본문 snake_case 유지 명시 |
| 1.2 | 2026-05-14 | yoseb lee | 추가 구현 반영 — settingsStore(theme/language) 인터페이스 추가, i18n 초기화 방법 및 useTranslation 사용 패턴 추가 |
| 1.3 | 2026-05-15 | yoseb lee | 일괄 삭제 API 추가 — `DELETE /api/todos/bulk` 엔드포인트, `todosApi.bulkDelete`, `useBulkDeleteTodo` 훅 |
| 1.4 | 2026-05-15 | yoseb lee | 마감 일시 시간 지원 — `due_date` DB 타입 `DATE` → `TIMESTAMP`, pg 타입 파서 설정(문자열 반환), 프론트엔드 `datetime-local` 입력 적용 |

---

## 1. 연결 정보

| 항목 | 값 |
|------|-----|
| 백엔드 Base URL | `http://localhost:3000` |
| API Prefix | `/api` |
| Swagger UI | `http://localhost:3000/api-docs` |
| Content-Type | `application/json` |
| 인증 방식 | `Authorization: Bearer {accessToken}` |

**프론트엔드 환경변수 (.env):**
```env
VITE_API_BASE_URL=http://localhost:3000/api
```

---

## 2. 공통 응답 구조

모든 API 응답은 아래 구조를 따른다.

```typescript
type ApiResponse<T = undefined> = {
  success: boolean;
  code: string;
  message?: string;
  data?: T;
};
```

**응답 코드표:**

| code | HTTP | 설명 |
|------|------|------|
| `SUCCESS` | 200 | 성공 |
| `CREATED` | 201 | 생성 성공 |
| `BAD_REQUEST` | 400 | 필수 필드 누락, 유효성 실패 |
| `UNAUTHORIZED` | 401 | 토큰 없음·만료·유효하지 않음 |
| `FORBIDDEN` | 403 | 타인 데이터 접근 시도 |
| `NOT_FOUND` | 404 | 리소스 없음 |
| `CONFLICT` | 409 | 이메일 중복 (BR-07) |
| `UNPROCESSABLE_ENTITY` | 422 | 할일 있는 카테고리 삭제 (BR-08) |
| `INTERNAL_SERVER_ERROR` | 500 | 서버 오류 |

---

## 3. TypeScript 타입 정의

```typescript
// types/common.ts
export type ApiResponse<T = undefined> = {
  success: boolean;
  code: string;
  message?: string;
  data?: T;
};

export type PaginationMeta = {
  page: number;
  limit: number;   // useFetchTodos에서 page_size를 limit으로 매핑
  total: number;
  total_pages: number;
};
```

```typescript
// types/user.ts
export type User = {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
};
```

```typescript
// types/category.ts
export type Category = {
  id: string;
  user_id: string | null;  // 기본 카테고리는 null
  name: string;
  is_default: boolean;
};
```

```typescript
// types/todo.ts
export type TodoItem = {
  id: string;
  user_id: string;
  category_id: string;
  title: string;
  description: string | null;
  due_date: string | null;  // PostgreSQL TIMESTAMP 문자열 "YYYY-MM-DD HH:MM:SS" (타임존 변환 없음)
  is_completed: boolean;
  created_at: string;
  updated_at: string;
};

export type TodoFilter = {
  category_id?: string;
  from?: string;          // YYYY-MM-DD
  to?: string;            // YYYY-MM-DD, from <= to 이어야 함 (해당 날짜 하루 전체 포함)
  is_completed?: boolean;
  sort?: 'created_at' | 'due_date';
  page?: number;
  limit?: number;
};

export type TodoCreateRequest = {
  title: string;
  category_id: string;
  description?: string;
  due_date?: string;  // datetime-local 입력값 "YYYY-MM-DDTHH:MM"
};

export type TodoUpdateRequest = {
  title?: string;
  description?: string | null;
  category_id?: string;
  due_date?: string | null;  // datetime-local 입력값 "YYYY-MM-DDTHH:MM" 또는 null
  is_completed?: boolean;
};

export type PaginatedResponse<T> = {
  todos: T[];
  pagination: PaginationMeta;
};
```

---

## 4. Zustand 인증 스토어

```typescript
// stores/authStore.ts
import { create } from 'zustand';
import type { User } from '@/types';

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (accessToken: string, refreshToken: string, user: User) => void;
  setAccessToken: (accessToken: string) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  setAuth: (accessToken, refreshToken, user) =>
    set({ accessToken, refreshToken, user, isAuthenticated: true }),
  setAccessToken: (accessToken) => set({ accessToken }),
  setUser: (user) => set({ user }),
  clearAuth: () =>
    set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false }),
}));
```

> **주의:** 토큰은 메모리(Zustand)에만 저장한다. 페이지 새로고침 시 초기화되어 재로그인이 필요하다. `localStorage` 저장 금지.

---

## 5. axios 클라이언트 설정

> **중요:** axios interceptor가 자동으로 키 변환을 수행한다.
> - **요청 인터셉터**: `config.data` 객체의 키를 **snake_case → camelCase**로 변환하여 백엔드로 전송
> - **응답 인터셉터**: `response.data` 객체의 키를 **camelCase → snake_case**로 변환하여 프론트엔드에서 수신
>
> 이로 인해 백엔드는 camelCase 요청을 처리하고 camelCase로 응답하지만, 프론트엔드 코드는 모든 API 데이터를 snake_case로 취급한다.

```typescript
// api/client.ts
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

function transformKeys<T>(obj: T, fn: (k: string) => string): T {
  if (Array.isArray(obj)) return obj.map((v) => transformKeys(v, fn)) as T;
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [fn(k), transformKeys(v, fn)]),
    ) as T;
  }
  return obj;
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// 요청 인터셉터 — Authorization 헤더 자동 첨부 + 요청 본문 snake_case → camelCase 변환
apiClient.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  if (config.data !== undefined) {
    config.data = transformKeys(config.data, toCamelCase);
  }
  return config;
});

// 응답 인터셉터 — 응답 본문 camelCase → snake_case 변환 + 401 시 토큰 갱신
let isRefreshing = false;
let pendingQueue: Array<(token: string) => void> = [];

apiClient.interceptors.response.use(
  (response) => {
    response.data = transformKeys(response.data, toSnakeCase);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    const { refreshToken, setAccessToken, clearAuth } = useAuthStore.getState();

    if (!refreshToken) {
      clearAuth();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve) => {
        pendingQueue.push((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(apiClient(originalRequest));
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
        { refreshToken },
      );
      const newAccessToken: string = data.data.access_token;

      setAccessToken(newAccessToken);
      pendingQueue.forEach((cb) => cb(newAccessToken));
      pendingQueue = [];

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient(originalRequest);
    } catch {
      clearAuth();
      pendingQueue = [];
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  },
);

export default apiClient;
```

---

## 5-1. 백엔드 pg 타입 파서 설정

`backend/src/config/database.js`에서 PostgreSQL `TIMESTAMP WITHOUT TIME ZONE` 컬럼을 **JavaScript `Date` 객체로 변환하지 않고 문자열 그대로** 반환하도록 설정한다.

```javascript
const { Pool, types } = require('pg');

// TIMESTAMP WITHOUT TIME ZONE(OID 1114)을 문자열로 반환
// 기본 동작(Date 객체 변환) 시 서버 로컬 타임존이 적용되어 저장 시각과 표시 시각이 달라지는 문제 방지
types.setTypeParser(1114, (val) => val);
```

**반환 형식:** `"YYYY-MM-DD HH:MM:SS"` (공백 구분자, 타임존 없음)

**프론트엔드 처리 방식:**
- `TodoItem.due_date` 표시: `formatDueDate()` 함수가 `value.slice(0, 10)`(날짜)과 `value.slice(11, 16)`(시간)을 직접 슬라이싱하여 `"YYYY-MM-DD HH:MM"` 형태로 출력
- `EditTodoModal` 초기값: `toDatetimeLocal()` 함수가 공백을 `T`로 교체 → `"YYYY-MM-DDTHH:MM"` (datetime-local 입력 호환)

---

## 6. API 함수

### 6.1 인증 (Auth)

```typescript
// api/auth.api.ts
import apiClient from './client';
import type { ApiResponse, User } from '@/types';

type LoginResponseData = {
  access_token: string;
  refresh_token: string;
  user: User;
};

export const authApi = {
  register: (body: { email: string; password: string; name: string }) =>
    apiClient.post<ApiResponse<User>>('/auth/register', body),

  login: (body: { email: string; password: string }) =>
    apiClient.post<ApiResponse<LoginResponseData>>('/auth/login', body),

  refresh: (refresh_token: string) =>
    apiClient.post<ApiResponse<{ access_token: string }>>('/auth/refresh', { refresh_token }),

  logout: () =>
    apiClient.post<ApiResponse>('/auth/logout'),
};
```

> **참고:** `refresh` 함수에서 `refresh_token` 파라미터명을 사용한다. axios interceptor가 요청 시 camelCase로 변환하므로 실제 전송되는 body는 `{ refreshToken }`이 된다.

### 6.2 사용자 (Users)

```typescript
// api/users.api.ts
import apiClient from './client';
import type { ApiResponse, User } from '@/types';

export const usersApi = {
  getMe: () =>
    apiClient.get<ApiResponse<User>>('/users/me'),

  updateMe: (body: { name?: string; current_password?: string; new_password?: string }) =>
    apiClient.patch<ApiResponse<User>>('/users/me', body),
};
```

### 6.3 카테고리 (Categories)

```typescript
// api/categories.api.ts
import apiClient from './client';
import type { ApiResponse, Category } from '@/types';

export const categoriesApi = {
  getAll: () =>
    apiClient.get<ApiResponse<Category[]>>('/categories'),

  create: (body: { name: string }) =>
    apiClient.post<ApiResponse<Category>>('/categories', body),

  update: (id: string, body: { name: string }) =>
    apiClient.patch<ApiResponse<Category>>(`/categories/${id}`, body),

  delete: (id: string) =>
    apiClient.delete<ApiResponse>(`/categories/${id}`),
};
```

### 6.4 할일 (Todos)

```typescript
// api/todos.api.ts
import apiClient from './client';
import type { ApiResponse, TodoItem, TodoFilter, TodoCreateRequest, TodoUpdateRequest, PaginatedResponse } from '@/types';

export const todosApi = {
  getAll: (params?: TodoFilter) =>
    apiClient.get<ApiResponse<PaginatedResponse<TodoItem>>>('/todos', { params }),

  getById: (id: string) =>
    apiClient.get<ApiResponse<TodoItem>>(`/todos/${id}`),

  create: (body: TodoCreateRequest) =>
    apiClient.post<ApiResponse<TodoItem>>('/todos', body),

  update: (id: string, body: TodoUpdateRequest) =>
    apiClient.patch<ApiResponse<TodoItem>>(`/todos/${id}`, body),

  delete: (id: string) =>
    apiClient.delete<ApiResponse>(`/todos/${id}`),

  bulkDelete: (ids: string[]) =>
    apiClient.delete<ApiResponse<{ count: number }>>('/todos/bulk', { data: { ids } }),
};
```

> **페이지네이션 응답 처리 주의사항:** 백엔드는 `{ todos, total, page, pageSize, totalPages }` (camelCase)로 응답한다. axios interceptor가 snake_case로 변환하면 `{ todos, total, page, page_size, total_pages }`가 된다. `useFetchTodos` 훅에서 이를 `PaginationMeta` 형태(`{ page, limit, total, total_pages }`)로 재가공하여 반환한다.

---

## 7. TanStack Query 훅

### 7.1 Query Keys

```typescript
// api/queryKeys.ts
export const queryKeys = {
  categories: ['categories'] as const,
  todos: (filter?: TodoFilter) => ['todos', filter] as const,
  todo: (id: string) => ['todos', id] as const,
  me: ['me'] as const,
};
```

### 7.2 인증 훅

```typescript
// features/auth/hooks/useLogin.ts
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/stores/authStore';
import { ROUTES } from '@/constants/routes';

export function useLogin() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (body: { email: string; password: string }) => authApi.login(body),
    onSuccess: (response) => {
      const { access_token, refresh_token, user } = response.data.data!;
      setAuth(access_token, refresh_token, user);
      navigate(ROUTES.TODOS);
    },
  });
}
```

```typescript
// features/auth/hooks/useLogout.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../../../api/auth.api';
import { useAuthStore } from '../../../stores/authStore';

export function useLogout() {
  const { clearAuth } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      clearAuth();
      queryClient.clear();
    },
  });
}
```

### 7.3 카테고리 훅

```typescript
// features/categories/hooks/useFetchCategories.ts
import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '../../../api/categories.api';
import { queryKeys } from '../../../api/queryKeys';

export function useFetchCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: async () => {
      const { data } = await categoriesApi.getAll();
      return data.data!;
    },
  });
}
```

```typescript
// features/categories/hooks/useDeleteCategory.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '../../../api/categories.api';
import { queryKeys } from '../../../api/queryKeys';

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => categoriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}
```

### 7.4 할일 훅

```typescript
// features/todos/hooks/useFetchTodos.ts
import { useQuery } from '@tanstack/react-query';
import { todosApi } from '@/api/todos.api';
import { queryKeys } from '@/api/queryKeys';
import type { TodoFilter, TodoItem } from '@/types';

type RawTodosResponse = {
  todos: TodoItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
};

export function useFetchTodos(filter?: TodoFilter) {
  return useQuery({
    queryKey: queryKeys.todos(filter),
    queryFn: async () => {
      const { data } = await todosApi.getAll(filter);
      const raw = data.data as unknown as RawTodosResponse;
      return {
        todos: raw.todos,
        pagination: {
          page: raw.page,
          limit: raw.page_size,
          total: raw.total,
          total_pages: raw.total_pages,
        },
      };
    },
  });
}
```

```typescript
// features/todos/hooks/useAddTodo.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { todosApi } from '../../../api/todos.api';
import { queryKeys } from '../../../api/queryKeys';

export function useAddTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: todosApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
}
```

```typescript
// features/todos/hooks/useUpdateTodo.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { todosApi } from '../../../api/todos.api';
import { queryKeys } from '../../../api/queryKeys';

export function useUpdateTodo(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: Parameters<typeof todosApi.update>[1]) =>
      todosApi.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
}
```

```typescript
// features/todos/hooks/useBulkDeleteTodo.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { todosApi } from '@/api/todos.api';
import { useUiStore } from '@/stores/uiStore';

export function useBulkDeleteTodo() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const showToast = useUiStore((s) => s.showToast);

  return useMutation({
    mutationFn: (ids: string[]) => todosApi.bulkDelete(ids),
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      showToast('success', t('toast.todo.bulkDeleted', { count: ids.length }));
    },
    onError: () => {
      showToast('error', t('toast.todo.bulkDeleteFailed'));
    },
  });
}
```

---

## 8. 엔드포인트 요약

### 8.1 인증

| 메서드 | 경로 | 인증 필요 | 설명 |
|--------|------|----------|------|
| POST | `/api/auth/register` | ✗ | 회원가입 |
| POST | `/api/auth/login` | ✗ | 로그인 — access/refresh token 반환 |
| POST | `/api/auth/refresh` | ✗ | Access Token 갱신 (`refresh_token` body 전달) |
| POST | `/api/auth/logout` | ✓ | 로그아웃 — 프론트는 응답 후 Zustand 토큰 제거 |

### 8.2 사용자

| 메서드 | 경로 | 인증 필요 | 설명 |
|--------|------|----------|------|
| GET | `/api/users/me` | ✓ | 내 정보 조회 |
| PATCH | `/api/users/me` | ✓ | 이름 또는 비밀번호 수정 (이메일 변경 불가 BR-09) |

### 8.3 카테고리

| 메서드 | 경로 | 인증 필요 | 설명 |
|--------|------|----------|------|
| GET | `/api/categories` | ✓ | 기본 카테고리 + 내 사용자 정의 카테고리 목록 |
| POST | `/api/categories` | ✓ | 사용자 정의 카테고리 생성 |
| PATCH | `/api/categories/:id` | ✓ | 카테고리 이름 수정 (기본 카테고리 수정 불가 BR-03) |
| DELETE | `/api/categories/:id` | ✓ | 카테고리 삭제 (할일 있으면 불가 BR-08) |

### 8.4 할일

| 메서드 | 경로 | 인증 필요 | 설명 |
|--------|------|----------|------|
| GET | `/api/todos` | ✓ | 할일 목록 (필터·정렬·페이지네이션) |
| POST | `/api/todos` | ✓ | 할일 등록 (`category_id` 필수 BR-05) |
| GET | `/api/todos/:id` | ✓ | 할일 단건 조회 |
| PATCH | `/api/todos/:id` | ✓ | 할일 부분 수정 (`is_completed`로 완료 토글) |
| DELETE | `/api/todos/:id` | ✓ | 할일 단건 삭제 |
| DELETE | `/api/todos/bulk` | ✓ | 할일 일괄 삭제 (body: `{ ids: string[] }`) |

### 8.5 기타

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/health` | 서버·DB 연결 상태 확인 |

---

## 9. 할일 목록 조회 파라미터

`GET /api/todos` 쿼리 파라미터:

| 파라미터 | 타입 | 기본값 | 설명 |
|----------|------|--------|------|
| `category_id` | UUID | — | 특정 카테고리 필터 |
| `from` | YYYY-MM-DD | — | 마감일 범위 시작 |
| `to` | YYYY-MM-DD | — | 마감일 범위 종료 (`from <= to`) |
| `is_completed` | boolean | — | 완료 여부 (`true`/`false`, 생략=전체) |
| `sort` | `created_at` \| `due_date` | `created_at` | `created_at`: 등록일 DESC, `due_date`: 마감일 ASC |
| `page` | integer ≥ 1 | 1 | 페이지 번호 |
| `limit` | 1~100 | 20 | 페이지당 항목 수 |

---

## 10. 요청·응답 예시

### 로그인

```
POST /api/auth/login
{ "email": "hong@example.com", "password": "password123!" }
```

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "로그인되었습니다.",
  "data": {
    "access_token": "<JWT>",
    "refresh_token": "<JWT>",
    "user": {
      "id": "uuid",
      "email": "hong@example.com",
      "name": "홍길동",
      "created_at": "2026-05-14T00:00:00Z"
    }
  }
}
```

### 할일 목록 조회 (페이지네이션 포함)

```
GET /api/todos?sort=due_date&page=1&limit=10&is_completed=false
Authorization: Bearer <access_token>
```

```json
{
  "success": true,
  "code": "SUCCESS",
  "data": {
    "todos": [ /* Todo[] */ ],
    "total": 45,
    "page": 1,
    "page_size": 10,
    "total_pages": 5
  }
}
```

> 백엔드 원본 응답은 camelCase(`pageSize`, `totalPages`)이며, axios interceptor가 snake_case로 변환한 결과이다. `useFetchTodos` 훅에서 `pagination` 객체로 재구성하여 사용한다.

### 카테고리 삭제 실패 (할일 존재)

```
DELETE /api/categories/:id
Authorization: Bearer <access_token>
```

```json
{
  "success": false,
  "code": "UNPROCESSABLE_ENTITY",
  "message": "할일이 속한 카테고리는 삭제할 수 없습니다."
}
```

---

## 11. 주요 비즈니스 규칙 처리

| 규칙 | 발생 조건 | HTTP | code | 프론트 처리 |
|------|----------|------|------|------------|
| BR-02 | 타인 데이터 접근 | 403 | `FORBIDDEN` | 에러 메시지 표시 |
| BR-03 | 기본 카테고리 수정/삭제 | 400 | `BAD_REQUEST` | 수정·삭제 버튼 비활성화 (`is_default === true`) |
| BR-05 | 할일 등록 시 `category_id` 누락 | 400 | `BAD_REQUEST` | 카테고리 선택 필수 표시 |
| BR-07 | 이메일 중복 가입 | 409 | `CONFLICT` | "이미 사용 중인 이메일" 안내 |
| BR-08 | 할일 있는 카테고리 삭제 | 422 | `UNPROCESSABLE_ENTITY` | "할일을 모두 삭제 후 카테고리 삭제 가능" 안내 |
| BR-09 | 이메일 변경 시도 | — | — | 이메일 필드 `disabled` 처리 |

---

## 12. 인증 흐름

```
1. 로그인 성공
   → access_token, refresh_token, user → Zustand setAuth()

2. API 요청
   → axios interceptor가 Authorization: Bearer {access_token} 자동 첨부

3. 401 응답 수신 (Access Token 만료)
   → POST /api/auth/refresh (refresh_token body 전달)
   → 성공: 새 access_token → Zustand setAccessToken() → 원래 요청 재시도
   → 실패: Zustand clearAuth() → 로그인 페이지로 이동

4. 로그아웃
   → POST /api/auth/logout
   → 응답 수신 후 Zustand clearAuth() + queryClient.clear()
```

---

## 13. settingsStore — 테마·언어 상태 관리

```typescript
// stores/settingsStore.ts
import { create } from 'zustand';

type SettingsState = {
  theme: 'light' | 'dark';
  language: string;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (lang: string) => void;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: (localStorage.getItem('theme') as 'light' | 'dark') ?? 'light',
  language: localStorage.getItem('language') ?? 'ko',
  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
  },
  setLanguage: (language) => {
    localStorage.setItem('language', language);
    set({ language });
  },
}));
```

**테마 적용 방식:** `document.documentElement.setAttribute('data-theme', theme)`  
**다크모드 CSS 선택자:** `html[data-theme="dark"] { ... }`  
**저장 키:** `localStorage.theme` — `'light'` | `'dark'`  
**저장 키:** `localStorage.language` — `'ko'` | `'en'` | `'zh'` | `'ja'` | `'es'` | `'fr'`

---

## 14. i18n 다국어 사용법

### 초기화

`src/i18n/index.ts`에서 i18next를 초기화한다. `src/main.tsx`에서 `import './i18n'`으로 앱 시작 전에 로드된다.

```typescript
// i18n/index.ts (개요)
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ko from './locales/ko.json';
import en from './locales/en.json';
// ... 나머지 언어

i18n.use(initReactI18next).init({
  resources: { ko: { translation: ko }, en: { translation: en }, /* ... */ },
  lng: localStorage.getItem('language') ?? 'ko',
  fallbackLng: 'ko',
  interpolation: { escapeValue: false },
});

export default i18n;
```

### 컴포넌트에서 사용

```typescript
import { useTranslation } from 'react-i18next';

function TodoItem() {
  const { t } = useTranslation();
  return <button>{t('todo.delete')}</button>;
}
```

### 언어 변경

```typescript
import i18n from '@/i18n';
import { useSettingsStore } from '@/stores/settingsStore';

function LanguageSelector() {
  const { setLanguage } = useSettingsStore();

  const handleChange = (lang: string) => {
    i18n.changeLanguage(lang);
    setLanguage(lang);
  };
  // ...
}
```

### 지원 언어 목록

| 코드 | 언어 |
|------|------|
| `ko` | 한국어 |
| `en` | English |
| `zh` | 中文 |
| `ja` | 日本語 |
| `es` | Español |
| `fr` | Français |
