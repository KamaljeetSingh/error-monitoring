import React, { useState, useEffect } from "react";
import axios from "axios";
import "./IssuesList.css";

const IssuesList = () => {
  const [issues, setIssues] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIssues();
  }, []);

  useEffect(() => {
    if (selectedIssue) {
      fetchEvents(selectedIssue._id);
    }
  }, [selectedIssue]);

  const fetchIssues = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/issues");
      setIssues(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch issues:", error);
      setLoading(false);
    }
  };

  const fetchEvents = async (issueId) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/issues/${issueId}/events`
      );
      setEvents(response.data);
    } catch (error) {
      console.error("Failed to fetch events:", error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "resolved":
        return "#4CAF50";
      case "unresolved":
        return "#f44336";
      default:
        return "#ff9800";
    }
  };

  if (loading) {
    return <div className="loading">Loading issues...</div>;
  }

  return (
    <div className="issues-container">
      <div className="issues-list">
        <h2>Error Issues</h2>
        {issues.map((issue) => (
          <div
            key={issue._id}
            className={`issue-card ${
              selectedIssue?._id === issue._id ? "selected" : ""
            }`}
            onClick={() => setSelectedIssue(issue)}
          >
            <div className="issue-header">
              <span className="issue-type">{issue.type}</span>
              <span
                className="issue-status"
                style={{ backgroundColor: getStatusColor(issue.status) }}
              >
                {issue.status}
              </span>
            </div>
            <div className="issue-message">{issue.message}</div>
            <div className="issue-meta">
              <span>Count: {issue.count}</span>
              <span>First seen: {formatDate(issue.firstSeen)}</span>
              <span>Last seen: {formatDate(issue.lastSeen)}</span>
            </div>
            <div className="issue-environments">
              <strong>Environments:</strong> {issue.environments.join(", ")}
            </div>
          </div>
        ))}
      </div>

      <div className="events-list">
        {selectedIssue ? (
          <>
            <h2>Events for Issue</h2>
            <div className="selected-issue-details">
              <h3>{selectedIssue.message}</h3>
              <p>Total Occurrences: {selectedIssue.count}</p>
            </div>
            {events.map((event) => (
              <div key={event._id} className="event-card">
                <div className="event-time">{formatDate(event.timestamp)}</div>
                <div className="event-details">
                  <div className="event-browser">
                    <strong>Browser:</strong> {event.deviceInfo.userAgent}
                  </div>
                  <div className="event-url">
                    <strong>URL:</strong> {event.pageInfo.url}
                  </div>
                  {event.stack && (
                    <div className="event-stack">
                      <strong>Stack Trace:</strong>
                      <pre>{event.stack}</pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </>
        ) : (
          <div className="no-selection">
            <h2>Select an issue to view its events</h2>
          </div>
        )}
      </div>
    </div>
  );
};

export default IssuesList;
