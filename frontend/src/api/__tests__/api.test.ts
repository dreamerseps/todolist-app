import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import AxiosMockAdapter from 'axios-mock-adapter';
import apiClient from '../client';
import { authApi } from '../auth.api';
import { usersApi } from '../users.api';
import { categoriesApi } from '../categories.api';
import { todosApi } from '../todos.api';
import { queryKeys } from '../queryKeys';
import { useAuthStore } from '@/stores/authStore';

let mock: AxiosMockAdapter;

beforeEach(() => {
  mock = new AxiosMockAdapter(apiClient);
  useAuthStore.getState().clearAuth();
});

afterEach(() => {
  mock.restore();
});

describe('authApi', () => {
  it('register — POST /auth/register', async () => {
    mock.onPost('/auth/register').reply(201, {
      success: true,
      code: 'CREATED',
      data: { id: 'u1', email: 'a@a.com', name: '홍' },
    });
    const res = await authApi.register({ email: 'a@a.com', password: 'pw12345!', name: '홍' });
    expect(res.status).toBe(201);
    expect(res.data.data?.email).toBe('a@a.com');
  });

  it('login — POST /auth/login', async () => {
    mock.onPost('/auth/login').reply(200, {
      success: true,
      code: 'SUCCESS',
      data: { access_token: 'at', refresh_token: 'rt', user: { id: 'u1' } },
    });
    const res = await authApi.login({ email: 'a@a.com', password: 'pw12345!' });
    expect(res.status).toBe(200);
    expect(res.data.data?.access_token).toBe('at');
  });

  it('refresh — POST /auth/refresh', async () => {
    mock.onPost('/auth/refresh').reply(200, {
      success: true,
      code: 'SUCCESS',
      data: { access_token: 'new-at' },
    });
    const res = await authApi.refresh('rt');
    expect(res.status).toBe(200);
    expect(res.data.data?.access_token).toBe('new-at');
  });

  it('logout — POST /auth/logout', async () => {
    mock.onPost('/auth/logout').reply(200, { success: true, code: 'SUCCESS' });
    const res = await authApi.logout();
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
  });
});

describe('usersApi', () => {
  it('getMe — GET /users/me', async () => {
    mock.onGet('/users/me').reply(200, {
      success: true,
      code: 'SUCCESS',
      data: { id: 'u1', email: 'a@a.com', name: '홍' },
    });
    const res = await usersApi.getMe();
    expect(res.status).toBe(200);
    expect(res.data.data?.name).toBe('홍');
  });

  it('updateMe — PATCH /users/me (이름 변경)', async () => {
    mock.onPatch('/users/me').reply(200, {
      success: true,
      code: 'SUCCESS',
      data: { id: 'u1', email: 'a@a.com', name: '새이름' },
    });
    const res = await usersApi.updateMe({ name: '새이름' });
    expect(res.data.data?.name).toBe('새이름');
  });

  it('updateMe — PATCH /users/me (비밀번호 변경)', async () => {
    mock.onPatch('/users/me').reply(200, { success: true, code: 'SUCCESS' });
    const res = await usersApi.updateMe({
      current_password: 'old',
      new_password: 'new12345!',
    });
    expect(res.data.success).toBe(true);
  });
});

