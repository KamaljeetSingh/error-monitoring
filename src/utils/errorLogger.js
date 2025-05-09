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

// Function to normalize stack trace for grouping
const normalizeStackTrace = (stack) => {
  if (!stack) return null;

  // Split the stack into lines
  const lines = stack.split("\n");

  // Process each line to extract key information
  return lines
    .map((line) => {
      // Remove line numbers and columns as they can vary
      line = line.replace(/:\d+:\d+/g, "");
      // Remove query parameters from URLs
      line = line.replace(/\?.*$/, "");
      // Remove webpack:// and similar prefixes
      line = line.replace(/^(webpack|webpack-internal):\/\/\//, "");
      return line.trim();
    })
    .filter(Boolean); // Remove empty lines
};

// Function to generate fingerprint from error
const generateFingerprint = (errorInfo) => {
  const components = [];

  // Add error type if available
  if (errorInfo.type) {
    components.push(errorInfo.type);
  }

  // Add error name if available
  if (errorInfo.name) {
    components.push(errorInfo.name);
  }

  // Process stack trace if available
  if (errorInfo.stack) {
    const normalizedStack = normalizeStackTrace(errorInfo.stack);
    if (normalizedStack && normalizedStack.length > 0) {
      // Take first 3 stack frames for fingerprinting
      components.push(...normalizedStack.slice(0, 3));
    }
  }

  // If it's a React error boundary error, include component stack
  if (
    errorInfo.type === "react_error_boundary" &&
    errorInfo.errorInfo?.componentStack
  ) {
    const componentStack = normalizeStackTrace(
      errorInfo.errorInfo.componentStack
    );
    if (componentStack && componentStack.length > 0) {
      components.push(...componentStack.slice(0, 2));
    }
  }

  // If no stack trace, use error message
  if (components.length === 0 && errorInfo.message) {
    // Remove variable parts from message (like dynamic values)
    const normalizedMessage = errorInfo.message
      .replace(/\d+/g, "N") // Replace numbers with N
      .replace(/["'].*?["']/g, "S") // Replace strings with S
      .replace(/https?:\/\/[^\s]+/g, "URL"); // Replace URLs with URL
    components.push(normalizedMessage);
  }

  // Join all components and create a hash
  return hashString(components.join("|"));
};

// Simple hash function
const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(36); // Convert to base-36 for shorter hash
};

// Function to log error to MongoDB
export const logError = async (errorInfo) => {
  try {
    // Generate fingerprint for grouping
    const fingerprint = generateFingerprint(errorInfo);

    const errorData = {
      ...errorInfo,
      fingerprint,
      deviceInfo: getDeviceInfo(),
      pageInfo: getPageInfo(),
      timestamp: new Date().toISOString(),
    };

    await axios.post(`${API_URL}/log-error`, errorData);
  } catch (error) {
    console.error("Failed to log error:", error);
  }
};
