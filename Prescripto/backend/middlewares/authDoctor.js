import jwt from 'jsonwebtoken'

const authDoctor = async (req, res, next)=>{
    try{
        let token = null;

        if (req.cookies.dToken) {
            token = req.cookies.dToken;
        } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.headers.dtoken) {
            token = req.headers.dtoken;
        }

        if(!token){
            return res.status(401).json({success:false, message:'Authentication failed: No token provided'})
        }

        const token_decode = jwt.verify(token, process.env.JWT_SECRET)
        req.user = token_decode
        req.body.docId = token_decode.id
        next()
    }catch(error){
        console.log(error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: 'Authentication failed: Invalid token' });
        }
        res.status(500).json({success:false, message:'Internal server error'})
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

export { authDoctor, checkRole }