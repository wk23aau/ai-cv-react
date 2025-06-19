// backend/src/types/auth.d.ts

export interface AuthenticatedUser {
  userId: number;
  username: string;
  isAdmin?: boolean; // Optional as it might not be present on all user-like objects or is context-dependent
}
