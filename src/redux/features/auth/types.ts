export interface Session {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

export interface LoginInput {
  phone: string;
  code: string;
  device?: string | null;
}
