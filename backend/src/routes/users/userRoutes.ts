import express, { Router, Request, Response, NextFunction, RequestHandler } from 'express'; // Added RequestHandler
import pool from '../../db';
import { protect } from '../../middleware/authMiddleware';

const router = Router();

const getUserProfileHandler: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authorized, user data not found' });
      return;
    }

    const [users] = await pool.query<any[]>('SELECT id, username, email, created_at, updated_at, is_admin FROM users WHERE id = ?', [req.user.userId]);

    if (users.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(users[0]);
  } catch (error) {
    next(error);
  }
};

const updateUserProfileHandler: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authorized, user data not found' });
      return;
    }

    const { username, email } = req.body;
    const userId = req.user.userId;

    if (!username && !email) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

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
      res.status(404).json({ error: 'User not found or no changes made' });
      return;
    }

    const [updatedUsers] = await pool.query<any[]>('SELECT id, username, email, created_at, updated_at, is_admin FROM users WHERE id = ?', [userId]);
    res.json(updatedUsers[0]);

  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'Username or email already taken.' });
      return;
    }
    next(error);
  }
};

router.get('/me', protect, getUserProfileHandler);
router.put('/me', protect, updateUserProfileHandler);

export default router;
