import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import archiver from 'archiver';
import extract from 'extract-zip';
import backupModel from '../models/backupModel.js';

class BackupService {
    constructor() {
        this.backupDir = path.join(process.cwd(), 'backups');
        this.tempDir = path.join(this.backupDir, 'temp');
        this.ensureDirectories();
    }

    ensureDirectories() {
        if (!fs.existsSync(this.backupDir)) {                                                                                                                                                                                                  
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    generateBackupId() {
        return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
                                                                                                                                                                                                             
        // JavaScript-based backup using mongoose
    async createDatabaseBackup(backupRecord) {
        try {
            const backupPath = path.join(this.tempDir, backupRecord.backupId);
            
            if (!fs.existsSync(backupPath)) {
                fs.mkdirSync(backupPath, { recursive: true });
            }

            console.log(`🚀 Starting backup: ${backupRecord.backupId}`);

            // Get all collections
            const collections = await mongoose.connection.db.listCollections().toArray();
            const backupStats = {
                collections: [],
                totalSize: 0,
                totalDocuments: 0
            };

            for (const collectionInfo of collections) {
                const collectionName = collectionInfo.name;
                
                try {
                    console.log(`📦 Backing up: ${collectionName}`);
                    
                    const collection = mongoose.connection.db.collection(collectionName);
                    const documents = await collection.find({}).toArray();
                    
                    const backupData = {
                        collection: collectionName,
                        count: documents.length,
                        documents: documents,
                        metadata: {
                            exportDate: new Date().toISOString(),
                            backupId: backupRecord.backupId
                        }
                    };

                    const filePath = path.join(backupPath, `${collectionName}.json`);
                    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));
                    
                    const fileStats = fs.statSync(filePath);
                    
                    backupStats.collections.push({
                        name: collectionName,
                        size: fileStats.size,
                        documentCount: documents.length
                    });
                    
                    backupStats.totalSize += fileStats.size;
                    backupStats.totalDocuments += documents.length;
                    
                    console.log(`✅ ${collectionName}: ${documents.length} docs`);
                    
                } catch (collectionError) {
                    console.warn(`⚠️ Failed: ${collectionName}`, collectionError.message);
                }
            }

            // Create summary
            const summary = {
                backupId: backupRecord.backupId,
                backupDate: new Date().toISOString(),
                databaseName: mongoose.connection.db.databaseName,
                totalCollections: backupStats.collections.length,
                totalDocuments: backupStats.totalDocuments,
                totalSize: backupStats.totalSize,
                collections: backupStats.collections,
                version: '1.0.0',
                method: 'mongoose-json'
            };

            const summaryPath = path.join(backupPath, 'backup-summary.json');
            fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

            console.log(`🎉 Backup completed: ${backupStats.collections.length} collections`);

            return {
                success: true,
                path: backupPath,
                stats: backupStats
            };

        } catch (error) {
            console.error('Backup error:', error);
            throw new Error(`Backup failed: ${error.message}`);
        }
    }

    // Compress backup folder
    async compressBackup(backupPath, backupId) {
        return new Promise((resolve, reject) => {
            const outputPath = path.join(this.backupDir, `${backupId}.zip`);
            const output = fs.createWriteStream(outputPath);
            const archive = archiver('zip', {
                zlib: { level: 9 }
            });

            output.on('close', () => {
                const compressedSize = archive.pointer();
                const originalSize = this.getDirectorySize(backupPath);
                const compressionRatio = originalSize > 0 ? ((originalSize - compressedSize) / originalSize) * 100 : 0;
                
                resolve({
                    filePath: outputPath,
                    originalSize: originalSize,
                    compressedSize: compressedSize,
                    compressionRatio: compressionRatio
                });
            });

            archive.on('error', (err) => {
                reject(err);
            });

            archive.pipe(output);
            archive.directory(backupPath, false);
            archive.finalize();
        });
    }

    getDirectorySize(dirPath) {
        let totalSize = 0;
        
        function calculateSize(itemPath) {
            if (!fs.existsSync(itemPath)) return;
            
            const stats = fs.statSync(itemPath);
            if (stats.isFile()) {
                totalSize += stats.size;
            } else if (stats.isDirectory()) {
                const items = fs.readdirSync(itemPath);
                items.forEach(item => {
                    calculateSize(path.join(itemPath, item));
                });
            }
        }
        
        calculateSize(dirPath);
        return totalSize;
    }

    async calculateChecksum(filePath) {
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash('sha256');
            const stream = fs.createReadStream(filePath);
            
            stream.on('data', (data) => {
                hash.update(data);
            });
            
            stream.on('end', () => {
                resolve(hash.digest('hex'));
            });
            
            stream.on('error', (error) => {
                reject(error);
            });
        });
    }

    async uploadToCloud(filePath, backupId) {
        try {
            const result = await cloudinary.uploader.upload(filePath, {
                resource_type: 'raw',
                public_id: `backups/${backupId}`,
                folder: 'backups'
            });
            
            return {
                cloudPath: result.secure_url,
                publicId: result.public_id
            };
        } catch (error) {
            throw new Error(`Cloud upload failed: ${error.message}`);
        }
    }

    async verifyBackup(backupRecord) {
        try {
            if (!fs.existsSync(backupRecord.filePath)) {
                throw new Error('Backup file not found');
            }

            const currentChecksum = await this.calculateChecksum(backupRecord.filePath);
            if (currentChecksum !== backupRecord.checksum) {
                throw new Error('Checksum mismatch');
            }

            return { verified: true, message: 'Backup verification successful' };
        } catch (error) {
            return { verified: false, message: error.message };
        }
    }

    async cleanupTemp(backupId) {
        const tempPath = path.join(this.tempDir, backupId);
        if (fs.existsSync(tempPath)) {
            await this.deleteDirectory(tempPath);
        }
    }

    async deleteDirectory(dirPath) {
        if (fs.existsSync(dirPath)) {
            const files = fs.readdirSync(dirPath);
            for (const file of files) {
                const filePath = path.join(dirPath, file);
                const stats = fs.statSync(filePath);
                if (stats.isDirectory()) {
                    await this.deleteDirectory(filePath);
                } else {
                    fs.unlinkSync(filePath);
                }
            }
            fs.rmdirSync(dirPath);
        }
    }

    async restoreDatabase(backupFilePath, options = {}) {
        try {
            const {
                targetDatabase = null,
                dropExisting = false,
                conflictResolution = 'skip', // 'skip', 'replace', 'merge'
                collections = null // null means restore all, or array of collection names
            } = options;

            console.log('🔄 Starting database restore...');
            console.log(`📁 Backup file: ${backupFilePath}`);

            // Step 1: Create temporary extraction directory
            const extractPath = path.join(this.tempDir, `restore_${Date.now()}`);
            if (!fs.existsSync(extractPath)) {
                fs.mkdirSync(extractPath, { recursive: true });
            }

            // Step 2: Extract backup file
            console.log('📦 Extracting backup file...');
            await extract(backupFilePath, { dir: extractPath });

            // Step 3: Read backup summary
            const summaryPath = path.join(extractPath, 'backup-summary.json');
            if (!fs.existsSync(summaryPath)) {
                throw new Error('Invalid backup file: missing backup-summary.json');
            }

            const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
            console.log(`📊 Backup info: ${summary.totalCollections} collections, ${summary.totalDocuments} documents`);

            // Step 4: Get list of collection files to restore
            const collectionFiles = fs.readdirSync(extractPath)
                .filter(file => file.endsWith('.json') && file !== 'backup-summary.json');

            if (collections) {
                // Filter to only requested collections
                const requestedFiles = collectionFiles.filter(file => {
                    const collectionName = file.replace('.json', '');
                    return collections.includes(collectionName);
                });
                if (requestedFiles.length === 0) {
                    throw new Error('No matching collections found in backup');
                }
                collectionFiles.splice(0, collectionFiles.length, ...requestedFiles);
            }

            console.log(`🎯 Restoring ${collectionFiles.length} collections...`);

            const restoreStats = {
                totalCollections: collectionFiles.length,
                processedCollections: 0,
                totalDocuments: 0,
                insertedDocuments: 0,
                skippedDocuments: 0,
                updatedDocuments: 0,
                errors: []
            };

            // Step 5: Restore each collection
            for (const collectionFile of collectionFiles) {
                try {
                    const collectionPath = path.join(extractPath, collectionFile);
                    const backupData = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));
                    
                    const collectionName = backupData.collection;
                    const documents = backupData.documents || [];
                    
                    console.log(`🔄 Restoring collection: ${collectionName} (${documents.length} documents)`);

                    if (documents.length === 0) {
                        console.log(`⏭️ Skipping empty collection: ${collectionName}`);
                        restoreStats.processedCollections++;
                        continue;
                    }

                    // Get collection reference
                    const collection = mongoose.connection.db.collection(collectionName);

                    // Drop existing collection if requested
                    if (dropExisting) {
                        try {
                            await collection.drop();
                            console.log(`🗑️ Dropped existing collection: ${collectionName}`);
                        } catch (dropError) {
                            // Collection might not exist, that's ok
                            if (dropError.code !== 26) { // NamespaceNotFound
                                console.warn(`⚠️ Could not drop collection ${collectionName}:`, dropError.message);
                            }
                        }
                    }

                    // Process documents based on conflict resolution strategy
                    if (conflictResolution === 'replace' || dropExisting) {
                        // Direct insert (fastest for large datasets)
                        if (documents.length > 0) {
                            // Process each document to handle ObjectId fields correctly
                            const processedDocuments = documents.map(doc => {
                                // Handle examSessionId conversion for physicalfitnesses collection
                                if (collectionName === 'physicalfitnesses' && doc.examSessionId) {
                                    if (typeof doc.examSessionId === 'string' && mongoose.Types.ObjectId.isValid(doc.examSessionId)) {
                                        doc.examSessionId = new mongoose.Types.ObjectId(doc.examSessionId);
                                    }
                                }
                                
                                // Handle other common ObjectId fields
                                if (doc._id && typeof doc._id === 'string' && mongoose.Types.ObjectId.isValid(doc._id)) {
                                    doc._id = new mongoose.Types.ObjectId(doc._id);
                                }
                                
                                // Handle any field ending with 'Id' that might be ObjectId
                                Object.keys(doc).forEach(key => {
                                    if (key.endsWith('Id') && doc[key] && typeof doc[key] === 'string' && mongoose.Types.ObjectId.isValid(doc[key])) {
                                        doc[key] = new mongoose.Types.ObjectId(doc[key]);
                                    }
                                });
                                
                                return doc;
                            });
                            
                            const result = await collection.insertMany(processedDocuments, { ordered: false });
                            restoreStats.insertedDocuments += result.insertedCount;
                            console.log(`✅ Inserted ${result.insertedCount} documents in ${collectionName}`);
                        }
                    } else {
                        // Handle conflicts individually
                        let inserted = 0, skipped = 0, updated = 0;

                        for (const doc of documents) {
                            try {
                                // Process document to handle ObjectId fields correctly
                                const processedDoc = { ...doc };
                                
                                // Handle examSessionId conversion for physicalfitnesses collection
                                if (collectionName === 'physicalfitnesses' && processedDoc.examSessionId) {
                                    if (typeof processedDoc.examSessionId === 'string' && mongoose.Types.ObjectId.isValid(processedDoc.examSessionId)) {
                                        processedDoc.examSessionId = new mongoose.Types.ObjectId(processedDoc.examSessionId);
                                    }
                                }
                                
                                // Handle other common ObjectId fields
                                if (processedDoc._id && typeof processedDoc._id === 'string' && mongoose.Types.ObjectId.isValid(processedDoc._id)) {
                                    processedDoc._id = new mongoose.Types.ObjectId(processedDoc._id);
                                }
                                
                                // Handle any field ending with 'Id' that might be ObjectId
                                Object.keys(processedDoc).forEach(key => {
                                    if (key.endsWith('Id') && processedDoc[key] && typeof processedDoc[key] === 'string' && mongoose.Types.ObjectId.isValid(processedDoc[key])) {
                                        processedDoc[key] = new mongoose.Types.ObjectId(processedDoc[key]);
                                    }
                                });
                                
                                if (conflictResolution === 'skip') {
                                    // Try to insert, skip if exists
                                    try {
                                        await collection.insertOne(processedDoc);
                                        inserted++;
                                    } catch (insertError) {
                                        if (insertError.code === 11000) { // Duplicate key
                                            skipped++;
                                        } else {
                                            throw insertError;
                                        }
                                    }
                                } else if (conflictResolution === 'merge') {
                                    // Upsert (update if exists, insert if not)
                                    const result = await collection.replaceOne(
                                        { _id: processedDoc._id },
                                        processedDoc,
                                        { upsert: true }
                                    );
                                    if (result.upsertedCount > 0) {
                                        inserted++;
                                    } else if (result.modifiedCount > 0) {
                                        updated++;
                                    }
                                }
                            } catch (docError) {
                                restoreStats.errors.push({
                                    collection: collectionName,
                                    document: doc._id,
                                    error: docError.message
                                });
                            }
                        }

                        restoreStats.insertedDocuments += inserted;
                        restoreStats.skippedDocuments += skipped;
                        restoreStats.updatedDocuments += updated;

                        console.log(`✅ ${collectionName}: ${inserted} inserted, ${skipped} skipped, ${updated} updated`);
                    }

                    restoreStats.totalDocuments += documents.length;
                    restoreStats.processedCollections++;

                } catch (collectionError) {
                    console.error(`❌ Error restoring collection ${collectionFile}:`, collectionError.message);
                    restoreStats.errors.push({
                        collection: collectionFile,
                        error: collectionError.message
                    });
                }
            }

            // Step 6: Cleanup extraction directory
            await this.deleteDirectory(extractPath);

            // Step 7: Generate restore report
            const restoreReport = {
                success: true,
                backupInfo: {
                    backupId: summary.backupId,
                    backupDate: summary.backupDate,
                    originalDatabase: summary.databaseName
                },
                restoreDate: new Date().toISOString(),
                stats: restoreStats,
                message: `Restore completed: ${restoreStats.processedCollections}/${restoreStats.totalCollections} collections processed`
            };

            console.log('🎉 Database restore completed successfully!');
            console.log(`📊 Stats: ${restoreStats.insertedDocuments} inserted, ${restoreStats.skippedDocuments} skipped, ${restoreStats.updatedDocuments} updated`);
            
            if (restoreStats.errors.length > 0) {
                console.warn(`⚠️ ${restoreStats.errors.length} errors occurred during restore`);
            }

            return restoreReport;

        } catch (error) {
            console.error('❌ Restore failed:', error);
            throw new Error(`Restore failed: ${error.message}`);
        }
    }

    async cleanupOldBackups() {
        const expiredBackups = await backupModel.find({
            autoDeleteAt: { $lte: new Date() }
        });

        for (const backup of expiredBackups) {
            try {
                if (backup.filePath && fs.existsSync(backup.filePath)) {
                    fs.unlinkSync(backup.filePath);
                }
                
                await backupModel.findByIdAndDelete(backup._id);
                console.log(`Deleted expired backup: ${backup.backupId}`);
            } catch (error) {
                console.error(`Error deleting backup ${backup.backupId}:`, error);
            }
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

export default new BackupService();
