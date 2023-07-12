require("dotenv").config({ path: "../.env" });
const serverless = require("serverless-http");
const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const router = express.Router();
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME;
const collectionName = process.env.MONGODB_COLLECTION_NAME;

const client = new MongoClient(uri);

async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
}
// Initialize MongoDB connection
connectToMongoDB();

async function disconnectFromMongoDB() {
  try {
    await client.close();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("Failed to disconnect from MongoDB:", error);
  }
}

async function retrievePlaylists() {
  const collection = client.db(dbName).collection(collectionName);
  const playlists = await collection.find({}).toArray();
  // console.log("Retrieved playlists:", playlists);
  return playlists;
}

async function retrievePlaylist(id) {
  const collection = client.db(dbName).collection(collectionName);
  const playlist = await collection.findOne({ _id: new ObjectId(id) });
  return playlist;
}

async function savePlaylist(data) {
  const collection = client.db(dbName).collection(collectionName);
  await collection.insertOne(data);
  console.log("Data saved successfully:", data);
}

async function updatePlaylist(id, data) {
  const collection = client.db(dbName).collection(collectionName);
  await collection.updateOne(
    { _id: new ObjectId(id) },
    { $push: { songs: data } }
  );
  console.log("Array field updated successfully");
}
async function deletePlaylist(id) {
  const collection = client.db(dbName).collection(collectionName);
  await collection.deleteOne({ _id: new ObjectId(id) });
  console.log("Document deleted successfully");
}
async function deleteSong(id, songId) {
  const collection = client.db(dbName).collection(collectionName);
  await collection.updateOne(
    { _id: new ObjectId(id) },
    { $pull: { songs: { id: songId } } }
  );
  console.log("Song deleted successfully");
}

// Middleware to parse JSON
app.use(express.json());

// Apply CORS and body-parser middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes

router.get("/playlists", async (req, res) => {
  try {
    const playlists = await retrievePlaylists();
    res.status(200).json(playlists);
  } catch (error) {
    console.error("Failed to retrieve data:", error);
    res.status(500).json({ error: "Failed to retrieve data" });
  }
});

router.get("/playlist/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const playlist = await retrievePlaylist(id);
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

router.post("/playlist", async (req, res) => {
  try {
    const data = req.body;
    await savePlaylist(data);
    res.status(200).json({ message: "Data saved successfully" });
  } catch (error) {
    console.error("Failed to save data:", error);
    res.status(500).json({ error: "Failed to save data" });
  }
});

router.put("/playlist/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body;
    await updatePlaylist(id, data);
    res.sendStatus(200);
  } catch (error) {
    console.error("Failed to update array field:", error);
    res.sendStatus(500);
  }
});

router.delete("/playlist/:id", async (req, res) => {
  try {
    const id = req.params.id;
    await deletePlaylist(id);
    res.sendStatus(200);
  } catch (error) {
    console.error("Failed to delete document:", error);
    res.sendStatus(500);
  }
});

router.delete("/playlist/:id/:songId", async (req, res) => {
  try {
    const id = req.params.id;
    const songId = req.params.songId;
    console.log(songId);
    if (!id || !songId) return res.sendStatus(400);
    await deleteSong(id, songId);
    res.sendStatus(200);
  } catch (error) {
    console.error("Failed to delete song:", error);
    res.sendStatus(500);
  }
});

// Handle SIGINT signal to disconnect from MongoDB
process.on("SIGINT", () => {
  disconnectFromMongoDB().then(() => {
    process.exit(0);
  });
});
// Use router middleware
app.use("/.netlify/functions/api", router);

// Export the app as a serverless function
const handler = serverless(app);
module.exports.handler = async (event, context) => {
  const result = await handler(event, context);
  return result;
};
