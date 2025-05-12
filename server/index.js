const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.SERVER_PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection string - Replace with your actual connection string
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function connectToMongo() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
}

// Error logging endpoint
app.post("/api/log-error", async (req, res) => {
  try {
    const errorData = req.body;
    const db = client.db("error-monitoring");
    const errorsCollection = db.collection("errors");
    const issuesCollection = db.collection("issues");

    // Add timestamp
    errorData.timestamp = new Date();

    // Find existing issue by fingerprint only
    const existingIssue = await issuesCollection.findOne({
      fingerprint: errorData.fingerprint,
    });

    if (existingIssue) {
      // Update existing issue - keep categorization separate from grouping logic
      const updateFields = {
        $inc: { count: 1 },
        $set: {
          lastSeen: new Date(),
          status: existingIssue.status || "unresolved",
        },
        $addToSet: {
          environments: errorData.deviceInfo?.platform,
          browsers: errorData.deviceInfo?.userAgent,
        },
      };

      // Only update categorization if it's explicitly provided and different
      if (
        errorData.categorization &&
        (!existingIssue.categorization ||
          JSON.stringify(existingIssue.categorization) !==
            JSON.stringify(errorData.categorization))
      ) {
        updateFields.$set.categorization = errorData.categorization;
      }

      await issuesCollection.updateOne(
        { _id: existingIssue._id },
        updateFields
      );
      errorData.issueId = existingIssue._id;
    } else {
      // Create new issue with default categorization if none provided
      const newIssue = {
        fingerprint: errorData.fingerprint,
        firstSeen: new Date(),
        lastSeen: new Date(),
        count: 1,
        status: "unresolved",
        type: errorData.type,
        message: errorData.message,
        environments: [errorData.deviceInfo?.platform].filter(Boolean),
        browsers: [errorData.deviceInfo?.userAgent].filter(Boolean),
        categorization: errorData.categorization || {
          priority: "P2",
          explanation: "Default categorization",
          method: "default",
        },
      };

      // Ensure no duplicate issues exist before inserting
      const duplicateCheck = await issuesCollection.findOne({
        fingerprint: errorData.fingerprint,
      });

      if (duplicateCheck) {
        // If a duplicate was created in the meantime, update it instead
        const updateFields = {
          $inc: { count: 1 },
          $set: {
            lastSeen: new Date(),
            status: duplicateCheck.status || "unresolved",
          },
          $addToSet: {
            environments: errorData.deviceInfo?.platform,
            browsers: errorData.deviceInfo?.userAgent,
          },
        };

        if (errorData.categorization) {
          updateFields.$set.categorization = errorData.categorization;
        }

        await issuesCollection.updateOne(
          { _id: duplicateCheck._id },
          updateFields
        );
        errorData.issueId = duplicateCheck._id;
      } else {
        // Insert new issue
        const issueResult = await issuesCollection.insertOne(newIssue);
        errorData.issueId = issueResult.insertedId;
      }
    }

    // Insert error event
    await errorsCollection.insertOne(errorData);

    res.status(200).json({ message: "Error logged successfully" });
  } catch (error) {
    console.error("Error logging failed:", error);
    res.status(500).json({ message: "Error logging failed" });
  }
});

// Get issues endpoint with priority filtering
app.get("/api/issues", async (req, res) => {
  try {
    const { priority, status } = req.query;
    const db = client.db("error-monitoring");
    const issuesCollection = db.collection("issues");

    // Build query based on filters
    const query = {};
    if (priority) {
      query["categorization.priority"] = priority;
    }
    if (status) {
      query.status = status;
    }

    const issues = await issuesCollection
      .find(query)
      .sort({
        // Sort by priority first (P0 -> P3), then by last seen
        "categorization.priority": 1,
        lastSeen: -1,
      })
      .toArray();

    res.status(200).json(issues);
  } catch (error) {
    console.error("Failed to fetch issues:", error);
    res.status(500).json({ message: "Failed to fetch issues" });
  }
});

// Get issue details endpoint
app.get("/api/issues/:issueId/events", async (req, res) => {
  try {
    const { issueId } = req.params;
    const db = client.db("error-monitoring");
    const errorsCollection = db.collection("errors");

    const events = await errorsCollection
      .find({ issueId: new ObjectId(issueId) })
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray();

    res.status(200).json(events);
  } catch (error) {
    console.error("Failed to fetch issue events:", error);
    res.status(500).json({ message: "Failed to fetch issue events" });
  }
});

// Update issue status endpoint
app.patch("/api/issues/:issueId", async (req, res) => {
  try {
    const { issueId } = req.params;
    const { status } = req.body;

    const db = client.db("error-monitoring");
    const issuesCollection = db.collection("issues");

    await issuesCollection.updateOne({ _id: issueId }, { $set: { status } });

    res.status(200).json({ message: "Issue updated successfully" });
  } catch (error) {
    console.error("Failed to update issue:", error);
    res.status(500).json({ message: "Failed to update issue" });
  }
});

connectToMongo().then(() => {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
});
