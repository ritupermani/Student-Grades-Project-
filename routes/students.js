import { Router } from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import {
  uploadFile,
  listStudents,
  updateStudent,
  deleteStudent,
  clearAllStudents,
  getHistory,
} from "../controllers/students.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });
const router = Router();
router.post(
  "/upload",
  (req, res, next) => {
    upload.single("file")(req, res, function (err) {
      if (err) {
        console.error("multer error", err);
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  },
  uploadFile
);
router.get("/", listStudents);
router.get("/history", getHistory);
router.delete("/clear", clearAllStudents);
router.put("/:id", updateStudent);
router.delete("/:id", deleteStudent);

export default router;
