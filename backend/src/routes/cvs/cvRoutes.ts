import express from 'express';
import pool from '../../db';
import { protect, AuthRequest } from '../../middleware/authMiddleware';

const router = express.Router();

// POST /api/cvs - Create a new CV
router.post('/', protect, async (req: AuthRequest, res: Response) => {
    const { cv_data, template_id, name } = req.body;
    const userId = req.user?.userId;

    if (!cv_data) {
        return res.status(400).json({ message: 'cv_data is required' });
    }

    try {
        const [result] = await pool.query<any>(
            'INSERT INTO cvs (user_id, cv_data, template_id, name) VALUES (?, ?, ?, ?)',
            [userId, JSON.stringify(cv_data), template_id || null, name || 'Untitled CV']
        );
        const newCvId = result.insertId;
        const [newCvRows] = await pool.query<any[]>('SELECT * FROM cvs WHERE id = ?', [newCvId]);

        if (newCvRows.length === 0) {
            return res.status(500).json({ message: 'Failed to retrieve newly created CV' });
        }

        const newCv = newCvRows[0];
        // Parse cv_data from string to JSON before sending response
        try {
            newCv.cv_data = JSON.parse(newCv.cv_data);
        } catch (parseError) {
            console.error("Error parsing cv_data from DB on create:", parseError);
            // Keep it as string if parsing fails, or handle error appropriately
        }

        res.status(201).json(newCv);
    } catch (error) {
        console.error('Create CV error:', error);
        res.status(500).json({ message: 'Server error while creating CV' });
    }
});

// GET /api/cvs - Get all CVs for the logged-in user
router.get('/', protect, async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    try {
        const [cvs] = await pool.query<any[]>('SELECT id, user_id, template_id, name, created_at, updated_at FROM cvs WHERE user_id = ? ORDER BY updated_at DESC', [userId]);
        // Note: cv_data is not returned in the list to keep the response light.
        // It can be fetched when a specific CV is requested.
        res.json(cvs);
    } catch (error) {
        console.error('Get CVs error:', error);
        res.status(500).json({ message: 'Server error while fetching CVs' });
    }
});

// GET /api/cvs/:id - Get a specific CV
router.get('/:id', protect, async (req: AuthRequest, res: Response) => {
    const cvId = req.params.id;
    const userId = req.user?.userId;
    try {
        const [cvs] = await pool.query<any[]>('SELECT * FROM cvs WHERE id = ? AND user_id = ?', [cvId, userId]);
        if (cvs.length === 0) {
            return res.status(404).json({ message: 'CV not found or not authorized' });
        }
        const cv = cvs[0];
        // Parse cv_data from string to JSON
        try {
            cv.cv_data = JSON.parse(cv.cv_data);
        } catch (parseError) {
            console.error("Error parsing cv_data from DB on get single:", parseError);
            return res.status(500).json({ message: 'Error processing CV data from database.' });
        }
        res.json(cv);
    } catch (error) {
        console.error('Get specific CV error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/cvs/:id - Update a specific CV
router.put('/:id', protect, async (req: AuthRequest, res: Response) => {
    const cvId = req.params.id;
    const userId = req.user?.userId;
    const { cv_data, template_id, name } = req.body;

    if (!cv_data && template_id === undefined && name === undefined) {
        return res.status(400).json({ message: 'No fields to update provided' });
    }

    try {
        // First, verify the CV belongs to the user
        const [existingCvs] = await pool.query<any[]>('SELECT * FROM cvs WHERE id = ? AND user_id = ?', [cvId, userId]);
        if (existingCvs.length === 0) {
            return res.status(404).json({ message: 'CV not found or not authorized' });
        }

        let query = 'UPDATE cvs SET ';
        const params: any[] = [];
        if (cv_data !== undefined) {
            query += 'cv_data = ?, ';
            params.push(JSON.stringify(cv_data));
        }
        if (template_id !== undefined) {
            query += 'template_id = ?, ';
            params.push(template_id);
        }
        if (name !== undefined) {
            query += 'name = ?, ';
            params.push(name);
        }
        query += 'updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?';
        params.push(cvId, userId);

        // Remove trailing comma if any before 'updated_at'
        query = query.replace(', updated_at', ' updated_at');

        await pool.query(query, params);

        const [updatedCvRows] = await pool.query<any[]>('SELECT * FROM cvs WHERE id = ?', [cvId]);
        if (updatedCvRows.length === 0) {
            return res.status(500).json({ message: 'Failed to retrieve updated CV' });
        }
        const updatedCv = updatedCvRows[0];
        try {
            updatedCv.cv_data = JSON.parse(updatedCv.cv_data);
        } catch (parseError) {
             console.error("Error parsing cv_data from DB on update:", parseError);
        }

        res.json(updatedCv);
    } catch (error) {
        console.error('Update CV error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/cvs/:id - Delete a specific CV
router.delete('/:id', protect, async (req: AuthRequest, res: Response) => {
    const cvId = req.params.id;
    const userId = req.user?.userId;
    try {
        const [result] = await pool.query<any>('DELETE FROM cvs WHERE id = ? AND user_id = ?', [cvId, userId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'CV not found or not authorized' });
        }
        res.status(200).json({ message: 'CV deleted successfully' });
    } catch (error) {
        console.error('Delete CV error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
