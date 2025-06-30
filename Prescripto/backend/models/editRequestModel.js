import mongoose from "mongoose";

const editRequestSchema = new mongoose.Schema({
    examSessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ExamSession",
        required: true
    },
    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctor",
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    specificStudents: [{
        type: String // Student IDs that need editing
    }],
    expectedCompletionTime: {
        type: Date
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'completed'],
        default: 'pending'
    },
    // Admin response
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin"
    },
    adminResponse: {
        type: String
    },
    reviewedAt: {
        type: Date
    },
    // Temporary unlock details
    tempUnlockUntil: {
        type: Date
    },
    isAutoLocked: {
        type: Boolean,
        default: false
    },
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
editRequestSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const EditRequest = mongoose.model("EditRequest", editRequestSchema);
export default EditRequest;