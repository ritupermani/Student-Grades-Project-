import mongoose from 'mongoose';
const studentSchema = new mongoose.Schema({
  student_id: { type: String, required: true, index: true },
  student_name: { type: String, required: true },
  total_marks: { type: Number, default: 0 },
  marks_obtained: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
}, { timestamps: true });
export default mongoose.model('Student', studentSchema);
