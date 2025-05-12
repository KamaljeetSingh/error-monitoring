import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./IssuesList.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const PRIORITY_LEVELS = {
  P0: {
    label: "Most Critical",
    description: "System inoperability, security breach, complete app failure",
    color: "#dc2626",
  },
  P1: {
    label: "Critical",
    description:
      "Core functionality blocked, UI blocked, component load failure",
    color: "#f97316",
  },
  P2: {
    label: "Needs Attention",
    description:
      "Minor UI issues, runtime type errors, background non-severe errors",
    color: "#6b7280",
  },
};

const IssuesList = () => {
  const [issues, setIssues] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  useEffect(() => {
    fetchIssues();
  }, [selectedPriority]);

  useEffect(() => {
    if (selectedIssue) {
      fetchEvents(selectedIssue._id);
    }
  }, [selectedIssue]);

  useEffect(() => {
    if (isOverlayOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, parseInt(scrollY || "0") * -1);
    }

    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
    };
  }, [isOverlayOpen]);

  const handleCloseOverlay = useCallback(() => {
    setIsOverlayOpen(false);
    setSelectedIssue(null);
    setEvents([]);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isOverlayOpen &&
        !event.target.closest(".events-overlay") &&
        !event.target.closest(".issue-card")
      ) {
        handleCloseOverlay();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOverlayOpen, handleCloseOverlay]);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedPriority !== "all") {
        params.append("priority", selectedPriority);
      }

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/issues?${params}`
      );
      setIssues(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch issues");
      console.error("Error fetching issues:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async (issueId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/issues/${issueId}/events`);
      setEvents(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch events");
      console.error("Error fetching events:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getPriorityCell = (priority) => {
    const level = PRIORITY_LEVELS[priority] || PRIORITY_LEVELS.P2;
    return (
      <span
        className="priority-cell"
        style={{
          backgroundColor: level.color,
          color: "#ffffff",
          fontWeight: "500",
        }}
        title={level.description}
      >
        {level.label}
      </span>
    );
  };

  const handleIssueSelect = useCallback((issue) => {
    setSelectedIssue(issue);
    setIsOverlayOpen(true);
  }, []);

  if (loading) {
    return <div className="loading">Loading issues...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="issues-container">
      <div className="priority-tabs">
        <button
          className={`priority-tab ${
            selectedPriority === "all" ? "active" : ""
          }`}
          onClick={() => setSelectedPriority("all")}
        >
          All Issues
        </button>
        {Object.entries(PRIORITY_LEVELS).map(([key, level]) => (
          <button
            key={key}
            className={`priority-tab ${
              selectedPriority === key ? "active" : ""
            }`}
            onClick={() => setSelectedPriority(key)}
            style={{
              borderColor: level.color,
              color: selectedPriority === key ? level.color : "inherit",
            }}
            title={level.description}
          >
            {level.label}
          </button>
        ))}
      </div>

      <div className="issues-table-container">
        <table className="issues-table">
          <thead>
            <tr>
              <th>Error Message</th>
              <th>Priority</th>
              <th>Occurrences</th>
              <th>Last Seen</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((issue) => (
              <tr
                key={issue._id}
                className={`issue-row ${
                  selectedIssue?._id === issue._id ? "selected" : ""
                }`}
                onClick={() => handleIssueSelect(issue)}
              >
                <td className="issue-message" title={issue.message}>
                  {issue.message}
                </td>
                <td>{getPriorityCell(issue.categorization?.priority)}</td>
                <td className="issue-count">{issue.count}</td>
                <td className="issue-last-seen">
                  {formatDate(issue.lastSeen)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={`events-overlay ${isOverlayOpen ? "open" : ""}`}>
        <div className="events-overlay-content">
          <div className="events-overlay-header">
            <button className="close-button" onClick={handleCloseOverlay}>
              ×
            </button>
            <h2>Events for Issue</h2>
          </div>

          {selectedIssue && (
            <div className="events-overlay-body">
              <div className="selected-issue-details">
                <div className="selected-issue-badges">
                  {getPriorityCell(selectedIssue.categorization?.priority)}
                </div>
                <h3>{selectedIssue.message}</h3>
                <div className="selected-issue-stats">
                  <div>Total Occurrences: {selectedIssue.count}</div>
                  <div>First Seen: {formatDate(selectedIssue.firstSeen)}</div>
                  <div>Last Seen: {formatDate(selectedIssue.lastSeen)}</div>
                </div>
                <div className="selected-issue-categorization">
                  <h4>Categorization Details</h4>
                  <p>
                    <strong>Priority:</strong>{" "}
                    {PRIORITY_LEVELS[selectedIssue.categorization?.priority]
                      ?.label || "Unknown"}
                  </p>
                  <p>
                    <strong>Description:</strong>{" "}
                    {PRIORITY_LEVELS[selectedIssue.categorization?.priority]
                      ?.description || "No description available"}
                  </p>
                  <p>
                    <strong>Explanation:</strong>{" "}
                    {selectedIssue.categorization?.explanation}
                  </p>
                  <p>
                    <strong>Method:</strong>{" "}
                    {selectedIssue.categorization?.method}
                  </p>
                </div>
              </div>

              <div className="events-section">
                <h3>Event History</h3>
                {loading ? (
                  <div className="loading">Loading events...</div>
                ) : error ? (
                  <div className="error">{error}</div>
                ) : events.length === 0 ? (
                  <div className="no-events">
                    No events found for this issue
                  </div>
                ) : (
                  <div className="events-timeline">
                    {events.map((event) => (
                      <div key={event._id} className="event-card">
                        <div className="event-header">
                          <div className="event-time">
                            {formatDate(event.timestamp)}
                          </div>
                          <div className="event-type">{event.type}</div>
                        </div>
                        <div className="event-details">
                          <div className="event-environment">
                            <strong>Environment:</strong>{" "}
                            {event.deviceInfo?.platform || "Unknown"}
                          </div>
                          <div className="event-browser">
                            <strong>Browser:</strong>{" "}
                            {event.deviceInfo?.userAgent || "Unknown"}
                          </div>
                          <div className="event-url">
                            <strong>URL:</strong>{" "}
                            {event.pageInfo?.url || "Unknown"}
                          </div>
                          {event.message && (
                            <div className="event-message">
                              <strong>Message:</strong> {event.message}
                            </div>
                          )}
                          {event.stack && (
                            <div className="event-stack">
                              <strong>Stack Trace:</strong>
                              <pre>{event.stack}</pre>
                            </div>
                          )}
                          {event.componentStack && (
                            <div className="event-component-stack">
                              <strong>Component Stack:</strong>
                              <pre>{event.componentStack}</pre>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IssuesList;
