import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { protect, admin, AuthRequest } from '../../middleware/authMiddleware';

const router = express.Router();

// Define the path to the GA configuration file
// Assuming this route file is in backend/src/routes/admin/,
// then __dirname is backend/src/routes/admin.
// So, ../../../ga_config.json would point to backend/ga_config.json
const GA_CONFIG_PATH = path.join(__dirname, '../../../ga_config.json'); // Adjusted path for backend/ga_config.json

interface GaConfig {
  measurementId?: string;
  propertyId?: string;
}

// Helper function to read GA config
async function readGaConfig(): Promise<GaConfig> {
  try {
    const data = await fs.readFile(GA_CONFIG_PATH, 'utf-8');
    return JSON.parse(data) as GaConfig;
  } catch (error: any) {
    // If file doesn't exist or other read error, return empty config
    if (error.code === 'ENOENT') {
      return {};
    }
    // For other errors, rethrow to be caught by route handler
    throw error;
  }
}

// Helper function to write GA config
async function writeGaConfig(config: GaConfig): Promise<void> {
  await fs.writeFile(GA_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

// POST /api/admin/settings/ga - Save GA Configuration
router.post('/ga', protect, admin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { measurementId, propertyId } = req.body;

  if (typeof measurementId !== 'string' || typeof propertyId !== 'string') {
    res.status(400).json({ message: 'Measurement ID and Property ID must be strings.' });
    return; // Added return
  }
  // Basic validation, can be enhanced (e.g., regex for G-XXXX format)
  if (!measurementId.trim() || !propertyId.trim()) {
    res.status(400).json({ message: 'Measurement ID and Property ID cannot be empty.' });
    return; // Added return
  }

  try {
    let config = await readGaConfig();
    config.measurementId = measurementId;
    config.propertyId = propertyId;
    await writeGaConfig(config);
    res.json({ success: true, message: 'GA settings saved successfully.' });
  } catch (error) {
    console.error('Error saving GA settings:', error);
    next(new Error('Failed to save GA settings due to a server error.')); // Pass a generic error to global handler
  }
});

// GET /api/admin/settings/ga - Retrieve GA Configuration
router.get('/ga', protect, admin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const config = await readGaConfig();
    res.json({
      measurementId: config.measurementId || '',
      propertyId: config.propertyId || '',
    });
  } catch (error) {
    console.error('Error retrieving GA settings:', error);
    // If readGaConfig itself throws an error (not ENOENT), it will be caught here.
    next(new Error('Failed to retrieve GA settings due to a server error.'));
  }
});

export default router;
