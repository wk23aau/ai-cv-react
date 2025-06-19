// backend/src/types/express.d.ts

import { AuthenticatedUser } from './auth'; // Adjusted path if your file structure differs

// This line ensures the file is treated as a module.
// It's important if your tsconfig.json has "isolatedModules": true,
// or generally to ensure correct module augmentation behavior.
export {};

declare global {
  namespace Express {
    export interface Request {
      user?: AuthenticatedUser; // Use the imported AuthenticatedUser interface
    }
  }
}
