import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { logError } from "./utils/errorLogger";

// Global error handler
window.onerror = function (message, source, lineno, colno, error) {
  const errorInfo = {
    type: "runtime",
    message,
    source,
    lineno,
    colno,
    stack: error?.stack,
  };

  console.error("Global error caught:", errorInfo);
  logError(errorInfo);
  return false;
};

// Unhandled promise rejection handler
window.onunhandledrejection = function (event) {
  const errorInfo = {
    type: "promise",
    message: event.reason?.message || "Unhandled Promise Rejection",
    stack: event.reason?.stack,
  };

  console.error("Unhandled promise rejection:", errorInfo);
  logError(errorInfo);
};

const container = document.getElementById("root");
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
