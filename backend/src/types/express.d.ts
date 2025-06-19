// backend/src/types/express.d.ts

// This line ensures the file is treated as a module.
// It's important if your tsconfig.json has "isolatedModules": true,
// or generally to ensure correct module augmentation behavior.
export {};

declare global {
  namespace Express {
    export interface Request {
      user?: { // The user property is optional on Express.Request
        userId: number;
        username: string;
        isAdmin?: boolean; // isAdmin itself is optional within the user object
      };
    }
  }
}
