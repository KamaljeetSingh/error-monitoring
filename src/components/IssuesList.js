import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { PRIORITY_LEVELS } from "../utils/errorCategorizer";
import "./IssuesList.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const IssuesList = () => {
  const [issues, setIssues] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPriority, setSelectedPriority] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  useEffect(() => {
    fetchIssues();
  }, [selectedPriority, selectedStatus]);

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
      if (selectedPriority) params.append("priority", selectedPriority);
      if (selectedStatus) params.append("status", selectedStatus);

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

  const getPriorityBadge = (priority) => {
    const level = PRIORITY_LEVELS[priority] || PRIORITY_LEVELS.P2;
    return (
      <span
        className="priority-badge"
        style={{ backgroundColor: level.color }}
        title={level.description}
      >
        {level.icon} {level.label}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      unresolved: { color: "#ef4444", icon: "🔴" },
      in_progress: { color: "#f97316", icon: "🟠" },
      resolved: { color: "#22c55e", icon: "🟢" },
    };
    const style = statusStyles[status] || statusStyles.unresolved;

    return (
      <span className="status-badge" style={{ backgroundColor: style.color }}>
        {style.icon} {status.charAt(0).toUpperCase() + status.slice(1)}
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
      <div className="filters">
        <select
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
          className="filter-select"
        >
          <option value="">All Priorities</option>
          {Object.entries(PRIORITY_LEVELS).map(([key, level]) => (
            <option key={key} value={key}>
              {level.icon} {level.label}
            </option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="filter-select"
        >
          <option value="">All Statuses</option>
          <option value="unresolved">Unresolved</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      <div className="issues-list">
        {issues.map((issue) => (
          <div
            key={issue._id}
            className={`issue-card ${
              selectedIssue?._id === issue._id ? "selected" : ""
            }`}
            onClick={() => handleIssueSelect(issue)}
          >
            <div className="issue-header">
              <div className="issue-badges">
                {getPriorityBadge(issue.categorization?.priority)}
                {getStatusBadge(issue.status)}
              </div>
              <div className="issue-count">
                {issue.count} {issue.count === 1 ? "occurrence" : "occurrences"}
              </div>
            </div>

            <div className="issue-content">
              <h3 className="issue-title">{issue.message}</h3>
              <div className="issue-details">
                <p className="issue-type">Type: {issue.type}</p>
                <p className="issue-explanation">
                  {issue.categorization?.explanation ||
                    "No explanation available"}
                </p>
                <p className="issue-method">
                  Categorized by: {issue.categorization?.method || "default"}
                </p>
              </div>
            </div>

            <div className="issue-footer">
              <div className="issue-environments">
                <strong>Environments:</strong>{" "}
                {issue.environments?.join(", ") || "Unknown"}
              </div>
              <div className="issue-browsers">
                <strong>Browsers:</strong>{" "}
                {issue.browsers?.slice(0, 3).join(", ")}
                {issue.browsers?.length > 3 ? "..." : ""}
              </div>
              <div className="issue-timestamps">
                <div>First seen: {formatDate(issue.firstSeen)}</div>
                <div>Last seen: {formatDate(issue.lastSeen)}</div>
              </div>
            </div>
          </div>
        ))}
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
                  {getPriorityBadge(selectedIssue.categorization?.priority)}
                  {getStatusBadge(selectedIssue.status)}
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
                    {selectedIssue.categorization?.priority}
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
