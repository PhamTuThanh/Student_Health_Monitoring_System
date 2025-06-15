import userModel from '../models/userModel.js';

export const getStudents = async (req, res) => {
  try {
    const students = await userModel.find({role: "student"});
    res.json({ success: true, students });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};