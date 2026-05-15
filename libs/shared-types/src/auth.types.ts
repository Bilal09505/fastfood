// libs/shared-types/src/auth.types.ts

export type Role = 'ADMIN' | 'SALESMAN' | 'MAKER' | 'SUPPLIER';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}
