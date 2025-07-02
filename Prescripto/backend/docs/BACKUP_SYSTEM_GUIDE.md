# 🔒 Backup System Guide - Prescripto

## 📖 Tổng quan

Hệ thống backup tự động cho Prescripto bao gồm:
- ✅ **Manual Backup**: Tạo backup thủ công từ admin panel
- ✅ **Scheduled Backup**: Backup tự động theo lịch (hàng ngày, tuần, tháng)
- ✅ **Cloud Storage**: Upload backup lên cloud storage
- ✅ **Verification**: Kiểm tra tính toàn vẹn của backup
- ✅ **Restore**: Khôi phục database từ backup
- ✅ **Cleanup**: Tự động xóa backup cũ theo retention policy

## 🛠️ Cài đặt Prerequisites

### 1. MongoDB Database Tools

#### Windows:
```bash
# Download MongoDB Database Tools từ:
# https://www.mongodb.com/try/download/database-tools

# Hoặc sử dụng chocolatey:
choco install mongodb-database-tools

# Hoặc sử dụng winget:
winget install MongoDB.DatabaseTools
```

#### Ubuntu/Debian:
```bash
# Import MongoDB public key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Update package list
sudo apt-get update

# Install MongoDB database tools
sudo apt-get install -y mongodb-database-tools
```

#### macOS:
```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-database-tools
```

### 2. Node.js Dependencies

```bash
cd backend
npm install archiver
```

### 3. Environment Variables

Thêm vào file `.env`:

```env
# Backup Configuration
BACKUP_RETENTION_DAYS=30
BACKUP_AUTO_CLEANUP=true
BACKUP_CLOUD_STORAGE=true

# Email Notifications (optional)
BACKUP_NOTIFICATION_EMAIL=admin@yourdomain.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 🚀 Cách sử dụng

### 1. Truy cập Admin Panel

1. Đăng nhập với tài khoản admin
2. Vào sidebar → **"Backup Management"**
3. Bạn sẽ thấy dashboard với:
   - 📊 Thống kê backup
   - 📋 Danh sách backup
   - ⚙️ Các công cụ quản lý

### 2. Tạo Manual Backup

```javascript
// Qua UI:
1. Click "Create Backup"
2. Nhập tên backup
3. Chọn retention days (mặc định 30 ngày)
4. Click "Create Backup"

// Qua API:
POST /api/admin/backup/create
Headers: { Authorization: "Bearer YOUR_TOKEN" }
Body: {
  "backupName": "Manual_Backup_2024_01_15",
  "retentionDays": 30
}
```

### 3. Scheduled Backups

Hệ thống tự động tạo backup theo lịch:

- **Daily**: Mỗi ngày lúc 2:00 AM (giữ 7 ngày)
- **Weekly**: Chủ nhật lúc 3:00 AM (giữ 30 ngày)  
- **Monthly**: Ngày 1 hàng tháng lúc 4:00 AM (giữ 365 ngày)
- **Cleanup**: Mỗi ngày lúc 1:00 AM (xóa backup hết hạn)

### 4. Download Backup

```javascript
// Qua UI:
1. Tìm backup trong danh sách
2. Click icon "📥" để download

// Qua API:
GET /api/admin/backup/{backupId}/download
Headers: { Authorization: "Bearer YOUR_TOKEN" }
```

### 5. Verify Backup

```javascript
// Qua UI:
1. Click icon "✓" để verify backup

// Qua API:
POST /api/admin/backup/{backupId}/verify
Headers: { Authorization: "Bearer YOUR_TOKEN" }
```

### 6. Restore Database

⚠️ **CẢNH BÁO**: Thao tác restore sẽ ghi đè toàn bộ database hiện tại!

```javascript
// Qua API (không có UI cho restore để tránh tai nạn):
POST /api/admin/backup/{backupId}/restore
Headers: { Authorization: "Bearer YOUR_TOKEN" }
Body: { "confirmRestore": true }
```

## 📁 Cấu trúc File Backup

```
Prescripto/
├── backend/
│   ├── backups/
│   │   ├── temp/                     # Temporary files during backup
│   │   ├── backup_xxx.zip           # Compressed backup files
│   │   └── ...
│   └── ...
```

### Format Backup File:
```
backup_1642234567890_abc123def.zip
├── prescripto/                      # Database name
│   ├── users.bson.gz               # User collection
│   ├── users.metadata.json         # Metadata
│   ├── doctors.bson.gz             # Doctor collection
│   ├── doctors.metadata.json       # Metadata
│   ├── appointments.bson.gz        # Appointment collection
│   ├── prescriptions.bson.gz       # Prescription collection
│   └── ...                         # Other collections
```

## 🔧 Configuration

### Backup Settings

```javascript
// backend/utils/backupScheduler.js

// Thay đổi lịch backup:
const schedules = {
  daily: '0 2 * * *',      // 2:00 AM daily
  weekly: '0 3 * * 0',     // 3:00 AM Sunday
  monthly: '0 4 1 * *',    // 4:00 AM 1st day
  cleanup: '0 1 * * *'     // 1:00 AM daily cleanup
};

// Thay đổi retention policy:
const retentionDays = {
  daily: 7,     // 7 days
  weekly: 30,   // 30 days  
  monthly: 365  // 1 year
};
```

### Cloud Storage Configuration

```javascript
// backend/utils/backupService.js

