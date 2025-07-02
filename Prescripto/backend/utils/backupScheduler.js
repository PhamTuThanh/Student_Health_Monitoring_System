import cron from 'node-cron';
import backupModel from '../models/backupModel.js';
import backupService from './backupService.js';

class BackupScheduler {
    constructor() {
        this.isRunning = false;
        this.scheduledTasks = new Map();
    }

    // Start all scheduled backup tasks
    startScheduler() {
        if (this.isRunning) {
            console.log('Backup scheduler is already running');
            return;
        }

        console.log('Starting backup scheduler...');

        // Daily backup at 2:00 AM
        this.scheduledTasks.set('daily', cron.schedule('0 2 * * *', async () => {
            console.log('Running scheduled daily backup...');
            await this.createScheduledBackup('daily');
        }, {
            scheduled: false
        }));

        // Weekly backup on Sunday at 3:00 AM
        this.scheduledTasks.set('weekly', cron.schedule('0 3 * * 0', async () => {
            console.log('Running scheduled weekly backup...');
            await this.createScheduledBackup('weekly');
        }, {
            scheduled: false
        }));

        // Monthly backup on 1st day at 4:00 AM
        this.scheduledTasks.set('monthly', cron.schedule('0 4 1 * *', async () => {
            console.log('Running scheduled monthly backup...');
            await this.createScheduledBackup('monthly');
        }, {
            scheduled: false
        }));

        // Cleanup old backups daily at 1:00 AM
        this.scheduledTasks.set('cleanup', cron.schedule('0 1 * * *', async () => {
            console.log('Running backup cleanup...');
            await this.runCleanup();
        }, {
            scheduled: false
        }));

        // Start all tasks
        this.scheduledTasks.forEach((task, name) => {
            task.start();
            console.log(`Started ${name} backup task`);
        });

        this.isRunning = true;
        console.log('Backup scheduler started successfully');
    }

    // Stop all scheduled tasks
    stopScheduler() {
        if (!this.isRunning) {
            console.log('Backup scheduler is not running');
            return;
        }

        console.log('Stopping backup scheduler...');
        
        this.scheduledTasks.forEach((task, name) => {
            task.stop();
            console.log(`Stopped ${name} backup task`);
        });

        this.isRunning = false;
        console.log('Backup scheduler stopped');
    }

    // Create scheduled backup
    async createScheduledBackup(scheduleType) {
        try {
            const backupId = backupService.generateBackupId();
            const startTime = new Date();
            
            // Determine retention based on schedule type
            let retentionDays;
            switch (scheduleType) {
                case 'daily':
                    retentionDays = 7; // Keep daily backups for 7 days
                    break;
                case 'weekly':
                    retentionDays = 30; // Keep weekly backups for 30 days
                    break;
                case 'monthly':
                    retentionDays = 365; // Keep monthly backups for 1 year
                    break;
                default:
                    retentionDays = 30;
            }

            const backupName = `Auto_${scheduleType}_${new Date().toISOString().split('T')[0]}`;

            // Create backup record
            const backupRecord = new backupModel({
                backupId,
                backupName,
                backupType: 'automatic',
                status: 'pending',
                createdBy: 'system',
                startTime,
                retentionDays,
                autoDeleteAt: new Date(Date.now() + (retentionDays * 24 * 60 * 60 * 1000))
            });

            await backupRecord.save();
            console.log(`Created ${scheduleType} backup record: ${backupId}`);

            // Start backup process
            await this.processScheduledBackup(backupRecord);

        } catch (error) {
            console.error(`Failed to create ${scheduleType} backup:`, error);
        }
    }

