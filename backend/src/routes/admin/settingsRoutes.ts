import express, { Request, Response, NextFunction } from 'express';
import { protect, admin } from '../../middleware/authMiddleware';
import { readGaConfig, writeGaConfig } from '../../utils/gaConfigUtils'; // Adjusted path

const router = express.Router();

router.post('/ga', protect, admin, async (req: Request, res: Response, next: NextFunction) => {
  const { measurementId, propertyId } = req.body;

  if (typeof measurementId !== 'string' || typeof propertyId !== 'string') {
    res.status(400).json({ error: 'Measurement ID and Property ID must be strings.' });
    return;
  }
  if (!measurementId.trim() || !propertyId.trim()) {
    res.status(400).json({ error: 'Measurement ID and Property ID cannot be empty.' });
    return;
  }

  try {
    let config = await readGaConfig();
    config.measurementId = measurementId;
    config.propertyId = propertyId;
    await writeGaConfig(config);
    res.json({ success: true, message: 'GA settings saved successfully.' });
  } catch (error) {
    console.error('Error saving GA settings:', error);
    next(new Error('Failed to save GA settings due to a server error.'));
  }
});

router.get('/ga', protect, admin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const config = await readGaConfig();
    res.json({
      measurementId: config.measurementId || '',
      propertyId: config.propertyId || '',
    });
  } catch (error) {
    console.error('Error retrieving GA settings:', error);
    next(new Error('Failed to retrieve GA settings due to a server error.'));
  }
});

export default router;
