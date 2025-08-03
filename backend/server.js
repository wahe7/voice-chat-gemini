const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const voiceRoutes = require("./routes/voice");
const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

app.use("/api/voice", voiceRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
