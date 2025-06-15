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
            role: 'doctor' // Explicitly set role for doctor
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
        const { name, email, password, cohort, studentId, major, about, dob, gender, address } = req.body;
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

        const studentData = {
            name,
            email,
            image: imageUrl,
            password: hashedPassword,
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
                res.json({success:true, token});
            } else {
                res.json({success:false, message: "Please try login again"});
            }

        }catch (error){
            console.log(error);
            res.json({success:false, message:error.message});
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
        const { cohort, major } = req.body;
        let query = { role: 'student' }; // Filter by role student
        if (cohort) query.cohort = cohort;
        if (major) query.major = major;
        // If no cohort or major, find all students 
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
      studentsToInsert.push({
        name: row.name,
        email: row.email,
        password: hashedPassword,
        cohort: row.cohort,
        studentId: row.studentId ? row.studentId.toString() : undefined,
        major: row.major,
        about: row.about,
        dob: row.dob, // Consider date validation/formatting
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
export { addDoctor, loginAdmin, allDoctors, appoinmentsAdmin, appoinmentCancel, adminDashboard, deleteDoctor, addStudent, listStudents, importStudentsExcel, addNews, getNews, updateNews, deleteNews };