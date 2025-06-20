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
            return res.json ({ success: false, message:'Invalid credentials'})
        }
        const isMatch = await bcrypt.compare(password, doctor.password)
        if(isMatch){
            const token = jwt.sign({id:doctor._id}, process.env.JWT_SECRET)
            res.json({success:true, token})
        }else{
            res.json ({ success: false, message:'Invalid credentials'})
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}
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
    const data = req.body;
    const height = parseFloat(data.height) || 0;
    const weight = parseFloat(data.weight) || 0;
    const systolic = parseFloat(data.systolic) || 0;
    const diastolic = parseFloat(data.diastolic) || 0;
    const heartRate = parseFloat(data.heartRate) || 0;

    data.zScoreCC = calculateZScoreCC(height);
    data.danhGiaCC = getDanhGiaCC(data.zScoreCC);
    data.zScoreCN = calculateZScoreCN(weight);
    data.danhGiaCN = getDanhGiaCN(data.zScoreCN);
    data.bmi = calculateBMI(weight, height);
    data.danhGiaBMI = getDanhGiaBMI(data.bmi);
    data.danhGiaTTH = getDanhGiaTTH(systolic, diastolic);
    data.danhGiaHeartRate = getDanhGiaHeartRate(heartRate);
    data.zScoreCNCc = (data.zScoreCN && data.zScoreCC) ? (parseFloat(data.zScoreCN) - parseFloat(data.zScoreCC)).toFixed(2) : "";
 
    await physicalFitnessModel.findOneAndUpdate(
      { studentId: data.studentId, followDate: data.followDate, examSessionId: data.examSessionId },
      data,
      { upsert: true, new: true }
    );
    res.json({ success: true, message: 'Save success' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error server!' });
  }
};
const getAllPhysicalFitness = async (req, res) => {
    try {
      const data = await physicalFitnessModel.find({});
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error server!' });
    }
  };

