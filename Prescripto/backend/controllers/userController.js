import validator from 'validator'
import bcrypt from 'bcrypt'
import userModel from '../models/userModel.js';
// import studentModel from '../models/studentModel.js'; // No longer needed
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary'
import doctorModel from './../models/doctorModel.js';
import appoinmentModel from '../models/appoinmentModel.js';
import physicalFitnessModel from '../models/physicalFitnessModel.js';
import examSessionModel from '../models/examSessionModel.js';
import paypal from 'paypal-rest-sdk';
import { sendAppointmentNotification, sendForgotPasswordEmail } from '../utils/emailService.js';
import chatBotModel from '../models/chatBotModel.js';
import News from '../models/newsModel.js';
import nodemailer from 'nodemailer';    
import abnormalityModel from '../models/abnormalityModel.js';
import prescriptionModel from '../models/prescriptionModel.js';

const registerUser = async (req, res) => {
    const { name, password, email } = req.body;
    const imageFile = req.file;
    try {
        const exists = await userModel.findOne({ email });
        if (exists) {
            return res.json({ success: false, message: "User already exists" });
        }
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" });
        }
        if (password.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        let imageUrl = 'https://i.imgur.com/1Q9Z1Zm.png'; // Default user image
        if (imageFile) {
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" });
            imageUrl = imageUpload.secure_url;
        }

        const newUser = new userModel({
            name: name,
            email: email,
            password: hashedPassword,
            image: imageUrl,
            role: 'user' // Default role for general registration
        });

        const user = await newUser.save();
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role, image: user.image } });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error registering user" });
    }
};

const loginUser = async (req, res) => {
    const { email, password, role } = req.body;
    try {
        let userData;
        if (role === 'student') {
            userData = await userModel.findOne({ email, role: 'student' });
        } else if (role === 'user') {
            userData = await userModel.findOne({ email, role: 'user' });
        } else {
            userData = await userModel.findOne({ email });
        }

        if (!userData) {
            return res.json({ success: false, message: "User does not exist" });
        }

        const isMatch = await bcrypt.compare(password, userData.password);
        if (!isMatch) {
            return res.json({ success: false, message: "Invalid credentials" });
        }

        const token = jwt.sign({ id: userData._id, role: userData.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

        // Set httpOnly cookie cho web
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000
        });

        // Trả về token cho mobile
        res.json({ 
          success: true, 
          token, 
          user: { 
            id: userData._id, 
            name: userData.name,
            studentName: userData.name,
            email: userData.email, 
            role: userData.role, 
            image: userData.image, 
            address: userData.address, 
            phone: userData.phone, 
            dob: userData.dob, 
            gender: userData.gender, 
            cohort: userData.cohort, 
            studentId: userData.studentId, 
            major: userData.major, 
            about: userData.about 
          } 
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error logging in" });
    }
};
const forgotPassword = async (req, res) => {
    const {email} = req.body;
    try {
        console.log('🔍 Forgot password request for email:', email);
        
        const user = await userModel.findOne({email});
        if (!user) {
            console.log('❌ User not found for email:', email);
            return res.json({success:false, message: 'User not found'})
        }
        
        console.log('✅ User found:', user.name);
        
        // Tạo mật khẩu ngẫu nhiên (8 ký tự, bao gồm chữ hoa, chữ thường, số)
        const generateRandomPassword = () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let password = '';
            for (let i = 0; i < 8; i++) {
                password += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return password;
        };
        
        const newPassword = generateRandomPassword();
        console.log('🔑 Generated new password:', newPassword);
        
        // Hash mật khẩu mới
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        // Cập nhật mật khẩu trong database
        await userModel.findByIdAndUpdate(user._id, { password: hashedPassword });
        console.log('✅ Password updated in database');
        
        // Gửi email với mật khẩu mới
        console.log('📧 Sending new password email to:', user.email);
        const emailResult = await sendForgotPasswordEmail(user.email, newPassword);
        console.log('📧 Email result:', emailResult);
        
        if (!emailResult.success) {
            console.log('❌ Email sending failed:', emailResult.error);
            return res.json({success:false, message: 'Failed to send new password email'})
        }
        
        console.log('✅ Forgot password process completed successfully');
        res.json({success:true, message: 'New password sent to your email'})
    } catch (error) {
        console.log('❌ Error in forgotPassword:', error);
        res.json({success:false, message: error.message})
    }
}

const changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { oldPassword, newPassword, confirmPassword } = req.body;

        if (!oldPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ success: false, message: "Please provide all required fields." });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ success: false, message: "New password and confirm password do not match." });
        }
        
        if (newPassword.length < 8) {
            return res.status(400).json({ success: false, message: "Password must be at least 8 characters long." });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Incorrect old password." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await userModel.findByIdAndUpdate(userId, { password: hashedPassword });

        res.json({ success: true, message: "Password changed successfully." });

    } catch (error) {
        console.error("Error in changePassword:", error);
        res.status(500).json({ success: false, message: "Server error while changing password." });
    }
};

