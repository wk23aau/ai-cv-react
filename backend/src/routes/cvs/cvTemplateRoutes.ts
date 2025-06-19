import express, { Request, Response } from 'express'; // Added Request, Response for clarity
import pool from '../../db';
import { RowDataPacket } from 'mysql2/promise'; // Added RowDataPacket

// No protect middleware needed if templates are public

const router = express.Router();

// GET /api/cv-templates - Get all available CV templates
router.get('/', async (req: Request, res: Response) => {
    try {
        const [templates] = await pool.query<RowDataPacket[]>('SELECT id, name, description, preview_image_url FROM cv_templates ORDER BY name ASC');
        res.json(templates);
        return;
    } catch (error) {
        console.error('Get CV templates error:', error);
        res.status(500).json({ message: 'Server error while fetching CV templates' });
        return;
    }
});

export default router;
