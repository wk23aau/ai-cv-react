import { Router, Response, NextFunction } from 'express'; // Request removed if not used directly
import pool from '../../db';
import { protect, AuthRequest } from '../../middleware/authMiddleware';
import bcrypt from 'bcrypt';
import { RowDataPacket, OkPacket } from 'mysql2/promise'; // Added OkPacket

const router = Router();

// The handlers will be typed with (req: AuthRequest, res: Response, next: NextFunction)

const getUserProfileHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const [rows] = await pool.query<RowDataPacket[]>('SELECT id, username, email, created_at, updated_at, is_admin FROM users WHERE id = ?', [req.user?.userId]);
        if (rows.length === 0) {
            res.status(404).json({ message: 'User not found' });
            return; // Ensures void return for this path
        }
        // Assuming the selected fields are what you want to return.
        // If you have a specific User DTO, you might cast rows[0] to that.
        res.json(rows[0]);
    } catch (error) {
        next(error);
    }
};

const updateUserProfileHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { username, email, password } = req.body;
    const userId = req.user?.userId;

    if (!userId) { // Important check if req.user or req.user.userId could be undefined
        res.status(401).json({ message: 'Not authorized' }); // Or 403 Forbidden
        return;
    }

    if (!username && !email && !password) {
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
        if (password) {
            const salt = await bcrypt.genSalt(10);
            const password_hash = await bcrypt.hash(password, salt);
            query += 'password_hash = ?, ';
            params.push(password_hash);
        }

        query += 'updated_at = CURRENT_TIMESTAMP WHERE id = ?';
        params.push(userId);
        query = query.replace(', updated_at', ' updated_at');

        const [result] = await pool.query<OkPacket>(query, params);

        if (result.affectedRows === 0) {
            res.status(404).json({ message: 'User not found or no changes made' });
            return;
        }

        const [updatedUsers] = await pool.query<RowDataPacket[]>('SELECT id, username, email, created_at, updated_at, is_admin FROM users WHERE id = ?', [userId]);
        res.json(updatedUsers[0]);

    } catch (error: any) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(409).json({ message: 'Username or email already taken.' });
            return;
        }
        next(error);
    }
};

// GET /api/users/me - Get current user's profile
router.get('/me', protect, getUserProfileHandler);

// PUT /api/users/me - Update current user's profile
router.put('/me', protect, updateUserProfileHandler);

export default router;
