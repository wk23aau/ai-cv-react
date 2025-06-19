import express, { Router, Response, NextFunction } from 'express';
import pool from '../../db';
import { protect, AuthRequest } from '../../middleware/authMiddleware';
import { RowDataPacket, OkPacket } from 'mysql2/promise';

const router = Router();

const createCvHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { cv_data, template_id, name } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
        res.status(401).json({ message: 'Not authorized to create CV' });
        return;
    }
    if (!cv_data) {
        res.status(400).json({ message: 'cv_data is required' });
        return;
    }

    try {
        const [result] = await pool.query<OkPacket>(
            'INSERT INTO cvs (user_id, cv_data, template_id, name) VALUES (?, ?, ?, ?)',
            [userId, JSON.stringify(cv_data), template_id || null, name || 'Untitled CV']
        );

        if (!result || !result.insertId) {
            throw new Error('CV creation failed, no insertId returned from database.');
        }
        const newCvId = result.insertId;
        const [newCvRows] = await pool.query<RowDataPacket[]>('SELECT * FROM cvs WHERE id = ?', [newCvId]);

        if (newCvRows.length === 0) {
            throw new Error('Failed to retrieve newly created CV immediately after insertion.');
        }

        const newCv = newCvRows[0];
        try {
            if (typeof newCv.cv_data === 'string') {
                newCv.cv_data = JSON.parse(newCv.cv_data);
            }
        } catch (parseError) {
            console.error("Error parsing cv_data from DB on create:", parseError);
            // Potentially send response with cv_data as string or handle error
        }

        res.status(201).json(newCv);
        return;
    } catch (error) {
        next(error);
    }
};

const getAllCvsHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json({ message: 'Not authorized to view CVs' });
        return;
    }
    try {
        const [cvs] = await pool.query<RowDataPacket[]>('SELECT id, user_id, template_id, name, created_at, updated_at FROM cvs WHERE user_id = ? ORDER BY updated_at DESC', [userId]);
        res.json(cvs);
        return;
    } catch (error) {
        next(error);
    }
};

const getCvByIdHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const cvId = req.params.id;
    const userId = req.user?.userId;
    if (!userId) {
        res.status(401).json({ message: 'Not authorized' });
        return;
    }
    try {
        const [cvs] = await pool.query<RowDataPacket[]>('SELECT * FROM cvs WHERE id = ? AND user_id = ?', [cvId, userId]);
        if (cvs.length === 0) {
            res.status(404).json({ message: 'CV not found or not authorized' });
            return;
        }
        const cv = cvs[0];
        try {
            if (typeof cv.cv_data === 'string') {
                cv.cv_data = JSON.parse(cv.cv_data);
            }
        } catch (parseError) {
            console.error("Error parsing cv_data from DB on get single:", parseError);
            throw new Error('Error processing CV data from database.');
        }
        res.json(cv);
        return;
    } catch (error) {
        next(error);
    }
};

const updateCvHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const cvId = req.params.id;
    const userId = req.user?.userId;
    const { cv_data, template_id, name } = req.body;

    if (!userId) {
        res.status(401).json({ message: 'Not authorized' });
        return;
    }
    if (cv_data === undefined && template_id === undefined && name === undefined) {
        res.status(400).json({ message: 'No fields to update provided' });
        return;
    }

    try {
        const [existingCvs] = await pool.query<RowDataPacket[]>('SELECT id FROM cvs WHERE id = ? AND user_id = ?', [cvId, userId]);
        if (existingCvs.length === 0) {
            res.status(404).json({ message: 'CV not found or not authorized for update' });
            return;
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

        query = query.replace(', updated_at', ' updated_at');

        await pool.query<OkPacket>(query, params);
        // Note: affectedRows might be 0 if submitted data is same as existing.
        // Fetching the CV ensures the latest data is returned.

        const [updatedCvRows] = await pool.query<RowDataPacket[]>('SELECT * FROM cvs WHERE id = ? AND user_id = ?', [cvId, userId]);
        if (updatedCvRows.length === 0) {
            throw new Error('Failed to retrieve updated CV after update operation.');
        }
        const updatedCv = updatedCvRows[0];
        try {
            if (typeof updatedCv.cv_data === 'string') {
                updatedCv.cv_data = JSON.parse(updatedCv.cv_data);
            }
        } catch (parseError) {
             console.error("Error parsing cv_data from DB on update:", parseError);
        }

        res.json(updatedCv);
        return;
    } catch (error) {
        next(error);
    }
};

const deleteCvHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const cvId = req.params.id;
    const userId = req.user?.userId;

    if (!userId) {
        res.status(401).json({ message: 'Not authorized' });
        return;
    }
    try {
        const [result] = await pool.query<OkPacket>('DELETE FROM cvs WHERE id = ? AND user_id = ?', [cvId, userId]);
        if (result.affectedRows === 0) {
            res.status(404).json({ message: 'CV not found or not authorized for deletion' });
            return;
        }
        res.status(200).json({ message: 'CV deleted successfully' });
        return;
    } catch (error) {
        next(error);
    }
};

// Define routes
router.post('/', protect, createCvHandler);
router.get('/', protect, getAllCvsHandler);
router.get('/:id', protect, getCvByIdHandler);
router.put('/:id', protect, updateCvHandler);
router.delete('/:id', protect, deleteCvHandler);

export default router;
