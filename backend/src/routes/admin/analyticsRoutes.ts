import express from 'express';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import fs from 'fs/promises'; // Added for file system operations
import path from 'path'; // Added for path manipulation
import { protect, admin } from '../../middleware/authMiddleware';
import { GA_PROPERTY_ID as ENV_GA_PROPERTY_ID } from '../../config'; // Renamed for clarity

const router = express.Router();

// Define the path to the GA configuration file, similar to settingsRoutes.ts
// Assuming this route file is in backend/src/routes/admin/,
// then __dirname is backend/src/routes/admin.
// So, ../../../ga_config.json would point to backend/ga_config.json
const GA_CONFIG_PATH = path.join(__dirname, '../../../ga_config.json');

interface GaConfigFile {
  measurementId?: string;
  propertyId?: string;
}

// Initialize Google Analytics Data API client
// The client will automatically use credentials from GOOGLE_APPLICATION_CREDENTIALS environment variable.
const analyticsDataClient = new BetaAnalyticsDataClient();

// GET /api/admin/analytics/overview
// Protected: Admin only
// Fetches real analytics data from Google Analytics Data API.
// NOTE: Ensure GOOGLE_APPLICATION_CREDENTIALS environment variable is set for authentication.
//       The GA Property ID will be sourced from ga_config.json first, then fallback to environment variable.
router.get('/overview', protect, admin, async (req, res) => {
  let finalPropertyId = '';
  let propertyIdSource = '';

  // 1. Try to read from ga_config.json
  try {
    const data = await fs.readFile(GA_CONFIG_PATH, 'utf-8');
    const configFromFile = JSON.parse(data) as GaConfigFile;
    if (configFromFile.propertyId && configFromFile.propertyId.trim() !== '') {
      finalPropertyId = configFromFile.propertyId.trim();
      propertyIdSource = 'ga_config.json';
      console.log('Using GA Property ID from ga_config.json:', finalPropertyId);
    }
  } catch (error: any) {
    // Log errors other than file not found, but don't fail the request, fallback instead.
    if (error.code !== 'ENOENT') {
      console.error('Error reading ga_config.json:', error.message);
    }
    // If ENOENT or other read error, proceed to fallback.
  }

  // 2. Fallback to environment variable if not found in file
  if (!finalPropertyId) {
    if (ENV_GA_PROPERTY_ID && ENV_GA_PROPERTY_ID !== 'YOUR_GA_PROPERTY_ID') {
      finalPropertyId = ENV_GA_PROPERTY_ID;
      propertyIdSource = 'environment variable';
      console.log('Using GA Property ID from environment variable:', finalPropertyId);
    }
  }

  // 3. Validate finalPropertyId before making API call
  if (!finalPropertyId || finalPropertyId === 'YOUR_GA_PROPERTY_ID') {
    console.error('GA Property ID is not configured (checked file and environment).');
    return res.status(500).json({
      message: 'Google Analytics Property ID is not configured on the server. Please set it in Admin > GA Configuration or via the GA_PROPERTY_ID environment variable.'
    });
  }

  try {
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${finalPropertyId}`, // Use the determined property ID
      dateRanges: [
        {
          startDate: '7daysAgo',
          endDate: 'today',
        },
      ],
      metrics: [
        { name: 'activeUsers' },      // Unique visitors
        { name: 'newUsers' },         // New users
        { name: 'sessions' },         // Total visits/sessions
        { name: 'screenPageViews' },  // Page views
        { name: 'averageSessionDuration' }, // Average session duration in seconds
      ],
    });

    let activeUsers = 0;
    let newUsers = 0;
    let sessions = 0;
    let screenPageViews = 0;
    let averageSessionDuration = "0s"; // Default to "0s" or 0 if you prefer number

    response.rows?.forEach(row => {
      // Each row typically corresponds to dimensions, but if no dimensions, there's one row for totals.
      // The order of metricValues corresponds to the order of metrics in the request.
      if (row.metricValues) {
        activeUsers = parseInt(row.metricValues[0]?.value || '0');
        newUsers = parseInt(row.metricValues[1]?.value || '0');
        sessions = parseInt(row.metricValues[2]?.value || '0');
        screenPageViews = parseInt(row.metricValues[3]?.value || '0');
        // averageSessionDuration is in seconds. Format it as "XmYs"
        const durationInSeconds = parseFloat(row.metricValues[4]?.value || '0');
        const minutes = Math.floor(durationInSeconds / 60);
        const seconds = Math.floor(durationInSeconds % 60);
        averageSessionDuration = `${minutes}m${seconds}s`;
      }
    });

    // This is the structure the frontend expects
    const formattedData = {
      totalVisits: sessions,         // Mapped from 'sessions'
      uniqueVisitors: activeUsers,   // Mapped from 'activeUsers'
      pageViews: screenPageViews,    // Mapped from 'screenPageViews'
      averageSessionDuration: averageSessionDuration, // Formatted string
      newUsers: newUsers,            // Added new metric
      // The following fields are not directly available from this basic GA report
      // and would require different/multiple API calls or further processing.
      // For now, they are removed or can be set to default/mock values if needed.
      // mostVisitedPages: [],
      // trafficSources: {},
    };

    res.json(formattedData);

  } catch (error: any) {
    console.error(`Error fetching Google Analytics data using Property ID from ${propertyIdSource} (${finalPropertyId}):`, error.message);
    // Check for specific error details if available
    let errorMessage = 'Failed to fetch analytics data from Google.';
    if (error.details) {
      errorMessage += ` Details: ${error.details}`;
    }
    // Customize error message based on the source of Property ID if it was default/placeholder
    if (finalPropertyId === 'YOUR_GA_PROPERTY_ID' && error.message.includes('Property ID')) {
        errorMessage = 'Failed to fetch analytics data: Invalid GA_PROPERTY_ID. Please ensure it is correctly configured.';
    } else if (error.message.includes('quota')) {
        errorMessage = 'Failed to fetch analytics data: Google Analytics API quota exceeded.';
    } else if (error.message.includes('permission')) {
        errorMessage = 'Failed to fetch analytics data: Permission denied. Check service account access to the GA property.';
    }

    res.status(500).json({
        message: errorMessage,
        // Optionally include error details in dev, but not prod
        // errorDetails: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
