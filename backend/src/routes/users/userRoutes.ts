import express from 'express';
import pool from '../../db';
import { protect, AuthRequest } from '../../middleware/authMiddleware';
import bcrypt from 'bcrypt';

const router = express.Router();

// GET /api/users/me - Get current user's profile
router.get('/me', protect, async (req: AuthRequest, res: Response) => {
    try {
        const [users] = await pool.query<any[]>('SELECT id, username, email, created_at, updated_at, is_admin FROM users WHERE id = ?', [req.user?.userId]);
        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(users[0]);
    } catch (error) {
        console.error('Get user profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/users/me - Update current user's profile
router.put('/me', protect, async (req: AuthRequest, res: Response) => {
    const { username, email, password } = req.body;
    const userId = req.user?.userId;

    if (!username && !email && !password) {
        return res.status(400).json({ message: 'No fields to update' });
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
        if (password) {
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);
            query += 'password_hash = ?, ';
            params.push(password_hash);
        }

        query += 'updated_at = CURRENT_TIMESTAMP WHERE id = ?';
        params.push(userId);

        // Remove trailing comma if any before 'updated_at'
        query = query.replace(', updated_at', ' updated_at');


        const [result] = await pool.query<any>(query, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found or no changes made' });
        }

        const [updatedUsers] = await pool.query<any[]>('SELECT id, username, email, created_at, updated_at, is_admin FROM users WHERE id = ?', [userId]);
        res.json(updatedUsers[0]);

    } catch (error: any) {
        console.error('Update user profile error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Username or email already taken.' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
