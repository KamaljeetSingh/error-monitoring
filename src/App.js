import React, { useState, Suspense, useEffect } from "react";
import axios from "axios";
import "./App.css";
import ErrorBoundary from "./components/ErrorBoundary";
import ErrorComponent from "./components/ErrorComponent";
import IssuesList from "./components/IssuesList";
import ErrorGroupingTest from "./components/ErrorGroupingTest";

// Lazy loaded component for Suspense error
const LazyComponent = React.lazy(
  () =>
    new Promise((resolve) => {
      setTimeout(() => {
        resolve({ default: () => <div>Lazy Loaded Content</div> });
      }, 1000);
    })
);

function App() {
  const [currentView, setCurrentView] = useState("demo");
  const [count, setCount] = useState(0);

  // 1. Reference Error - Using undefined variable
  const triggerReferenceError = () => {
    // Intentionally using undefined variable
    // eslint-disable-next-line no-undef
    console.log(undefinedVariable);
  };

  // 2. Type Error - Calling a number as a function
  const triggerTypeError = () => {
    const number = 42;
    number();
  };

  // 3. Syntax Error - Using eval with invalid syntax
  const triggerSyntaxError = () => {
    eval("if (true) {");
  };

  // 4. Range Error - Creating an array with invalid length
  const triggerRangeError = () => {
    new Array(-1);
  };

  // 5. URI Error - Invalid URI encoding
  const triggerURIError = () => {
    decodeURIComponent("%");
  };

  // 6. Promise Rejection - Unhandled promise rejection
  const triggerPromiseError = () => {
    Promise.reject(new Error("Unhandled Promise Rejection"));
  };

  // 7. Async/Await Error - Error in async function
  const triggerAsyncError = async () => {
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error("Async Operation Failed"));
      }, 100);
    });
  };

  // 8. Memory Leak - Creating an infinite loop with array
  const triggerMemoryError = () => {
    const arr = [];
    while (true) {
      arr.push(new Array(1000000));
    }
  };

  // 9. DOM Manipulation Error - Accessing non-existent element
  const triggerDOMError = () => {
    document.getElementById("non-existent-element").innerHTML = "test";
  };

  // 10. Critical Error - Stack overflow
  const triggerStackOverflow = () => {
    function recursive() {
      recursive();
    }
    recursive();
  };

  // 11. Suspense Hydration Error
  const triggerSuspenseError = () => {
    setCount((prev) => prev + 1); // Force re-render during hydration
  };

  // 12. LocalStorage Access Error
  const triggerLocalStorageError = () => {
    // Simulate localStorage access denied
    Object.defineProperty(window, "localStorage", {
      get: () => {
        throw new Error("Access is denied for this document");
      },
    });
    localStorage.getItem("test");
  };

  // 13. Axios Request Abort Error
  const triggerAxiosError = async () => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 100);
    try {
      await axios.get("https://api.example.com/data", {
        signal: controller.signal,
      });
    } catch (error) {
      throw error;
    }
  };

  // 14. ResizeObserver Error
  const triggerResizeObserverError = () => {
    const observer = new ResizeObserver(() => {
      throw new Error(
        "ResizeObserver loop completed with undelivered notifications"
      );
    });
    observer.observe(document.body);
    // Force resize
    window.dispatchEvent(new Event("resize"));
  };

  // 15. React Container Error
  const triggerContainerError = () => {
    const container = document.createElement("div");
    container.id = "invalid-container";
    React.render(<div>Test</div>, container);
  };

  // 16. CSS Chunk Loading Error
  const triggerCSSChunkError = () => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://jsak.mmtcdn.com/flights/assets/css/search-simple.pwa.16e.css";

    link.onerror = () => {
      throw new Error("Loading CSS chunk failed");
    };

    document.head.appendChild(link);
  };

  // Background Error 1: Service Worker Registration Error
  const triggerServiceWorkerError = () => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/non-existent-sw.js");
    }
  };

  // Background Error 2: WebSocket Connection Error
  const triggerWebSocketError = () => {
    const ws = new WebSocket("ws://invalid-websocket-url");
    ws.onerror = (error) => {
      console.error("WebSocket connection error:", error);
      throw error;
    };
  };

  // Background Error 3: IndexedDB Error
  const triggerIndexedDBError = () => {
    const request = indexedDB.open("test-db", 1);
    request.onerror = (event) => {
      console.error("IndexedDB error:", event.target.error);
      throw event.target.error;
    };
  };

  // Background Error 4: Performance API Error
  const triggerPerformanceError = () => {
    try {
      const entries = performance.getEntriesByType("resource");
      entries.forEach((entry) => {
        if (entry.duration > 1000) {
          throw new Error(
            `Resource ${entry.name} took too long to load: ${entry.duration}ms`
          );
        }
      });
    } catch (error) {
      console.error("Performance monitoring error:", error);
      throw error;
    }
  };

  // Background Error 5: Beacon API Error
  const triggerBeaconError = () => {
    return new Promise((resolve, reject) => {
      try {
        const data = new Blob(["test data"], { type: "application/json" });
        const success = navigator.sendBeacon(
          "https://invalid-beacon-url",
          data
        );

        if (!success) {
          const error = new Error("Beacon API failed to send data");
          console.error("Beacon API Error:", error);
          reject(error);
        } else {
          resolve();
        }
      } catch (error) {
        console.error("Beacon API Error:", error);
        reject(error);
      }
    }).catch((error) => {
      throw error;
    });
  };

  const renderContent = () => {
    switch (currentView) {
      case "issues":
        return (
          <ErrorBoundary>
            <IssuesList />
          </ErrorBoundary>
        );
      case "demo":
      default:
        return (
          <ErrorBoundary>
            <div className="App">
              <header className="App-header">
                <h1>JavaScript Error Testing</h1>
                <div className="error-buttons">
                  <div className="error-section">
                    <h3>Basic Errors</h3>
                    <button
                      onClick={() => {
                        try {
                          // eslint-disable-next-line no-undef
                          console.log(undefinedVariable);
                        } catch (error) {
                          throw error;
                        }
                      }}
                      className="error-button"
                    >
                      Reference Error
                    </button>
                    <button
                      onClick={() => {
                        try {
                          const number = 42;
                          number();
                        } catch (error) {
                          throw error;
                        }
                      }}
                      className="error-button"
                    >
                      Type Error
                    </button>
                    <button
                      onClick={() => {
                        try {
                          eval("if (true) {");
                        } catch (error) {
                          throw error;
                        }
                      }}
                      className="error-button"
                    >
                      Syntax Error
                    </button>
                  </div>

                  <div className="error-section">
                    <h3>Runtime Errors</h3>
                    <button
                      onClick={triggerRangeError}
                      className="error-button"
                    >
                      Range Error
                    </button>
                    <button onClick={triggerURIError} className="error-button">
                      URI Error
                    </button>
                    <button onClick={triggerDOMError} className="error-button">
                      DOM Error
                    </button>
                  </div>

                  <div className="error-section">
                    <h3>Async Errors</h3>
                    <button
                      onClick={triggerPromiseError}
                      className="error-button"
                    >
                      Promise Error
                    </button>
                    <button
                      onClick={triggerAsyncError}
                      className="error-button"
                    >
                      Async Error
                    </button>
                    <button
                      onClick={triggerAxiosError}
                      className="error-button"
                    >
                      Axios Error
                    </button>
                  </div>

                  <div className="error-section">
                    <h3>React Errors</h3>
                    <button
                      onClick={triggerSuspenseError}
                      className="error-button"
                    >
                      Suspense Error
                    </button>
                    <button
                      onClick={triggerLocalStorageError}
                      className="error-button"
                    >
                      LocalStorage Error
                    </button>
                    <button
                      onClick={triggerContainerError}
                      className="error-button"
                    >
                      Container Error
                    </button>
                    <button
                      onClick={triggerCSSChunkError}
                      className="error-button"
                    >
                      CSS Chunk Error
                    </button>
                  </div>

                  <div className="error-section">
                    <h3>Browser Errors</h3>
                    <button
                      onClick={triggerResizeObserverError}
                      className="error-button"
                    >
                      ResizeObserver Error
                    </button>
                  </div>

                  <div className="error-section">
                    <h3>Critical Errors</h3>
                    <button
                      onClick={triggerMemoryError}
                      className="error-button critical"
                    >
                      Memory Error
                    </button>
                    <button
                      onClick={triggerStackOverflow}
                      className="error-button critical"
                    >
                      Stack Overflow
                    </button>
                  </div>

                  <div className="error-section">
                    <h3>Background Errors</h3>
                    <button
                      onClick={triggerServiceWorkerError}
                      className="error-button background"
                    >
                      Service Worker Error
                    </button>
                    <button
                      onClick={triggerWebSocketError}
                      className="error-button background"
                    >
                      WebSocket Error
                    </button>
                    <button
                      onClick={triggerIndexedDBError}
                      className="error-button background"
                    >
                      IndexedDB Error
                    </button>
                    <button
                      onClick={triggerPerformanceError}
                      className="error-button background"
                    >
                      Performance Error
                    </button>
                    <button
                      onClick={triggerBeaconError}
                      className="error-button background"
                    >
                      Beacon API Error
                    </button>
                  </div>

                  <div className="error-section">
                    <h3>React Component Errors</h3>
                    <ErrorComponent />
                  </div>
                </div>
              </header>

              <Suspense fallback={<div>Loading...</div>}>
                <LazyComponent />
              </Suspense>
              <ErrorGroupingTest />
            </div>
          </ErrorBoundary>
        );
    }
  };

  return (
    <div className="app-container">
      <nav className="app-nav">
        <div className="nav-brand">Error Monitor</div>
        <div className="nav-links">
          <button
            className={`nav-link ${currentView === "demo" ? "active" : ""}`}
            onClick={() => setCurrentView("demo")}
          >
            Demo
          </button>
          <button
            className={`nav-link ${currentView === "issues" ? "active" : ""}`}
            onClick={() => setCurrentView("issues")}
          >
            Issues
          </button>
        </div>
      </nav>
      {renderContent()}
    </div>
  );
}

export default App;
