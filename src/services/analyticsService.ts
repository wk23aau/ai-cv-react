// Make GtagEventParams more generic for gtag.js 'event' command
// See: https://developers.google.com/gtagjs/reference/event
interface GtagEventParams {
  event_category?: string;
  event_label?: string;
  value?: number;
  [key: string]: any; // Allow other parameters
}

// Ambient declaration for gtag on the window object
// This is needed because gtag is loaded dynamically.
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

let isGtagInitialized = false;
let currentMeasurementId: string | null = null;
let eventQueue: Array<{ type: 'pageview', path: string } | { type: 'event', action: string, params?: GtagEventParams }> = [];

const trackQueuedEvents = () => {
  // console.log('Processing GA event queue. Length:', eventQueue.length);
  while (eventQueue.length > 0) {
    const eventItem = eventQueue.shift();
    if (eventItem) {
      if (eventItem.type === 'pageview') {
        trackPageView(eventItem.path, true); // Pass fromQueue = true
      } else if (eventItem.type === 'event') {
        // The original trackEvent took (category, action, label, value)
        // The new GtagEventParams is more flexible. We'll adapt.
        // For simplicity, the queued event 'action' becomes the gtag action,
        // and 'params' directly becomes gtag params.
        trackEvent(eventItem.action, eventItem.params, true); // Pass fromQueue = true
      }
    }
  }
};

export const initializeGtag = (measurementId: string): Promise<void> => {
  if (isGtagInitialized && measurementId === currentMeasurementId) {
    // console.log('Gtag already initialized with this Measurement ID.');
    return Promise.resolve();
  }

  // If trying to initialize with a new ID, reset (conceptual, actual library might handle this differently)
  if (isGtagInitialized && measurementId !== currentMeasurementId) {
      console.warn(`Re-initializing Gtag with new Measurement ID: ${measurementId}. Previous: ${currentMeasurementId}`);
      isGtagInitialized = false; // Force re-initialization
      // Note: This doesn't remove the old script or its configuration. A full teardown is more complex.
  }


  return new Promise((resolve, reject) => {
    if (!measurementId || !measurementId.startsWith('G-')) {
      console.error('Invalid Measurement ID provided for Gtag initialization:', measurementId);
      return reject(new Error('Invalid Measurement ID. Must start with "G-".'));
    }

    const existingScript = document.getElementById('gtag-script');
    if (existingScript) {
        // If a script with this ID exists, assume it's ours.
        // If currentMeasurementId matches, assume it's already loaded or loading.
        // If not, it might be from a previous attempt or a different ID.
        // For simplicity, if it exists and ID is different, we might remove and re-add,
        // or just log a warning and potentially fail.
        // Current logic: if isGtagInitialized is false, it will proceed to load.
        // If script exists but init is false, it might be from a failed previous load.
        // Let's remove it to be safe if the ID is different or if it failed to load previously.
        if(!isGtagInitialized || currentMeasurementId !== measurementId) {
            console.warn('Removing existing gtag script for re-initialization.');
            existingScript.remove();
        } else if (isGtagInitialized && currentMeasurementId === measurementId) {
            // Already initialized with this ID, and script exists.
            return resolve();
        }
    }


    const script = document.createElement('script');
    script.id = 'gtag-script';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;

    script.onload = () => {
      window.dataLayer = window.dataLayer || [];
      // Ensure gtag function is defined robustly
      window.gtag = function(...args: any[]) {
        // @ts-ignore
        window.dataLayer.push(args); // Using Object.values(arguments) or ...args
      };

      window.gtag('js', new Date());
      window.gtag('config', measurementId); // Primary config for the measurement ID

      currentMeasurementId = measurementId;
      isGtagInitialized = true;
      console.log('Google Analytics initialized with Measurement ID:', measurementId);

      trackQueuedEvents();
      resolve();
    };

    script.onerror = (error) => {
      console.error('Failed to load Google Analytics script:', error);
      isGtagInitialized = false; // Keep it false
      // Attempt to remove the failed script to allow for potential retries without conflicts
      const failedScript = document.getElementById('gtag-script');
      if (failedScript) {
        failedScript.remove();
      }
      reject(new Error('Failed to load Google Analytics script.'));
    };

    document.head.appendChild(script);
  });
};

/**
 * Tracks a page view.
 * @param path - The path of the page to track.
 * @param fromQueue - Internal flag to prevent re-queueing.
 */
export const trackPageView = (path: string, fromQueue: boolean = false) => {
  if (!isGtagInitialized) {
    if (!fromQueue) {
      // console.log('Gtag not initialized. Queuing pageview:', path);
      eventQueue.push({ type: 'pageview', path });
    }
    return;
  }
  if (!currentMeasurementId) {
    console.warn("GA currentMeasurementId not set. Page view not tracked for path:", path);
    return;
  }
  if (!window.gtag) {
    console.warn("window.gtag is not available. Page view not tracked for path:", path);
    return;
  }

  // For SPAs, 'page_view' event is often preferred after initial 'config'
  // However, sending 'config' again with page_path also works and is simpler here.
  window.gtag('config', currentMeasurementId, {
    page_path: path,
  });
  // console.log(`GA PageView: ${path} (ID: ${currentMeasurementId})`);
};


/**
 * Tracks a generic event.
 * @param action - The action of the event (e.g., 'login', 'click').
 * @param params - (Optional) Parameters for the event.
 * @param fromQueue - Internal flag to prevent re-queueing.
 */
export const trackEvent = (action: string, params?: GtagEventParams, fromQueue: boolean = false) => {
  if (!isGtagInitialized) {
    if (!fromQueue) {
      // console.log(`Gtag not initialized. Queuing event: ${action}`, params || '');
      eventQueue.push({ type: 'event', action, params });
    }
    return;
  }
  if (!window.gtag) {
    console.warn(`window.gtag is not available. Event "${action}" not tracked.`);
    return;
  }

  window.gtag('event', action, params);
  // console.log(`GA Event: ${action}`, params || '');
};

// Adapting the old trackEvent signature to the new one for compatibility if needed elsewhere,
// though direct use of the new signature is preferred.
/**
 * @deprecated Use trackEvent(action, params) instead.
 */
export const trackLegacyEvent = (category: string, action: string, label?: string, value?: number) => {
    console.warn("trackLegacyEvent is deprecated. Use trackEvent(action, params) instead.");
    const params: GtagEventParams = {};
    if (category) params.event_category = category;
    if (label) params.event_label = label;
    if (value !== undefined) params.value = value;
    trackEvent(action, params);
};

// Export currentMeasurementId for potential use elsewhere if needed (e.g. debugging UI)
export const getCurrentMeasurementId = () => currentMeasurementId;
export const getIsGtagInitialized = () => isGtagInitialized;
