import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Assuming a global stylesheet, adjust if necessary
import App from './App';
import { AuthProvider } from './AuthContext'; // Import AuthProvider
import * as analyticsService from './services/analyticsService'; // Import the service
// import reportWebVitals from './reportWebVitals'; // Optional, from CRA

// Fetch GA Measurement ID and initialize Gtag
// This runs asynchronously and should not block app rendering.
// analyticsService is designed to queue events if gtag is not ready.
fetch('/api/settings/ga/public-measurement-id')
  .then(response => {
    if (!response.ok) {
      throw new Error(`Failed to fetch GA settings: ${response.status} ${response.statusText}`);
    }
    return response.json();
  })
  .then(data => {
    if (data && data.measurementId && typeof data.measurementId === 'string' && data.measurementId.startsWith('G-')) {
      analyticsService.initializeGtag(data.measurementId)
        .then(() => {
          console.log("Gtag initialization successfully triggered via public Measurement ID:", data.measurementId);
          // Page views are typically tracked by AnalyticsPageViewTracker in App.tsx
          // or similar mechanism once the router is ready and gtag is initialized.
        })
        .catch(error => {
          console.error("Error initializing Gtag after fetching ID:", error);
        });
    } else if (data && (data.measurementId === null || data.measurementId === '')) {
      console.warn('GA Measurement ID is not configured on the backend. Analytics will be disabled.');
    } else {
      // This case might occur if the response format is unexpected or measurementId is invalid
      console.warn('GA Measurement ID not found or invalid in response. Analytics will be disabled. Response:', data);
    }
  })
  .catch(error => {
    console.error('Error fetching GA Measurement ID from /api/settings/ga/public-measurement-id:', error);
    // App should still render, analytics will be disabled or use queued events if it initializes later.
  });
  // .finally() is not strictly needed here as render is independent.

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);

// // If you want to start measuring performance in your app, pass a function
// // to log results (for example: reportWebVitals(console.log))
// // or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
