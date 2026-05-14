export type ApiResponse<T = undefined> = {
  success: boolean;
  code: string;
  message?: string;
  data?: T;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
};
