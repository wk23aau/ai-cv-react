// backend/src/types/express.d.ts

// To ensure this file is treated as a module and its declarations are merged correctly.
export {};

declare global {
  namespace Express {
    export interface Request {
      user?: { // The user property is optional, as it's only present after 'protect' middleware
        userId: number;
        username: string;
        isAdmin?: boolean; // isAdmin is also optional within the user object
      };
    }
  }
}
