# 💾 Backup & Disaster Recovery Documentation

## Overview

The EMS Backup & Disaster Recovery system provides comprehensive data protection and system recovery capabilities for the Employee Management System. This includes automated backups, point-in-time recovery, and full disaster recovery procedures.

## 🎯 Backup Strategy

### Backup Components
- **Database**: MongoDB collections and indexes
- **Application Code**: Complete application source code
- **User Uploads**: Files uploaded by users (profiles, documents)
- **Configuration**: Environment variables, nginx configs, SSL certificates
- **Logs**: Application and system logs for debugging

### Backup Types
- **Incremental**: Daily automated backups
- **Full**: Comprehensive backup archives
- **On-demand**: Manual backups before major changes

### Retention Policy
- **Daily Backups**: 30 days retention
- **Full Archives**: 90 days retention
- **Critical Backups**: Manual retention (before major updates)

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
# Install MongoDB tools
sudo apt-get install -y mongodb-clients

# Install backup utilities
sudo apt-get install -y tar gzip curl

# Install notification tools (optional)
sudo apt-get install -y mailutils
```

### 2. Configure Environment

```bash
# Create backup directories
sudo mkdir -p /app/backups/{database,application,uploads,config,logs,archive}
sudo chown -R $USER:$USER /app/backups

# Set backup script permissions
chmod +x backup-system.sh recovery-system.sh

# Configure environment variables in .env.prod
MONGODB_URI=your-mongodb-connection-string
SLACK_WEBHOOK_URL=your-slack-webhook-url  # Optional
```

### 3. Schedule Automated Backups

```bash
# Add to crontab
crontab -e

# Add these lines:
# Daily backup at 2 AM
0 2 * * * /opt/Employee-Management-System_React/backup-system.sh

# Weekly full backup at 3 AM Sunday
0 3 * * 0 /opt/Employee-Management-System_React/backup-system.sh

# Monthly archive cleanup
0 4 1 * * find /app/backups/archive -name "*.tar.gz" -mtime +90 -delete
```

## 📋 Backup Operations

### Manual Backup

```bash
# Full system backup
./backup-system.sh

# Check backup status
tail -f /var/log/ems-backup.log
```

### Backup Verification

```bash
# List available backups
ls -la /app/backups/archive/

# Check backup integrity
tar -tzf /app/backups/archive/ems_full_backup_YYYYMMDD_HHMMSS.tar.gz

# View backup summary
cat /app/backups/archive/ems_full_backup_YYYYMMDD_HHMMSS.summary
```

### Backup Monitoring

```bash
# Monitor backup processes
ps aux | grep backup

# Check backup logs
tail -f /var/log/ems-backup.log

# Check disk usage
df -h /app/backups
```

## 🔄 Recovery Operations

### List Available Backups

```bash
# Show all available backups
./recovery-system.sh list
```

### Database Recovery

```bash
# Restore from specific backup
./recovery-system.sh restore-db db_20250918_120000.tar.gz

# Interactive restoration
./recovery-system.sh restore-db
```

### Application Recovery

```bash
# Restore application code
./recovery-system.sh restore-app app_20250918_120000.tar.gz

# This will:
# - Stop current application
# - Backup current version
# - Extract and install backup
# - Restore dependencies
# - Restart services
```

### Full System Recovery

```bash
# Complete system restoration
./recovery-system.sh full-restore ems_full_backup_20250918_120000.tar.gz

# This performs:
# - Database restoration
# - Application restoration
# - Configuration restoration
# - Upload files restoration
# - Service restart
# - System validation
```

### Validate System After Recovery

```bash
# Check system health after recovery
./recovery-system.sh validate
```

## 🚨 Disaster Recovery Procedures

### Scenario 1: Database Corruption

```bash
# 1. Stop application to prevent further damage
pm2 stop all

# 2. Backup corrupted database (for analysis)
mongodump --uri="$MONGODB_URI" --out="/tmp/corrupted_db_$(date +%Y%m%d)"

# 3. Restore from latest backup
./recovery-system.sh restore-db

# 4. Validate restoration
./recovery-system.sh validate

# 5. Restart application
pm2 start all
```

### Scenario 2: Complete Server Failure

```bash
# On new server:

# 1. Install EMS dependencies
# (Follow PRODUCTION_DEPLOYMENT_GUIDE.md)

# 2. Copy backup files to new server
scp -r user@backup-server:/app/backups/ /app/

# 3. Perform full system restore
./recovery-system.sh full-restore [latest-backup-file]

# 4. Update DNS and SSL certificates
# 5. Validate all services
```

### Scenario 3: Accidental Data Deletion

```bash
# 1. Identify what was deleted and when
# 2. Find appropriate backup before deletion
./recovery-system.sh list

# 3. Restore specific component
./recovery-system.sh restore-db [backup-before-deletion]

# 4. Validate data integrity
./recovery-system.sh validate
```

### Scenario 4: Security Breach

```bash
# 1. Immediately isolate system
sudo ufw deny in
pm2 stop all

# 2. Backup current state for analysis
./backup-system.sh

# 3. Restore from known good backup
./recovery-system.sh full-restore [pre-breach-backup]

