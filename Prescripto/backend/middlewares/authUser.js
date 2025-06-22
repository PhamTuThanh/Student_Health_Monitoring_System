import jwt from 'jsonwebtoken'

const authUser = async (req, res, next)=>{
    try{
        let token = null;

        if (req.cookies.token) {
            token = req.cookies.token;
        } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if(!token){
            return res.status(401).json({success:false, message:'Authentication failed: No token provided'})
        }
        
        const token_decode = jwt.verify(token, process.env.JWT_SECRET)
        req.user = token_decode;
        console.log('Authorization header:', req.header('Authorization'));
        console.log('Cookie token:', req.cookies.token);
        next()
    }catch(error){
        console.log(error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: 'Authentication failed: Invalid token' });
        }
        res.status(500).json({success:false, message:'Internal server error'})
    }
}
export default authUser