describe('categoriesApi', () => {
  it('getAll — GET /categories', async () => {
    mock.onGet('/categories').reply(200, {
      success: true,
      code: 'SUCCESS',
      data: [{ id: 'c1', name: '업무', is_default: true, user_id: null }],
    });
    const res = await categoriesApi.getAll();
    expect(res.data.data).toHaveLength(1);
    expect(res.data.data?.[0].name).toBe('업무');
  });

  it('create — POST /categories', async () => {
    mock.onPost('/categories').reply(201, {
      success: true,
      code: 'CREATED',
      data: { id: 'c2', name: '스터디', is_default: false, user_id: 'u1' },
    });
    const res = await categoriesApi.create({ name: '스터디' });
    expect(res.data.data?.name).toBe('스터디');
    expect(res.data.data?.is_default).toBe(false);
  });

  it('update — PATCH /categories/:id', async () => {
    mock.onPatch('/categories/c2').reply(200, {
      success: true,
      code: 'SUCCESS',
      data: { id: 'c2', name: '독서', is_default: false, user_id: 'u1' },
    });
    const res = await categoriesApi.update('c2', { name: '독서' });
    expect(res.data.data?.name).toBe('독서');
  });

  it('delete — DELETE /categories/:id', async () => {
    mock.onDelete('/categories/c2').reply(200, { success: true, code: 'SUCCESS' });
    const res = await categoriesApi.delete('c2');
    expect(res.data.success).toBe(true);
  });

  it('delete — 422 할일이 있는 카테고리 삭제 실패', async () => {
    mock.onDelete('/categories/c1').reply(422, {
      success: false,
      code: 'UNPROCESSABLE_ENTITY',
      message: '할일이 속한 카테고리는 삭제할 수 없습니다.',
    });
    await expect(categoriesApi.delete('c1')).rejects.toMatchObject({
      response: { status: 422 },
    });
  });
});

describe('todosApi', () => {
  it('getAll — GET /todos', async () => {
    mock.onGet('/todos').reply(200, {
      success: true,
      code: 'SUCCESS',
      data: { todos: [], pagination: { page: 1, limit: 20, total: 0, total_pages: 0 } },
    });
    const res = await todosApi.getAll();
    expect(res.data.data?.todos).toHaveLength(0);
    expect(res.data.data?.pagination.total).toBe(0);
  });

  it('getAll — 필터 파라미터 전달', async () => {
    mock.onGet('/todos').reply(200, {
      success: true,
      code: 'SUCCESS',
      data: { todos: [], pagination: { page: 1, limit: 20, total: 0, total_pages: 0 } },
    });
    const res = await todosApi.getAll({ is_completed: false, page: 1, limit: 20 });
    expect(res.status).toBe(200);
  });

  it('getById — GET /todos/:id', async () => {
    mock.onGet('/todos/t1').reply(200, {
      success: true,
      code: 'SUCCESS',
      data: { id: 't1', title: '주간 보고서', is_completed: false },
    });
    const res = await todosApi.getById('t1');
    expect(res.data.data?.title).toBe('주간 보고서');
  });

  it('create — POST /todos', async () => {
    mock.onPost('/todos').reply(201, {
      success: true,
      code: 'CREATED',
      data: { id: 't2', title: '새 할일', category_id: 'c1', is_completed: false },
    });
    const res = await todosApi.create({ title: '새 할일', category_id: 'c1' });
    expect(res.data.data?.title).toBe('새 할일');
  });

  it('update — PATCH /todos/:id (완료 토글)', async () => {
    mock.onPatch('/todos/t1').reply(200, {
      success: true,
      code: 'SUCCESS',
      data: { id: 't1', is_completed: true },
    });
    const res = await todosApi.update('t1', { is_completed: true });
    expect(res.data.data?.is_completed).toBe(true);
  });

  it('delete — DELETE /todos/:id', async () => {
    mock.onDelete('/todos/t1').reply(200, { success: true, code: 'SUCCESS' });
    const res = await todosApi.delete('t1');
    expect(res.data.success).toBe(true);
  });
});

describe('queryKeys', () => {
  it('me 키가 올바르다', () => {
    expect(queryKeys.me).toEqual(['me']);
  });

  it('categories 키가 올바르다', () => {
    expect(queryKeys.categories).toEqual(['categories']);
  });

  it('todos 키 — 필터 없음', () => {
    expect(queryKeys.todos()).toEqual(['todos', undefined]);
  });

  it('todos 키 — 필터 있음', () => {
    const filter = { is_completed: false, page: 1 };
    expect(queryKeys.todos(filter)).toEqual(['todos', filter]);
  });

  it('todo 단건 키', () => {
    expect(queryKeys.todo('t1')).toEqual(['todos', 't1']);
  });
});
