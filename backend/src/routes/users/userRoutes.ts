import express, { Router, Request, Response, NextFunction } from 'express';
import pool from '../../db';
import { protect } from '../../middleware/authMiddleware'; // Removed AuthRequest import

const router = Router();

// Changed req type from AuthRequest to Request
const getUserProfileHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // req.user is now available due to module augmentation
        const [users] = await pool.query<any[]>('SELECT id, username, email, created_at, updated_at, is_admin FROM users WHERE id = ?', [req.user?.userId]);
        if (users.length === 0) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.json(users[0]);
    } catch (error) {
        next(error);
    }
};

// Changed req type from AuthRequest to Request
const updateUserProfileHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { username, email } = req.body; // Password update logic already removed
    const userId = req.user?.userId; // req.user is now available due to module augmentation

    if (!username && !email) {
        res.status(400).json({ message: 'No fields to update' });
        return;
    }

    try {
        let query = 'UPDATE users SET ';
        const params: any[] = [];

        if (username) {
            query += 'username = ?, ';
            params.push(username);
        }
        if (email) {
            query += 'email = ?, ';
            params.push(email);
        }

        query += 'updated_at = CURRENT_TIMESTAMP WHERE id = ?';
        params.push(userId);

        query = query.replace(', updated_at', ' updated_at');


        const [result] = await pool.query<any>(query, params);

        if (result.affectedRows === 0) {
            res.status(404).json({ message: 'User not found or no changes made' });
            return;
        }

        const [updatedUsers] = await pool.query<any[]>('SELECT id, username, email, created_at, updated_at, is_admin FROM users WHERE id = ?', [userId]);
        res.json(updatedUsers[0]);

    } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ message: 'Username or email already taken.' });
            return;
        }
        next(error);
    }
};

// Removed 'as express.RequestHandler' casts
router.get('/me', protect, getUserProfileHandler);
router.put('/me', protect, updateUserProfileHandler);

export default router;
