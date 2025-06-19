import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import pool from '../db';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL } from '../config';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config';

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_CALLBACK_URL,
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const { id: googleId, displayName, emails } = profile;
        const email = emails && emails.length > 0 ? emails[0].value : null;

        if (!email) {
          return done(new Error('Email not provided by Google'), undefined);
        }

        // Check if user exists with this Google ID
        let [users] = await pool.query<any[]>('SELECT * FROM users WHERE google_id = ?', [googleId]);
        let user = users[0];

        if (!user) {
          // If not, check if user exists with this email (to link accounts)
          [users] = await pool.query<any[]>('SELECT * FROM users WHERE email = ?', [email]);
          user = users[0];

          if (user) {
            // User exists with this email, link Google ID
            await pool.query('UPDATE users SET google_id = ? WHERE id = ?', [googleId, user.id]);
          } else {
            // New user, create one
            // Use displayName as username, or part of email if displayName is not available
            const username = displayName || email.split('@')[0];
            const [result] = await pool.query<any>(
              'INSERT INTO users (username, email, google_id, is_verified) VALUES (?, ?, ?, ?)',
              [username, email, googleId, true] // Mark as verified since email comes from Google
            );
            if (!result || !result.insertId) {
               return done(new Error('Failed to create new user with Google OAuth.'), undefined);
            }
            user = { id: result.insertId, username, email, google_id: googleId, is_admin: 0 }; // Assume not admin by default
          }
        }

        // At this point, 'user' object should be populated, either found or created.
        // Ensure we have all necessary fields for the JWT.
        // If the user was found by email and then google_id was added, or found by google_id,
        // we need to ensure the 'user' object has 'id', 'username', 'email', 'is_admin'.
        // The existing queries might not return all these if columns are missing or named differently.
        // Let's re-fetch the user to be sure, or ensure the INSERT/UPDATE path correctly forms the user object.

        // For simplicity, we assume 'user' now has at least 'id', 'username', 'email', and 'is_admin' (even if default).
        // The existing user schema might not have 'is_admin' set by default or 'google_id'.
        // This part might need adjustment based on the exact schema and how complete the 'user' object is.

        const tokenPayload = {
          userId: user.id,
          username: user.username,
          email: user.email, // Ensure email is part of the token
          isAdmin: user.is_admin || 0, // Ensure isAdmin is part of the token, defaulting to 0 (false)
        };
        const appToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1h' });

        return done(null, { token: appToken, user: tokenPayload }); // Pass our app token and user info
      } catch (error) {
        return done(error, undefined);
      }
    }
  )
);

// Note: passport.serializeUser and passport.deserializeUser are not strictly needed
// if we are using JWTs and not relying on session-based authentication with Passport.
// For JWT flow, the callback directly provides the token.

export default passport;
