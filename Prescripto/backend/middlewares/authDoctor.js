import jwt from 'jsonwebtoken'

const authDoctor = async (req, res, next)=>{
    try{
        const {dtoken} = req.headers
        if(!dtoken){
            return res.json({success:false, message:'Not authorized login again'})
        }
        const token_decode = jwt.verify(dtoken, process.env.JWT_SECRET)
        req.user = token_decode
        req.body.docId = token_decode.id
        next()
    }catch(error){
        console.log(error)
        res.json({success:false, message:error.message})
    }
}

const checkRole = (roles) => {
    return async (req, res, next) => {
        try {
            const {dtoken} = req.headers
            if(!dtoken){
                return res.json({success:false, message:'Not authorized login again'})
            }
            const token_decode = jwt.verify(dtoken, process.env.JWT_SECRET)
            if (!roles.includes(token_decode.role)) {
                return res.json({success:false, message:'Access denied. Insufficient permissions.'})
            }
            next()
        } catch(error) {
            console.log(error)
            res.json({success:false, message:error.message})
        }
    }
}

export { authDoctor, checkRole }