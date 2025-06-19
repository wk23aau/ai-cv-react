import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { protect, admin } from '../../middleware/authMiddleware';

const router = express.Router();

const GA_CONFIG_PATH = path.join(__dirname, '../../../ga_config.json');

interface GaConfig {
  measurementId?: string;
  propertyId?: string;
}

async function readGaConfig(): Promise<GaConfig> {
  try {
    const data = await fs.readFile(GA_CONFIG_PATH, 'utf-8');
    return JSON.parse(data) as GaConfig;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return {};
    }
    throw error;
  }
}

async function writeGaConfig(config: GaConfig): Promise<void> {
  await fs.writeFile(GA_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

router.post('/ga', protect, admin, async (req: Request, res: Response, next: NextFunction) => {
  const { measurementId, propertyId } = req.body;

  if (typeof measurementId !== 'string' || typeof propertyId !== 'string') {
    res.status(400).json({ message: 'Measurement ID and Property ID must be strings.' }); // Consider { error: 'message' }
    return;
  }
  if (!measurementId.trim() || !propertyId.trim()) {
    res.status(400).json({ message: 'Measurement ID and Property ID cannot be empty.' }); // Consider { error: 'message' }
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
