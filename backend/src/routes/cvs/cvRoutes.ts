import express, { Router, Response, NextFunction } from 'express'; // Removed RequestHandler from direct import
import pool from '../../db';
import { protect, AuthRequest } from '../../middleware/authMiddleware';

const router = Router();

// Changed req type to AuthRequest, removed internal cast
const createCvHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { cv_data, template_id, name } = req.body;
    const userId = req.user?.userId; // Direct use of req.user

    if (!cv_data) {
        res.status(400).json({ message: 'cv_data is required' });
        return;
    }

    try {
        const [result] = await pool.query<any>(
            'INSERT INTO cvs (user_id, cv_data, template_id, name) VALUES (?, ?, ?, ?)',
            [userId, JSON.stringify(cv_data), template_id || null, name || 'Untitled CV']
        );

        if (!result || !result.insertId) {
            throw new Error('CV creation failed, no insertId returned from database.');
        }
        const newCvId = result.insertId;
        const [newCvRows] = await pool.query<any[]>('SELECT * FROM cvs WHERE id = ?', [newCvId]);

        if (newCvRows.length === 0) {
            throw new Error('Failed to retrieve newly created CV immediately after insertion.');
        }

        const newCv = newCvRows[0];
        if (typeof newCv.cv_data === 'string') {
            newCv.cv_data = JSON.parse(newCv.cv_data);
        }
        res.status(201).json(newCv);
    } catch (error) {
        next(error);
    }
};

// Changed req type to AuthRequest, removed internal cast
const getAllCvsHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.userId; // Direct use of req.user
    try {
        const [cvs] = await pool.query<any[]>('SELECT id, user_id, template_id, name, created_at, updated_at FROM cvs WHERE user_id = ? ORDER BY updated_at DESC', [userId]);
        res.json(cvs);
    } catch (error) {
        next(error);
    }
};

// Changed req type to AuthRequest, removed internal cast
const getCvByIdHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const cvId = req.params.id;
    const userId = req.user?.userId; // Direct use of req.user
    try {
        const [cvs] = await pool.query<any[]>('SELECT * FROM cvs WHERE id = ? AND user_id = ?', [cvId, userId]);
        if (cvs.length === 0) {
            res.status(404).json({ message: 'CV not found or not authorized' });
            return;
        }
        const cv = cvs[0];
        if (typeof cv.cv_data === 'string') {
            cv.cv_data = JSON.parse(cv.cv_data);
        }
        res.json(cv);
    } catch (error) {
        next(error);
    }
};

// Changed req type to AuthRequest, removed internal cast
const updateCvHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const cvId = req.params.id;
    const userId = req.user?.userId; // Direct use of req.user
    const { cv_data, template_id, name } = req.body;

    if (cv_data === undefined && template_id === undefined && name === undefined) {
        res.status(400).json({ message: 'No fields to update provided' });
        return;
    }
    try {
        const [existingCvs] = await pool.query<any[]>('SELECT id FROM cvs WHERE id = ? AND user_id = ?', [cvId, userId]);
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
        await pool.query<any>(query, params);
        const [updatedCvRows] = await pool.query<any[]>('SELECT * FROM cvs WHERE id = ? AND user_id = ?', [cvId, userId]);
        if (updatedCvRows.length === 0) {
            throw new Error('Failed to retrieve updated CV after update operation.');
        }
        const updatedCv = updatedCvRows[0];
        if (typeof updatedCv.cv_data === 'string') {
            updatedCv.cv_data = JSON.parse(updatedCv.cv_data);
        }
        res.json(updatedCv);
    } catch (error) {
        next(error);
    }
};

// Changed req type to AuthRequest, removed internal cast
const deleteCvHandler = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const cvId = req.params.id;
    const userId = req.user?.userId; // Direct use of req.user
    try {
        const [result] = await pool.query<any>('DELETE FROM cvs WHERE id = ? AND user_id = ?', [cvId, userId]);
        if (result.affectedRows === 0) {
            res.status(404).json({ message: 'CV not found or not authorized for deletion' });
            return;
        }
        res.status(200).json({ message: 'CV deleted successfully' });
    } catch (error) {
        next(error);
    }
};

// Apply 'as express.RequestHandler' casts
router.post('/', protect, createCvHandler as express.RequestHandler);
router.get('/', protect, getAllCvsHandler as express.RequestHandler);
router.get('/:id', protect, getCvByIdHandler as express.RequestHandler);
router.put('/:id', protect, updateCvHandler as express.RequestHandler);
router.delete('/:id', protect, deleteCvHandler as express.RequestHandler);

export default router;
