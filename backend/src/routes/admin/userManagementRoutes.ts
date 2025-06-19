import express, { Request, Response, NextFunction } from 'express'; // Ensured Request is imported
import pool from '../../db';
import { protect, admin } from '../../middleware/authMiddleware'; // Removed AuthRequest import
import { RowDataPacket } from 'mysql2/promise';

const router = express.Router();

interface UserDbRow {
  id: number;
  is_active: boolean;
}

// Changed req type from AuthRequest to Request, removed 'as express.RequestHandler' cast
router.put('/:userId/toggle-active', protect, admin, async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = req.params;

  if (!userId || isNaN(parseInt(userId))) {
    res.status(400).json({ message: 'Valid User ID is required.' });
    return;
  }
  const targetUserId = parseInt(userId);

  // Example of using req.user which is now available via augmentation.
  // This check is commented out as per original logic, but demonstrates req.user access.
  // if (req.user && req.user.userId === targetUserId) {
  //   res.status(400).json({ message: 'Admin users cannot deactivate their own account.' });
  //   return;
  // }

  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query<RowDataPacket[]>('SELECT id, is_active FROM users WHERE id = ?', [targetUserId]);

    if (rows.length === 0) {
      res.status(404).json({ message: 'User not found.' });
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
      res.status(500).json({ message: 'Failed to update user status, user may have been deleted.' });
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
