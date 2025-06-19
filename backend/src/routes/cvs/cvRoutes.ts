import express, { Router, Request, Response, NextFunction } from 'express';
import pool from '../../db';
import { protect } from '../../middleware/authMiddleware';

const router = Router();

const createCvHandler = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) { // Added check
        return res.status(401).json({ error: 'Not authorized' });
    }
    const { cv_data, template_id, name } = req.body;
    const userId = req.user.userId; // Safe access

    if (!cv_data) {
        res.status(400).json({ error: 'cv_data is required' });
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

const getAllCvsHandler = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) { // Added check
        return res.status(401).json({ error: 'Not authorized' });
    }
    const userId = req.user.userId; // Safe access
    try {
        const [cvs] = await pool.query<any[]>('SELECT id, user_id, template_id, name, created_at, updated_at FROM cvs WHERE user_id = ? ORDER BY updated_at DESC', [userId]);
        res.json(cvs);
    } catch (error) {
        next(error);
    }
};

const getCvByIdHandler = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) { // Added check
        return res.status(401).json({ error: 'Not authorized' });
    }
    const cvId = req.params.id;
    const userId = req.user.userId; // Safe access
    try {
        const [cvs] = await pool.query<any[]>('SELECT * FROM cvs WHERE id = ? AND user_id = ?', [cvId, userId]);
        if (cvs.length === 0) {
            res.status(404).json({ error: 'CV not found or not authorized' });
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

const updateCvHandler = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) { // Added check
        return res.status(401).json({ error: 'Not authorized' });
    }
    const cvId = req.params.id;
    const userId = req.user.userId; // Safe access
    const { cv_data, template_id, name } = req.body;

    if (cv_data === undefined && template_id === undefined && name === undefined) {
        res.status(400).json({ error: 'No fields to update provided' });
        return;
    }
    try {
        const [existingCvs] = await pool.query<any[]>('SELECT id FROM cvs WHERE id = ? AND user_id = ?', [cvId, userId]);
        if (existingCvs.length === 0) {
            res.status(404).json({ error: 'CV not found or not authorized for update' });
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

const deleteCvHandler = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) { // Added check
        return res.status(401).json({ error: 'Not authorized' });
    }
    const cvId = req.params.id;
    const userId = req.user.userId; // Safe access
    try {
        const [result] = await pool.query<any>('DELETE FROM cvs WHERE id = ? AND user_id = ?', [cvId, userId]);
        if (result.affectedRows === 0) {
            res.status(404).json({ error: 'CV not found or not authorized for deletion' });
            return;
        }
        res.status(200).json({ message: 'CV deleted successfully' });
    } catch (error) {
        next(error);
    }
};

router.post('/', protect, createCvHandler);
router.get('/', protect, getAllCvsHandler);
router.get('/:id', protect, getCvByIdHandler);
router.put('/:id', protect, updateCvHandler);
router.delete('/:id', protect, deleteCvHandler);

export default router;
