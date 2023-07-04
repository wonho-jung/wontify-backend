require("dotenv").config({ path: "../.env" });

const serverless = require("serverless-http");
const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const bodyParser = require("body-parser");
const WebSocket = require("ws");

const app = express();

const router = express.Router();

const PORT = process.env.BACK_END_SERVER_PORT;

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    methods: ["GET", "POST", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(bodyParser.json());
app.use("/.netlify/functions/server", router);

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME;
const collectionName = process.env.MONGODB_COLLECTION_NAME;

const client = new MongoClient(uri);

let wsServer;

async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
}

async function disconnectFromMongoDB() {
  try {
    await client.close();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("Failed to disconnect from MongoDB:", error);
  }
}

connectToMongoDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

  wsServer = new WebSocket.Server({ server });

  wsServer.on("connection", (ws) => {
    console.log("WebSocket connection established");

    ws.on("message", (message) => {
      console.log("Received WebSocket message:", message);

      try {
        const parsedMessage = JSON.parse(message);
        if (parsedMessage.type === "userAction") {
          console.log("Received a user action:", parsedMessage.action);
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message as JSON:", error);

        // Handle non-JSON messages here
        if (message === "Hello WebSocket server!") {
          console.log("Received a greeting from the client");
        }
      }
    });

    ws.on("close", () => {
      console.log("WebSocket connection closed");
    });
  });
});

app.get("/playlists", async (req, res) => {
  try {
    const collection = client.db(dbName).collection(collectionName);
    const playlists = await collection.find({}).toArray();
    console.log("User playlists:", playlists);
    res.status(200).json(playlists);
  } catch (error) {
    console.error("Failed to retrieve data:", error);
    res.status(500).json({ error: "Failed to retrieve data" });
  }
});

app.get("/playlist/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const collection = client.db(dbName).collection(collectionName);
    const playlist = await collection.findOne({ _id: new ObjectId(id) });

    if (playlist) {
      res.json(playlist);
    } else {
      res.status(404).send("Playlist not found");
    }
  } catch (error) {
    console.error("Failed to fetch playlist:", error);
    res.status(500).send("An error occurred");
  }
});

app.post("/playlist", async (req, res) => {
  try {
    const data = req.body;
    const collection = client.db(dbName).collection(collectionName);
    await collection.insertOne(data);
    res.status(200).json({ message: "Data saved successfully" });
    console.log("Data saved successfully", data);

    // Example: Sending a WebSocket message to notify clients
    const notificationMessage = JSON.stringify({
      type: "notification",
      content: "A new playlist has been created",
    });
    wsServer.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(notificationMessage);
      }
    });
  } catch (error) {
    console.error("Failed to save data:", error);
    res.status(500).json({ error: "Failed to save data" });
  } finally {
    console.log("Request completed");
  }
});

app.put("/playlist/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body;
    const collection = client.db(dbName).collection(collectionName);
    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $push: { songs: data } }
    );
    console.log("Array field updated successfully");
    res.sendStatus(200);

    // Example: Sending a WebSocket message to notify clients
    const notificationMessage = JSON.stringify({
      type: "notification",
      content: "A playlist has been updated",
    });
    wsServer.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(notificationMessage);
      }
    });
  } catch (error) {
    console.error("Failed to update array field:", error);
    res.sendStatus(500);
  }
});

process.on("SIGINT", () => {
  disconnectFromMongoDB().then(() => {
    process.exit(0);
  });
});

module.exports.handler = serverless(app);
