import express from 'express';
import { protect, admin } from '../../middleware/authMiddleware'; // Corrected path

const router = express.Router();

// Mock data for analytics overview
const mockAnalyticsData = {
  totalVisits: 1234,
  uniqueVisitors: 789,
  pageViews: 5678,
  averageSessionDuration: "5m30s",
  mostVisitedPages: [
    { path: '/', visits: 1200 },
    { path: '/editor', visits: 800 },
    { path: '/dashboard', visits: 650 },
  ],
  trafficSources: {
    direct: 500,
    organicSearch: 300,
    referral: 150,
  }
};

// GET /api/admin/analytics/overview
// Protected: Admin only
router.get('/overview', protect, admin, (req, res) => {
  try {
    // In a real application, you would fetch this data from your analytics service
    // or a database where you store aggregated analytics.
    res.json(mockAnalyticsData);
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    res.status(500).json({ message: 'Error fetching analytics data' });
  }
});

export default router;
