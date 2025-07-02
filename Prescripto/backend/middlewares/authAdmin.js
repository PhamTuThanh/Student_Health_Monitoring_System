import jwt from 'jsonwebtoken'

const authAdmin = (req, res, next) => {
    try {
        let token = null;

        if (req.cookies.aToken) {
            token = req.cookies.aToken;
        } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ success: false, message: 'Authentication failed: No token provided' });
        }

        // Check if token is not empty string and has proper JWT format
        if (typeof token !== 'string' || token.trim() === '') {
            return res.status(401).json({ success: false, message: 'Authentication failed: Empty token' });
        }

        // Basic JWT format validation (should have 3 parts separated by dots)
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
            console.log('Invalid JWT format:', token.substring(0, 20) + '...');
            return res.status(401).json({ success: false, message: 'Authentication failed: Invalid token format' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role !== 'admin' || decoded.email !== process.env.ADMIN_EMAIL) {
            return res.status(403).json({ success: false, message: 'Authorization failed: Not an admin' });
        }

        req.admin = decoded;
        next();
    } catch (error) {
        console.log('Auth error:', error.message);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: 'Authentication failed: Invalid token' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Authentication failed: Token expired' });
        }
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
}
export default authAdmin