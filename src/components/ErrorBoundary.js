import React from "react";
import { logError } from "../utils/errorLogger";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      categorization: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  async componentDidCatch(error, errorInfo) {
    try {
      // Log the error to our error tracking system
      const categorization = await logError({
        type: "react_error_boundary",
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        name: error.name,
        errorInfo: {
          componentStack: errorInfo.componentStack,
        },
      });

      this.setState({
        error: error,
        errorInfo: errorInfo,
        categorization: categorization,
      });
    } catch (loggingError) {
      console.error("Failed to log error:", loggingError);
      this.setState({
        error: error,
        errorInfo: errorInfo,
      });
    }
  }

  render() {
    if (this.state.hasError) {
      const { categorization } = this.state;
      const priorityColor = categorization?.priority
        ? {
            P0: "#dc2626", // Red
            P1: "#f97316", // Orange
            P2: "#eab308", // Yellow
            P3: "#22c55e", // Green
          }[categorization.priority]
        : "#666";

      return (
        <div className="error-boundary">
          <h2>Something went wrong.</h2>
          {categorization && (
            <div
              style={{
                padding: "10px",
                margin: "10px 0",
                borderLeft: `4px solid ${priorityColor}`,
                backgroundColor: `${priorityColor}10`,
              }}
            >
              <h3 style={{ margin: "0 0 5px 0", color: priorityColor }}>
                {categorization.priority} - {categorization.explanation}
              </h3>
              {categorization.recommendations && (
                <p style={{ margin: "5px 0", fontSize: "0.9em" }}>
                  <strong>Recommendations:</strong>{" "}
                  {categorization.recommendations}
                </p>
              )}
            </div>
          )}
          <details style={{ whiteSpace: "pre-wrap", color: "#666" }}>
            <summary>Error Details</summary>
            <p>
              <strong>Error:</strong> {this.state.error?.toString()}
            </p>
            <p>
              <strong>Component Stack:</strong>{" "}
              {this.state.errorInfo?.componentStack}
            </p>
          </details>
          <button
            onClick={() =>
              this.setState({
                hasError: false,
                error: null,
                errorInfo: null,
                categorization: null,
              })
            }
            style={{
              padding: "10px 20px",
              margin: "20px 0",
              backgroundColor: "#61dafb",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
