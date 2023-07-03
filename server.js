require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.BACK_END_SERVER_PORT;

// Enable CORS middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    methods: ["GET", "POST", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(bodyParser.json());

const uri = process.env.MONGODB_URI;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function connectToMongoDB() {
  try {
    // Connect the client to the server (optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1); // Exit the process with a non-zero status code
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

// Connect to MongoDB
connectToMongoDB().then(() => {
  // Start the server after successful connection to MongoDB
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});

// Retrieve data from the collection
// GET all the user's playlists
app.get("/playlists", async (req, res) => {
  try {
    const db = client.db(process.env.MONGODB_DB_NAME);
    const collection = db.collection(process.env.MONGODB_COLLECTION_NAME);

    const result = await collection.find({}).toArray();
    console.log("user playlists", result);
    res.status(200).json(result);
  } catch (error) {
    console.error("Failed to retrieve data:", error);
    res.status(500).json({ error: "Failed to retrieve data" });
  }
});
// GET a specific playlist songs
app.get("/playlist/:id", async (req, res) => {
  try {
    const id = req.params.id; // Accessing the 'id' parameter from the URL

    const db = client.db(process.env.MONGODB_DB_NAME);
    const collection = db.collection(process.env.MONGODB_COLLECTION_NAME);

    // Query the collection to find a document with the specified 'id'
    const playlist = await collection.findOne({ _id: ObjectId(id) });

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
// POST a new user playlist
app.post("/playlist", async (req, res) => {
  try {
    const data = req.body; // Assuming the data is sent in the request body

    const db = client.db(process.env.MONGODB_DB_NAME);
    const collection = db.collection(process.env.MONGODB_COLLECTION_NAME);

    const result = await collection.insertOne(data);
    res.status(200).json({ message: "Data saved successfully" });
    console.log("Data saved successfully");
  } catch (error) {
    console.error("Failed to save data:", error);
    res.status(500).json({ error: "Failed to save data" });
  }
});
// PUT a new song to a specific playlist
app.put("/playlist/:id", async (req, res) => {
  try {
    const id = req.params.id; // Accessing the 'id' parameter from the URL

    const data = req.body; // Assuming the data is sent in the request body

    const db = client.db(process.env.MONGODB_DB_NAME);
    const collection = db.collection(process.env.MONGODB_COLLECTION_NAME);

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $push: { songs: data } }
    );
    console.log("Array field updated successfully");
  } catch (error) {
    console.error("Failed to update array field:", error);
  }
});

// Handle server shutdown gracefully
process.on("SIGINT", () => {
  disconnectFromMongoDB().then(() => {
    process.exit(0); // Exit the process with a zero status code
  });
});
