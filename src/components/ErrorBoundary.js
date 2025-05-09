import React from "react";
import { logError } from "../utils/errorLogger";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to our error tracking system
    logError({
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
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong.</h2>
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
              this.setState({ hasError: false, error: null, errorInfo: null })
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
