import { describe, it, expect } from 'vitest';
import type {
  ApiResponse,
  PaginationMeta,
  User,
  LoginRequest,
  SignupRequest,
  UpdateProfileRequest,
  Category,
  CategoryCreateRequest,
  CategoryUpdateRequest,
  TodoItem,
  TodoFilter,
  TodoCreateRequest,
  TodoUpdateRequest,
  PaginatedResponse,
} from '../index';

describe('Common Types', () => {
  it('ApiResponse should allow success with data', () => {
    const response: ApiResponse<{ id: string }> = {
      success: true,
      code: 'SUCCESS',
      data: { id: '1' },
    };
    expect(response.success).toBe(true);
    expect(response.code).toBe('SUCCESS');
    expect(response.data?.id).toBe('1');
  });

  it('ApiResponse should allow failure without data', () => {
    const response: ApiResponse = {
      success: false,
      code: 'BAD_REQUEST',
      message: '잘못된 요청입니다.',
    };
    expect(response.success).toBe(false);
    expect(response.message).toBe('잘못된 요청입니다.');
    expect(response.data).toBeUndefined();
  });

  it('PaginationMeta should contain required pagination fields', () => {
    const meta: PaginationMeta = {
      page: 1,
      limit: 20,
      total: 45,
      total_pages: 3,
    };
    expect(meta.page).toBe(1);
    expect(meta.limit).toBe(20);
    expect(meta.total).toBe(45);
    expect(meta.total_pages).toBe(3);
  });
});

describe('User Types', () => {
  it('User should have required fields', () => {
    const user: User = {
      id: 'uuid-1',
      email: 'test@example.com',
      name: '홍길동',
      created_at: '2026-05-14T00:00:00Z',
      updated_at: '2026-05-14T00:00:00Z',
    };
    expect(user.id).toBe('uuid-1');
    expect(user.email).toBe('test@example.com');
    expect(user.name).toBe('홍길동');
  });

  it('LoginRequest should have email and password', () => {
    const req: LoginRequest = {
      email: 'test@example.com',
      password: 'password123!',
    };
    expect(req.email).toBe('test@example.com');
    expect(req.password).toBe('password123!');
  });

  it('SignupRequest should have email, password, and name', () => {
    const req: SignupRequest = {
      email: 'test@example.com',
      password: 'password123!',
      name: '홍길동',
    };
    expect(req.email).toBe('test@example.com');
    expect(req.name).toBe('홍길동');
  });

  it('UpdateProfileRequest should allow partial update', () => {
    const nameOnly: UpdateProfileRequest = { name: '새이름' };
    const passwordOnly: UpdateProfileRequest = {
      current_password: 'oldPass',
      new_password: 'newPass123!',
    };
    const both: UpdateProfileRequest = {
      name: '새이름',
      current_password: 'oldPass',
      new_password: 'newPass123!',
    };
    expect(nameOnly.name).toBe('새이름');
    expect(passwordOnly.current_password).toBe('oldPass');
    expect(both.name).toBe('새이름');
    expect(both.new_password).toBe('newPass123!');
  });
});

describe('Category Types', () => {
  it('Default Category should have null user_id and is_default true', () => {
    const category: Category = {
      id: 'cat-1',
      user_id: null,
      name: '업무',
      is_default: true,
    };
    expect(category.user_id).toBeNull();
    expect(category.is_default).toBe(true);
  });

  it('Custom Category should have user_id and is_default false', () => {
    const category: Category = {
      id: 'cat-2',
      user_id: 'user-uuid',
      name: '스터디',
      is_default: false,
    };
    expect(category.user_id).toBe('user-uuid');
    expect(category.is_default).toBe(false);
  });

  it('CategoryCreateRequest should require name', () => {
    const req: CategoryCreateRequest = { name: '운동' };
    expect(req.name).toBe('운동');
  });

  it('CategoryUpdateRequest should require name', () => {
    const req: CategoryUpdateRequest = { name: '새 카테고리명' };
    expect(req.name).toBe('새 카테고리명');
  });
});

describe('Todo Types', () => {
  it('TodoItem should have required fields', () => {
    const todo: TodoItem = {
      id: 'todo-1',
      user_id: 'user-1',
      category_id: 'cat-1',
      title: '주간 보고서 작성',
      description: null,
      due_date: '2026-05-20',
      is_completed: false,
      created_at: '2026-05-14T00:00:00Z',
      updated_at: '2026-05-14T00:00:00Z',
    };
    expect(todo.title).toBe('주간 보고서 작성');
    expect(todo.description).toBeNull();
    expect(todo.is_completed).toBe(false);
  });

  it('TodoFilter should allow all optional fields', () => {
    const emptyFilter: TodoFilter = {};
    const fullFilter: TodoFilter = {
      category_id: 'cat-1',
      from: '2026-05-01',
      to: '2026-05-31',
      is_completed: false,
      sort: 'created_at',
      page: 1,
      limit: 20,
    };
    expect(Object.keys(emptyFilter).length).toBe(0);
    expect(fullFilter.sort).toBe('created_at');
    expect(fullFilter.page).toBe(1);
  });

  it('TodoFilter sort should accept due_date', () => {
    const filter: TodoFilter = { sort: 'due_date' };
    expect(filter.sort).toBe('due_date');
  });

  it('TodoCreateRequest should require title and category_id', () => {
    const req: TodoCreateRequest = {
      title: '새 할일',
      category_id: 'cat-1',
    };
    expect(req.title).toBe('새 할일');
    expect(req.category_id).toBe('cat-1');
    expect(req.description).toBeUndefined();
    expect(req.due_date).toBeUndefined();
  });

  it('TodoCreateRequest should allow optional fields', () => {
    const req: TodoCreateRequest = {
      title: '새 할일',
      category_id: 'cat-1',
      description: '설명',
      due_date: '2026-05-20',
    };
    expect(req.description).toBe('설명');
    expect(req.due_date).toBe('2026-05-20');
  });

  it('TodoUpdateRequest should allow all optional fields', () => {
    const req: TodoUpdateRequest = { is_completed: true };
    expect(req.is_completed).toBe(true);
    expect(req.title).toBeUndefined();

    const fullReq: TodoUpdateRequest = {
      title: '수정된 제목',
      description: null,
      category_id: 'cat-2',
      due_date: null,
      is_completed: true,
    };
    expect(fullReq.description).toBeNull();
    expect(fullReq.due_date).toBeNull();
  });

  it('PaginatedResponse should wrap todos with pagination', () => {
    const todo: TodoItem = {
      id: 'todo-1',
      user_id: 'user-1',
      category_id: 'cat-1',
      title: '테스트',
      description: null,
      due_date: null,
      is_completed: false,
      created_at: '2026-05-14T00:00:00Z',
      updated_at: '2026-05-14T00:00:00Z',
    };
    const response: PaginatedResponse<TodoItem> = {
      todos: [todo],
      pagination: { page: 1, limit: 20, total: 1, total_pages: 1 },
    };
    expect(response.todos.length).toBe(1);
    expect(response.pagination.total).toBe(1);
  });
});
