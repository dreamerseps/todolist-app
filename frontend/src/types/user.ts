export type User = {
  id: string;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type SignupRequest = {
  email: string;
  password: string;
  name: string;
};

export type UpdateProfileRequest = {
  name?: string;
  current_password?: string;
  new_password?: string;
};
