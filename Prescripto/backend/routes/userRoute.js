import express from 'express';
import { registerUser, loginUser, getProfile, updateProfile, bookAppoinment, listAppoinment, 
cancelAppoinment,  createPayPalPayment,handlePayPalSuccess,handlePayPalCancel, sendEmail, getUsersForChat, getDoctorsForChat, getPhysicalData, getExamSessions, compareHealthData, saveChatHistory, getChatHistory,
getAnnouncements, forgotPassword, changePassword, getHealthScores, getAbnormalityByStudentId, getPrescriptionByStudentId} from '../controllers/userController.js';
import { verifyToken } from '../middlewares/auth.js';
import upload from '../middlewares/multer.js';

const userRouter = express.Router();
userRouter.post('/register', registerUser); 
userRouter.post('/login', loginUser);
userRouter.get('/get-profile', verifyToken, getProfile);
userRouter.post('/update-profile', upload.single('image'), verifyToken, updateProfile);
userRouter.post('/book-appoinment', verifyToken, bookAppoinment);
userRouter.post('/list-appoinment', verifyToken, listAppoinment);
userRouter.post('/cancel-appoinment', verifyToken, cancelAppoinment);
//userRouter.post('/refund-status', verifyToken, refundStatus)
userRouter.post('/paypal-payment', verifyToken, createPayPalPayment);
userRouter.get('/paypal-success', handlePayPalSuccess);
userRouter.get('/paypal-cancel', handlePayPalCancel);
userRouter.post('/send-Email', sendEmail)
userRouter.get('/users-for-chat/', verifyToken, getUsersForChat)
userRouter.get('/doctors-for-chat/', verifyToken, getDoctorsForChat)
userRouter.get('/data-physical/:studentId?', getPhysicalData)
userRouter.post('/save-chat-history', verifyToken, saveChatHistory)
userRouter.get('/get-chat-history/:studentId', verifyToken, getChatHistory)
userRouter.get('/get-announcements', verifyToken, getAnnouncements) 
userRouter.post('/forgot-password', forgotPassword)
userRouter.post('/change-password', verifyToken, changePassword)
userRouter.get('/get-health-scores/:studentId', verifyToken, getHealthScores)
userRouter.get('/get-abnormality/:studentId', verifyToken, getAbnormalityByStudentId)
userRouter.get('/get-prescription/:studentId', verifyToken, getPrescriptionByStudentId)
userRouter.get('/get-exam-sessions/:studentId', verifyToken, getExamSessions)
userRouter.get('/compare-health-data/:studentId', verifyToken, compareHealthData)
export default userRouter;  