import mongoose from "mongoose";

const backupSchema = new mongoose.Schema({
    backupId: {
        type: String,
        required: true,
        unique: true
    },
    backupName: {
        type: String,
        required: true
    },
    backupType: {
        type: String,
        enum: ['manual', 'automatic', 'scheduled'],
        default: 'manual'
    },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'failed', 'corrupted'],
        default: 'pending'
    },
    backupSize: {
        type: Number, // Size in bytes
        default: 0
    },
    collections: [{
        name: String,
        documentCount: Number,
        size: Number
    }],
    createdBy: {
        type: String,
        required: true
    },
    filePath: {
        type: String // Local file path
    },
    cloudPath: {
        type: String // Cloud storage path
    },
    downloadUrl: {
        type: String // Temporary download URL
    },
    checksum: {
        type: String // SHA-256 checksum for integrity
    },
    compressionRatio: {
        type: Number, // Percentage of compression
        default: 0
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    duration: {
        type: Number // Duration in milliseconds
    },
    errorMessage: {
        type: String
    },
    autoDeleteAt: {
        type: Date // Auto deletion date
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    retentionDays: {
        type: Number,
        default: 30 // Keep for 30 days by default
    }
}, {
    timestamps: true
});

// Index for better query performance
backupSchema.index({ createdAt: -1 });
backupSchema.index({ status: 1 });
backupSchema.index({ backupType: 1 });
backupSchema.index({ autoDeleteAt: 1 });

const backupModel = mongoose.models.Backup || mongoose.model('Backup', backupSchema);

export default backupModel; 