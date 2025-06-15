import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import Doctor from '../models/doctorModel.js';

export const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Thử tìm user ở User model trước
        let user = await User.findById(decoded.id);
        // Nếu không có, thử tìm ở Doctor model
        if (!user) {
            user = await Doctor.findById(decoded.id);
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
};

export const checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized access'
            });
        }

        next();
    };
}; 