import { Request, Response, NextFunction } from 'express'; // Using Request from express
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config';

// The AuthRequest interface is no longer needed here, as Express.Request is augmented.
// export interface AuthRequest extends Request {
//     user?: { userId: number; username: string; isAdmin?: boolean };
// }

export const protect = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as {
                userId: number;
                username: string;
                email: string; // email is in the token but not strictly part of req.user by default
                isAdmin: boolean;
                iat: number;
                exp: number
            };

            // Now assign to req.user directly. TypeScript knows its augmented shape.
            req.user = {
                userId: decoded.userId,
                username: decoded.username,
                isAdmin: !!decoded.isAdmin
            };
            next();
        } catch (error) {
            console.error('Token verification error:', error);
            // Clear user on failed token, though req.user might not have been set yet.
            req.user = undefined;
            res.status(401).json({ message: 'Not authorized, token failed' });
            return;
        }
    } else {
        req.user = undefined; // Clear user if no token
        res.status(401).json({ message: 'Not authorized, no token' });
        return;
    }
};

export const admin = (req: Request, res: Response, next: NextFunction) => {
    // req.user is now known to TypeScript via module augmentation
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        // req.user might be undefined if 'protect' failed or wasn't called
        res.status(403).json({ message: req.user ? 'Not authorized as an admin.' : 'Not authorized, no user session.' });
    }
};
