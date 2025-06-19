import express from 'express';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { protect, admin } from '../../middleware/authMiddleware';
import { GA_PROPERTY_ID } from '../../config'; // Import GA_PROPERTY_ID

const router = express.Router();

// Initialize Google Analytics Data API client
// The client will automatically use credentials from GOOGLE_APPLICATION_CREDENTIALS environment variable.
const analyticsDataClient = new BetaAnalyticsDataClient();

// GET /api/admin/analytics/overview
// Protected: Admin only
// Fetches real analytics data from Google Analytics Data API.
// NOTE: Ensure GOOGLE_APPLICATION_CREDENTIALS environment variable is set for authentication.
//       And GA_PROPERTY_ID is correctly configured in .env or config.ts.
router.get('/overview', protect, admin, async (req, res) => {
  if (!GA_PROPERTY_ID || GA_PROPERTY_ID === 'YOUR_GA_PROPERTY_ID') {
    console.error('GA_PROPERTY_ID is not configured.');
    return res.status(500).json({
      message: 'Google Analytics Property ID is not configured on the server. Please set GA_PROPERTY_ID.'
    });
  }

  try {
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${GA_PROPERTY_ID}`,
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
    console.error('Error fetching Google Analytics data:', error.message);
    // Check for specific error details if available
    let errorMessage = 'Failed to fetch analytics data from Google.';
    if (error.details) {
      errorMessage += ` Details: ${error.details}`;
    }
     // Provide more specific error message if GA_PROPERTY_ID is the default placeholder
    if (GA_PROPERTY_ID === 'YOUR_GA_PROPERTY_ID' && error.message.includes('Property ID')) {
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
