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

// Error categories by priority
const ERROR_CATEGORIES = {
  P0: {
    label: "Critical (P0)",
    description:
      "System-wide failures, security vulnerabilities, data loss, complete app crash, or major feature unavailability",
    color: "#dc2626",
    errors: [
      {
        name: "Memory Leak",
        description:
          "Creates an infinite loop with array allocation, causing browser to crash",
        trigger: () => {
          const arr = [];
          while (true) {
            arr.push(new Array(1000000));
          }
        },
      },
      {
        name: "Stack Overflow",
        description: "Causes infinite recursion, leading to browser crash",
        trigger: () => {
          function recursive() {
            recursive();
          }
          recursive();
        },
      },
      {
        name: "Security Error",
        description: "Simulates unauthorized access attempt to sensitive data",
        trigger: () => {
          Object.defineProperty(window, "localStorage", {
            get: () => {
              throw new Error("Access is denied for this document");
            },
          });
          localStorage.getItem("test");
        },
      },
    ],
  },
  P1: {
    label: "Non-Critical (P1)",
    description:
      "Feature degradation, UI issues, or errors with workarounds that don't affect core functionality",
    color: "#f97316",
    errors: [
      {
        name: "Promise Rejection",
        description: "Unhandled promise rejection in async operation",
        trigger: () => {
          Promise.reject(new Error("Unhandled Promise Rejection"));
        },
      },
      {
        name: "Network Error",
        description: "API request failure affecting feature functionality",
        trigger: async () => {
          const controller = new AbortController();
          setTimeout(() => controller.abort(), 100);
          await axios.get("https://api.example.com/data", {
            signal: controller.signal,
          });
        },
      },
      {
        name: "Type Error",
        description: "Attempts to call a number as a function",
        trigger: () => {
          const number = 42;
          number();
        },
      },
      {
        name: "Reference Error",
        description: "Uses an undefined variable",
        trigger: () => {
          // eslint-disable-next-line no-undef
          console.log(undefinedVariable);
        },
      },
      {
        name: "DOM Error",
        description: "Attempts to access non-existent element",
        trigger: () => {
          document.getElementById("non-existent-element").innerHTML = "test";
        },
      },
      {
        name: "URI Error",
        description: "Invalid URI encoding attempt",
        trigger: () => {
          decodeURIComponent("%");
        },
      },
      {
        name: "Range Error",
        description: "Creates array with invalid length",
        trigger: () => {
          new Array(-1);
        },
      },
      {
        name: "Syntax Error",
        description: "Invalid JavaScript syntax",
        trigger: () => {
          eval("if (true) {");
        },
      },
      {
        name: "Async Operation",
        description: "Failed async operation with timeout",
        trigger: async () => {
          await new Promise((resolve, reject) => {
            setTimeout(() => {
              reject(new Error("Async Operation Failed"));
            }, 100);
          });
        },
      },
      {
        name: "CSS load error",
        description: "Failed loading css",
        trigger: () => {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href =
            "https://jsak.mmtcdn.com/flights/assets/css/search-simple.pwa.16e.css";

          link.onerror = () => {
            throw new Error("Loading CSS chunk failed");
          };

          document.head.appendChild(link);
        },
      },
    ],
  },
};

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
    // observer.observe(document.body);
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

  const renderDemoContent = () => (
    <div className="demo-container">
      <div className="demo-header">
        <h1>Error Testing Dashboard</h1>
        <p className="demo-description">
          Test different types of errors categorized by severity. Each error
          type demonstrates a specific failure scenario in web applications.
        </p>
      </div>

      <div className="error-categories">
        {Object.entries(ERROR_CATEGORIES).map(([priority, category]) => (
          <div
            key={priority}
            className="error-category"
            style={{ borderColor: category.color }}
          >
            <div
              className="category-header"
              style={{ backgroundColor: category.color }}
            >
              <h2>{category.label}</h2>
              <p>{category.description}</p>
            </div>
            <div className="category-errors">
              {category.errors.map((error, index) => (
                <div key={index} className="error-item">
                  <div className="error-info">
                    <h3>{error.name}</h3>
                    <p>{error.description}</p>
                  </div>
                  <button
                    className="error-trigger"
                    onClick={() => {
                      try {
                        error.trigger();
                      } catch (err) {
                        throw err;
                      }
                    }}
                    style={{ borderColor: category.color }}
                  >
                    Trigger Error
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

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
        return <ErrorBoundary>{renderDemoContent()}</ErrorBoundary>;
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
