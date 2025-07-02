import validator from 'validator';
import bcrypt from 'bcrypt';
import { v2 as cloudinary } from 'cloudinary';
import doctorModel from '../models/doctorModel.js';
// import studentModel from '../models/studentModel.js'; // No longer needed
import jwt from 'jsonwebtoken'
import appoinmentModel from './../models/appoinmentModel.js';
import userModel from './../models/userModel.js'; // Use userModel for students
import xlsx from 'xlsx';
import News from '../models/newsModel.js';
import ExamSession from "../models/examSessionModel.js";
import physicalFitnessModel from "../models/physicalFitnessModel.js";
import EditRequest from "../models/editRequestModel.js";
import abnormalityModel from "../models/abnormalityModel.js";
// import { normalizeCohort } from '../utils/normalize.js';


//API for adding doctor
const addDoctor = async (req, res) => {
    try {
        const { name, email, password, speciality, degree, experience, about, fees, address } = req.body;
        const imageFile = req.file;

        if (!name || !email || !password || !speciality || !degree || !experience || !about || !fees || !address) {
            return res.json({ success: false, message: "You are missing details" });
        }
        // Validating email format
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" });
        }
        // Validating strong password
        if (password.length < 8) {
            return res.json({ success: false, message: "Please enter a stronger password" });
        }
        // Hashing doctor password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        //Upload image to cloudinary
        let imageUrl = 'https://i.imgur.com/1Q9Z1Zm.png'; // Default doctor image
        if (imageFile) {
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, {resource_type: "image" });
            imageUrl = imageUpload.secure_url;
        }
        

        const doctorData = {
            name,
            email,
            image: imageUrl,
            password: hashedPassword,
            speciality,
            degree,
            experience,
            about,
            fees,
            address: JSON.parse(address),
            date: Date.now(),
            role: 'doctor'
        };
        const newDoctor = new doctorModel(doctorData);
        await newDoctor.save();

        res.json({ success: true, message: "Doctor added" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}
//API for adding student (now uses userModel)
const addStudent = async (req, res) => {
    try {
        const { name, email, password, phone, cohort, studentId, major, about, dob, gender, address } = req.body;
        const imageFile = req.file;
        console.log('req.body:', req.body);
        console.log('req.file:', req.file);
        if (!name || !email || !password || !cohort || !studentId || !major || !about || !dob || !gender || !address) {
            return res.json({ success: false, message: "You are missing details" });
        }
        // Validating email format
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" });
        }
        // Validating strong password
        if (password.length < 8) {
            return res.json({ success: false, message: "Please enter a stronger password" });
        }
        
        const existingUserEmail = await userModel.findOne({ email });
        if (existingUserEmail) {
            return res.json({success:false, message:'Email already exists'});
        }
        const duplicateStudent = await userModel.findOne({studentId, role: 'student'});
        if(duplicateStudent){
            return res.json({success:false, message:'Student ID already exists'});
        }
        
        // Hashing student password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        //Upload image to cloudinary
        let imageUrl = 'https://i.imgur.com/1Q9Z1Zm.png'; // Default student image
        if (imageFile) {
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, {resource_type: "image" });
            imageUrl = imageUpload.secure_url;
        }        
        //phone default 0000000000
        const studentData = {
            name,
            email,
            image: imageUrl,
            password: hashedPassword,
            phone: phone || '0000000000',
            cohort,
            studentId,
            major,
            about,
            dob,
            gender,
            address: JSON.parse(address),
            role: 'student' // Set role to student
        };
        const newStudent = new userModel(studentData); // Use userModel
        await newStudent.save();

        res.json({ success: true, message: "Student added" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

//API For admin login
const loginAdmin = async (req, res) =>{
    try{
        const {email, password} = req.body;
        // Consider storing admin credentials more securely if this is for a real application
        if(email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD){
            const token = jwt.sign({email: email, role: 'admin'}, process.env.JWT_SECRET, { expiresIn: '1d' });
            
            res.cookie('aToken', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 24 * 60 * 60 * 1000 // 1 day
            });

            res.status(200).json({
                success: true,
                message: 'Admin logged in successfully',
                token: token
            });

        } else {
            res.json({success:false, message: "Please try login again"});
        }

    }catch (error){
        console.log(error);
        res.json({success:false, message:error.message});
    }
}
//API for admin logout
const logoutAdmin = async (req, res) => {
try {
    res.clearCookie('aToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    });
    res.status(200).json({ success: true, message: "Logged out successfully" });
} catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Logout failed" });
}
}
//API to get all doctor list for admin panel
    const allDoctors = async(req, res) => {
        try{
            const doctors = await doctorModel.find({}).select('-password'); // Assuming doctors are still in doctorModel
            res.json({success:true, doctors});
        }catch(error){
            console.log(error);
            res.json({success:false, message:error.message});
        }
    }
//API to get all appoinment list
    const appoinmentsAdmin = async (req, res)=>{
        try {
            const appoinments = await appoinmentModel.find({});
            res.json({success:true, appoinments});
        } catch (error) {
            console.log(error);
            res.json({success:false, message:error.message});
        }
    }
//api for appoinment cancellaion
const appoinmentCancel = async (req, res)=>{
    try {
        const {appoinmentId} = req.body;
        const appoinmentData = await appoinmentModel.findById(appoinmentId);

        if (!appoinmentData) {
            return res.json({success:false, message: "Appointment not found"});
        }

        await appoinmentModel.findByIdAndUpdate(appoinmentId, {cancelled:true});
        
        const {docId, slotDate, slotTime} = appoinmentData;
        const doctorData = await doctorModel.findById(docId);
        if (doctorData && doctorData.slot_booked && doctorData.slot_booked[slotDate]){
            let slot_booked = doctorData.slot_booked;
            slot_booked[slotDate] = slot_booked[slotDate].filter(e=> e!== slotTime);
            await doctorModel.findByIdAndUpdate(docId,{slot_booked});
        }
        res.json({success:true, message:'Appoinment Cancelled'});

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}
//API to get dashboard data for admin panel
const adminDashboard = async (req, res)=>{
    try {
        const doctors = await doctorModel.find({}); // Assuming doctors are in doctorModel
        const students = await userModel.find({role: 'student'}); // Students from userModel
        const appoinments = await appoinmentModel.find({});

        const dashData ={
            doctors: doctors.length,
            appoinments: appoinments.length,
            students: students.length, // Changed from patients to students
            lastestAppoinments: appoinments.sort((a,b) => b.date - a.date).slice(0,5) // Sort by date for latest
        };
        res.json({success:true, dashData});
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}
const deleteDoctor = async (req, res) => {
    try {
        const { docId } = req.body;
        if (!docId) {
            return res.status(400).json({ success: false, message: "Doctor ID is required" });
        }
        const deletedDoctor = await doctorModel.findByIdAndDelete(docId); // Assuming Doctor is alias for doctorModel 
        if (!deletedDoctor) {
            return res.status(404).json({ success: false, message: "Doctor not found" });
        }
        res.status(200).json({ success: true, message: "Doctor deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

//--------------------Student Management--------------------
const listStudents = async (req, res) => {
    try {
        const { cohort, major, studentId } = req.body;
        let query = { role: 'student' }; // Filter by role student
        
        if (cohort) query.cohort = cohort;
        if (major) {
            // Case-insensitive matching for major
            query.major = { $regex: new RegExp(`^${major}$`, 'i') };
        }
        if (studentId && studentId.trim() !== '') {
            // Use regex for partial matching (case-insensitive)
            query.studentId = { $regex: studentId.trim(), $options: 'i' };
        }
        
        const students = await userModel.find(query).select('-password');
        res.json({ success: true, students });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

const importStudentsExcel = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(sheet);

    const studentsToInsert = [];
    for (const row of jsonData) {
      const existingUserEmail = await userModel.findOne({ email: row.email });
      if (existingUserEmail) {
        console.log(`Email ${row.email} already exists, skipping.`);
        continue; // Skip if email exists
      }
      if (row.studentId) {
        const existingStudentId = await userModel.findOne({ studentId: row.studentId, role: 'student' });
        if (existingStudentId) {
          console.log(`Student ID ${row.studentId} already exists, skipping.`);
          continue; // Skip if studentId exists for a student
        }
      }

      const hashedPassword = await bcrypt.hash(row.password ? row.password.toString() : '12345678', 10);
    //   const cohort = row.cohort ? normalizeCohort(row.cohort) : "";
      studentsToInsert.push({
        name: row.name,
        email: row.email,
        password: hashedPassword,
        phone: row.phone || '0000000000',
        cohort: row.cohort,
        studentId: row.studentId ? row.studentId.toString() : undefined,
        major: row.major,
        about: row.about,
        dob: row.dob, 
        gender: row.gender,
        address: {
          line1: row.address_line1 || '',
          line2: row.address_line2 || ''
        },
        image: row.image || 'https://i.imgur.com/1Q9Z1Zm.png',
        role: 'student'
      });
    }
    if (studentsToInsert.length > 0) {
        await userModel.insertMany(studentsToInsert); // Use userModel
        res.json({ success: true, message: `Import thành công ${studentsToInsert.length} sinh viên!`, count: studentsToInsert.length });
    } else {
        res.json({ success: true, message: 'Không có sinh viên mới nào được thêm (có thể do trùng lặp email/Student ID).', count: 0 });
    }

  } catch (error) {
    console.log("Import Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
//--------------------News Management--------------------
const addNews = async (req, res) => {
    try {
        const { title, category, date, content } = req.body;
        const file = req.file;
        let fileUrl = ''; // Default student image
        if (file) {
            const fileUpload = await cloudinary.uploader.upload(file.path, {resource_type: "image" });
            fileUrl = fileUpload.secure_url;
        }  
        if (!title || !category || !date || !content) {
            return res.json({ success: false, message: "You are missing details" });
        }

        const news = new News({ title, category, date, content, file: fileUrl });
        await news.save();
        res.json({ success: true, message: 'News added successfully' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}
const getNews = async (req, res) => {
    try {
        const news = await News.find({}).sort({ date: -1 });
        res.json({ success: true, news });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}
const updateNews = async (req, res) => {
    try {
        const { id, title, category, date, content } = req.body;
        const file = req.file;
        let updateFields = { title, category, date, content };

        if (!id || !title || !category || !date || !content) {
            return res.json({ success: false, message: "You are missing details" });
        }

        if (file) {
            const fileUpload = await cloudinary.uploader.upload(file.path, { resource_type: "auto" });
            updateFields.file = fileUpload.secure_url;
        }

        const news = await News.findByIdAndUpdate(id, updateFields, { new: true });
        if (!news) {
            return res.json({ success: false, message: "News not found" });
        }
        res.json({ success: true, message: 'News updated successfully', news });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}
const deleteNews = async (req, res) => {
    try {
        const { id } = req.body;
        if (!id) {
            return res.status(400).json({ success: false, message: "News ID is required" });
        }
        const deletedNews = await News.findByIdAndDelete(id);
        if (!deletedNews) {
            return res.status(404).json({ success: false, message: "News not found" });
        }
        res.status(200).json({ success: true, message: "News deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
}
// Tạo exam session mới và tạo bản ghi rỗng cho tất cả sinh viên
const createExamSession = async (req, res) => {
  try {
    const { examSessionName, examSessionDate, examSessionAcademicYear, examSessionDescription } = req.body;
    // 1. Tạo exam session mới
    const examSession = await ExamSession.create({
      examSessionName,
      examSessionDate,
      examSessionAcademicYear,
      examSessionDescription,
      createdBy: req.user?._id || null,
    });

    // 2. Lấy danh sách tất cả sinh viên
    const students = await userModel.find({ role: {$in: ["student", "user"]}});

    // 3. Tạo bản ghi rỗng cho từng sinh viên
    const emptyRecords = students.map((student) => ({
      studentId: student._id,
      examSessionId: examSession._id,
      // Các trường dữ liệu sức khỏe để rỗng hoặc mặc định
      height: "",
      weight: "",
      zScoreCC: "",
      danhGiaCC: "",
      zScoreCN: "",
      danhGiaCN: "",
      zScoreCNCc: "",
      bmi: "",
      danhGiaBMI: "",
      systolic: "",
      diastolic: "",
      danhGiaTTH: "",
      heartRate: "",
      danhGiaHeartRate: "",
    }));
    await physicalFitnessModel.insertMany(emptyRecords);
    res.status(201).json({ success: true, message: "Create exam session and empty records successfully", examSession });
  } catch (error) {
    console.error("Error creating exam session:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
const examtionList = async (req, res) => {
    try {
        const examSessions = await ExamSession.find({});
        res.json({ success: true, examSessions });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

const deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({ success: false, message: "Student ID is required" });
        }

        const deletedStudent = await userModel.findByIdAndDelete(id);
        
        if (!deletedStudent) {
            return res.status(404).json({ success: false, message: "Student not found" });
        }

        res.status(200).json({ success: true, message: "Student deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

//--------------------Exam Session Lock Management--------------------

// API để lấy danh sách exam sessions với thông tin physical fitness data
const getExamSessionsWithData = async (req, res) => {
    try {
        const examSessions = await ExamSession.find({}).sort({ createdAt: -1 });
        
        const sessionsWithStats = await Promise.all(
            examSessions.map(async (session) => {
                // Handle both ObjectId and String types for examSessionId
                const fitnessData = await physicalFitnessModel.find({ 
                    $or: [
                        { examSessionId: session._id }, // ObjectId match
                        { examSessionId: String(session._id) } // String match
                    ]
                });
                
                console.log(`🔍 Session ${session.examSessionAcademicYear} (${session._id}): Found ${fitnessData.length} fitness records`);
                
                const totalStudents = fitnessData.length;
                const completedData = fitnessData.filter(data => 
                    data.height && data.weight && data.systolic && data.diastolic && data.heartRate
                ).length;
                
                return {
                    ...session.toObject(),
                    totalStudents,
                    completedData,
                    completionRate: totalStudents > 0 ? Math.round((completedData / totalStudents) * 100) : 0
                };
            })
        );

        res.json({ success: true, examSessions: sessionsWithStats });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// API để lock/unlock exam session
const toggleExamSessionLock = async (req, res) => {
    try {
        const { examSessionId, isLocked, lockReason } = req.body;
        
        if (!examSessionId) {
            return res.status(400).json({ success: false, message: "Exam session ID is required" });
        }

        const examSession = await ExamSession.findById(examSessionId);
        if (!examSession) {
            return res.status(404).json({ success: false, message: "Exam session not found" });
        }

        const updateData = {
            isLocked: isLocked,
            lockedAt: isLocked ? new Date() : null,
            lockReason: isLocked ? lockReason : null,
            lockedBy: req.user?._id || null
        };

        const updatedSession = await ExamSession.findByIdAndUpdate(
            examSessionId, 
            updateData, 
            { new: true }
        );

        res.json({ 
            success: true, 
            message: `Exam session ${isLocked ? 'locked' : 'unlocked'} successfully`,
            examSession: updatedSession
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// API để lấy danh sách edit requests
const getEditRequests = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        
        let filter = {};
        if (status && status !== 'all') {
            filter.status = status;
        }

        const skip = (page - 1) * limit;
        
        const editRequests = await EditRequest.find(filter)
            .populate('examSessionId', 'examSessionName examSessionDate examSessionAcademicYear')
            .populate('requestedBy', 'name email')
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

// API để approve/reject edit request
const handleEditRequest = async (req, res) => {
    try {
        const { requestId, action, adminResponse, tempUnlockHours } = req.body;
        
        if (!requestId || !action) {
            return res.status(400).json({ 
                success: false, 
                message: "Request ID and action are required" 
            });
        }

        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({ 
                success: false, 
                message: "Action must be 'approve' or 'reject'" 
            });
        }

        const editRequest = await EditRequest.findById(requestId)
            .populate('examSessionId')
            .populate('requestedBy');
            
        if (!editRequest) {
            return res.status(404).json({ 
                success: false, 
                message: "Edit request not found" 
            });
        }

        if (editRequest.status !== 'pending') {
            return res.status(400).json({ 
                success: false, 
                message: "Request has already been processed" 
            });
        }

        // Update edit request
        const updateData = {
            status: action === 'approve' ? 'approved' : 'rejected',
            reviewedBy: req.user?._id || null,
            adminResponse: adminResponse || '',
            reviewedAt: new Date()
        };

        if (action === 'approve' && tempUnlockHours) {
            const tempUnlockUntil = new Date();
            tempUnlockUntil.setHours(tempUnlockUntil.getHours() + parseInt(tempUnlockHours));
            updateData.tempUnlockUntil = tempUnlockUntil;
        }

        const updatedRequest = await EditRequest.findByIdAndUpdate(
            requestId,
            updateData,
            { new: true }
        );

        res.json({ 
            success: true, 
            message: `Edit request ${action}d successfully`,
            editRequest: updatedRequest
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// API để revoke temporary unlock
const revokeTempUnlock = async (req, res) => {
    try {
        const { requestId } = req.body;
        
        if (!requestId) {
            return res.status(400).json({ 
                success: false, 
                message: "Request ID is required" 
            });
        }

        const editRequest = await EditRequest.findById(requestId);
        if (!editRequest) {
            return res.status(404).json({ 
                success: false, 
                message: "Edit request not found" 
            });
        }

        const updatedRequest = await EditRequest.findByIdAndUpdate(
            requestId,
            { 
                tempUnlockUntil: null,
                revokedAt: new Date()
            },
            { new: true }
        );

        res.json({ 
            success: true, 
            message: "Temporary unlock revoked successfully",
            editRequest: updatedRequest
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};
const getPhysicalFitnessBySession = async (req, res) => {
    try {
        const { examSessionId } = req.query;
        const physicalFitness = await physicalFitnessModel.find({ examSessionId });
        res.json({ success: true, data: physicalFitness });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
}

// Get all physical fitness data
const getAllPhysicalFitness = async (req, res) => {
    try {
        const physicalFitness = await physicalFitnessModel.find({});
        res.json({ success: true, data: physicalFitness });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
}

// Get all abnormality data
const getAllAbnormality = async (req, res) => {
    try {
        const abnormalities = await abnormalityModel.find({});
        res.json({ success: true, data: abnormalities });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
}

// Get all exam sessions
const getListExamSession = async (req, res) => {
    try {
        const examSessions = await ExamSession.find({}).sort({ createdAt: -1 });
        res.json({ success: true, data: examSessions });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
}

export { 
    addDoctor, 
    loginAdmin, 
    logoutAdmin, 
    allDoctors, 
    appoinmentsAdmin, 
    appoinmentCancel, 
    adminDashboard, 
    deleteDoctor, 
    addStudent, 
    listStudents, 
    importStudentsExcel, 
    addNews, 
    getNews, 
    updateNews, 
    deleteNews, 
    createExamSession, 
    examtionList,
    deleteStudent,
    // Lock Management APIs
    getExamSessionsWithData,
    toggleExamSessionLock,
    getEditRequests,
    handleEditRequest,
    revokeTempUnlock,
    getPhysicalFitnessBySession,
    getAllPhysicalFitness,
    getAllAbnormality,
    getListExamSession
};