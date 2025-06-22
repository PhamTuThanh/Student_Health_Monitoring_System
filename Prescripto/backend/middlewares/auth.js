import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import Doctor from '../models/doctorModel.js';

export const verifyToken = async (req, res, next) => {
    try {
        let token = null;

        if (req.cookies.aToken) {
            token = req.cookies.aToken;
        } else if (req.cookies.dToken) {
            token = req.cookies.dToken;
        } else if (req.cookies.uToken) {
            token = req.cookies.uToken;
        } else if (req.cookies.token) {
            token = req.cookies.token;
        } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

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