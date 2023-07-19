"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
require("dotenv").config({ path: "../.env" });
const express_1 = __importDefault(require("express"));
const serverless_http_1 = __importDefault(require("serverless-http"));
const mongodb_1 = require("mongodb");
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const app = (0, express_1.default)();
const router = express_1.default.Router();
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME;
const collectionName = process.env.MONGODB_COLLECTION_NAME;
const client = new mongodb_1.MongoClient(uri);
async function connectToMongoDB() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
    }
    catch (error) {
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
    }
    catch (error) {
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
    const playlist = await collection.findOne({ _id: new mongodb_1.ObjectId(id) });
    return playlist;
}
async function savePlaylist(data) {
    const collection = client.db(dbName).collection(collectionName);
    await collection.insertOne(data);
    console.log("Data saved successfully:", data);
}
async function updatePlaylist(id, data) {
    const collection = client.db(dbName).collection(collectionName);
    await collection.updateOne({ _id: new mongodb_1.ObjectId(id) }, { $push: { songs: data } });
    console.log("Array field updated successfully");
}
async function deletePlaylist(id) {
    const collection = client.db(dbName).collection(collectionName);
    await collection.deleteOne({ _id: new mongodb_1.ObjectId(id) });
    console.log("Document deleted successfully");
}
async function deleteSong(id, songId) {
    const collection = client.db(dbName).collection(collectionName);
    await collection.updateOne({ _id: new mongodb_1.ObjectId(id) }, { $pull: { songs: { id: songId } } });
    console.log("Song deleted successfully");
}
// Middleware to parse JSON
app.use(express_1.default.json());
// Apply CORS and body-parser middlewares
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
// Routes
router.get("/playlists", async (_req, res) => {
    try {
        const playlists = await retrievePlaylists();
        res.status(200).json(playlists);
    }
    catch (error) {
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
        }
        else {
            res.status(404).send("Playlist not found");
        }
    }
    catch (error) {
        console.error("Failed to fetch playlist:", error);
        res.status(500).send("An error occurred");
    }
});
router.post("/playlist", async (req, res) => {
    try {
        const data = req.body;
        await savePlaylist(data);
        res.status(200).json({ message: "Data saved successfully" });
    }
    catch (error) {
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
    }
    catch (error) {
        console.error("Failed to update array field:", error);
        res.sendStatus(500);
    }
});
router.delete("/playlist/:id", async (req, res) => {
    try {
        const id = req.params.id;
        await deletePlaylist(id);
        res.sendStatus(200);
    }
    catch (error) {
        console.error("Failed to delete document:", error);
        res.sendStatus(500);
    }
});
router.delete("/playlist/:id/:songId", async (req, res) => {
    try {
        const id = req.params.id;
        const songId = req.params.songId;
        if (!id || !songId)
            return res.sendStatus(400);
        await deleteSong(id, songId);
        res.sendStatus(200);
    }
    catch (error) {
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
const handler = (0, serverless_http_1.default)(app);
exports.handler = handler;
