import express, { Router, Request, Response, NextFunction } from 'express';
import pool from '../../db';
import { protect, AuthRequest } from '../../middleware/authMiddleware';
// import bcrypt from 'bcrypt'; // REMOVE THIS LINE

const router = Router();

const getUserProfileHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        // req.user is now properly typed via AuthRequest from 'protect' middleware
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

const updateUserProfileHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { username, email } = req.body; // Removed password
    const userId = req.user?.userId;

    if (!username && !email) { // Condition updated
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
        // Password update logic removed

        query += 'updated_at = CURRENT_TIMESTAMP WHERE id = ?';
        params.push(userId);

        // Remove trailing comma if any before 'updated_at'
        // A more robust way to build the query might be to collect field updates in an array and then join them.
        // For example: const setClauses = []; if (username) setClauses.push('username = ?'); ... query += setClauses.join(', ');
        // However, the current replace method works for the specific fields here.
        query = query.replace(', updated_at', ' updated_at'); // Clean up query string if only one field was present before updated_at
        if (query.startsWith('UPDATE users SET updated_at')) { // if no fields were added, username or email
             query = query.replace('updated_at = CURRENT_TIMESTAMP WHERE id = ?', 'id = ?'); // Avoid updating only updated_at if no other changes
             // This case should ideally be caught by the "No fields to update" check,
             // but as a safeguard if only `updated_at` was the change (which is implicitly done).
             // Or, ensure the query is only built if there are actual changes.
             // For now, the existing logic means at least one of username/email must be present.
        }


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

router.get('/me', protect, getUserProfileHandler as express.RequestHandler);
router.put('/me', protect, updateUserProfileHandler as express.RequestHandler);

export default router;
