export type Category = {
  id: string;
  user_id: string | null;
  name: string;
  is_default: boolean;
};

export type CategoryCreateRequest = {
  name: string;
};

export type CategoryUpdateRequest = {
  name: string;
};
