import jwt from 'jsonwebtoken'
import doctorModel from '../models/doctorModel.js'
import examSessionModel from '../models/examSessionModel.js'
import EditRequest from '../models/editRequestModel.js'

const authDoctor = async (req, res, next)=>{
    try{
        let token = null;

        // Check cookies first (for browser requests), then headers (for API requests)
        if (req.cookies.dToken) {
            token = req.cookies.dToken;
        } else if (req.headers.dtoken) {
            token = req.headers.dtoken;
        } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }
        
        if (!token) {
            return res.status(401).json({ success: false, message: "Not Authorized Login Again" });
        }

        const token_decode = jwt.verify(token, process.env.JWT_SECRET)
        const doctor = await doctorModel.findById(token_decode.id).select('-password')
        
        if (!doctor) {
            return res.status(404).json({ success: false, message: "Doctor not found" });
        }

        req.body.docId = token_decode.id
        req.user = doctor
        next()
    }catch(error){
        console.log(error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: 'Authentication failed: Invalid token' });
        }
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}

const checkRole = (roles) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({success:false, message:'Access denied. Insufficient permissions.'})
        }
        
        next()
    }
}

// Check edit permission middleware for exam sessions
const checkEditPermissionMiddleware = async (req, res, next) => {
    try {
        const { examSessionId } = req.body || req.query || req.params;
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
            return next();
        }

        // Check xem có temporary unlock không
        const activeRequest = await EditRequest.findOne({
            examSessionId: examSessionId,
            requestedBy: doctorId,
            status: 'approved',
            tempUnlockUntil: { $gt: new Date() }
        });

        if (activeRequest) {
            return next();
        }

        // Exam session bị lock và không có permission
        return res.status(403).json({ 
            success: false, 
            message: "This exam session is locked. Please request edit access from admin.",
            lockReason: examSession.lockReason,
            lockedAt: examSession.lockedAt,
            isLocked: true
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export { authDoctor, checkRole, checkEditPermissionMiddleware }