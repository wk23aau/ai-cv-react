import { Router, Request, Response, NextFunction } from 'express'; // express import for Router already here
import pool from '../../db';
import { protect } from '../../middleware/authMiddleware';

const router = Router();

const getUserProfileHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => { // Added Promise<void> return type
  try {
    if (!req.user) { // Check if req.user is populated by 'protect'
      res.status(401).json({ error: 'Not authorized, user data not found' });
      return;
    }
    // Access req.user.userId safely
    const [users] = await pool.query<any[]>('SELECT id, username, email, created_at, updated_at, is_admin FROM users WHERE id = ?', [req.user.userId]);

    if (users.length === 0) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json(users[0]);
  } catch (error) {
    next(error);
  }
};

const updateUserProfileHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => { // Added Promise<void> return type
  try {
    if (!req.user) { // Check if req.user is populated
      res.status(401).json({ error: 'Not authorized, user data not found' });
      return;
    }

    const { username, email } = req.body;
    const userId = req.user.userId; // Access userId safely

    if (!username && !email) {
      res.status(400).json({ message: 'No fields to update' });
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
      res.status(404).json({ message: 'User not found or no changes made' });
      return;
    }

    const [updatedUsers] = await pool.query<any[]>('SELECT id, username, email, created_at, updated_at, is_admin FROM users WHERE id = ?', [userId]);
    res.json(updatedUsers[0]);

  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ message: 'Username or email already taken.' }); // Consider changing to { error: 'message' } for consistency
      return;
    }
    next(error);
  }
};

// Routes - 'as express.RequestHandler' casts were already removed
router.get('/me', protect, getUserProfileHandler);
router.put('/me', protect, updateUserProfileHandler);

export default router;
