import express, { Response, NextFunction } from 'express'; // Request removed as AuthRequest is used
import pool from '../../db'; // Database pool
import { protect, admin, AuthRequest } from '../../middleware/authMiddleware'; // Auth middleware
import { RowDataPacket } from 'mysql2/promise';

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
router.put('/:userId/toggle-active', protect, admin, (async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { userId } = req.params;

  if (!userId || isNaN(parseInt(userId))) {
    res.status(400).json({ message: 'Valid User ID is required.' });
    return; // Added return
  }
  const targetUserId = parseInt(userId);

  // Optional: Prevent admin from deactivating themselves if that's a desired business rule
  // if (req.user && req.user.userId === targetUserId) {
  //   res.status(400).json({ message: 'Admin users cannot deactivate their own account.' });
  // return;
  // }

  let connection; // Define connection here to be accessible in finally
  try {
    connection = await pool.getConnection();

    // Changed UserDbRow[] to RowDataPacket[]
    const [rows] = await connection.query<RowDataPacket[]>('SELECT id, is_active FROM users WHERE id = ?', [targetUserId]);

    if (rows.length === 0) {
      // connection.release(); // Moved to finally
      res.status(404).json({ message: 'User not found.' });
      return; // Added return
    }

    const userRow = rows[0] as UserDbRow; // Assert type for use
    const currentUserStatus = userRow.is_active;
    const newStatus = !currentUserStatus;

    const [updateResult] = await connection.query<any>( // OkPacket is typical for UPDATE
      'UPDATE users SET is_active = ? WHERE id = ?',
      [newStatus, targetUserId]
    );

    // connection.release(); // Moved to finally

    if (updateResult.affectedRows === 0) {
      res.status(500).json({ message: 'Failed to update user status, user may have been deleted.' });
      return; // Added return
    }

    res.json({
      message: `User status updated successfully. User is now ${newStatus ? 'active' : 'inactive'}.`,
      userId: targetUserId,
      isActive: newStatus
    });
    // No explicit return needed here as it's the end of a try path and res.json() was called.
  } catch (error) {
    console.error('Error toggling user active status:', error);
    next(error); // Passes to error handler
  } finally {
    if (connection) {
      connection.release(); // Ensure connection is released
    }
  }
}) as express.RequestHandler);

export default router;
