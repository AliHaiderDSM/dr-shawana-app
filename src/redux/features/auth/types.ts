export interface Session {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

export interface AppSession {
  role: 'patient' | 'doctor';
  accessToken: string;
  refreshToken: string;
}

export interface LoginInput {
  phone: string;
  code: string;
  device?: string | null;
}

export interface PasswordLoginInput {
  phone: string;
  password: string;
  device?: string | null;
}

export interface ResetPasswordInput {
  phone: string;
  code: string;
  password: string;
  device?: string | null;
}