// Cloudinary (default)
const uploadToCloud = async (filePath, backupId) => {
  const result = await cloudinary.uploader.upload(filePath, {
    resource_type: 'raw',
    public_id: `backups/${backupId}`,
    folder: 'backups'
  });
  return result;
};

// AWS S3 (alternative)
// Uncomment and configure for AWS S3:
/*
import AWS from 'aws-sdk';
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});
*/
```

## 📊 Monitoring & Alerts

### Database Backup Logs

```bash
# Xem logs backup:
tail -f backend/logs/backup.log

# Backup started
[2024-01-15 02:00:01] INFO: Starting automatic daily backup
[2024-01-15 02:00:01] INFO: Created backup record: backup_1642234567890_abc123def
[2024-01-15 02:01:15] INFO: Database backup completed: 125MB
[2024-01-15 02:01:30] INFO: Compression completed: 45MB (64% reduction)
[2024-01-15 02:02:45] INFO: Cloud upload completed
[2024-01-15 02:02:50] INFO: Backup verification successful
[2024-01-15 02:02:51] INFO: Automatic backup completed: backup_1642234567890_abc123def
```

### Health Checks

```javascript
// API endpoint kiểm tra backup health:
GET /api/admin/backup/stats
Response: {
  "success": true,
  "data": {
    "totalBackups": 15,
    "completedBackups": 14,
    "failedBackups": 1,
    "successRate": 93,
    "totalSize": 2147483648,
    "formattedTotalSize": "2.00 GB"
  }
}
```

## 🔒 Security Best Practices

### 1. File Permissions
```bash
# Đảm bảo chỉ user application có quyền truy cập backup folder:
chmod 700 backend/backups/
chown app:app backend/backups/
```

### 2. Encryption at Rest
```javascript
// Backup files được mã hóa trước khi lưu:
const encryptedBackup = encrypt(backupData, process.env.BACKUP_ENCRYPTION_KEY);
```

### 3. Access Control
- Chỉ admin có quyền tạo/xóa backup
- Backup API yêu cầu authentication token
- Rate limiting cho backup operations

### 4. Audit Logging
```javascript
// Mọi thao tác backup được log:
auditLog.log({
  action: 'BACKUP_CREATED',
  user: req.admin.email,
  backupId: 'backup_1642234567890_abc123def',
  timestamp: new Date(),
  ipAddress: req.ip
});
```

## 🚨 Troubleshooting

### Lỗi thường gặp:

#### 1. "mongodump command not found"
```bash
# Solution: Cài đặt MongoDB Database Tools
# Windows: choco install mongodb-database-tools
# Ubuntu: sudo apt-get install mongodb-database-tools
# macOS: brew install mongodb-database-tools
```

#### 2. "Permission denied writing to backup directory"
```bash
# Solution: Kiểm tra permissions
ls -la backend/backups/
chmod 755 backend/backups/
```

#### 3. "Cloud upload failed"
```bash
# Solution: Kiểm tra Cloudinary credentials
# Đảm bảo CLOUDINARY_URL được set trong .env
echo $CLOUDINARY_URL
```

#### 4. "Backup verification failed"
```bash
# Solution: Kiểm tra file integrity
# File có thể bị corrupt trong quá trình transfer
# Tạo lại backup và verify lại
```

#### 5. "Out of disk space"
```bash
# Solution: 
# 1. Cleanup old backups: POST /api/admin/backup/cleanup
# 2. Reduce retention days
# 3. Enable cloud storage để backup chỉ lưu local tạm thời
```

## 📈 Performance Optimization

### 1. Backup Size Optimization
```javascript
// Exclude unnecessary collections:
const excludeCollections = ['logs', 'sessions', 'temp_data'];

// Use compression:
const compressionLevel = 9; // Maximum compression
```

### 2. Backup Speed Optimization
```javascript
// Parallel backup của multiple collections:
const backupPromises = collections.map(collection => 
  backupCollection(collection)
);
await Promise.all(backupPromises);
```

### 3. Storage Optimization
```javascript
// Automatic cleanup old backups:
const retentionPolicy = {
  daily: 7,    // Keep 7 daily backups
  weekly: 4,   // Keep 4 weekly backups  
  monthly: 12  // Keep 12 monthly backups
};
```

## 📞 Support

Nếu gặp vấn đề với backup system:

1. **Check logs**: `tail -f backend/logs/backup.log`
2. **Verify prerequisites**: Đảm bảo mongodump/mongorestore đã được cài đặt
3. **Check permissions**: Đảm bảo app có quyền write vào backup directory
4. **Test manually**: Thử tạo backup manual để test
5. **Contact support**: Provide backup logs và error messages

---

## 🎯 Future Enhancements

### Planned Features:
- [ ] **Incremental Backups**: Chỉ backup data thay đổi
- [ ] **Multiple Cloud Providers**: Support AWS S3, Google Cloud Storage
- [ ] **Backup Encryption**: End-to-end encryption
- [ ] **Backup Monitoring Dashboard**: Real-time backup status
- [ ] **Email Notifications**: Alert khi backup thành công/thất bại
- [ ] **Backup Testing**: Tự động test restore để verify backup integrity
- [ ] **Backup Metrics**: Detailed analytics về backup performance

### Contributing:
- Fork repository
- Create feature branch
- Implement feature with tests
- Submit pull request

---

**🔐 Backup System v1.0.0 - Prescripto Health Management System** 