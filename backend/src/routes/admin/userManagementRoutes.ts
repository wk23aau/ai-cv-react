import express, { Request, Response, NextFunction } from 'express';
import pool from '../../db'; // Database pool
import { protect, admin, AuthRequest } from '../../middleware/authMiddleware'; // Auth middleware

const router = express.Router();

// Interface for database row, assuming RowDataPacket or similar
interface UserDbRow {
  id: number;
  is_active: boolean;
  // other fields if needed
}

// PUT /api/admin/users/:userId/toggle-active
// Toggles the is_active status of a user.
// Protected: Admin only
router.put('/:userId/toggle-active', protect, admin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { userId } = req.params;

  if (!userId || isNaN(parseInt(userId))) {
    return res.status(400).json({ message: 'Valid User ID is required.' });
  }
  const targetUserId = parseInt(userId);

  // Optional: Prevent admin from deactivating themselves if that's a desired business rule
  // if (req.user && req.user.userId === targetUserId) {
  //   return res.status(400).json({ message: 'Admin users cannot deactivate their own account.' });
  // }

  try {
    const connection = await pool.getConnection(); // Get a connection from the pool

    // Check if user exists and get current status
    const [rows] = await connection.query<UserDbRow[]>('SELECT id, is_active FROM users WHERE id = ?', [targetUserId]);

    if (rows.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'User not found.' });
    }

    const currentUserStatus = rows[0].is_active;
    const newStatus = !currentUserStatus;

    // Update the user's is_active status
    const [updateResult] = await connection.query<any>(
      'UPDATE users SET is_active = ? WHERE id = ?',
      [newStatus, targetUserId]
    );

    connection.release(); // Release the connection back to the pool

    if (updateResult.affectedRows === 0) {
      // Should not happen if user was found, but good to check
      return res.status(500).json({ message: 'Failed to update user status, user may have been deleted.' });
    }

    res.json({
      message: `User status updated successfully. User is now ${newStatus ? 'active' : 'inactive'}.`,
      userId: targetUserId,
      isActive: newStatus
    });

  } catch (error) {
    console.error('Error toggling user active status:', error);
    next(error); // Pass error to the global error handler
  }
});

export default router;
