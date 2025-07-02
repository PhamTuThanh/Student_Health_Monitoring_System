import backupModel from '../models/backupModel.js';
import backupService from '../utils/backupService.js';
import fs from 'fs';
import path from 'path';

// Create manual backup
const createManualBackup = async (req, res) => {
    try {
        const { backupName, retentionDays = 30 } = req.body;
        const createdBy = req.admin.email;

        if (!backupName) {
            return res.status(400).json({
                success: false,
                message: 'Backup name is required'
            });
        }

        // Generate unique backup ID
        const backupId = backupService.generateBackupId();
        const startTime = new Date();

        // Create backup record
        const backupRecord = new backupModel({
            backupId,
            backupName,
            backupType: 'manual',
            status: 'pending',
            createdBy,
            startTime,
            retentionDays,
            autoDeleteAt: new Date(Date.now() + (retentionDays * 24 * 60 * 60 * 1000))
        });

        await backupRecord.save();

        // Start backup process in background
        createBackupProcess(backupRecord).catch(error => {
            console.error('Backup process failed:', error);
        });

        res.status(200).json({
            success: true,
            message: 'Backup process started',
            backupId: backupId
        });

    } catch (error) {
        console.error('Create manual backup error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to start backup process',
            error: error.message
        });
    }
};

// Background backup process
const createBackupProcess = async (backupRecord) => {
    try {
        // Update status to in_progress
        await backupModel.findByIdAndUpdate(backupRecord._id, {
            status: 'in_progress'
        });

        console.log(`Starting backup process for: ${backupRecord.backupId}`);

        // Step 1: Create database backup
        const dumpResult = await backupService.createDatabaseBackup(backupRecord);
        
        // Step 2: Compress the backup
        const compressionResult = await backupService.compressBackup(
            dumpResult.path, 
            backupRecord.backupId
        );

        // Step 3: Calculate checksum
        const checksum = await backupService.calculateChecksum(compressionResult.filePath);

        // Step 4: Upload to cloud (optional)
        let cloudPath = null;
        try {
            const cloudResult = await backupService.uploadToCloud(
                compressionResult.filePath, 
                backupRecord.backupId
            );
            cloudPath = cloudResult.cloudPath;
        } catch (cloudError) {
            console.warn('Cloud upload failed, backup stored locally only:', cloudError.message);
        }

        // Step 5: Update backup record with completion details
        const endTime = new Date();
        const duration = endTime.getTime() - backupRecord.startTime.getTime();

        await backupModel.findByIdAndUpdate(backupRecord._id, {
            status: 'completed',
            endTime,
            duration,
            backupSize: compressionResult.compressedSize,
            filePath: compressionResult.filePath,
            cloudPath,
            checksum,
            compressionRatio: compressionResult.compressionRatio,
            collections: dumpResult.stats.collections,
            isVerified: true
        });

        // Step 6: Cleanup temporary files
        await backupService.cleanupTemp(backupRecord.backupId);

        console.log(`Backup completed successfully: ${backupRecord.backupId}`);

    } catch (error) {
        console.error(`Backup failed for ${backupRecord.backupId}:`, error);
        
        // Update status to failed
        await backupModel.findByIdAndUpdate(backupRecord._id, {
            status: 'failed',
            endTime: new Date(),
            errorMessage: error.message
        });

        // Cleanup on failure
        await backupService.cleanupTemp(backupRecord.backupId);
    }
};

// Get all backups with pagination and filtering
const getAllBackups = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            status, 
            backupType, 
            sortBy = 'createdAt', 
            sortOrder = 'desc' 
        } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (backupType) filter.backupType = backupType;

        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const backups = await backupModel
            .find(filter)
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const total = await backupModel.countDocuments(filter);

        // Format file sizes and add download URLs
        const formattedBackups = backups.map(backup => {
            const backupObj = backup.toObject();
            backupObj.formattedSize = backupService.formatFileSize(backup.backupSize);
            backupObj.formattedDuration = backup.duration ? 
                `${Math.round(backup.duration / 1000)}s` : 'N/A';
            
            // Add download URL if file exists
            if (backup.filePath && fs.existsSync(backup.filePath)) {
                backupObj.canDownload = true;
            }
            
            return backupObj;
        });

        res.status(200).json({
            success: true,
            data: {
                backups: formattedBackups,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / limit),
                    totalBackups: total,
                    hasNext: page * limit < total,
                    hasPrev: page > 1
                }
            }
        });

    } catch (error) {
        console.error('Get all backups error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch backups',
            error: error.message
        });
    }
};

// Get backup details
const getBackupDetails = async (req, res) => {
    try {
        const { backupId } = req.params;

        const backup = await backupModel.findOne({ backupId });
        if (!backup) {
            return res.status(404).json({
                success: false,
                message: 'Backup not found'
            });
        }

        const backupDetails = backup.toObject();
        backupDetails.formattedSize = backupService.formatFileSize(backup.backupSize);
        backupDetails.formattedDuration = backup.duration ? 
            `${Math.round(backup.duration / 1000)}s` : 'N/A';

        // Check if file exists
        if (backup.filePath) {
            backupDetails.fileExists = fs.existsSync(backup.filePath);
        }

        res.status(200).json({
            success: true,
            data: backupDetails
        });

    } catch (error) {
        console.error('Get backup details error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get backup details',
            error: error.message
        });
    }
};

