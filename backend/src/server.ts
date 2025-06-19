import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/auth/authRoutes';
import userRoutes from './routes/users/userRoutes';
import cvRoutes from './routes/cvs/cvRoutes';
import cvTemplateRoutes from './routes/cvs/cvTemplateRoutes';
import aiRoutes from './routes/ai/aiRoutes'; // Import AI routes
import adminAnalyticsRoutes from './routes/admin/analyticsRoutes'; // Import Admin Analytics routes
import adminUserManagementRoutes from './routes/admin/userManagementRoutes'; // Import Admin User Management routes
import adminSettingsRoutes from './routes/admin/settingsRoutes'; // Import Admin Settings routes
import publicSettingsRoutes from './routes/publicSettingsRoutes'; // Import Public Settings routes

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cvs', cvRoutes);
app.use('/api/cv-templates', cvTemplateRoutes);
app.use('/api/ai', aiRoutes); // Mount AI routes
app.use('/api/admin/analytics', adminAnalyticsRoutes); // Mount Admin Analytics routes
app.use('/api/admin/users', adminUserManagementRoutes); // Mount Admin User Management routes for admin actions on users
app.use('/api/admin/settings', adminSettingsRoutes); // Mount Admin Settings routes (protected)
app.use('/api/settings', publicSettingsRoutes); // Mount Public Settings routes (e.g., for GA Measurement ID)


app.get('/', (req, res) => {
  res.send('Hello from CV Builder Backend!');
});

// Basic Error Handling Middleware
// IMPORTANT: This should be added AFTER all your routes and other middleware.
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled error:", err.stack || err.message || err); // Log the error stack for debugging

  // Avoid sending error details in production for security reasons
  // if (process.env.NODE_ENV === 'production') {
  //   return res.status(500).json({ message: 'Internal Server Error' });
  // }

  // For development, you might want to send more details
  res.status(500).json({
    message: err.message || 'An unexpected error occurred',
    // stack: err.stack // Optionally include stack in dev
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
