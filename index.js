const express = require("express");
const http = require("http");
const path = require("path");

const app = express();

app.get("/", (req, res) => {
  res.sendFile(path.resolve(__dirname, "web", "index.html"));
});

app.get("/api", (req, res) => {
  res.send(req.headers);
});

const server = http.createServer(app);
server.listen(process.env.PORT || 3000);