    // Process scheduled backup
    async processScheduledBackup(backupRecord) {
        try {
            // Update status to in_progress
            await backupModel.findByIdAndUpdate(backupRecord._id, {
                status: 'in_progress'
            });

            console.log(`Processing automatic backup: ${backupRecord.backupId}`);

            // Step 1: Create database backup
            const dumpResult = await backupService.createDatabaseBackup(backupRecord);
            
            // Step 2: Compress the backup
            const compressionResult = await backupService.compressBackup(
                dumpResult.path, 
                backupRecord.backupId
            );

            // Step 3: Calculate checksum
            const checksum = await backupService.calculateChecksum(compressionResult.filePath);

            // Step 4: Upload to cloud storage (for automated backups)
            let cloudPath = null;
            try {
                const cloudResult = await backupService.uploadToCloud(
                    compressionResult.filePath, 
                    backupRecord.backupId
                );
                cloudPath = cloudResult.cloudPath;
                console.log(`Backup uploaded to cloud: ${backupRecord.backupId}`);
            } catch (cloudError) {
                console.warn('Cloud upload failed for automated backup:', cloudError.message);
            }

            // Step 5: Update backup record
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

            console.log(`Automatic backup completed: ${backupRecord.backupId}`);

            // Step 7: Send notification (if email service is available)
            await this.sendBackupNotification(backupRecord, 'success');

        } catch (error) {
            console.error(`Automatic backup failed for ${backupRecord.backupId}:`, error);
            
            // Update status to failed
            await backupModel.findByIdAndUpdate(backupRecord._id, {
                status: 'failed',
                endTime: new Date(),
                errorMessage: error.message
            });

            // Cleanup on failure
            await backupService.cleanupTemp(backupRecord.backupId);

            // Send failure notification
            await this.sendBackupNotification(backupRecord, 'failed', error.message);
        }
    }

    // Run cleanup of old backups
    async runCleanup() {
        try {
            console.log('Starting automatic backup cleanup...');
            await backupService.cleanupOldBackups();
            console.log('Backup cleanup completed');
        } catch (error) {
            console.error('Backup cleanup failed:', error);
        }
    }

    // Send backup notification (placeholder for email service)
    async sendBackupNotification(backupRecord, status, errorMessage = null) {
        try {
            // This would integrate with your email service
            const notification = {
                to: process.env.ADMIN_EMAIL,
                subject: `Backup ${status.toUpperCase()}: ${backupRecord.backupName}`,
                message: status === 'success' 
                    ? `Backup ${backupRecord.backupId} completed successfully.`
                    : `Backup ${backupRecord.backupId} failed: ${errorMessage}`
            };

            console.log('Backup notification:', notification);
            
            // TODO: Implement actual email sending
            // await emailService.sendEmail(notification);
            
        } catch (error) {
            console.error('Failed to send backup notification:', error);
        }
    }

    // Get scheduler status
    getStatus() {
        return {
            isRunning: this.isRunning,
            activeTasks: Array.from(this.scheduledTasks.keys()),
            totalTasks: this.scheduledTasks.size
        };
    }

    // Enable/disable specific backup types
    toggleBackupType(backupType, enabled) {
        const task = this.scheduledTasks.get(backupType);
        if (task) {
            if (enabled) {
                task.start();
                console.log(`Enabled ${backupType} backup`);
            } else {
                task.stop();
                console.log(`Disabled ${backupType} backup`);
            }
            return true;
        }
        return false;
    }

    // Get next scheduled backup times
    getNextBackupTimes() {
        const times = {};
        this.scheduledTasks.forEach((task, name) => {
            if (name !== 'cleanup') {
                // This would require additional logic to calculate next run time
                // For now, just return the schedule pattern
                times[name] = this.getScheduleDescription(name);
            }
        });
        return times;
    }

    getScheduleDescription(scheduleType) {
        switch (scheduleType) {
            case 'daily':
                return 'Every day at 2:00 AM';
            case 'weekly':
                return 'Every Sunday at 3:00 AM';
            case 'monthly':
                return 'First day of month at 4:00 AM';
            default:
                return 'Unknown schedule';
        }
    }
}

export default new BackupScheduler(); 