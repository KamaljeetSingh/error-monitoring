const express = require("express");
const { MongoClient } = require("mongodb");
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
    const collection = client.db("error-monitoring").collection("errors");

    // Add timestamp
    errorData.timestamp = new Date();

    // Insert error data
    await collection.insertOne(errorData);

    res.status(200).json({ message: "Error logged successfully" });
  } catch (error) {
    console.error("Error logging failed:", error);
    res.status(500).json({ message: "Error logging failed" });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  connectToMongo();
});
