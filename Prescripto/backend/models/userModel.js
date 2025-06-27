import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    image: { type: String, default: "https://i.imgur.com/1Q9Z1Zm.png" }, // Default image
    address: { type: Object, default:{line1:'', line2:''} },
    gender: {type:String, default:"Not Selected"},
    dob: {type:String, default:"Not Selected"},
    phone: {type:String, default:"0000000000"},
    role: { type: String, enum: ['student', 'doctor', 'admin', 'user'], default: 'user' },
    cohort: { type: String },
    studentId: { type: String }, 
    major: { type: String },
    about: { type: String },

},{minimize: false, timestamps: true });

const userModel = mongoose.models.User || mongoose.model('User', userSchema);

export default userModel; 