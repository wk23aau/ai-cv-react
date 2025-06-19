import express, { Request, Response, NextFunction } from 'express';
import pool from '../../db';
import { protect, admin } from '../../middleware/authMiddleware';
import { RowDataPacket } from 'mysql2/promise';

const router = express.Router();

interface UserDbRow {
  id: number;
  is_active: boolean;
}

router.put('/:userId/toggle-active', protect, admin, async (req: Request, res: Response, next: NextFunction) => {
  const { userId: targetUserIdString } = req.params; // Renamed to avoid conflict with potential req.user.userId

  if (!targetUserIdString || isNaN(parseInt(targetUserIdString))) {
    res.status(400).json({ error: 'Valid User ID is required.' });
    return;
  }
  const targetUserId = parseInt(targetUserIdString);

  // Example of using req.user (if needed for logic like preventing self-deactivation):
  // if (!req.user) { // This check would be needed if using req.user.userId
  //    return res.status(401).json({ error: 'Not authorized, user data not found' });
  // }
  // if (req.user.userId === targetUserId) {
  //   res.status(400).json({ message: 'Admin users cannot deactivate their own account.' });
  //   return;
  // }

  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query<RowDataPacket[]>('SELECT id, is_active FROM users WHERE id = ?', [targetUserId]);

    if (rows.length === 0) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const userRow = rows[0] as UserDbRow;
    const currentUserStatus = userRow.is_active;
    const newStatus = !currentUserStatus;

    const [updateResult] = await connection.query<any>(
      'UPDATE users SET is_active = ? WHERE id = ?',
      [newStatus, targetUserId]
    );

    if (updateResult.affectedRows === 0) {
      // This could also mean the status was already what we tried to set it to,
      // or user just got deleted. For simplicity, treating as an issue.
      res.status(500).json({ error: 'Failed to update user status, user may have been deleted or status unchanged.' });
      return;
    }

    res.json({
      message: `User status updated successfully. User is now ${newStatus ? 'active' : 'inactive'}.`,
      userId: targetUserId,
      isActive: newStatus
    });
  } catch (error) {
    console.error('Error toggling user active status:', error);
    next(error);
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

export default router;
