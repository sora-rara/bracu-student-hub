const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const deadlineRoutes = require("./routes/deadlineRoutes");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/deadlines", deadlineRoutes);

// Connect to MongoDB (Atlas)
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(5000, () => console.log("Server running on port 5000"));
  })
  .catch((err) => console.error("DB connection error:", err));
