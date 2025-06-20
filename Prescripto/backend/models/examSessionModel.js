import mongoose from "mongoose";

const examSessionSchema = new mongoose.Schema({
    examSessionName: {
        type: String,
        required: true,
    },
    examSessionDate: {
        type: Date,
        required: true,
    },
    examSessionAcademicYear: {
        type: String,
    },
    examSessionDescription: {
        type: String,
    },
    examSessionCreatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    examSessionCreatedAt: {
        type: Date,
        default: Date.now
    }
});

const ExamSession = mongoose.model("ExamSession", examSessionSchema);
export default ExamSession;