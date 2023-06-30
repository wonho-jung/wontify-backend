const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 8888;

// Enable CORS middleware
app.use(
  cors({
    origin: "http://localhost:3001", // Specify a specific origin
    methods: "GET,POST", // Specify allowed methods
    allowedHeaders: "Content-Type,Authorization", // Specify allowed headers
  })
);

// Rest of your routes and middleware here

app.get("/testAPI", (req, res) => {
  const data = { message: "Hello, World!" };
  res.json(data);
});

var listener = app.listen(8888, function () {
  console.log("Listening on port " + listener.address().port); //Listening on port 8888
});