# 4. Update all credentials
# 5. Apply security patches
# 6. Validate system integrity
```

## 📊 Backup Monitoring Dashboard

### Create Backup Status Page

```bash
# Create status page
cat > /var/www/html/backup-status.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>EMS Backup Status</title>
    <meta http-equiv="refresh" content="300">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .status { padding: 10px; margin: 10px 0; border-radius: 5px; }
        .good { background-color: #d4edda; color: #155724; }
        .warning { background-color: #fff3cd; color: #856404; }
        .error { background-color: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <h1>EMS Backup Status</h1>
    
    <div id="backup-status">
        <h2>Latest Backups</h2>
        <div class="status good">
            <strong>Database:</strong> <span id="db-backup">Loading...</span>
        </div>
        <div class="status good">
            <strong>Application:</strong> <span id="app-backup">Loading...</span>
        </div>
        <div class="status good">
            <strong>Full Archive:</strong> <span id="full-backup">Loading...</span>
        </div>
    </div>
    
    <div id="backup-stats">
        <h2>Backup Statistics</h2>
        <div class="status">
            <strong>Total Backup Size:</strong> <span id="total-size">Loading...</span>
        </div>
        <div class="status">
            <strong>Available Space:</strong> <span id="free-space">Loading...</span>
        </div>
    </div>
    
    <script>
        function updateStatus() {
            // This would be populated by a PHP script or API
            // For now, showing static content
            document.getElementById('db-backup').textContent = 
                new Date().toLocaleString() + ' (Success)';
            document.getElementById('app-backup').textContent = 
                new Date().toLocaleString() + ' (Success)';
            document.getElementById('full-backup').textContent = 
                new Date().toLocaleString() + ' (Success)';
            document.getElementById('total-size').textContent = '2.5 GB';
            document.getElementById('free-space').textContent = '45.2 GB';
        }
        
        updateStatus();
        setInterval(updateStatus, 300000); // Update every 5 minutes
    </script>
</body>
</html>
EOF
```

## 🔔 Alerting Configuration

### Email Alerts

```bash
# Configure postfix for email alerts
sudo apt-get install -y postfix

# Test email notification
echo "EMS backup test" | mail -s "Test Alert" admin@formonex.in
```

### Slack Integration

```bash
# Set Slack webhook in environment
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"

# Test Slack notification
curl -X POST -H 'Content-type: application/json' \
    --data '{"text":"EMS backup system test notification"}' \
    $SLACK_WEBHOOK_URL
```

## 📈 Backup Performance Optimization

### Compression Settings

```bash
# Adjust compression level in backup script
# Level 1: Fastest compression, larger files
tar -czf --compression-level=1 backup.tar.gz /path/to/data

# Level 9: Best compression, slower
tar -czf --compression-level=9 backup.tar.gz /path/to/data
```

### Parallel Processing

```bash
# Use parallel compression
tar -cf - /path/to/data | pigz > backup.tar.gz

# Use multiple CPU cores for MongoDB dump
mongodump --numParallelCollections=4 --uri="$MONGODB_URI"
```

### Network Optimization

```bash
# For remote backups, use rsync with compression
rsync -avz --compress-level=6 /app/backups/ user@backup-server:/backups/

# Use bandwidth limiting for backups during business hours
rsync --bwlimit=1000 /app/backups/ user@backup-server:/backups/
```

## 🧪 Testing & Validation

### Backup Testing Schedule

- **Weekly**: Test database restoration on staging environment
- **Monthly**: Full system restoration test
- **Quarterly**: Disaster recovery drill

### Validation Checklist

- [ ] Backup files are created successfully
- [ ] Backup files are not corrupted
- [ ] Database restoration works correctly
- [ ] Application restoration preserves functionality
- [ ] Configuration restoration maintains settings
- [ ] Upload files are properly restored
- [ ] System validation passes all checks

### Test Restoration

```bash
# Create test environment for restoration
docker run -d --name test-mongo mongo:5.0
docker run -d --name test-app -p 8080:8000 node:18-alpine

# Test restoration on test environment
MONGODB_URI="mongodb://localhost:27017/test" ./recovery-system.sh restore-db

# Validate test restoration
curl http://localhost:8080/health
```

## 📝 Backup Logs Analysis

### Important Log Patterns

```bash
# Check for successful backups
grep "SUCCESS" /var/log/ems-backup.log

# Check for backup failures
grep "ERROR" /var/log/ems-backup.log

# Monitor backup duration
grep "completed in" /var/log/ems-backup.log

# Check backup sizes
grep "Backup Size" /var/log/ems-backup.log
```

### Log Rotation for Backup Logs

```bash
# Configure logrotate for backup logs
sudo tee /etc/logrotate.d/ems-backup << 'EOF'
/var/log/ems-backup.log {
    weekly
    rotate 12
    compress
    delaycompress
    missingok
    notifempty
    create 0644 root root
}

/var/log/ems-recovery.log {
    monthly
    rotate 6
    compress
    delaycompress
    missingok
    notifempty
    create 0644 root root
}
EOF
```

## 🚨 Emergency Contacts

### Backup & Recovery Team
- **Primary**: backup-admin@formonex.in
- **Secondary**: system-admin@formonex.in
- **Emergency**: +1-234-567-8900

### Escalation Process
1. **Level 1**: System Administrator (Response: 1 hour)
2. **Level 2**: Database Administrator (Response: 30 minutes)
3. **Level 3**: Development Team Lead (Response: 15 minutes)
4. **Level 4**: CTO/Emergency Contact (Response: Immediate)

This comprehensive backup and disaster recovery system ensures that the EMS can recover from various failure scenarios with minimal data loss and downtime.