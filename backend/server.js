const express = require("express");
const {WebSocketServer} = require("ws");
const path = require("path");
const cors = require("cors");

const { handleVoiceSession } = require("./controller/voiceController");

const dotenv = require("dotenv");
dotenv.config();

const app = express();
const wss = new WebSocketServer({ port: 8080 });

app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.use(express.static(path.join(__dirname, '../frontend')));

// Serve the main HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

wss.on('connection', (ws) => {
  console.log('Client connected');
  handleVoiceSession(ws);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