const getPhysicalFitness = async (req, res) => {
    try {
        const data = await physicalFitnessModel.find({});
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
    const requiredFields = ['studentId', 'height', 'weight'];
    const invalidRows = [];
    const validData = [];

    data.forEach((row, index) => {
      const missingFields = requiredFields.filter(field => !row[field]);
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

    if (invalidRows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Some rows are missing required fields',
        invalidRows
      });
    }

    // Check for duplicates and prepare data
    const processedData = [];
    const duplicateStudentIds = [];
    const existingRecords = await physicalFitnessModel.find({ examSessionId });

    for (const row of validData) {
      const studentId = String(row.studentId).replace(/^['"]+|['"]+$/g, '').trim();
      
      // Check if record already exists
      const existingRecord = existingRecords.find(record => 
        String(record.studentId) === studentId
      );

      if (existingRecord) {
        duplicateStudentIds.push(studentId);
        continue;
      }

      // Calculate derived fields
      const height = parseFloat(row.height) || 0;
      const weight = parseFloat(row.weight) || 0;
      const systolic = parseFloat(row.systolic) || 0;
      const diastolic = parseFloat(row.diastolic) || 0;
      const heartRate = parseFloat(row.heartRate) || 0;

      const zScoreCC = calculateZScoreCC(height);
      const zScoreCN = calculateZScoreCN(weight);
      const bmi = calculateBMI(weight, height);
      const zScoreCNCc = (zScoreCN && zScoreCC) 
        ? (parseFloat(zScoreCN) - parseFloat(zScoreCC)).toFixed(2) 
        : "";

      processedData.push({
        studentId,
        examSessionId,
        gender: row.gender || "",
        followDate: row.followDate || "",
        height,
        weight,
        zScoreCC,
        danhGiaCC: getDanhGiaCC(zScoreCC),
        zScoreCN,
        danhGiaCN: getDanhGiaCN(zScoreCN),
        zScoreCNCc,
        bmi,
        danhGiaBMI: getDanhGiaBMI(bmi),
        systolic,
        diastolic,
        danhGiaTTH: getDanhGiaTTH(systolic, diastolic),
        heartRate,
        danhGiaHeartRate: getDanhGiaHeartRate(heartRate),
      });
    }

    // Insert new records
    let insertedCount = 0;
    if (processedData.length > 0) {
      const result = await physicalFitnessModel.insertMany(processedData);
      insertedCount = result.length;
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
        duplicateCount: duplicateStudentIds.length,
        skippedCount: invalidRows.length
      }
    };

    if (duplicateStudentIds.length > 0) {
      response.duplicates = duplicateStudentIds;
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
        const data = await abnormalityModel.find({});
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server!' });
    }
}
const createAbnormality = async (req, res) => {
    try {
       // console.log("Received body:", req.body);
    
        const abnormality = new Abnormality({
            student: req.body.student, // ObjectId
            studentId: req.body.studentId,
            studentName: req.body.studentName,  
            doctorName: req.body.doctorName,
            date: req.body.date,
            symptoms: req.body.symptoms,
            temporaryTreatment: req.body.temporaryTreatment,
          });
          await abnormality.save();
      //  console.log("Saved abnormality:", abnormality);
        res.status(201).json({ success: true, data: abnormality });
      } catch (err) {
        console.log("Error:", err);
        res.status(500).json({ success: false, message: err.message });
      }
}
const getAbnormalityByStudentId = async (req, res) => {
   try {
    const { studentId } = req.params;
    const abnormality = await Abnormality.find({ studentId: studentId });
    res.json({ success: true, data: abnormality });
   } catch (error) {
    res.status(500).json({ success: false, message: error.message });
   }
}
//-----------------controller for drug stock-----------------

const addDrug = async (req, res) => {
  try {
    const {
      drugName,
      drugCode,
      drugType,
      drugUnit,
      inventoryQuantity,
      expiryDate,
      supplierName,
      notes
    } = req.body;
    const drugImage = req.file;

    // Validate required fields
    if (!drugName || !drugCode || !drugUnit || !inventoryQuantity || !expiryDate || !drugType) {
      return res.status(400).json({ success: false, message: "Missing required fields!" });
    }

    // Optionally: Validate inventoryQuantity is a number
    if (isNaN(inventoryQuantity) || Number(inventoryQuantity) < 0) {
      return res.status(400).json({ success: false, message: "Inventory quantity must be a non-negative number!" });
    }

    // Optionally: Validate expiryDate is a valid date
    if (isNaN(Date.parse(expiryDate))) {
      return res.status(400).json({ success: false, message: "Expiry date is invalid!" });
    }
    //upload image to cloudinary
    let imageUrl = 'https://i.imgur.com/1Q9Z1Zm.png'; 
        if (drugImage) {
            const imageUpload = await cloudinary.uploader.upload(drugImage.path, {resource_type: "image" });
            imageUrl = imageUpload.secure_url;
        }

    // Create new drug
    const drug = await drugStockModel.create({
      drugImage: imageUrl,
      drugName: drugName.trim(),
      drugCode: drugCode.trim(),
      drugType: drugType.trim(),
      drugUnit: drugUnit.trim(),
      inventoryQuantity: Number(inventoryQuantity),
      expiryDate: new Date(expiryDate),
      supplierName: supplierName ? supplierName.trim() : "",
      notes: notes ? notes.trim() : ""
    });

    res.status(201).json({ success: true, message: "Drug added successfully!", data: drug });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
const importDrugExcel = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const xlsx = (await import('xlsx')).default || require('xlsx');
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    let data = xlsx.utils.sheet_to_json(sheet);

    // Validate required fields
    const requiredFields = ['drugName', 'drugCode', 'drugType', 'drugUnit', 'inventoryQuantity', 'expiryDate'];
    const invalidRows = data.filter(row => {
      return requiredFields.some(field => !row[field]);
    });

    if (invalidRows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Some rows are missing required fields',
        invalidRows 
      });
    }

    // Process each row
    const drugs = await Promise.all(data.map(async (row) => {
      const drug = {
        drugImage: 'https://i.imgur.com/1Q9Z1Zm.png', // Default image
        drugName: row.drugName?.trim(),
        drugCode: row.drugCode?.trim(),
        drugType: row.drugType?.trim(),
        drugUnit: row.drugUnit?.trim(),
        inventoryQuantity: Number(row.inventoryQuantity),
        expiryDate: new Date(row.expiryDate),
        supplierName: row.supplierName?.trim() || "",
        notes: row.notes?.trim() || ""
      };
      return drugStockModel.create(drug);
    }));

    res.status(201).json({ 
      success: true, 
      message: `Successfully imported ${drugs.length} drugs`, 
      data: drugs 
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDrugStock = async (req, res) => {
  try {
    const drugs = await drugStockModel.find({}).sort({ createdAt: -1 });
    res.json({ success: true, data: drugs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
const deleteDrug = async (req, res) => {
  try {
    const { drugId } = req.params;
    await drugStockModel.findByIdAndDelete(drugId);
    res.json({ success: true, message: 'Drug deleted successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
const updateDrug = async (req, res) => {
  try {
    const { drugId } = req.params;
    const { drugName, drugCode, drugType, drugUnit, inventoryQuantity, expiryDate, supplierName, notes } = req.body;
    await drugStockModel.findByIdAndUpdate(drugId, { drugName, drugCode, drugType, drugUnit, inventoryQuantity, expiryDate, supplierName, notes });
    res.json({ success: true, message: 'Drug updated successfully!' });
  }catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
const getUsersForChat = async (req, res) => {
  try {
    const users = await userModel.find({});
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Lấy danh sách physical fitness theo examSessionId
const getPhysicalFitnessBySession = async (req, res) => {
  try {
    const { examSessionId } = req.query;
    if (!examSessionId) {
      return res.status(400).json({ success: false, message: "Missing examSessionId" });
    }
    // Populate studentId để lấy thông tin sinh viên nếu cần
    const data = await physicalFitnessModel.find({ 
      examSessionId: new mongoose.Types.ObjectId(examSessionId)
    }).populate('studentId');
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
const getListExamSession = async (req, res) => {
  try {
    const data = await examSessionModel.find({}).sort({ examSessionCreatedAt: -1 });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
export { changeAvailability, doctorList, loginDoctor, appoinmentsDoctor, appoinmentComplete, appoinmentCancel, doctorDashboard, doctorProfile,
     updateDoctorProfile, refundStatus, savePhysicalFitness, getAllPhysicalFitness, getAllAbnormality, createAbnormality, getAbnormalityByStudentId, getPhysicalFitness,
     importPhysicalFitnessExcel, addDrug, importDrugExcel, getDrugStock, deleteDrug, updateDrug, getUsersForChat, getPhysicalFitnessBySession, getListExamSession };

