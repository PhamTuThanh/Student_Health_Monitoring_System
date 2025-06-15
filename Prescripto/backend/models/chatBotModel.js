 import mongoose from "mongoose";
 
 const chatBotSchema = new mongoose.Schema({
    // student: { 
    //     type: mongoose.Schema.Types.ObjectId, 
    //     ref: 'Student'|| 'user', 
    //     required: true 
    // },
    studentId: { 
        type: String, 
        required: true 
    },
    studentName: { 
        type: String, 
        required: true 
    },
    messages: [{
        sender: {
            type: String,
            enum: ['user', 'bot'],
            required: true
        },
        content: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    lastMessageTime: { 
        type: Date, 
        default: Date.now 
    },
    lastMessageSender: { 
        type: String, 
        enum: ['user', 'bot'],
        default: 'bot'
    },
    lastMessageContent: { 
        type: String 
    }
});

 const chatBotModel = mongoose.models.chatBot || mongoose.model('chatBot', chatBotSchema);

 export default chatBotModel;
 