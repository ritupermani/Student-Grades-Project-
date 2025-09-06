import XLSX from "xlsx";
import Student from "../models/Student.js";
import fs from "fs";

const historyLog = [];

/**
 * Upload and process Excel/CSV file
 */
export async function uploadFile(req, res) {
  try {
    console.log(
      "Upload route hit. req.file:",
      req.file && { originalname: req.file.originalname, path: req.file.path }
    );

    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const filepath = req.file.path;
    const workbook = XLSX.readFile(filepath, { cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      defval: "",
    });

    console.log("Rows from XLSX:", rows);

    const normalizedRows = rows.map((row) => {
      const newRow = {};
      for (let key in row) {
        newRow[key.trim().toLowerCase()] = row[key];
      }
      return newRow;
    });

    // ✅ CHANGE THE HEADER NAMES HERE to match your Excel
    const docs = normalizedRows
      .map((r) => {
        const sid = String(
          r["roll no"] ?? r["rollno"] ?? r["student_id"] ?? ""
        ).trim();
        const name = String(
          r["name"] ?? r["student name"] ?? r["student_name"] ?? ""
        ).trim();
        const total =
          Number(r["out of"] ?? r["total"] ?? r["total_marks"] ?? 0) || 0;
        const marks =
          Number(
            r["marks"] ?? r["marks obtained"] ?? r["marks_obtained"] ?? 0
          ) || 0;
        const percentage =
          total > 0 ? Math.round((marks / total) * 10000) / 100 : 0;

        return {
          student_id: sid,
          student_name: name,
          total_marks: total,
          marks_obtained: marks,
          percentage,
        };
      })
      .filter((d) => d.student_id && d.student_name);
    if (docs.length === 0) {
      try {
        fs.unlinkSync(filepath);
      } catch (e) {}
      return res.status(400).json({
        error:
          "No valid rows found in file. Ensure headers include Roll No and Name",
      });
    }

    const ops = docs.map((d) => ({
      updateOne: {
        filter: { student_id: d.student_id },
        update: { $set: d },
        upsert: true,
      },
    }));

    await Student.bulkWrite(ops);

    historyLog.push({
      file: req.file.originalname,
      uploadedAt: new Date(),
      count: docs.length,
    });

    try {
      fs.unlinkSync(filepath);
    } catch (e) {}

    res.json({ message: `Imported ${docs.length} students` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * List all students
 */
export async function listStudents(req, res) {
  try {
    const students = await Student.find({}).sort({ createdAt: -1 });
    res.json({ students, total: students.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * Upload history
 */
export async function getHistory(req, res) {
  res.json({ history: historyLog });
}

/**
 * Update student
 */
export async function updateStudent(req, res) {
  try {
    const id = req.params.id;
    const data = req.body;
    const updated = await Student.findByIdAndUpdate(id, data, { new: true });
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json({ student: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * Delete single student
 */
export async function deleteStudent(req, res) {
  try {
    const id = req.params.id;
    const deleted = await Student.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * Clear all students
 */
export async function clearAllStudents(req, res) {
  try {
    await Student.deleteMany({});
    res.json({ message: "All students deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
