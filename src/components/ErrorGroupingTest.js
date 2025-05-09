import React, { useState } from "react";
import axios from "axios";
import "./ErrorGroupingTest.css";

const ErrorGroupingTest = () => {
  // Group 1: Resource Loading Errors (should group together)
  const triggerCSSLoadError1 = () => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://missing-stylesheet-1.css";
    link.onerror = () => {
      throw new Error("Loading CSS chunk failed: missing-stylesheet-1.css");
    };
    document.head.appendChild(link);
  };

  const triggerCSSLoadError2 = () => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://missing-stylesheet-2.css";
    link.onerror = () => {
      throw new Error("Failed to load stylesheet: missing-stylesheet-2.css");
    };
    document.head.appendChild(link);
  };

  const triggerScriptLoadError = () => {
    const script = document.createElement("script");
    script.src = "https://missing-script.js";
    script.onerror = () => {
      throw new Error("Loading chunk script failed: missing-script.js");
    };
    document.head.appendChild(script);
  };

  // Group 2: Network Errors (should group together)
  const triggerNetworkError1 = async () => {
    try {
      await axios.get("https://invalid-api-1.example.com/data");
    } catch (error) {
      throw new Error("Network Error: Failed to fetch data from API");
    }
  };

  const triggerNetworkError2 = async () => {
    try {
      await fetch("https://invalid-api-2.example.com/data");
    } catch (error) {
      throw new Error("NetworkError: Failed to connect to server");
    }
  };

  const triggerNetworkError3 = () => {
    const ws = new WebSocket("ws://invalid-websocket.example.com");
    ws.onerror = () => {
      throw new Error("Network Error: WebSocket connection failed");
    };
  };

  // Group 3: Type Errors (should group together)
  const triggerTypeError1 = () => {
    const user = undefined;
    user.getName();
  };

  const triggerTypeError2 = () => {
    const arr = null;
    arr.push(1);
  };

  const triggerTypeError3 = () => {
    const num = 42;
    num.toLowerCase();
  };

  // Group 4: React State Errors (should group together)
  const triggerStateError1 = () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [, setState] = useState(null);
    setState(() => {
      throw new Error("React setState error: Invalid state update");
    });
  };

  const triggerStateError2 = () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [, setState] = useState(null);
    setState(() => {
      throw new Error("React state error: Failed to process state");
    });
  };

  return (
    <div className="error-grouping-test">
      <h2>Error Grouping Test</h2>

      <div className="error-group">
        <h3>Group 1: Resource Loading Errors</h3>
        <p>
          These errors should be grouped together as resource loading errors
        </p>
        <div className="button-group">
          <button onClick={triggerCSSLoadError1}>CSS Load Error 1</button>
          <button onClick={triggerCSSLoadError2}>CSS Load Error 2</button>
          <button onClick={triggerScriptLoadError}>Script Load Error</button>
        </div>
      </div>

      <div className="error-group">
        <h3>Group 2: Network Errors</h3>
        <p>These errors should be grouped together as network errors</p>
        <div className="button-group">
          <button onClick={triggerNetworkError1}>Network Error (Axios)</button>
          <button onClick={triggerNetworkError2}>Network Error (Fetch)</button>
          <button onClick={triggerNetworkError3}>
            Network Error (WebSocket)
          </button>
        </div>
      </div>

      <div className="error-group">
        <h3>Group 3: Type Errors</h3>
        <p>These errors should be grouped together as type errors</p>
        <div className="button-group">
          <button onClick={triggerTypeError1}>Type Error (undefined)</button>
          <button onClick={triggerTypeError2}>Type Error (null)</button>
          <button onClick={triggerTypeError3}>Type Error (number)</button>
        </div>
      </div>

      <div className="error-group">
        <h3>Group 4: React State Errors</h3>
        <p>These errors should be grouped together as React state errors</p>
        <div className="button-group">
          <button onClick={triggerStateError1}>State Error 1</button>
          <button onClick={triggerStateError2}>State Error 2</button>
        </div>
      </div>
    </div>
  );
};

export default ErrorGroupingTest;
