require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.BACK_END_SERVER_PORT;

// Enable CORS middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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
    // Connect the client to the server	(optional starting in v4.7)
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

app.get("/testAPI", (req, res) => {
  const data = { message: "Hello, World!" };
  res.json(data);
});

app.post("/saveData", (req, res) => {
  const data = req.body; // Assuming the data is sent in the request body
  console.log(req.body);
  // Access the MongoDB database using the connected client
  const db = client.db(process.env.MONGODB_DB_NAME);
  const collection = db.collection(process.env.MONGODB_COLLECTION_NAME);

  // Insert the data into the collection
  collection.insertOne(data, (err, result) => {
    if (err) {
      console.error("Failed to save data:", err);
      res.status(500).json({ error: "Failed to save data" });
    } else {
      console.log("Data saved successfully");
      res.status(200).json({ message: "Data saved successfully" });
    }
  });
});

// Handle server shutdown gracefully
process.on("SIGINT", () => {
  disconnectFromMongoDB().then(() => {
    process.exit(0); // Exit the process with a zero status code
  });
});
