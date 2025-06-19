import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config'; // Assuming JWT_SECRET is correctly configured

// AuthRequest interface is removed as Express.Request is now augmented globally.

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      // Set req.user to undefined before sending error response
      req.user = undefined;
      res.status(401).json({ error: 'Not authorized, no token' });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET!) as { // Added non-null assertion for JWT_SECRET
      userId: number;
      username: string;
      isAdmin?: boolean;
      // email might also be in the token, but not used for req.user here
    };

    // Assign to req.user, matching the augmented structure
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      isAdmin: !!decoded.isAdmin // Ensure boolean
    };
    next();

  } catch (error) {
    // Set req.user to undefined before sending error response
    req.user = undefined;
    // It's good practice to log the actual error for server-side debugging
    console.error('Token verification failed:', error);
    res.status(401).json({ error: 'Not authorized, token failed' });
    // No explicit return needed here as it's the end of the catch block in an async function without further await
  }
};

export const admin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ error: req.user ? 'Not authorized as an admin.' : 'Not authorized, no user session.' });
    // No return needed here
  }
};
