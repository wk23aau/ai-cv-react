// backend/src/types/express.d.ts

import { AuthenticatedUser } from './auth'; // Adjusted path if your file structure differs

// This line ensures the file is treated as a module.
// It's important if your tsconfig.json has "isolatedModules": true,
// or generally to ensure correct module augmentation behavior.
export {};

declare global {
  namespace Express {
    /**
     * Passport declares an empty `User` interface which results in `req.user`
     * being typed as `User | undefined`. This overrides that interface so that
     * both `req.user` and the `User` type itself include the fields we expect
     * after authentication.
     */
    export interface User extends AuthenticatedUser {}

    export interface Request {
      user?: AuthenticatedUser;
    }
  }
}
