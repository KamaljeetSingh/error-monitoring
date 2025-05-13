import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Function to get device and browser information
const getDeviceInfo = () => {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    colorDepth: window.screen.colorDepth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    cookiesEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack,
    online: navigator.onLine,
    memory: navigator.deviceMemory,
    hardwareConcurrency: navigator.hardwareConcurrency,
    connection: navigator.connection
      ? {
          effectiveType: navigator.connection.effectiveType,
          rtt: navigator.connection.rtt,
          downlink: navigator.connection.downlink,
        }
      : null,
  };
};

// Function to get current URL and referrer
const getPageInfo = () => {
  return {
    url: window.location.href,
    referrer: document.referrer,
    title: document.title,
  };
};

// Function to log error to server
export const logError = async (errorInfo) => {
  try {
    const errorData = {
      ...errorInfo,
      deviceInfo: getDeviceInfo(),
      pageInfo: getPageInfo(),
      timestamp: new Date().toISOString(),
    };

    const response = await axios.post(`${API_URL}/log-error`, errorData);

    // Return the categorization from the server response if needed
    return response.data.categorization;
  } catch (error) {
    console.error("Failed to log error:", error);
    throw error; // Re-throw to allow error handling by the caller
  }
};
