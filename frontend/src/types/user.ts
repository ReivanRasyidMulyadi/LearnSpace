export type Role = "STUDENT" | "ADMIN";

export interface User {
  user_id: string;
  email: string;
  name: string;
  role: Role;
  picture?: string | null;
  auth_provider: "password" | "google";
  created_at: string;
}

export interface AuthResponse {
  session_token: string;
  user: User;
}
