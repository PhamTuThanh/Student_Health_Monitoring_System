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
import prescriptionModel from '../models/prescriptionModel.js';
import { normalizeCohort } from '../utils/normalize.js';
import EditRequest from '../models/editRequestModel.js';
import mongoose from 'mongoose';
import { calculateBMI, getDanhGiaBMI, isValidBMI, isHealthyBMI } from '../utils/bmiUtils.js';

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
        console.log(examSessionId);
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
      
      // Debug logging
      console.log('Backend Debug - req.body:', req.body);
      console.log('Backend Debug - examSessionId:', examSessionId);
      console.log('Backend Debug - examSessionId type:', typeof examSessionId);
      
      // Validate examSessionId
      if (!examSessionId) {
        console.error('Backend Error - examSessionId is missing from request body');
        return res.status(400).json({ success: false, message: 'Exam session ID is required' });
      }
      
      // Validate file upload
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      // Validate file extension
      const allowedExtensions = ['.xlsx', '.xls', '.xlsm', '.xlsb', '.xltx', '.xltm'];
      const fileExtension = req.file.originalname.toLowerCase().substring(req.file.originalname.lastIndexOf('.'));
      if (!allowedExtensions.includes(fileExtension)) {
        return res.status(400).json({ 
          success: false, 
          message: `Invalid file format. Only Excel files are allowed: ${allowedExtensions.join(', ')}` 
        });
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (req.file.size > maxSize) {
        return res.status(400).json({ 
          success: false, 
          message: 'File size too large. Maximum size allowed is 10MB' 
        });
      }
  
      // Validate examSessionId exists
      const examSession = await examSessionModel.findById(examSessionId);
      if (!examSession) {
        return res.status(400).json({ success: false, message: 'Exam session not found' });
      }

      // Check edit permission for this exam session
      const doctorId = req.user._id;
      
      // Nếu exam session bị lock, check permission
      if (examSession.isLocked) {
        // Check xem có temporary unlock không
        const activeRequest = await EditRequest.findOne({
          examSessionId: examSessionId,
          requestedBy: doctorId,
          status: 'approved',
          tempUnlockUntil: { $gt: new Date() }
        });

        if (!activeRequest) {
          return res.status(403).json({ 
            success: false, 
            message: "This exam session is locked. Please request edit access from admin.",
            lockReason: examSession.lockReason,
            lockedAt: examSession.lockedAt,
            isLocked: true
          });
        }
      }
  
      let xlsx, workbook, data;
      
      try {
        xlsx = (await import('xlsx')).default || require('xlsx');
        workbook = xlsx.readFile(req.file.path);
      } catch (fileError) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot read Excel file. File may be corrupted or password protected' 
        });
      }

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Excel file contains no worksheets' 
        });
      }

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      
      try {
        data = xlsx.utils.sheet_to_json(sheet);
      } catch (parseError) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot parse Excel data. Please check the file format' 
        });
      }
  
      // Validate data structure
      if (!data || data.length === 0) {
        return res.status(400).json({ success: false, message: 'Excel file is empty or contains no valid data' });
      }

      // Check maximum rows limit
      const maxRows = 3000;
      if (data.length > maxRows) {
        return res.status(400).json({ 
          success: false, 
          message: `Too many rows. Maximum ${maxRows} rows allowed, but file contains ${data.length} rows` 
        });
      }
  
      // Validate required fields and data format
      const requiredFields = ['studentId'];
      const optionalNumericFields = ['height', 'weight', 'systolic', 'diastolic', 'heartRate'];
      const optionalStringFields = ['gender', 'cohort', 'followDate'];
      const invalidRows = [];
      const validData = [];
      const warnings = [];
  
      data.forEach((row, index) => {
        const rowNumber = index + 1;
        const rowErrors = [];
        const rowWarnings = [];
        
        // Check required fields
        const missingFields = requiredFields.filter(field => 
          !row[field] && row[field] !== 0 && row[field] !== '0'
        );
        
        if (missingFields.length > 0) {
          rowErrors.push(`Missing required fields: ${missingFields.join(', ')}`);
        }

        // Validate studentId format
        if (row.studentId) {
          const studentId = String(row.studentId).trim();
          if (studentId.length === 0) {
            rowErrors.push('Student ID cannot be empty');
          } else if (studentId.length > 50) {
            rowErrors.push('Student ID is too long (max 50 characters)');
          }
        }

        // Validate numeric fields
        optionalNumericFields.forEach(field => {
          if (row[field] !== undefined && row[field] !== null && row[field] !== '') {
            const value = parseFloat(row[field]);
            if (isNaN(value)) {
              rowErrors.push(`${field} must be a valid number`);
            } else if (value < 0) {
              rowErrors.push(`${field} cannot be negative`);
            } else {
              // Specific validation for each field
              switch (field) {
                case 'height':
                  if (value > 0 && (value < 50 || value > 250)) {
                    rowWarnings.push(`Height ${value}cm seems unusual (expected range: 50-250cm)`);
                  }
                  break;
                case 'weight':
                  if (value > 0 && (value < 20 || value > 200)) {
                    rowWarnings.push(`Weight ${value}kg seems unusual (expected range: 20-200kg)`);
                  }
                  break;
                case 'systolic':
                  if (value > 0 && (value < 60 || value > 250)) {
                    rowWarnings.push(`Systolic pressure ${value} seems unusual (expected range: 60-250mmHg)`);
                  }
                  break;
                case 'diastolic':
                  if (value > 0 && (value < 40 || value > 150)) {
                    rowWarnings.push(`Diastolic pressure ${value} seems unusual (expected range: 40-150mmHg)`);
                  }
                  break;
                case 'heartRate':
                  if (value > 0 && (value < 30 || value > 220)) {
                    rowWarnings.push(`Heart rate ${value} seems unusual (expected range: 30-220 bpm)`);
                  }
                  break;
              }
            }
          }
        });

        // Validate gender
        if (row.gender) {
          const gender = String(row.gender).trim().toLowerCase();
          const validGenders = ['male', 'female', 'nam', 'nữ', 'm', 'f'];
          if (!validGenders.includes(gender)) {
            rowWarnings.push(`Gender "${row.gender}" may not be recognized (expected: Male/Female/Nam/Nữ)`);
          }
        }

        // Validate cohort format
        if (row.cohort) {
          const cohort = String(row.cohort).trim();
          if (cohort.length > 20) {
            rowErrors.push('Cohort name is too long (max 20 characters)');
          }
        }

        // Validate date format
        if (row.followDate) {
          const dateValue = row.followDate;
          let isValidDate = false;
          
          if (typeof dateValue === 'number') {
            // Excel serial date
            if (dateValue > 0 && dateValue < 100000) {
              isValidDate = true;
            }
          } else if (typeof dateValue === 'string') {
            const dateStr = dateValue.trim();
            const dateFormats = [
              /^\d{4}-\d{2}-\d{2}$/,  // YYYY-MM-DD
              /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
              /^\d{2}-\d{2}-\d{4}$/   // DD-MM-YYYY
            ];
            
            if (dateFormats.some(format => format.test(dateStr))) {
              const testDate = new Date(dateStr);
              if (!isNaN(testDate.getTime())) {
                isValidDate = true;
              }
            }
          } else if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
            isValidDate = true;
          }
          
          if (!isValidDate) {
            rowErrors.push(`Invalid date format for followDate: "${dateValue}". Expected format: YYYY-MM-DD`);
          }
        }

        // Check for duplicate studentId in the same file
        const duplicateIndex = data.findIndex((otherRow, otherIndex) => 
          otherIndex !== index && 
          String(otherRow.studentId).trim() === String(row.studentId).trim()
        );
        if (duplicateIndex !== -1) {
          rowErrors.push(`Duplicate student ID found at row ${duplicateIndex + 1}`);
        }

        if (rowErrors.length > 0) {
          invalidRows.push({
            row: rowNumber,
            studentId: row.studentId || 'N/A',
            errors: rowErrors
          });
        } else {
          validData.push(row);
          if (rowWarnings.length > 0) {
            warnings.push({
              row: rowNumber,
              studentId: row.studentId,
              warnings: rowWarnings
            });
          }
        }
      });

      // If there are too many invalid rows, reject the import
      if (invalidRows.length > data.length * 0.5) { // More than 50% invalid
        return res.status(400).json({
          success: false,
          message: `Too many invalid rows (${invalidRows.length}/${data.length}). Please fix the data and try again.`,
          invalidRows: invalidRows.slice(0, 10), // Show first 10 errors
          totalInvalidRows: invalidRows.length
        });
      }
  
            // Process data and handle upsert (insert or update)
      let insertedCount = 0;
      let updatedCount = 0;
      const updatedStudentIds = [];
  
      for (const row of validData) {
        const studentId = String(row.studentId).replace(/^['"]+|['"]+$/g, '').trim();
        
        // Additional validation for studentId
        if (!studentId || studentId === 'undefined' || studentId === 'null') {
          console.error(`Invalid studentId found:`, row.studentId);
          invalidRows.push({
            row: data.findIndex(r => r === row) + 1,
            studentId: row.studentId || 'N/A',
            errors: ['Invalid or empty studentId']
          });
          continue;
        }
        
        // Debug logging
        console.log(`\n=== Processing Row for StudentId: ${studentId} ===`);
        console.log('Raw studentId from Excel:', row.studentId);
        console.log('Processed studentId:', studentId);
        console.log('StudentId type:', typeof studentId);
        console.log('StudentId length:', studentId.length);
        console.log('ExamSessionId:', examSessionId);
        
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

        // Separate query fields from update fields
        const queryCondition = {
          studentId: String(studentId),
          examSessionId: examSessionId
        };

        const updateData = {
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

        console.log('Query condition:', queryCondition);
        console.log('Update data keys:', Object.keys(updateData));

        try {
          // Check if record exists first for accurate tracking
          const existingRecord = await physicalFitnessModel.findOne(queryCondition);
          const recordExists = !!existingRecord;
          
          console.log('Record exists before upsert:', recordExists);
          if (existingRecord) {
            console.log('Existing record _id:', existingRecord._id);
          }

          // Use proper upsert with separated query and update data
          const result = await physicalFitnessModel.findOneAndUpdate(
            queryCondition,
            { 
              $set: updateData,
              $setOnInsert: queryCondition // Only set these on insert to ensure query fields are set
            },
            { 
              new: true,
              upsert: true,
              setDefaultsOnInsert: true
            }
          );

          console.log('Operation result _id:', result._id);

          // Track based on whether record existed before
          if (recordExists) {
            updatedCount++;
            updatedStudentIds.push(studentId);
            console.log('Operation: UPDATE (record existed)');
          } else {
            insertedCount++;
            console.log('Operation: INSERT (new record)');
          }
        } catch (dbError) {
          console.error(`Database error for student ${studentId}:`, dbError);
          
          // Handle duplicate key error specifically
          if (dbError.code === 11000) {
            console.error('Duplicate key error - attempting update instead');
            try {
              // If duplicate key error, try a simple update
              const updateResult = await physicalFitnessModel.findOneAndUpdate(
                queryCondition,
                { $set: updateData },
                { new: true }
              );
              
              if (updateResult) {
                updatedCount++;
                updatedStudentIds.push(studentId);
                console.log('Operation: UPDATE (after duplicate key error)');
              } else {
                throw new Error('Update failed after duplicate key error');
              }
            } catch (retryError) {
              invalidRows.push({
                row: data.findIndex(r => String(r.studentId).trim() === studentId) + 1,
                studentId: studentId,
                errors: [`Database error: ${retryError.message}`]
              });
            }
          } else {
            invalidRows.push({
              row: data.findIndex(r => String(r.studentId).trim() === studentId) + 1,
              studentId: studentId,
              errors: [`Database error: ${dbError.message}`]
            });
          }
        }
      }
  
      // Clean up uploaded file
      try {
        const fs = await import('fs');
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
        // Don't fail the whole import because of file cleanup error
      }
  
      // Prepare detailed summary
      const totalProcessed = insertedCount + updatedCount;
      const hasErrors = invalidRows.length > 0;
      const hasWarnings = warnings.length > 0;
      
      // Return response with detailed information
      const response = {
        success: totalProcessed > 0, // Success if at least one record was processed
        message: totalProcessed > 0 
          ? `Import completed! ${totalProcessed} records processed successfully.`
          : 'Import failed. No records were processed.',
        summary: {
          totalRows: data.length,
          validRows: validData.length,
          processedRows: totalProcessed,
          insertedCount,
          updatedCount,
          errorCount: invalidRows.length,
          warningCount: warnings.length
        }
      };
  
      // Add updated student IDs if any
      if (updatedStudentIds.length > 0) {
        response.updated = updatedStudentIds.slice(0, 10); // Limit to first 10 for readability
        if (updatedStudentIds.length > 10) {
          response.moreUpdated = updatedStudentIds.length - 10;
        }
      }
  
      // Add error details if any
      if (hasErrors) {
        response.errors = {
          count: invalidRows.length,
          details: invalidRows.slice(0, 5), // Show first 5 errors
          hasMore: invalidRows.length > 5
        };
      }
  
      // Add warning details if any
      if (hasWarnings) {
        response.warnings = {
          count: warnings.length,
          details: warnings.slice(0, 5), // Show first 5 warnings
          hasMore: warnings.length > 5
        };
      }

      // Set appropriate HTTP status
      const statusCode = totalProcessed > 0 ? (hasErrors ? 207 : 200) : 400; // 207 = Multi-Status
      
      res.status(statusCode).json(response);
  
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
      
      // Determine error type and appropriate response
      let errorMessage = 'Import failed due to an unexpected error';
      let statusCode = 500;
      
      if (error.name === 'ValidationError') {
        errorMessage = 'Data validation failed: ' + error.message;
        statusCode = 400;
      } else if (error.name === 'MongoError' || error.name === 'MongooseError') {
        errorMessage = 'Database error occurred during import';
        statusCode = 500;
      } else if (error.message.includes('ENOENT') || error.message.includes('file')) {
        errorMessage = 'File processing error: Unable to read the uploaded file';
        statusCode = 400;
      } else if (error.message.includes('memory') || error.message.includes('size')) {
        errorMessage = 'File too large or system memory insufficient';
        statusCode = 413; // Payload Too Large
      }
      
      res.status(statusCode).json({ 
        success: false, 
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? {
          name: error.name,
          message: error.message,
          stack: error.stack?.split('\n').slice(0, 5) // Limited stack trace in dev
        } : undefined,
        timestamp: new Date().toISOString()
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
        const { drugId } = req.params;
        
        if (!drugId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Drug ID is required' 
            });
        }

        const deletedDrug = await drugStockModel.findByIdAndDelete(drugId);
        
        if (!deletedDrug) {
            return res.status(404).json({ 
                success: false, 
                message: 'Drug not found' 
            });
        }

  
        res.status(200).json({ 
            success: true, 
            message: 'Drug deleted',
            deletedId: deletedDrug._id 
        });
    } catch (error) {
        console.error('Delete drug error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error: ' + error.message 
        });
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
        
        // Try to find with both ObjectId and String to handle data inconsistency
        const examSessionIdStr = String(examSessionId);
        
        // Build query conditions
        const queryConditions = [
            { examSessionId: examSessionIdStr } // String match
        ];
        
        // Add ObjectId match only if examSessionId is a valid ObjectId string
        if (mongoose.Types.ObjectId.isValid(examSessionId)) {
            queryConditions.push({ examSessionId: new mongoose.Types.ObjectId(examSessionId) });
        }
        
        const data = await physicalFitnessModel.find({ 
            $or: queryConditions
        });
        
        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Backend error:', error);
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

//--------------------Doctor Lock Management--------------------

// API để check edit permission cho exam session
const checkEditPermission = async (req, res) => {
    try {
        const { examSessionId } = req.params;
        const doctorId = req.user._id;
        
        if (!examSessionId) {
            return res.status(400).json({ 
                success: false, 
                message: "Exam session ID is required" 
            });
        }

        const examSession = await examSessionModel.findById(examSessionId);
        if (!examSession) {
            return res.status(404).json({ 
                success: false, 
                message: "Exam session not found" 
            });
        }

        // Nếu exam session không bị lock, cho phép edit
        if (!examSession.isLocked) {
            return res.json({ 
                success: true, 
                canEdit: true,
                reason: "Exam session is not locked"
            });
        }

        // Check xem có temporary unlock không
        const activeRequest = await EditRequest.findOne({
            examSessionId: examSessionId,
            doctorId: doctorId,
            status: 'approved',
            tempUnlockUntil: { $gt: new Date() }
        });

        if (activeRequest) {
            return res.json({ 
                success: true, 
                canEdit: true,
                reason: "Temporary unlock is active",
                tempUnlockUntil: activeRequest.tempUnlockUntil
            });
        }

        return res.json({ 
            success: true, 
            canEdit: false,
            reason: "Exam session is locked",
            lockReason: examSession.lockReason,
            lockedAt: examSession.lockedAt
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// API để request edit access
const requestEditAccess = async (req, res) => {
    try {
        const { examSessionId, reason } = req.body;
        const doctorId = req.user._id;
        
        if (!examSessionId || !reason) {
            return res.status(400).json({ 
                success: false, 
                message: "Exam session ID and reason are required" 
            });
        }

        const examSession = await examSessionModel.findById(examSessionId);
        if (!examSession) {
            return res.status(404).json({ 
                success: false, 
                message: "Exam session not found" 
            });
        }

        if (!examSession.isLocked) {
            return res.status(400).json({ 
                success: false, 
                message: "Exam session is not locked, no need to request access" 
            });
        }

        // Check xem đã có request pending chưa
        const existingRequest = await EditRequest.findOne({
            examSessionId: examSessionId,
            requestedBy: doctorId,
            status: 'pending'
        });

        if (existingRequest) {
            return res.status(400).json({ 
                success: false, 
                message: "You already have a pending request for this exam session" 
            });
        }

        // Create new edit request
        const editRequest = new EditRequest({
            examSessionId: examSessionId,
            requestedBy: doctorId,
            reason: reason,
            status: 'pending'
        });

        await editRequest.save();

        res.json({ 
            success: true, 
            message: "Edit request submitted successfully",
            editRequest: editRequest
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// API để lấy danh sách edit requests của doctor
const getMyEditRequests = async (req, res) => {
    try {
        const doctorId = req.user._id;
        const { status, page = 1, limit = 10 } = req.query;
        
        let filter = { requestedBy: doctorId };
        if (status && status !== 'all') {
            filter.status = status;
        }

        const skip = (page - 1) * limit;
        
        const editRequests = await EditRequest.find(filter)
            .populate('examSessionId', 'examSessionName examSessionDate examSessionAcademicYear')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await EditRequest.countDocuments(filter);

        res.json({ 
            success: true, 
            editRequests,
            pagination: {
                current: parseInt(page),
                total: Math.ceil(total / limit),
                count: editRequests.length,
                totalRecords: total
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// API để cancel edit request (chỉ cho pending requests)
const cancelEditRequest = async (req, res) => {
    try {
        const { requestId } = req.body;
        const doctorId = req.user._id;
        
        if (!requestId) {
            return res.status(400).json({ 
                success: false, 
                message: "Request ID is required" 
            });
        }

        const editRequest = await EditRequest.findOne({
            _id: requestId,
            requestedBy: doctorId
        });
        
        if (!editRequest) {
            return res.status(404).json({ 
                success: false, 
                message: "Edit request not found" 
            });
        }

        if (editRequest.status !== 'pending') {
            return res.status(400).json({ 
                success: false, 
                message: "Can only cancel pending requests" 
            });
        }

        const updatedRequest = await EditRequest.findByIdAndUpdate(
            requestId,
            { 
                status: 'cancelled',
                cancelledAt: new Date()
            },
            { new: true }
        );

        res.json({ 
            success: true, 
            message: "Edit request cancelled successfully",
            editRequest: updatedRequest
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
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
    getPrescriptionByStudentId, getPrescriptionByAbnormalityId,
    // Lock Management APIs
    checkEditPermission,
    requestEditAccess,
    getMyEditRequests,
    cancelEditRequest
}

