import express, { Request, Response } from 'express'; // Added Request
import { BetaAnalyticsDataClient, protos } from '@google-analytics/data';
import fs from 'fs/promises';
import path from 'path';
import { protect, admin } from '../../middleware/authMiddleware'; // Removed AuthRequest import

const router = express.Router();

const GA_CONFIG_PATH = path.join(__dirname, '../../../ga_config.json');

interface GaConfigFile {
  measurementId?: string;
  propertyId?: string;
}

const analyticsDataClient = new BetaAnalyticsDataClient();

// Changed req type from AuthRequest to Request, removed 'as express.RequestHandler' cast
router.get('/overview', protect, admin, async (req: Request, res: Response) => {
  let finalPropertyId = '';
  let propertyIdSource = '';

  try {
    const data = await fs.readFile(GA_CONFIG_PATH, 'utf-8');
    const configFromFile = JSON.parse(data) as GaConfigFile;
    if (configFromFile.propertyId && configFromFile.propertyId.trim() !== '') {
      finalPropertyId = configFromFile.propertyId.trim();
      propertyIdSource = 'ga_config.json';
      console.log('Using GA Property ID from ga_config.json:', finalPropertyId);
    }
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      console.error('Error reading ga_config.json:', error.message);
    }
  }

  if (!finalPropertyId) {
    const envGaPropertyId = process.env.GA_PROPERTY_ID;
    if (envGaPropertyId && envGaPropertyId !== 'YOUR_GA_PROPERTY_ID') {
      finalPropertyId = envGaPropertyId;
      propertyIdSource = 'environment variable';
      console.log('Using GA Property ID from environment variable:', finalPropertyId);
    }
  }

  if (!finalPropertyId || finalPropertyId === 'YOUR_GA_PROPERTY_ID') {
    console.error('GA Property ID is not configured (checked file and environment).');
    res.status(500).json({
      message: 'Google Analytics Property ID is not configured on the server. Please set it in Admin > GA Configuration or via the GA_PROPERTY_ID environment variable.'
    });
    return;
  }

  try {
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${finalPropertyId}`,
      dateRanges: [
        {
          startDate: '7daysAgo',
          endDate: 'today',
        },
      ],
      metrics: [
        { name: 'activeUsers' },
        { name: 'newUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' },
      ],
    });

    let activeUsers = 0;
    let newUsers = 0;
    let sessions = 0;
    let screenPageViews = 0;
    let averageSessionDuration = "0s";

    response.rows?.forEach((row: protos.google.analytics.data.v1beta.IRow) => {
      if (row.metricValues) {
        activeUsers = parseInt(row.metricValues[0]?.value || '0');
        newUsers = parseInt(row.metricValues[1]?.value || '0');
        sessions = parseInt(row.metricValues[2]?.value || '0');
        screenPageViews = parseInt(row.metricValues[3]?.value || '0');
        const durationInSeconds = parseFloat(row.metricValues[4]?.value || '0');
        const minutes = Math.floor(durationInSeconds / 60);
        const seconds = Math.floor(durationInSeconds % 60);
        averageSessionDuration = `${minutes}m${seconds}s`;
      }
    });

    const formattedData = {
      totalVisits: sessions,
      uniqueVisitors: activeUsers,
      pageViews: screenPageViews,
      averageSessionDuration: averageSessionDuration,
      newUsers: newUsers,
    };

    res.json(formattedData);

  } catch (error: any) {
    console.error(`Error fetching Google Analytics data using Property ID from ${propertyIdSource} (${finalPropertyId}):`, error.message);
    let errorMessage = 'Failed to fetch analytics data from Google.';
    if (error.details) {
      errorMessage += ` Details: ${error.details}`;
    }
    if (finalPropertyId === 'YOUR_GA_PROPERTY_ID' && error.message.includes('Property ID')) {
        errorMessage = 'Failed to fetch analytics data: Invalid GA_PROPERTY_ID. Please ensure it is correctly configured.';
    } else if (error.message.includes('quota')) {
        errorMessage = 'Failed to fetch analytics data: Google Analytics API quota exceeded.';
    } else if (error.message.includes('permission')) {
        errorMessage = 'Failed to fetch analytics data: Permission denied. Check service account access to the GA property.';
    }

    res.status(500).json({
        message: errorMessage,
    });
    return;
  }
});

export default router;