//API to get user profile data
const getProfile = async (req, res) => {
    try {
        // const { userId } = req.body // userId should come from token (req.user.id)
        const userId = req.user.id;
        const userData = await userModel.findById(userId).select('-password')
        if (!userData) {
            return res.json({ success: false, message: "User not found" });
        }
        res.json({ success: true, userData });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
    
};
//API to update user profile 
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, phone, address, dob, gender, cohort, studentId, major, about } = req.body;
        const imageFile = req.file;

        const updateData = {
            name, phone, dob, gender,
            cohort, studentId, major, about
        };

        if (address) {
            try {
                updateData.address = JSON.parse(address);
            } catch (e) {
                // If address is not a valid JSON string, keep it as is or handle error
                updateData.address = address; 
            }
        }

        if (imageFile) {
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: 'image' });
            updateData.image = imageUpload.secure_url;
        }

        const updatedUser = await userModel.findByIdAndUpdate(userId, updateData, { new: true });

        if (!updatedUser) {
            return res.json({ success: false, message: "User not found or update failed" });
        }

        res.json({ success: true, message: "Profile Updated", userData: updatedUser });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};
//API to book appoinment
const bookAppoinment = async (req, res) => {
    try {
        const userId = req.user.id; // Assuming userId comes from token
        const { docId, slotDate, slotTime } = req.body;
        const docData = await doctorModel.findById(docId).select('-password');

        if (!docData) {
            return res.json({ success: false, message: 'Doctor not found' });
        }
        if (!docData.available) {
            return res.json({ success: false, message: 'Doctor not available' });
        }

        let slot_booked = docData.slot_booked || {};

        if (slot_booked[slotDate]) {
            if (slot_booked[slotDate].includes(slotTime)) {
                return res.json({ success: false, message: 'Slot not available' });
            } else {
                slot_booked[slotDate].push(slotTime);
            }
        } else {
            slot_booked[slotDate] = [slotTime];
        }

        const userData = await userModel.findById(userId).select('-password');
        if (!userData) {
            return res.json({ success: false, message: 'User not found' });
        }
        // delete docData.slot_booked; // This might not be needed / could be an error if docData is just a selection

        const appoinmentData = {
            userId,
            docId,
            userData: {
                name: userData.name,
                email: userData.email,
                // include other necessary userData fields
            },
            docData: {
                name: docData.name,
                speciality: docData.speciality,
                // include other necessary docData fields
            },
            amount: docData.fees,
            slotTime,
            slotDate,
            date: Date.now(),
        };

        const newAppoinment = new appoinmentModel(appoinmentData);
        await newAppoinment.save();

        await doctorModel.findByIdAndUpdate(docId, { slot_booked });

        try {
            const emailResult = await sendAppointmentNotification(appoinmentData);
            if (!emailResult.success) {
                console.error('Failed to send email notifications:', emailResult.error);
            }
        } catch (emailError) {
            console.error('Email notification error:', emailError);
        }

        res.json({ success: true, message: 'Appointment Booked' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};
//API to get user appoinments for frontend my-appoinment page
const listAppoinment = async (req, res) => {
    try {
        const userId = req.user.id; // Assuming userId comes from token
        const appoinments = await appoinmentModel.find({userId})
        res.json({success:true, appoinments})
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}
//API to cancel appoinment
const cancelAppoinment = async (req, res)=>{
    try {
        const userId = req.user.id; // Assuming userId comes from token
        const {appoinmentId} = req.body

        const appoinmentData = await appoinmentModel.findById(appoinmentId)

        if (!appoinmentData) {
            return res.json({success:false, message: 'Appointment not found'})
        }
        if (appoinmentData.userId.toString() !== userId.toString()){
            return res.json({success:false, message: 'Unauthorized action'})
        }
        await appoinmentModel.findByIdAndUpdate(appoinmentId, {cancelled:true})
        
        const {docId, slotDate, slotTime} = appoinmentData
        const doctorData = await doctorModel.findById(docId)
        if (doctorData && doctorData.slot_booked && doctorData.slot_booked[slotDate]) {
            let slot_booked = doctorData.slot_booked
            slot_booked[slotDate] = slot_booked[slotDate].filter(e=> e!== slotTime)
            await doctorModel.findByIdAndUpdate(docId,{slot_booked})
        }
        res.json({success:true, message:'Appoinment Cancelled'})

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

paypal.configure({
    mode: 'sandbox',
    client_id: process.env.PAYPAL_CLIENT_ID,
    client_secret: process.env.PAYPAL_CLIENT_SECRET,
  });

  const createPayPalPayment = async (req, res) => {
    try {
      const { amount, description, appointmentId } = req.body;
  
      const paymentData = {
        intent: 'sale',
        payer: {
          payment_method: 'paypal',
        },
        redirect_urls: {
          return_url: `${process.env.BACKEND_URL}/api/user/paypal-success?appointmentId=${appointmentId}&redirect_to=${process.env.FRONTEND_URL}/my-appoinments`,
          cancel_url: `${process.env.BACKEND_URL}/api/user/paypal-cancel?redirect_to=${process.env.FRONTEND_URL}/my-appoinments`,
        },
        transactions: [
          {
            amount: {
              total: parseFloat(amount).toFixed(2),
              currency: 'USD',
            },
            description,
          },
        ],
      };
  
      paypal.payment.create(paymentData, (error, payment) => {
        if (error) {
          console.error("PayPal creation error:", error.response ? error.response.details : error);
          return res.json({ success: false, message: 'Payment creation failed' });
        }
        const approvalUrl = payment.links.find((link) => link.rel === 'approval_url').href;
        res.json({ success: true, approvalUrl });
      });
    } catch (error) {
      console.error("Create PayPal Payment Error:", error);
      res.json({ success: false, message: error.message });
    }
  };

  const handlePayPalSuccess = async (req, res) => {
    try {
      const { paymentId, PayerID, appointmentId, redirect_to } = req.query;
      const execute_payment_json = {
        "payer_id": PayerID,
        "transactions": [{
            "amount": {
                "currency": "USD",
                 // You might need to fetch the appointment amount again for safety
                 // For now, assuming it's passed or known
            }
        }]
    };

    // Fetch appointment to get amount
    const appointment = await appoinmentModel.findById(appointmentId);
    if (!appointment) {
        return res.status(404).send('Appointment not found');
    }
    execute_payment_json.transactions[0].amount.total = parseFloat(appointment.amount).toFixed(2);


      paypal.payment.execute(paymentId, execute_payment_json, async function (error, payment) {
        if (error) {
            console.error(error.response);
            // Redirect to a payment failed page with error message
            return res.redirect(`${redirect_to}?payment_status=failed&message=${encodeURIComponent(error.response.message || 'Payment execution failed')}`);
        }
        await appoinmentModel.findByIdAndUpdate(appointmentId, { payment: true });
        res.redirect(`${redirect_to}?payment_status=success`);
    });
    } catch (error) {
      console.error(error);
      const { redirect_to } = req.query;
      res.redirect(`${redirect_to}?payment_status=failed&message=${encodeURIComponent(error.message)}`);
    }
  };

  const handlePayPalCancel = (req, res) => {
    const { redirect_to } = req.query;
    res.redirect(`${redirect_to}?payment_status=cancelled`);
  };
  
  const sendEmail = async (req, res) =>{
    try {
      const {to, subject, text} = req.body
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USERNAME,
          pass: process.env.SMTP_PASSWORD
        }
      })
      const mailOptions = {
        from: process.env.SMTP_USERNAME,
        to,
        subject,
        text
      }
      await transporter.sendMail(mailOptions)
      res.json({success:true, message:'Email sent'})
    } catch (error) {
      console.log(error);
      res.json({success:false, message:error.message})
    }
  }
const getUsersForChat = async (req, res) => {
    try {
		const loggedInUserId = req.user._id;

		const filteredUsers = await userModel.find({ _id: { $ne: loggedInUserId } }).select("-password");

		res.status(200).json(filteredUsers);
	} catch (error) {
		console.error("Error in getUsersForChat: ", error.message);
		res.status(500).json({ error: "Internal server error" });
	}
}
const getDoctorsForChat = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;

        const filteredDoctors = await doctorModel.find({ _id: { $ne: loggedInUserId } }).select("-password");
        res.status(200).json(filteredDoctors);
    } catch (error) {
        console.error("Error in getDoctorsForChat: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}
//lấy dữ liệu từ bảng physical của mỗi user
const getPhysicalData = async (req, res) => {
    try {
      const { studentId } = req.params;
      const { examSessionId } = req.query; // Add examSessionId as query parameter
  
      let query = {};
      if (studentId) {
        query.studentId = studentId;
      } else {
        return res.status(400).json({ success: false, message: "Missing studentId" });
      }

      // Add examSessionId filter if provided
      if (examSessionId) {
        query.examSessionId = examSessionId;
      }
  
      const physicalData = await physicalFitnessModel.find(query).populate('examSessionId', 'examSessionName examSessionAcademicYear examSessionDate');
      if (!physicalData || physicalData.length === 0) {
        return res.status(404).json({ success: false, message: "No physical data found" });
      }
  
      res.json({ success: true, data: physicalData });
    } catch (error) {
      console.error("Error in getPhysicalData:", error.message);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// New API to get exam sessions for a student
const getExamSessions = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Find all exam sessions where this student has data
    const physicalData = await physicalFitnessModel.find({ studentId }).populate('examSessionId', 'examSessionName examSessionAcademicYear examSessionDate').sort({ 'examSessionId.examSessionDate': -1 });
    
    if (!physicalData || physicalData.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Extract unique exam sessions
    const examSessions = physicalData.reduce((unique, item) => {
      if (item.examSessionId && !unique.find(session => session._id.toString() === item.examSessionId._id.toString())) {
        unique.push({
          _id: item.examSessionId._id,
          examSessionName: item.examSessionId.examSessionName,
          examSessionAcademicYear: item.examSessionId.examSessionAcademicYear,
          examSessionDate: item.examSessionId.examSessionDate
        });
      }
      return unique;
    }, []);

    res.json({ success: true, data: examSessions });
  } catch (error) {
    console.error("Error in getExamSessions:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// New API to compare health data between exam sessions
const compareHealthData = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { examSessionId1, examSessionId2 } = req.query;
    
    if (!examSessionId1 || !examSessionId2) {
      return res.status(400).json({ success: false, message: "Missing examSessionIds for comparison" });
    }

    const [data1, data2] = await Promise.all([
      physicalFitnessModel.findOne({ studentId, examSessionId: examSessionId1 }).populate('examSessionId'),
      physicalFitnessModel.findOne({ studentId, examSessionId: examSessionId2 }).populate('examSessionId')
    ]);

    if (!data1 || !data2) {
      return res.status(404).json({ success: false, message: "Data not found for one or both exam sessions" });
    }

    // Calculate differences
    const comparison = {
      session1: {
        _id: data1.examSessionId._id,
        name: data1.examSessionId.examSessionName,
        academicYear: data1.examSessionId.examSessionAcademicYear,
        date: data1.examSessionId.examSessionDate,
        height: data1.height,
        weight: data1.weight,
        bmi: data1.bmi,
        systolic: data1.systolic,
        diastolic: data1.diastolic,
        heartRate: data1.heartRate,
        danhGiaBMI: data1.danhGiaBMI,
        danhGiaTTH: data1.danhGiaTTH
      },
      session2: {
        _id: data2.examSessionId._id,
        name: data2.examSessionId.examSessionName,
        academicYear: data2.examSessionId.examSessionAcademicYear,
        date: data2.examSessionId.examSessionDate,
        height: data2.height,
        weight: data2.weight,
        bmi: data2.bmi,
        systolic: data2.systolic,
        diastolic: data2.diastolic,
        heartRate: data2.heartRate,
        danhGiaBMI: data2.danhGiaBMI,
        danhGiaTTH: data2.danhGiaTTH
      },
      differences: {
        height: data2.height - data1.height,
        weight: data2.weight - data1.weight,
        bmi: (parseFloat(data2.bmi) - parseFloat(data1.bmi)).toFixed(2),
        systolic: data2.systolic - data1.systolic,
        diastolic: data2.diastolic - data1.diastolic,
        heartRate: data2.heartRate - data1.heartRate
      }
    };

    res.json({ success: true, data: comparison });
  } catch (error) {
    console.error("Error in compareHealthData:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const saveChatHistory = async (req, res) => {
    try {
        console.log("Headers:", req.headers); // Debug log
        console.log("User from token:", req.user); // Debug log
        console.log("Request body:", req.body); // Debug log
        
        const { studentId, studentName, messages } = req.body;
        
        if (!studentId || !studentName) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: studentId or studentName"
            });
        }
        
        // Tìm hoặc tạo mới chat history
        let chatHistory = await chatBotModel.findOne({ studentId });
        
        if (!chatHistory) {
            chatHistory = new chatBotModel({
                studentId,
                studentName,
                messages: [],
                lastMessageTime: new Date(),
                lastMessageSender: 'bot',
                lastMessageContent: ''
            });
        }

        // Cập nhật messages
        chatHistory.messages = messages;
        
        // Cập nhật thông tin tin nhắn cuối
        if (Array.isArray(messages) && messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            chatHistory.lastMessageTime = lastMessage.timestamp;
            chatHistory.lastMessageSender = lastMessage.sender;
            chatHistory.lastMessageContent = lastMessage.content;
        }

        await chatHistory.save();
        
        res.status(200).json({ 
            success: true, 
            message: "Chat history saved successfully" 
        });
    } catch (error) {
        console.error("Error saving chat history:", error);
        res.status(500).json({ 
            success: false, 
            message: "Error saving chat history",
            error: error.message,
        });
    }
};
const getChatHistory = async (req, res) => {
    try {
        const {studentId} = req.params;
        const chatHistory = await chatBotModel.findOne({studentId})
        if (!chatHistory) 
        return res.status(404).json({ success: false, message: "No chat history found" });
        res.status(200).json(chatHistory);
    } catch (error) {
        console.error("Error in getChatHistory:", error.message);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}
const getAnnouncements = async (req, res) => {
    try {
        const news = await News.find({}).sort({ date: -1 });
        res.json({ success: true, news });
    } catch (error) {
        console.log(error); 
        res.json({ success: false, message: error.message });
    }
}

const getHealthScores = async (req, res) => {
    try {
        const { studentId } = req.params;
        
        
        const physicalData = await physicalFitnessModel.findOne({ studentId }).sort({ createdAt: -1 });
        
        if (!physicalData) {
            return res.json({
                success: true,
                data: {
                    physicalFitness: 0,
                    cardiovascular: 0,
                    respiratory: 0,
                    mental: 0,
                    overall: 0
                }
            });
        }

       
        let physicalFitness = 70; 
        let cardiovascular = 70;
        let respiratory = 70;
        let mental = 75;

        if (physicalData.danhGiaBMI === 'BT') physicalFitness += 15;
        else if (physicalData.danhGiaBMI === 'TC') physicalFitness += 10;
        else if (physicalData.danhGiaBMI === 'G') physicalFitness += 5;

        if (physicalData.danhGiaTTH === 'HABT') cardiovascular += 20;
        else if (physicalData.danhGiaTTH === 'HAT') cardiovascular += 15;
        else if (physicalData.danhGiaTTH === 'HAC') cardiovascular -= 10
        if (physicalData.danhGiaHeartRate === 'NTBT') {
            cardiovascular += 10;
            respiratory += 20;
        } else if (physicalData.danhGiaHeartRate === 'NTT') {
            cardiovascular += 5;
            respiratory += 10;
        } else if (physicalData.danhGiaHeartRate === 'NTC') {
            cardiovascular -= 5;
            respiratory -= 10;
        }

        
        if (physicalData.danhGiaCC === 'BT') physicalFitness += 10;
        if (physicalData.danhGiaCN === 'BT') physicalFitness += 10;

        
        const avgPhysical = (physicalFitness + cardiovascular + respiratory) / 3;
        mental = Math.min(95, Math.max(60, avgPhysical - 5 + Math.random() * 10));

                
        physicalFitness = Math.min(100, Math.max(0, physicalFitness));
        cardiovascular = Math.min(100, Math.max(0, cardiovascular));
        respiratory = Math.min(100, Math.max(0, respiratory));
        mental = Math.min(100, Math.max(0, mental));

        const overall = Math.round((physicalFitness + cardiovascular + respiratory + mental) / 4);

        res.json({
            success: true,
            data: {
                physicalFitness: Math.round(physicalFitness),
                cardiovascular: Math.round(cardiovascular),
                respiratory: Math.round(respiratory),
                mental: Math.round(mental),
                overall
            }
        });

    } catch (error) {
        console.error('Error getting health scores:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting health scores',
            error: error.message
        });
    }
};
const getAbnormalityByStudentId = async (req, res) => {
    try {
        const { studentId } = req.params;
        const abnormalities = await abnormalityModel.find({ studentId }).sort({ date: -1 });
        res.json({ success: true, data: abnormalities });
    } catch (error) {
        console.error('Error getting abnormality:', error); 
        res.status(500).json({
            success: false,
            message: 'Error getting abnormality',
            error: error.message
        });
    }
};
const getPrescriptionByStudentId = async (req, res) => {
    try {
        const { studentId } = req.params;
        const prescriptions = await prescriptionModel
            .find({ studentId })
            .populate('medicines.drugId', 'drugName drugCode drugUnit')
            .sort({ prescriptionDate: -1 });
        res.json({ success: true, data: prescriptions });
    } catch (error) {
        console.error('Error getting prescription:', error); 
        res.status(500).json({
            success: false,
            message: 'Error getting prescription',
            error: error.message
        });
    }
};

export { registerUser, loginUser, getProfile, updateProfile, bookAppoinment, listAppoinment, cancelAppoinment, createPayPalPayment,handlePayPalSuccess,handlePayPalCancel, sendEmail, getUsersForChat, getDoctorsForChat, getPhysicalData, saveChatHistory, getChatHistory, getAnnouncements, forgotPassword, changePassword, getHealthScores, getAbnormalityByStudentId, getPrescriptionByStudentId, getExamSessions, compareHealthData };