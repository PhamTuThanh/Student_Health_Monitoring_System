// scripts/normalizeCohort.js
import mongoose from 'mongoose';
import physicalFitnessModel from '../models/physicalFitnessModel.js';

// Hàm chuẩn hóa cohort
function normalizeCohort(cohort) {
  if (!cohort) return "";
  return cohort.charAt(0).toUpperCase() + cohort.slice(1).toLowerCase();
}

async function normalizeAllCohorts() {
  await mongoose.connect('mongodb+srv://project2:04102003@cluster0.cn6ru.mongodb.net'); // sửa lại connection string cho đúng

  const all = await physicalFitnessModel.find({ cohort: { $exists: true, $ne: "" } });
  let count = 0;

  for (const doc of all) {
    const normalized = normalizeCohort(doc.cohort);
    if (doc.cohort !== normalized) {
      await physicalFitnessModel.updateOne({ _id: doc._id }, { $set: { cohort: normalized } });
      count++;
    }
  }

  console.log(`Đã chuẩn hóa ${count} bản ghi cohort.`);
  await mongoose.disconnect();
}

normalizeAllCohorts();