import { describe, it, expect } from 'vitest';
import { ROUTES } from '../routes';
import { API_ENDPOINTS } from '../api';
import { PAGE_SIZE, DEFAULT_SORT, MAX_PAGE_SIZE, MIN_PASSWORD_LENGTH, MAX_NAME_LENGTH, MAX_CATEGORY_NAME_LENGTH } from '../defaults';

describe('ROUTES', () => {
  it('should have correct login route', () => {
    expect(ROUTES.LOGIN).toBe('/login');
  });

  it('should have correct signup route', () => {
    expect(ROUTES.SIGNUP).toBe('/signup');
  });

  it('should have correct todos route', () => {
    expect(ROUTES.TODOS).toBe('/todos');
  });

  it('should have correct categories route', () => {
    expect(ROUTES.CATEGORIES).toBe('/categories');
  });

  it('should have correct profile route', () => {
    expect(ROUTES.PROFILE).toBe('/profile');
  });

  it('should have all 5 routes defined', () => {
    expect(Object.keys(ROUTES).length).toBe(5);
  });
});

describe('API_ENDPOINTS', () => {
  it('should have correct auth endpoints', () => {
    expect(API_ENDPOINTS.AUTH.REGISTER).toBe('/auth/register');
    expect(API_ENDPOINTS.AUTH.LOGIN).toBe('/auth/login');
    expect(API_ENDPOINTS.AUTH.REFRESH).toBe('/auth/refresh');
    expect(API_ENDPOINTS.AUTH.LOGOUT).toBe('/auth/logout');
  });

  it('should have correct users endpoint', () => {
    expect(API_ENDPOINTS.USERS.ME).toBe('/users/me');
  });

  it('should have correct categories endpoints', () => {
    expect(API_ENDPOINTS.CATEGORIES.BASE).toBe('/categories');
    expect(API_ENDPOINTS.CATEGORIES.BY_ID('abc123')).toBe('/categories/abc123');
  });

  it('should have correct todos endpoints', () => {
    expect(API_ENDPOINTS.TODOS.BASE).toBe('/todos');
    expect(API_ENDPOINTS.TODOS.BY_ID('todo-1')).toBe('/todos/todo-1');
  });

  it('BY_ID function should handle UUID format', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    expect(API_ENDPOINTS.CATEGORIES.BY_ID(uuid)).toBe(`/categories/${uuid}`);
    expect(API_ENDPOINTS.TODOS.BY_ID(uuid)).toBe(`/todos/${uuid}`);
  });
});

describe('Defaults', () => {
  it('PAGE_SIZE should be 20', () => {
    expect(PAGE_SIZE).toBe(20);
  });

  it('DEFAULT_SORT should be created_at_desc', () => {
    expect(DEFAULT_SORT).toBe('created_at_desc');
  });

  it('MAX_PAGE_SIZE should be 100', () => {
    expect(MAX_PAGE_SIZE).toBe(100);
  });

  it('MIN_PASSWORD_LENGTH should be 8', () => {
    expect(MIN_PASSWORD_LENGTH).toBe(8);
  });

  it('MAX_NAME_LENGTH should be 100', () => {
    expect(MAX_NAME_LENGTH).toBe(100);
  });

  it('MAX_CATEGORY_NAME_LENGTH should be 50', () => {
    expect(MAX_CATEGORY_NAME_LENGTH).toBe(50);
  });
});
