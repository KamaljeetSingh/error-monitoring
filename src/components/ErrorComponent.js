import React, { useState } from "react";

const ErrorComponent = () => {
  const [shouldError, setShouldError] = useState(false);

  if (shouldError) {
    // This will trigger the error boundary
    throw new Error("This is a React component error");
  }

  return (
    <div className="error-component">
      <h3>React Component Error Test</h3>
      <button
        onClick={() => setShouldError(true)}
        style={{
          padding: "10px 20px",
          backgroundColor: "#ff6b6b",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          color: "white",
        }}
      >
        Trigger React Error
      </button>
    </div>
  );
};

export default ErrorComponent;
