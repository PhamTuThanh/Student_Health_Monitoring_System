import express from "express"
import path from 'path';
import cors from "cors"
import 'dotenv/config'
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js"
import adminRouter from './routes/adminRoute.js';
import doctorRouter from "./routes/doctorRoute.js";
import userRouter from "./routes/userRoute.js";
import reminderRouter from "./routes/reminderRoute.js";
import cron from 'node-cron';
import { checkAndSendReminders } from './controllers/reminderController.js';
import messageRouter from './routes/messageRoute.js';
import studentRouter from './routes/studentRoute.js';
import {app, server} from './socket/socket.js'
const port = process.env.PORT || 9000

app.use(cors())
app.use(express.json())

app.use('/api/admin', adminRouter);
app.use('/api/doctor', doctorRouter);
app.use('/api/user', userRouter); 
app.use('/api/reminder', reminderRouter);
app.use('/api/messages', messageRouter);
app.use('/api', studentRouter);
app.use((err, req, res, next) => {
    console.error(err.stack);
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Something went wrong!';
    res.status(statusCode).json({ 
        success: false, 
        message,
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

cron.schedule('*/5 * * * *', async () => {
    try {
        await checkAndSendReminders();
    } catch (error) {
        console.error('Error in scheduled reminder check:', error);
    }
});

const startServer = async () => {
    try {
        await connectDB();
        console.log('MongoDB connected successfully');
        await connectCloudinary();
        console.log('Cloudinary connected successfully');
        server.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        })
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
