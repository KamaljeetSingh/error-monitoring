import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { logError } from "./utils/errorLogger";

// Global error handler
window.onerror = async function (message, source, lineno, colno, error) {
  const errorInfo = {
    type: "runtime",
    message,
    source,
    lineno,
    colno,
    stack: error?.stack,
  };

  try {
    console.error("Global error caught:", errorInfo);
    const categorization = await logError(errorInfo);
    console.log("Error categorized as:", categorization);
  } catch (loggingError) {
    console.error("Failed to log error:", loggingError);
  }
  return false;
};

// Unhandled promise rejection handler
window.onunhandledrejection = async function (event) {
  const errorInfo = {
    type: "promise",
    message: event.reason?.message || "Unhandled Promise Rejection",
    stack: event.reason?.stack,
  };

  try {
    console.error("Unhandled promise rejection:", errorInfo);
    const categorization = await logError(errorInfo);
    console.log("Error categorized as:", categorization);
  } catch (loggingError) {
    console.error("Failed to log error:", loggingError);
  }
};

const container = document.getElementById("root");
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
