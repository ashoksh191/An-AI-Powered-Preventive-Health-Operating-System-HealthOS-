export interface AuthResponse {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email?: string;
    created_at: string;
    email_confirmed_at?: string;
  };
  session?: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
  error?: string;
}

export interface UserSessionInfo {
  id: string;
  email?: string;
  role?: string;
}
