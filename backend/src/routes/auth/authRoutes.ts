import express, { Request, Response, NextFunction, Router } from 'express';
import passport from '../../middleware/passportConfig';
// import bcrypt from 'bcrypt'; // Remove if not used - REMOVED
import jwt from 'jsonwebtoken'; // Still used by passportConfig (indirectly via creating JWTs in passportConfig)
import pool from '../../db'; // Still used by passportConfig
import { JWT_SECRET } from '../../config'; // Still used by passportConfig (indirectly)

const router = Router();

// Google OAuth Routes - KEEP THESE
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login?error=oauth_failed', session: false }),
  (req: Request, res: Response) => {
    // Successful authentication
    // req.user is populated by Passport's verify callback with { token: appToken, user: tokenPayload }
    const { token, user } = req.user as { token: string; user: any };

    // Redirect to a frontend page that can handle the token
    // For example, pass the token as a query parameter
    // The frontend will then use this token to update AuthContext
    // IMPORTANT: Ensure your frontend callback URL can handle this.
    // Using environment variable for frontend URL is good practice.
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'; // Default Vite dev server
    res.redirect(`${frontendUrl}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`);
  }
);

export default router;
