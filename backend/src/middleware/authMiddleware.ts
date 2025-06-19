import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config';

export interface AuthRequest extends Request {
    user?: { userId: number; username: string; isAdmin?: boolean };
}

export const protect = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            // Define a more specific type for the decoded token if possible, matching tokenPayload
            const decoded = jwt.verify(token, JWT_SECRET) as {
                userId: number;
                username: string;
                email: string; // email is in the token
                isAdmin: boolean; // Expect isAdmin to be boolean from token now
                iat: number;
                exp: number
            };
            // Ensure conversion if isAdmin might not be a boolean strictly from token
            req.user = {
                userId: decoded.userId,
                username: decoded.username,
                isAdmin: !!decoded.isAdmin // Explicitly make it boolean
            };
            next();
        } catch (error) {
            console.error('Token verification error:', error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

export const admin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};
