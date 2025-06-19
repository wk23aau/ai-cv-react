import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();

// Define the path to the GA configuration file
// Assuming this route file is in backend/src/routes/,
// then __dirname is backend/src/routes. (Adjust if placed in admin or other subfolder)
// If it's in backend/src/routes/ then ../../ga_config.json should be correct for backend/ga_config.json
const GA_CONFIG_PATH = path.join(__dirname, '../../ga_config.json');

interface GaConfig {
  measurementId?: string;
  propertyId?: string; // Not used by this route, but part of the file structure
}

// GET /api/settings/ga/public-measurement-id - Retrieve Public GA Measurement ID
// This endpoint is public and does not require authentication.
router.get('/ga/public-measurement-id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    let measurementId: string | null = null;
    try {
      const data = await fs.readFile(GA_CONFIG_PATH, 'utf-8');
      const config = JSON.parse(data) as GaConfig;
      if (config.measurementId && typeof config.measurementId === 'string' && config.measurementId.trim() !== '') {
        measurementId = config.measurementId.trim();
      }
    } catch (error: any) {
      // If file doesn't exist (ENOENT) or is invalid JSON, measurementId remains null.
      // Log other errors server-side but don't expose details to client.
      if (error.code !== 'ENOENT') {
        console.error('Error reading GA config file for public measurement ID:', error.message);
      }
      // measurementId will be null, which is the desired response in case of error or missing file/field.
    }

    res.json({ measurementId });

  } catch (error) { // Catch unexpected errors in the route handler itself
    console.error('Unexpected error in /ga/public-measurement-id route:', error);
    // Pass to global error handler, which should send a generic 500 response
    next(new Error('An unexpected server error occurred.'));
  }
});

export default router;
