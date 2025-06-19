// Ambient declaration for gtag if not using a library like @types/gtag.js
declare global {
  interface Window {
    gtag?: (command: string, action: string, params?: GtagEventParams | { user_id: string | null } | { page_path: string }) => void;
  }
}

export interface GtagEventParams {
  event_category?: string;
  event_label?: string;
  value?: number;
  [key: string]: any; // Allow other custom parameters
}

const GA_TRACKING_ID = "G-XXXXXXXXXX"; // Replace with your actual Measurement ID

/**
 * Sends a page view event to Google Analytics.
 * Should be called on initial load and on route changes.
 * @param path - The path of the page being viewed (e.g., window.location.pathname).
 */
export const trackPageView = (path: string): void => {
  if (typeof window.gtag === 'function') {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: path,
    });
    console.log(`GA PageView: ${path}`);
  } else {
    // console.warn('gtag not available for page view tracking.');
  }
};

/**
 * Sends an event to Google Analytics.
 * @param action - The action of the event (e.g., 'click', 'cv_generated').
 * @param params - Optional parameters for the event, including category, label, value.
 */
export const trackEvent = (action: string, params?: GtagEventParams): void => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', action, params);
    console.log(`GA Event: ${action}`, params || '');
  } else {
    // console.warn(`gtag not available for event: ${action}`);
  }
};

export const trackEvent = (action: string, params?: GtagEventParams): void => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', action, params);
    console.log(`GA Event: ${action}`, params || '');
  } else {
    // console.warn(`gtag not available for event: ${action}`);
  }
};

/**
 * Sets the user ID for Google Analytics tracking.
 * This should be called after a user logs in.
 * @param userId - The unique identifier for the user.
 */
export const setUserId = (userId: string | number | null): void => {
  if (typeof window.gtag === 'function') {
    if (userId) {
      window.gtag('config', GA_TRACKING_ID, {
        'user_id': String(userId) // GA expects user_id to be a string
      });
      console.log(`GA User-ID set: ${userId}`);
    } else {
      // If clearing user_id, some recommend sending null, others just stop sending it.
      // Sending config with user_id: null might be explicit.
      // Or, subsequent page views/events without user_id effectively "clears" it for those hits.
      // For simplicity, we'll rely on new page loads/configs not having it if not set.
      // Or, more explicitly:
      window.gtag('config', GA_TRACKING_ID, {
        'user_id': null
      });
      console.log('GA User-ID cleared.');
    }
  } else {
    // console.warn('gtag not available for setting User-ID.');
  }
};

export default {
  trackPageView,
  trackEvent,
  setUserId,
};