// Download backup file
const downloadBackup = async (req, res) => {
    try {
        const { backupId } = req.params;

        const backup = await backupModel.findOne({ backupId });
        if (!backup) {
            return res.status(404).json({
                success: false,
                message: 'Backup not found'
            });
        }

        if (!backup.filePath || !fs.existsSync(backup.filePath)) {
            return res.status(404).json({
                success: false,
                message: 'Backup file not found'
            });
        }

        const fileName = `${backup.backupName}_${backup.backupId}.zip`;
        const filePath = backup.filePath;

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

    } catch (error) {
        console.error('Download backup error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to download backup',
            error: error.message
        });
    }
};

// Verify backup integrity
const verifyBackup = async (req, res) => {
    try {
        const { backupId } = req.params;

        const backup = await backupModel.findOne({ backupId });
        if (!backup) {
            return res.status(404).json({
                success: false,
                message: 'Backup not found'
            });
        }

        const verificationResult = await backupService.verifyBackup(backup);

        // Update verification status
        await backupModel.findByIdAndUpdate(backup._id, {
            isVerified: verificationResult.verified,
            status: verificationResult.verified ? backup.status : 'corrupted'
        });

        res.status(200).json({
            success: true,
            data: {
                backupId: backup.backupId,
                verified: verificationResult.verified,
                message: verificationResult.message
            }
        });

    } catch (error) {
        console.error('Verify backup error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify backup',
            error: error.message
        });
    }
};

// Delete backup
const deleteBackup = async (req, res) => {
    try {
        const { backupId } = req.params;

        const backup = await backupModel.findOne({ backupId });
        if (!backup) {
            return res.status(404).json({
                success: false,
                message: 'Backup not found'
            });
        }

        // Delete local file
        if (backup.filePath && fs.existsSync(backup.filePath)) {
            fs.unlinkSync(backup.filePath);
        }

        // Delete cloud file (if applicable)
        if (backup.cloudPath) {
            try {
                // Implementation depends on cloud provider
                // await cloudinary.uploader.destroy(backup.publicId, { resource_type: 'raw' });
            } catch (cloudError) {
                console.warn('Failed to delete cloud backup:', cloudError.message);
            }
        }

        // Delete database record
        await backupModel.findByIdAndDelete(backup._id);

        res.status(200).json({
            success: true,
            message: 'Backup deleted successfully'
        });

    } catch (error) {
        console.error('Delete backup error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete backup',
            error: error.message
        });
    }
};

// Restore database from backup
const restoreBackup = async (req, res) => {
    try {
        const { backupId } = req.params;
        const { 
            confirmRestore,
            dropExisting = false,
            conflictResolution = 'skip', // 'skip', 'replace', 'merge'
            collections = null // null means restore all, or array of collection names
        } = req.body;

        if (!confirmRestore) {
            return res.status(400).json({
                success: false,
                message: 'Restore confirmation required'
            });
        }

        const backup = await backupModel.findOne({ backupId });
        if (!backup) {
            return res.status(404).json({
                success: false,
                message: 'Backup not found'
            });
        }

        if (!backup.filePath || !fs.existsSync(backup.filePath)) {
            return res.status(404).json({
                success: false,
                message: 'Backup file not found'
            });
        }

        if (backup.status !== 'completed' || !backup.isVerified) {
            return res.status(400).json({
                success: false,
                message: 'Cannot restore from incomplete or corrupted backup'
            });
        }

        // Prepare restore options
        const restoreOptions = {
            dropExisting,
            conflictResolution,
            collections
        };

        console.log(`Starting restore for backup: ${backupId} with options:`, restoreOptions);

        // Start restoration process
        const restoreResult = await backupService.restoreDatabase(backup.filePath, restoreOptions);

        // Create restore record for audit trail
        const restoreRecord = {
            backupId: backup.backupId,
            restoreDate: new Date(),
            restoreOptions,
            stats: restoreResult.stats,
            restoreBy: req.admin.email
        };

        res.status(200).json({
            success: true,
            message: 'Database restored successfully',
            data: {
                ...restoreResult,
                auditInfo: restoreRecord
            }
        });

    } catch (error) {
        console.error('Restore backup error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to restore backup',
            error: error.message
        });
    }
};

// Get backup statistics
const getBackupStats = async (req, res) => {
    try {
        const stats = await backupModel.aggregate([
            {
                $group: {
                    _id: null,
                    totalBackups: { $sum: 1 },
                    totalSize: { $sum: '$backupSize' },
                    completedBackups: {
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                    },
                    failedBackups: {
                        $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
                    },
                    manualBackups: {
                        $sum: { $cond: [{ $eq: ['$backupType', 'manual'] }, 1, 0] }
                    },
                    automaticBackups: {
                        $sum: { $cond: [{ $eq: ['$backupType', 'automatic'] }, 1, 0] }
                    }
                }
            }
        ]);

        const result = stats[0] || {
            totalBackups: 0,
            totalSize: 0,
            completedBackups: 0,
            failedBackups: 0,
            manualBackups: 0,
            automaticBackups: 0
        };

        result.formattedTotalSize = backupService.formatFileSize(result.totalSize);
        result.successRate = result.totalBackups > 0 ? 
            Math.round((result.completedBackups / result.totalBackups) * 100) : 0;

        res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Get backup stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get backup statistics',
            error: error.message
        });
    }
};

// Clean up old backups
const cleanupOldBackups = async (req, res) => {
    try {
        await backupService.cleanupOldBackups();
        
        res.status(200).json({
            success: true,
            message: 'Old backups cleanup completed'
        });

    } catch (error) {
        console.error('Cleanup old backups error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cleanup old backups',
            error: error.message
        });
    }
};

export {
    createManualBackup,
    getAllBackups,
    getBackupDetails,
    downloadBackup,
    verifyBackup,
    deleteBackup,
    restoreBackup,
    getBackupStats,
    cleanupOldBackups
}; 