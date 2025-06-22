import mongoose from "mongoose";

const PhysicalFitnessSchema = new mongoose.Schema({
  examSessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ExamSession"
  },
  studentId: String,
  cohort: String,
  gender: String,
  followDate: String,
  height: Number,
  weight: Number,
  zScoreCC: String,
  danhGiaCC: String,
  zScoreCN: String,
  danhGiaCN: String,
  zScoreCNCc: String,
  bmi: String,
  danhGiaBMI: String,
  systolic: Number,
  diastolic: Number,
  danhGiaTTH: String,
  heartRate: Number,
  danhGiaHeartRate: String,
});

const physicalFitnessModel = mongoose.model.physicalFitness || mongoose.model('physicalFitness', PhysicalFitnessSchema);

export default physicalFitnessModel;
