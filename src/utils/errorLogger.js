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

// Built-in fingerprint rules for common error patterns
const BUILT_IN_FINGERPRINT_RULES = [
  {
    // CSS Chunk Loading Errors
    test: (error) => {
      return (
        error.message?.includes("Loading CSS chunk failed") ||
        error.message?.includes("Loading chunk") ||
        error.message?.includes("stylesheet") ||
        (error.type === "ChunkLoadError" && error.message?.includes("CSS"))
      );
    },
    getFingerprint: () => ["css-chunk-load-error"],
  },
  {
    // Network related errors
    test: (error) => {
      return (
        error.name === "NetworkError" ||
        error.message?.includes("Network Error") ||
        error.message?.includes("Failed to fetch") ||
        error.message?.includes("ERR_CONNECTION") ||
        (error.type === "AxiosError" && error.message?.includes("Network"))
      );
    },
    getFingerprint: (error) => ["network-error", error.type || error.name],
  },
  {
    // Resource loading errors
    test: (error) => {
      return (
        error.message?.includes("Failed to load resource") ||
        error.message?.includes("404") ||
        error.message?.includes("failed to load")
      );
    },
    getFingerprint: (error) => {
      // Extract resource type (script, style, image, etc.)
      const resourceType =
        error.message?.match(/(script|style|image|resource)/i)?.[0] ||
        "resource";
      return ["resource-load-error", resourceType.toLowerCase()];
    },
  },
];

// Function to normalize stack trace for grouping
const normalizeStackTrace = (stack) => {
  if (!stack) return null;

  // Split the stack into lines and process each line
  const lines = stack.split("\n").map((line) => {
    // Remove line numbers and columns
    line = line.replace(/:\d+:\d+/g, "");

    // Remove query parameters and hashes from URLs
    line = line.replace(/\?.*$/, "").replace(/#.*$/, "");

    // Remove webpack:// and similar prefixes
    line = line.replace(/^(webpack|webpack-internal):\/\/\//, "");

    // Remove dynamic paths (like hashes in build files)
    line = line.replace(/[a-f0-9]{7,}/g, "HASH");

    // Remove variable parts of anonymous function names
    line = line.replace(/<anonymous>:\d+/g, "<anonymous>");

    // Normalize common patterns in React component names
    line = line.replace(/\/(index|main)\.(js|jsx|ts|tsx)/, "/$1");

    // Remove or normalize version numbers
    line = line.replace(/[@/][\d.]+(-[a-z]+(\.\d+)?)?/g, "");

    return line.trim();
  });

  // Filter out empty lines and known irrelevant frames
  return lines.filter((line) => {
    return (
      line &&
      !line.includes("node_modules") &&
      !line.includes("webpack/runtime")
    );
  });
};

// Function to normalize error message
const normalizeErrorMessage = (message) => {
  if (!message) return "";

  return (
    message
      // Replace all numbers with 'N'
      .replace(/\d+([,.]\d+)?/g, "N")
      // Replace all URLs with 'URL'
      .replace(/https?:\/\/[^\s)]+/g, "URL")
      // Replace all file paths
      .replace(/\/[\w/.%-]+/g, "PATH")
      // Replace all hex colors
      .replace(/#[0-9a-f]{3,6}/gi, "HEX")
      // Replace all quoted strings
      .replace(/"([^"]*)"/, "STR")
      .replace(/'([^']*)'/, "STR")
      // Replace all UUIDs and similar long hex strings
      .replace(
        /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi,
        "UUID"
      )
      // Normalize whitespace
      .replace(/\s+/g, " ")
      .trim()
  );
};

// Function to extract meaningful parts from error
const extractErrorComponents = (errorInfo) => {
  const components = [];

  // Check built-in rules first
  for (const rule of BUILT_IN_FINGERPRINT_RULES) {
    if (rule.test(errorInfo)) {
      return rule.getFingerprint(errorInfo);
    }
  }

  // Add error type and name
  if (errorInfo.type) components.push(errorInfo.type);
  if (errorInfo.name && errorInfo.name !== errorInfo.type)
    components.push(errorInfo.name);

  // Process stack trace if available
  if (errorInfo.stack) {
    const normalizedStack = normalizeStackTrace(errorInfo.stack);
    if (normalizedStack && normalizedStack.length > 0) {
      // Take first 3 in-app frames for fingerprinting
      components.push(...normalizedStack.slice(0, 3));
    }
  }

  // Handle React error boundary errors
  if (
    errorInfo.type === "react_error_boundary" &&
    errorInfo.errorInfo?.componentStack
  ) {
    const componentStack = normalizeStackTrace(
      errorInfo.errorInfo.componentStack
    );
    if (componentStack && componentStack.length > 0) {
      // Take first 2 component frames
      components.push(...componentStack.slice(0, 2));
    }
  }

  // If no stack trace, use normalized error message
  if (components.length === 0 && errorInfo.message) {
    components.push(normalizeErrorMessage(errorInfo.message));
  }

  return components;
};

// Enhanced hash function using MurmurHash3
const murmurhash3 = (key) => {
  let h1 = 0xdeadbeef;
  const c1 = 0xcc9e2d51;
  const c2 = 0x1b873593;

  for (let i = 0; i < key.length; i++) {
    let k1 = key.charCodeAt(i);
    k1 = (k1 & 0xffff) * c1 + ((((k1 >>> 16) * c1) & 0xffff) << 16);
    k1 = (k1 << 15) | (k1 >>> 17);
    k1 = (k1 & 0xffff) * c2 + ((((k1 >>> 16) * c2) & 0xffff) << 16);
    h1 ^= k1;
    h1 = (h1 << 13) | (h1 >>> 19);
    h1 = (h1 & 0xffff) * 5 + ((((h1 >>> 16) * 5) & 0xffff) << 16);
    h1 = (h1 & 0xffff) + 0x6b64 + ((((h1 >>> 16) + 0xe654) & 0xffff) << 16);
  }

  h1 ^= key.length;
  h1 ^= h1 >>> 16;
  h1 =
    (h1 & 0xffff) * 0x85ebca6b + ((((h1 >>> 16) * 0x85ebca6b) & 0xffff) << 16);
  h1 ^= h1 >>> 13;
  h1 =
    (h1 & 0xffff) * 0xc2b2ae35 + ((((h1 >>> 16) * 0xc2b2ae35) & 0xffff) << 16);
  h1 ^= h1 >>> 16;

  return (h1 >>> 0).toString(36);
};

// Function to generate fingerprint from error
const generateFingerprint = (errorInfo) => {
  const components = extractErrorComponents(errorInfo);

  // Join components and create a hash
  return murmurhash3(components.join("|"));
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
