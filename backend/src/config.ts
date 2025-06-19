import dotenv from 'dotenv';

dotenv.config();

export const JWT_SECRET = process.env.JWT_SECRET || 'fallbacksecret';
export const GA_PROPERTY_ID = process.env.GA_PROPERTY_ID || 'YOUR_GA_PROPERTY_ID'; // Placeholder for Google Analytics Property ID
