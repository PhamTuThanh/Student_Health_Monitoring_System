import doctorModel from '../models/doctorModel.js'; 
import userModel from '../models/userModel.js';
import bcrypt from 'bcrypt'
import jwt  from 'jsonwebtoken';
import appoinmentModel from './../models/appoinmentModel.js';
import physicalFitnessModel from '../models/physicalFitnessModel.js';
import abnormalityModel from '../models/abnormalityModel.js';
import Abnormality from '../models/abnormalityModel.js';
import xlsx from 'xlsx';
import drugStockModel from '../models/drugStockModel.js';
import cloudinary from 'cloudinary';
import examSessionModel from '../models/examSessionModel.js';
import mongoose from 'mongoose';
import prescriptionModel from '../models/prescriptionModel.js';
import { normalizeCohort } from '../utils/normalize.js';

const changeAvailability = async (req, res) => {
    try {
        const { docId } = req.body;

        const docData = await doctorModel.findById(docId);
        await doctorModel.findByIdAndUpdate(docId, { available: !docData.available });
        res.json({ success: true, message: 'Availability Changed' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};
const doctorList = async (req, res)=>{
    try {
        const doctors = await doctorModel.find({}).select(['-password', '-email'])
        res.json({success:true, doctors})
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}
//api for doctor login
const loginDoctor = async (req, res)=>{
    try {
        const { email, password} = req. body
        const doctor = await doctorModel.findOne({email})

        if(!doctor){
            return res.status(401).json ({ success: false, message:'Invalid credentials'})
        }
        const isMatch = await bcrypt.compare(password, doctor.password)
        if(isMatch){
            const token = jwt.sign({id:doctor._id, role: 'doctor'}, process.env.JWT_SECRET)
            
            res.cookie('dToken', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV !== 'development', // Use secure cookies in production
                sameSite: 'strict', 
                maxAge: 3 * 24 * 60 * 60 * 1000 // 3 days
            });

            res.status(200).json({
                success:true, 
                message:'Doctor logged in successfully',
                token: token // Keep this for easier testing in Postman
            })
        }else{
            res.status(401).json ({ success: false, message:'Invalid credentials'})
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}


const logoutDoctor = (req, res) => {
    try {
        res.cookie('dToken', '', {
            httpOnly: true,
            expires: new Date(0),
            secure: process.env.NODE_ENV !== 'development',
            sameSite: 'strict',
        });
        res.status(200).json({ success: true, message: 'Doctor logged out successfully' });
    } catch (error) {
        console.error('Logout Doctor Error:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

//api to get doctor appoinments for dpoctor panel
const appoinmentsDoctor = async (req,res)=>{
    try {
        const {docId} = req.body
        const appoinments = await appoinmentModel.find({docId})
        res.json({success:true, appoinments})
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}
//api to mark appoinment completed 
const appoinmentComplete = async(req, res) =>{
    try {
        const {docId, appoinmentId} = req.body
        const appoinmentData = await appoinmentModel.findById(appoinmentId)
        if(appoinmentData && appoinmentData.docId == docId){
            await appoinmentModel.findByIdAndUpdate(appoinmentId, {isCompleted:true})
            return res.json({success:true, message:'Appoinment Completed'})

        }else{
            return res.json({success:false, message:'Mark failed'})
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

//api to cancel appoinment for doctor panel 
const appoinmentCancel = async(req, res) =>{
    try {
        const {docId, appoinmentId} = req.body
        const appoinmentData = await appoinmentModel.findById(appoinmentId)
        if(appoinmentData && appoinmentData.docId == docId){
            await appoinmentModel.findByIdAndUpdate(appoinmentId, {cancelled:true})
            return res.json({success:true, message:'Appoinment Cancelled'})

        }else{
            return res.json({success:false, message:'cancellation failed'})
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}
const refundStatus = async(req, res) =>{
    try {
        const {docId, appoinmentId} = req.body
        const appoinmentData = await appoinmentModel.findById(appoinmentId)
        if(appoinmentData && appoinmentData.docId == docId){
            await appoinmentModel.findByIdAndUpdate(appoinmentId, {refund:true})
            return res.json({success:true, message:'Refunded'})
        }else{
            return res.json({success:false, message:'Refund failed'})
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}
//api to get dashboard data for doctor panel
const doctorDashboard = async (req,res)=>{
    try {
        const {docId} = req.body
        const appoinments = await appoinmentModel.find({docId})
        let earnings = 0

        appoinments.map((item)=>{

            if(item.isCompleted || item.payment){
                earnings += item.amount
            }
        })
        let patients =[]
        appoinments.map((item)=>{
            if(!patients.includes(item.userId)){
                patients.push(item.userId)
            }
        })
        const dashData ={
            earnings,
            appoinments:appoinments.length,
            patients: patients.length,
            lastestAppoinments: appoinments.reverse().slice(0,5)
        }
        res.json({success : true, dashData})
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}
//api to get doctor profile for doctor panel
const doctorProfile = async (req,res)=>{
    try {
        const {docId} = req.body
        const profileData = await doctorModel.findById(docId).select('-password')
        res.json({success:true, profileData})
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}
const updateDoctorProfile = async(req, res) =>{
    try {
        const {docId, fees, address, available} = req.body
        await doctorModel.findByIdAndUpdate(docId, {fees, address, available})  
        res.json({success:true, message:'Profile Updated'})
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// ----------controller calculate for physical fitness----------
function calculateZScoreCC(height) {
  const standard = 169.9;
  const sd = 5.7;
  return height ? ((height - standard) / sd).toFixed(2) : "";
}
function calculateZScoreCN(weight) {
  const standard = 62.3;
  const sd = 10.2;
  return weight ? ((weight - standard) / sd).toFixed(2) : "";
}
function calculateBMI(weight, height) {
  if (!weight || !height) return "";
  const heightInMeters = height / 100;
  return (weight / (heightInMeters * heightInMeters)).toFixed(2);
}
function getDanhGiaCC(zScore) {
  if (!zScore) return "";
  const z = parseFloat(zScore);
  if (z < -2) return "TCN";
  if (z < -1) return "TC";
  if (z < 1) return "BT";
  return "RC";
}
function getDanhGiaCN(zScore) {
  if (!zScore) return "";
  const z = parseFloat(zScore);
  if (z < -3) return "NCN";
  if (z < -2) return "NC";
  if (z < 1) return "BT";
  return "NC";
}
function getDanhGiaBMI(bmi) {
  if (!bmi) return "";
  const bmiValue = parseFloat(bmi);
  if (bmiValue < 18.5) return "G";
  if (bmiValue < 22.9) return "BT";
  if (bmiValue < 24.9) return "TC";
  if (bmiValue < 29.9) return "BP I";
  if (bmiValue < 30) return "BP II";
  return "BP III";
}
function getDanhGiaTTH(systolic, diastolic) {
  if (!systolic || !diastolic) return "";
  if (systolic < 120 || diastolic < 80) return "HAT";
  if (systolic > 140 || diastolic > 90) return "HAC";
  return "HABT";
}
function getDanhGiaHeartRate(heartRate) {
  if (!heartRate) return "";
  const heartRateValue = parseFloat(heartRate);
  if (heartRateValue < 60) return "NTT";
  if (heartRateValue > 100) return "NTC";
  return "NTBT";
}
//-----------------controller for physical fitness-----------------
const savePhysicalFitness = async (req, res) => {
    try {
        const { studentId, examSessionId, ...data } = req.body;

        if (!studentId || !examSessionId) {
            return res.status(400).json({ success: false, message: "Student ID and Exam Session ID are required." });
        }
        if(data.cohort){
            data.cohort = normalizeCohort(data.cohort);
        }
        const fitnessData = await physicalFitnessModel.findOneAndUpdate(
            { studentId: studentId, examSessionId: examSessionId }, // Query to find the document
            { $set: data }, // Data to update
            { 
                new: true, // Return the updated document
                upsert: true, // Create a new document if one doesn't exist
                setDefaultsOnInsert: true // Apply model defaults on insert
            }
        );

        res.json({ success: true, message: 'Data saved successfully', data: fitnessData });
    } catch (error) {
        console.error("Error saving physical fitness data:", error);
        res.status(500).json({ success: false, message: 'Error saving data', error: error.message });
    }
};
const getAllPhysicalFitness = async (req, res) => {
  try {
    const data = await physicalFitnessModel.find();
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching data', error: err.message });
  }
};
const getPhysicalFitnessStatus = async (req, res) => {
    try {
        const { examSessionId,cohort } = req.query;
        const filter = {};
        if(examSessionId){
            filter.examSessionId = examSessionId;
        }
        if(cohort && cohort !== "All" && cohort !== ""){
            filter.cohort = cohort;
        }
        const data = await physicalFitnessModel.find(filter);
        const total = data.length;
        const daTDSK = data.filter(d=>d.height && d.weight).length;
        const bmiStats = {};
        let male = 0;
        let female = 0;
        // Đếm số lượng nam/nữ
        for (const d of data) {
          if (d.gender && typeof d.gender === 'string') {
            const g = d.gender.trim().toLowerCase();
            if (g === 'male' || g === 'Male') male++;
            if (g === 'female' || g === 'Female') female++;
          }
          if (d.danhGiaBMI) {
            bmiStats[d.danhGiaBMI] = (bmiStats[d.danhGiaBMI] || 0) + 1;
          }
        }
        res.json({
          success: true,
          total,
          daTDSK,
          bmiStats,
          male,
          female,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
  };
  const importPhysicalFitnessExcel = async (req, res) => {
    try {
      const { examSessionId } = req.body;
      
      // Validate examSessionId
      if (!examSessionId) {
        return res.status(400).json({ success: false, message: 'Exam session ID is required' });
      }
      
      // Validate file upload
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }
  
      // Validate examSessionId exists
      const examSession = await examSessionModel.findById(examSessionId);
      if (!examSession) {
        return res.status(400).json({ success: false, message: 'Exam session not found' });
      }
  
      const xlsx = (await import('xlsx')).default || require('xlsx');
      const workbook = xlsx.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      let data = xlsx.utils.sheet_to_json(sheet);
  
      // Validate data structure
      if (!data || data.length === 0) {
        return res.status(400).json({ success: false, message: 'Excel file is empty or invalid format' });
      }
  
      // Validate required fields
      const requiredFields = ['studentId'];
      const invalidRows = [];
      const validData = [];
  
      data.forEach((row, index) => {
        const missingFields = requiredFields.filter(field => !row[field] && row[field] !== 0);
        if (missingFields.length > 0) {
          invalidRows.push({
            row: index + 1,
            missingFields,
            studentId: row.studentId || 'N/A'
          });
        } else {
          validData.push(row);
        }
      });
  
      // Note: We'll still process rows with missing optional fields, but with warnings
  
            // Process data and handle upsert (insert or update)
      const existingRecords = await physicalFitnessModel.find({ examSessionId });
      let insertedCount = 0;
      let updatedCount = 0;
      const updatedStudentIds = [];
  
      for (const row of validData) {
        const studentId = String(row.studentId).replace(/^['"]+|['"]+$/g, '').trim();
        
        // Calculate derived fields - use 0 as default for empty numeric fields
        const height = row.height !== undefined && row.height !== null && row.height !== "" ? parseFloat(row.height) || 0 : 0;
        const weight = row.weight !== undefined && row.weight !== null && row.weight !== "" ? parseFloat(row.weight) || 0 : 0;
        const systolic = row.systolic !== undefined && row.systolic !== null && row.systolic !== "" ? parseFloat(row.systolic) || 0 : 0;
        const diastolic = row.diastolic !== undefined && row.diastolic !== null && row.diastolic !== "" ? parseFloat(row.diastolic) || 0 : 0;
        const heartRate = row.heartRate !== undefined && row.heartRate !== null && row.heartRate !== "" ? parseFloat(row.heartRate) || 0 : 0;
  
        const zScoreCC = calculateZScoreCC(height);
        const zScoreCN = calculateZScoreCN(weight);
        const bmi = calculateBMI(weight, height);
        const zScoreCNCc = (zScoreCN && zScoreCC && parseFloat(zScoreCN) !== 0 && parseFloat(zScoreCC) !== 0) 
          ? (parseFloat(zScoreCN) - parseFloat(zScoreCC)).toFixed(2) 
          : "";
        const cohort = row.cohort ? normalizeCohort(row.cohort) : "";

        const updateData = {
          studentId,
          examSessionId,
          cohort,
          gender: row.gender || "",
          followDate: row.followDate || "",
          height,
          weight,
          zScoreCC,
          danhGiaCC: height > 0 ? getDanhGiaCC(zScoreCC) : "",
          zScoreCN,
          danhGiaCN: weight > 0 ? getDanhGiaCN(zScoreCN) : "",
          zScoreCNCc,
          bmi,
          danhGiaBMI: (weight > 0 && height > 0) ? getDanhGiaBMI(bmi) : "",
          systolic,
          diastolic,
          danhGiaTTH: (systolic > 0 && diastolic > 0) ? getDanhGiaTTH(systolic, diastolic) : "",
          heartRate,
          danhGiaHeartRate: heartRate > 0 ? getDanhGiaHeartRate(heartRate) : "",
        };

        // Check if record already exists
        const existingRecord = existingRecords.find(record => 
          String(record.studentId) === studentId
        );

        if (existingRecord) {
          // Update existing record - update all fields including 0 values for numeric fields
          const fieldsToUpdate = {};
          const numericFields = ['height', 'weight', 'systolic', 'diastolic', 'heartRate', 'bmi', 'zScoreCC', 'zScoreCN', 'zScoreCNCc'];
          const evaluationFields = ['danhGiaCC', 'danhGiaCN', 'danhGiaBMI', 'danhGiaTTH', 'danhGiaHeartRate'];
          
                      Object.keys(updateData).forEach(key => {
              if (key === 'studentId' || key === 'examSessionId') {
                fieldsToUpdate[key] = updateData[key];
              } else if (numericFields.includes(key) || evaluationFields.includes(key)) {
                // Always update numeric and evaluation fields, even if they are 0 or empty
                fieldsToUpdate[key] = updateData[key];
              } else if (updateData[key] !== "" && updateData[key] !== null && updateData[key] !== undefined) {
                // For other fields, only update if they have data
                fieldsToUpdate[key] = updateData[key];
              }
            });
          
          await physicalFitnessModel.findByIdAndUpdate(existingRecord._id, fieldsToUpdate);
          updatedCount++;
          updatedStudentIds.push(studentId);
        } else {
          // Insert new record
          await physicalFitnessModel.create(updateData);
          insertedCount++;
        }
      }
  
      // Clean up uploaded file
      const fs = await import('fs');
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
  
      // Return response with detailed information
      const response = {
        success: true,
        message: `Import completed successfully!`,
        summary: {
          totalRows: data.length,
          validRows: validData.length,
          insertedCount,
          updatedCount,
          skippedCount: invalidRows.length
        }
      };
  
      if (updatedStudentIds.length > 0) {
        response.updated = updatedStudentIds;
      }
  
      if (invalidRows.length > 0) {
        response.invalidRows = invalidRows;
      }
  
      res.json(response);
  
    } catch (error) {
      console.error('Import Physical Fitness Excel Error:', error);
      
      // Clean up uploaded file on error
      if (req.file && req.file.path) {
        try {
          const fs = await import('fs');
          if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
        } catch (cleanupError) {
          console.error('Error cleaning up file:', cleanupError);
        }
      }
      
      res.status(500).json({ 
        success: false, 
        message: 'Import failed: ' + error.message 
      });
    }
  };

//-----------------controller for abnormality-----------------
const getAllAbnormality = async (req, res) => {
    try {
        const abnormalities = await Abnormality.find({});
        res.status(200).json({ success: true, data: abnormalities });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const createAbnormality = async (req, res) => {
    try {
        const newAbnormality = new Abnormality(req.body);
        await newAbnormality.save();
        res.status(201).json({ success: true, message: 'Abnormality created', data: newAbnormality });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Failed to create abnormality', error: error.message });
    }
};

const getAbnormalityByStudentId = async (req, res) => {
    try {
        const { studentId } = req.params;
        const abnormalities = await Abnormality.find({ studentId });
        if (!abnormalities.length) {
            return res.status(404).json({ success: false, message: 'No abnormalities found for this student' });
        }
        res.status(200).json({ success: true, data: abnormalities });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const deleteAbnormality = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedAbnormality = await Abnormality.findByIdAndDelete(id);
        if (!deletedAbnormality) {
            return res.status(404).json({ success: false, message: 'Abnormality not found' });
        }
        res.status(200).json({ success: true, message: 'Abnormality deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
//-----------------controller for drug stock-----------------
const addDrug = async (req, res) => {
    try {
        const {
            drugName, drugCode, drugType, drugUnit,
            inventoryQuantity, expiryDate, supplierName, notes
        } = req.body;
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded.'
            });
        }
        const file = req.file;
        const result = await cloudinary.v2.uploader.upload(file.path, {
            folder: 'drug_images'
        });
        if (!result) {
            return res.status(500).json({
                success: false,
                message: 'Failed to upload image'
            });
        }
        const newDrug = new drugStockModel({
            drugImage: result.secure_url,
            drugName,
            drugCode,
            drugType,
            drugUnit,
            inventoryQuantity,
            expiryDate,
            supplierName,
            notes
        });
        await newDrug.save();
        res.status(201).json({
            success: true,
            message: 'Drug added successfully',
            data: newDrug
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Failed to add drug',
            error: error.message
        });
    }
};
const importDrugExcel = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: 'No file uploaded.'
        });
    }
    try {
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);
        
        const requiredColumns = ['drugName', 'drugCode', 'drugType', 'drugUnit', 'inventoryQuantity', 'expiryDate', 'supplierName'];
        if (data.length > 0) {
            const header = Object.keys(data[0]);
            const missingColumns = requiredColumns.filter(col => !header.includes(col));
            if (missingColumns.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Missing required columns: ${missingColumns.join(', ')}`
                });
            }
        } else {
            return res.status(400).json({ success: false, message: 'Excel file is empty.' });
        }
        
        await drugStockModel.insertMany(data);
        res.status(201).json({
            success: true,
            message: 'Drugs imported successfully',
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error processing Excel file',
            error: error.message
        });
    }
};

const getDrugStock = async (req, res) => {
    try {
        const drugs = await drugStockModel.find({});
        res.status(200).json({ success: true, data: drugs });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

const deleteDrug = async (req, res) => {
    try {
        const { id } = req.params;
        await drugStockModel.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: 'Drug deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
const updateDrug = async (req, res) => {
    try {
        let { _id } = req.params;
        
        // Xử lý trường hợp id là object
        if (typeof _id === 'object' && _id !== null) {
            console.log("ID is object:", _id);
            // Nếu id là object, thử lấy giá trị đầu tiên
            _id = Object.values(_id)[0] || _id.toString();
        }
        
        // Kiểm tra id có hợp lệ không
        if (!_id || _id === 'undefined') {
            console.log("Invalid ID received:", _id);
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid or missing ID parameter.' 
            });
        }
        
        console.log("Processing ID:", _id, "Type:", typeof _id);
        const updateData = req.body;

        // Kiểm tra xem có dữ liệu để update không
        if (!updateData || Object.keys(updateData).length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'No data provided for update.' 
            });
        }

        // Tìm và cập nhật drug, trả về document mới
        const updatedDrug = await drugStockModel.findByIdAndUpdate(
            _id, 
            updateData, 
            { 
                new: true,           // Trả về document đã cập nhật
                runValidators: true  // Chạy validation của schema
            }
        );

        if (!updatedDrug) {
            console.log("Drug not found with ID:", _id);
            return res.status(404).json({ 
                success: false, 
                message: 'Drug not found with the provided ID.' 
            });
        }

        res.status(200).json({ 
            success: true, 
            message: 'Drug updated successfully!', 
            data: updatedDrug 
        });
        
    } catch (error) {
        console.error("Update drug error:", error);
        res.status(400).json({ 
            success: false, 
            message: 'Update failed', 
            error: error.message 
        });
    }
};

//-----------------controller for chat-----------------
const getUsersForChat = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const filteredUsers = await userModel.find({ _id: { $ne: loggedInUserId } }).select("-password");
        res.status(200).json(filteredUsers);
    } catch (error) {
        console.error("Error in getUsersForSidebar: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
};
const getPhysicalFitnessBySession = async (req, res) => {
    try {
        const { examSessionId } = req.query;
        if (!examSessionId) {
            return res.status(400).json({
                success: false,
                message: 'examSessionId is required'
            });
        }
        const data = await physicalFitnessModel.find({ examSessionId });
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching physical fitness data',
            error: error.message
        });
    }
};
const getListExamSession = async (req, res) => {
    try {
        const examSessions = await examSessionModel.find({}).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: examSessions });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching exam sessions',
            error: error.message
        });
    }
};
const addPrescription = async (req, res) => {
    try {
        const {
            abnormalityId,
            studentId,
            doctorName,
            prescriptionDate,
            diagnosis,
            medicines,
            notes
        } = req.body;

        if (!abnormalityId || !studentId || !doctorName || !medicines || medicines.length === 0) {
            return res.status(400).json({ success: false, message: "Missing required fields." });
        }

        // --- Stock Validation ---
        for (const med of medicines) {
            const drug = await drugStockModel.findById(med.drugId);
            if (!drug) {
                return res.status(404).json({ success: false, message: `Drug with ID ${med.drugId} not found.` });
            }
            // Simple validation: assumes 1 unit per dosage.
            // You might need more complex logic here based on your dosage string (e.g., "2 tablets").
            const quantityToPrescribe = Number(med.quantity) || 1; 
            if (drug.inventoryQuantity < quantityToPrescribe) {
                return res.status(400).json({ success: false, message: `Not enough stock for ${drug.drugName}. Only ${drug.inventoryQuantity} left.` });
            }
        }

        // --- Create Prescription ---
        const newPrescription = new prescriptionModel({
            abnormalityId,
            studentId,
            doctorName,
            prescriptionDate,
            diagnosis,
            medicines,
            notes
        });
        await newPrescription.save();

        // --- Update Stock ---
        for (const med of medicines) {
            const quantityToPrescribe = Number(med.quantity) || 1; // Corresponds to the logic above
            await drugStockModel.findByIdAndUpdate(med.drugId, {
                $inc: { inventoryQuantity: -quantityToPrescribe }
            });
        }

        res.status(201).json({ success: true, message: "Prescription created and stock updated successfully.", data: newPrescription });

    } catch (error) {
        console.error("Error creating prescription:", error);
        res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
    }
};
const getPrescriptionByStudentId = async (req, res) => {
    try {
        const { studentId } = req.params;
        const prescriptions = await prescriptionModel.find({ studentId }).populate('medicines.drugId', 'drugName drugCode drugUnit');
        res.status(200).json({ success: true, data: prescriptions });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
    }
};

const getPrescriptionByAbnormalityId = async (req, res) => {
    try {
        const { abnormalityId } = req.params;
        const prescriptions = await prescriptionModel.find({ abnormalityId }).populate('medicines.drugId', 'drugName drugCode drugUnit');
        res.status(200).json({ success: true, data: prescriptions });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
    }
};

export {
    changeAvailability, doctorList, loginDoctor, appoinmentsDoctor,
    appoinmentCancel, appoinmentComplete,doctorDashboard,doctorProfile,
    updateDoctorProfile, refundStatus, savePhysicalFitness,
    getAllPhysicalFitness, getPhysicalFitnessStatus, importPhysicalFitnessExcel,
    getAllAbnormality, createAbnormality, getAbnormalityByStudentId,
    deleteAbnormality,
    addDrug, importDrugExcel, getDrugStock, deleteDrug, updateDrug,
    getUsersForChat,
    getPhysicalFitnessBySession,
    getListExamSession,
    logoutDoctor,
    addPrescription,
    getPrescriptionByStudentId, getPrescriptionByAbnormalityId
}

