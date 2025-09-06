import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import studentRoutes from "./routes/students.js";
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
app.use(cors({
  origin: "https://student-grade.netlify.app",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true, // optional if you need cookies/auth
}));

app.use(express.json());
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use("/uploads", express.static(uploadsDir));
app.use("/api/students", studentRoutes);
app.get("/api/health", (req, res) => res.json({ status: "ok" }));
async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");
    app.listen(PORT, () => console.log("Server listening on", PORT));
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
start();
