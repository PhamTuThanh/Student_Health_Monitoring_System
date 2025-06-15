import mongoose from "mongoose";

const AbnormalitySchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  studentId: { type: String, required: true },
  studentName: { type: String, required: true },
  doctorName: { type: String, required: true },
  date: { type: Date, required: true },
  symptoms: { type: [String], required: true },
  temporaryTreatment: { type: String, required: true },
});

const abnormalityModel = mongoose.models.abnormality || mongoose.model('abnormality', AbnormalitySchema);

export default abnormalityModel;