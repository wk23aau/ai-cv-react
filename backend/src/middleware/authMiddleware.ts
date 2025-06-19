import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config';
import { AuthenticatedUser } from '../types/auth'; // Import AuthenticatedUser

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      req.user = undefined;
      res.status(401).json({ error: 'Not authorized, no token' });
      return;
    }

    // Define what structure you expect from the JWT payload itself
    interface JwtPayload {
      userId: number;
      username: string;
      isAdmin?: boolean; // isAdmin from token might be optional or always present
      // other standard JWT claims like iat, exp, etc.
      iat: number; // Standard claim
      exp: number; // Standard claim
    }

    const decoded = jwt.verify(token, JWT_SECRET!) as JwtPayload;

    // Create an object that explicitly matches the AuthenticatedUser interface
    const authenticatedUser: AuthenticatedUser = {
      userId: decoded.userId,
      username: decoded.username,
      isAdmin: !!decoded.isAdmin // Ensure boolean and handle if undefined in token
    };

    req.user = authenticatedUser;
    next();

  } catch (error) {
    console.error('Token verification failed:', error);
    req.user = undefined;
    res.status(401).json({ error: 'Not authorized, token failed' });
    // No return needed here as it's the end of the catch block and response is sent
  }
};

export const admin = (req: Request, res: Response, next: NextFunction): void => {
  // req.user is now an AuthenticatedUser | undefined due to global augmentation
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ error: req.user ? 'Not authorized as an admin.' : 'Not authorized, no user session.' });
  }
};
