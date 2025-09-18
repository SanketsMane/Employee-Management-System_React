#!/bin/bash

# 💾 EMS Backup & Recovery System
# Comprehensive backup solution for Employee Management System

set -e

# Configuration
BACKUP_DIR="/app/backups"
LOG_FILE="/var/log/ems-backup.log"
RETENTION_DAYS=30
MONGO_URI="${MONGODB_URI}"
APP_DIR="/opt/Employee-Management-System_React"
DATE=$(date +%Y%m%d_%H%M%S)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $LOG_FILE
}

# Error handling
error_exit() {
    log "ERROR: $1"
    echo -e "${RED}❌ Backup failed: $1${NC}"
    exit 1
}

# Success logging
success() {
    log "SUCCESS: $1"
    echo -e "${GREEN}✅ $1${NC}"
}

# Create backup directories
create_directories() {
    log "Creating backup directories..."
    mkdir -p "$BACKUP_DIR"/{database,application,uploads,logs,config}
    mkdir -p "$BACKUP_DIR"/archive
    success "Backup directories created"
}

# Database backup
backup_database() {
    log "Starting database backup..."
    
    if [ -z "$MONGO_URI" ]; then
        error_exit "MongoDB URI not found in environment variables"
    fi
    
    local db_backup_dir="$BACKUP_DIR/database/db_$DATE"
    
    # Create MongoDB dump
    mongodump --uri="$MONGO_URI" --out="$db_backup_dir" || error_exit "MongoDB dump failed"
    
    # Compress database backup
    tar -czf "$BACKUP_DIR/database/db_$DATE.tar.gz" -C "$BACKUP_DIR/database" "db_$DATE"
    rm -rf "$db_backup_dir"
    
    # Get database statistics
    mongo "$MONGO_URI" --quiet --eval "
        var stats = db.runCommand('dbStats');
        print('Database: ' + stats.db);
        print('Collections: ' + stats.collections);
        print('Data Size: ' + (stats.dataSize / 1024 / 1024).toFixed(2) + ' MB');
        print('Storage Size: ' + (stats.storageSize / 1024 / 1024).toFixed(2) + ' MB');
    " >> "$BACKUP_DIR/database/db_$DATE.stats"
    
    success "Database backup completed: db_$DATE.tar.gz"
}

# Application code backup
backup_application() {
    log "Starting application backup..."
    
    local app_backup_file="$BACKUP_DIR/application/app_$DATE.tar.gz"
    
    # Backup application code (excluding node_modules and logs)
    tar --exclude='node_modules' \
        --exclude='logs' \
        --exclude='.git' \
        --exclude='uploads' \
        --exclude='dist' \
        --exclude='build' \
        -czf "$app_backup_file" \
        -C "$(dirname $APP_DIR)" \
        "$(basename $APP_DIR)" || error_exit "Application backup failed"
    
    # Create application manifest
    cat > "$BACKUP_DIR/application/app_$DATE.manifest" << EOF
Backup Date: $(date)
Application Directory: $APP_DIR
Git Commit: $(cd $APP_DIR && git rev-parse HEAD 2>/dev/null || echo "N/A")
Git Branch: $(cd $APP_DIR && git branch --show-current 2>/dev/null || echo "N/A")
Node Version: $(node --version)
NPM Version: $(npm --version)
Package Versions:
$(cd $APP_DIR && npm list --depth=0 2>/dev/null || echo "N/A")
EOF
    
    success "Application backup completed: app_$DATE.tar.gz"
}

# User uploads backup
backup_uploads() {
    log "Starting uploads backup..."
    
    local uploads_dir="/app/uploads"
    local uploads_backup_file="$BACKUP_DIR/uploads/uploads_$DATE.tar.gz"
    
    if [ -d "$uploads_dir" ]; then
        tar -czf "$uploads_backup_file" -C "$(dirname $uploads_dir)" "$(basename $uploads_dir)" || error_exit "Uploads backup failed"
        
        # Create uploads manifest
        find "$uploads_dir" -type f | wc -l > "$BACKUP_DIR/uploads/uploads_$DATE.count"
        du -sh "$uploads_dir" > "$BACKUP_DIR/uploads/uploads_$DATE.size"
        
        success "Uploads backup completed: uploads_$DATE.tar.gz"
    else
        log "WARNING: Uploads directory not found: $uploads_dir"
    fi
}

# Configuration backup
backup_configuration() {
    log "Starting configuration backup..."
    
    local config_backup_file="$BACKUP_DIR/config/config_$DATE.tar.gz"
    
    # Backup environment files and configurations
    tar -czf "$config_backup_file" \
        -C "$APP_DIR" \
        .env.prod \
        docker-compose.production.yml \
        nginx-production-config.conf \
        ecosystem.config.js \
        2>/dev/null || true
    
    # Backup system configurations
    tar -czf "$BACKUP_DIR/config/system_config_$DATE.tar.gz" \
        /etc/nginx/sites-available/ems \
        /etc/nginx/sites-enabled/ems \
        /etc/ssl/certs/ \
        /etc/ssl/private/ \
        2>/dev/null || true
    
    # Create configuration manifest
    cat > "$BACKUP_DIR/config/config_$DATE.manifest" << EOF
Backup Date: $(date)
Environment Files: $(ls -la $APP_DIR/.env* 2>/dev/null || echo "None found")
Nginx Version: $(nginx -v 2>&1)
SSL Certificates: $(ls -la /etc/ssl/certs/cert.pem 2>/dev/null || echo "Not found")
EOF
    
    success "Configuration backup completed: config_$DATE.tar.gz"
}

# System logs backup
backup_logs() {
    log "Starting logs backup..."
    
    local logs_backup_file="$BACKUP_DIR/logs/logs_$DATE.tar.gz"
    
    # Backup application and system logs
    tar -czf "$logs_backup_file" \
        /app/logs/ \
        /var/log/nginx/ems_*.log \
        /var/log/ems-*.log \
        2>/dev/null || true
    
    success "Logs backup completed: logs_$DATE.tar.gz"
}

# Create comprehensive backup archive
create_full_backup() {
    log "Creating comprehensive backup archive..."
    
    local full_backup_file="$BACKUP_DIR/archive/ems_full_backup_$DATE.tar.gz"
    
    # Create full backup archive
    tar -czf "$full_backup_file" \
        -C "$BACKUP_DIR" \
        database/db_$DATE.tar.gz \
        application/app_$DATE.tar.gz \
        uploads/uploads_$DATE.tar.gz \
        config/config_$DATE.tar.gz \
        logs/logs_$DATE.tar.gz \
        2>/dev/null || true
    
    # Create backup summary
    cat > "$BACKUP_DIR/archive/ems_full_backup_$DATE.summary" << EOF
EMS Full Backup Summary
======================
Backup Date: $(date)
Backup Version: 4.5

Components Backed Up:
- Database: $(ls -lh $BACKUP_DIR/database/db_$DATE.tar.gz 2>/dev/null | awk '{print $5}' || echo "Failed")
- Application: $(ls -lh $BACKUP_DIR/application/app_$DATE.tar.gz 2>/dev/null | awk '{print $5}' || echo "Failed")
- Uploads: $(ls -lh $BACKUP_DIR/uploads/uploads_$DATE.tar.gz 2>/dev/null | awk '{print $5}' || echo "Failed")
- Configuration: $(ls -lh $BACKUP_DIR/config/config_$DATE.tar.gz 2>/dev/null | awk '{print $5}' || echo "Failed")
- Logs: $(ls -lh $BACKUP_DIR/logs/logs_$DATE.tar.gz 2>/dev/null | awk '{print $5}' || echo "Failed")

Full Archive: $(ls -lh $full_backup_file 2>/dev/null | awk '{print $5}' || echo "Failed")

System Information:
- Hostname: $(hostname)
- OS: $(uname -a)
- Disk Usage: $(df -h / | tail -1)
- Memory: $(free -h | grep Mem)
- Uptime: $(uptime)

Database Statistics:
$(cat $BACKUP_DIR/database/db_$DATE.stats 2>/dev/null || echo "Database stats not available")
EOF
    
    success "Full backup archive created: ems_full_backup_$DATE.tar.gz"
}

# Cleanup old backups
cleanup_old_backups() {
    log "Cleaning up old backups (older than $RETENTION_DAYS days)..."
    
    # Cleanup individual component backups
    find "$BACKUP_DIR/database" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    find "$BACKUP_DIR/database" -name "*.stats" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    find "$BACKUP_DIR/application" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    find "$BACKUP_DIR/application" -name "*.manifest" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    find "$BACKUP_DIR/uploads" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    find "$BACKUP_DIR/config" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    find "$BACKUP_DIR/logs" -name "*.tar.gz" -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    
    # Cleanup full backup archives (keep longer - 90 days)
    find "$BACKUP_DIR/archive" -name "*.tar.gz" -mtime +90 -delete 2>/dev/null || true
    find "$BACKUP_DIR/archive" -name "*.summary" -mtime +90 -delete 2>/dev/null || true
    
    success "Old backups cleaned up"
}

# Backup verification
verify_backup() {
    log "Verifying backup integrity..."
    
    local verification_failed=false
    
    # Verify database backup
    if [ -f "$BACKUP_DIR/database/db_$DATE.tar.gz" ]; then
        tar -tzf "$BACKUP_DIR/database/db_$DATE.tar.gz" >/dev/null 2>&1 || verification_failed=true
    fi
    
    # Verify application backup
    if [ -f "$BACKUP_DIR/application/app_$DATE.tar.gz" ]; then
        tar -tzf "$BACKUP_DIR/application/app_$DATE.tar.gz" >/dev/null 2>&1 || verification_failed=true
    fi
    
    # Verify full backup archive
    if [ -f "$BACKUP_DIR/archive/ems_full_backup_$DATE.tar.gz" ]; then
        tar -tzf "$BACKUP_DIR/archive/ems_full_backup_$DATE.tar.gz" >/dev/null 2>&1 || verification_failed=true
    fi
    
    if [ "$verification_failed" = true ]; then
        error_exit "Backup verification failed"
    else
        success "Backup verification passed"
    fi
}

# Send notification
send_notification() {
    local status="$1"
    local message="$2"
    
    # Email notification
    if command -v mail >/dev/null 2>&1; then
        echo "$message" | mail -s "EMS Backup $status" admin@formonex.in 2>/dev/null || true
    fi
    
    # Slack notification (if webhook configured)
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        local color="good"
        if [ "$status" = "FAILED" ]; then
            color="danger"
        fi
        
        curl -X POST -H 'Content-type: application/json' \
            --data "{
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"title\": \"EMS Backup $status\",
                    \"text\": \"$message\",
                    \"footer\": \"EMS Backup System\",
                    \"ts\": $(date +%s)
                }]
            }" \
            "$SLACK_WEBHOOK_URL" 2>/dev/null || true
    fi
}

# Main backup function
main() {
    echo -e "${BLUE}🚀 Starting EMS Backup Process${NC}"
    log "Starting EMS backup process"
    
    local start_time=$(date +%s)
    
    # Create backup directories
    create_directories
    
    # Perform backups
    backup_database
    backup_application
    backup_uploads
    backup_configuration
    backup_logs
    
    # Create full backup archive
    create_full_backup
    
    # Verify backups
    verify_backup
    
    # Cleanup old backups
    cleanup_old_backups
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Generate final report
    local backup_size=$(du -sh "$BACKUP_DIR/archive/ems_full_backup_$DATE.tar.gz" 2>/dev/null | cut -f1 || echo "Unknown")
    
    local success_message="EMS backup completed successfully!
Duration: ${duration}s
Backup Size: $backup_size
Archive: ems_full_backup_$DATE.tar.gz
Date: $(date)"
    
    success "Backup process completed in ${duration} seconds"
    echo -e "${GREEN}🎉 Backup completed successfully!${NC}"
    echo "📊 Backup Size: $backup_size"
    echo "📁 Archive: ems_full_backup_$DATE.tar.gz"
    
    # Send success notification
    send_notification "SUCCESS" "$success_message"
    
    log "Backup process completed successfully"
}

# Error handling for the main function
if ! main "$@"; then
    local error_message="EMS backup failed!
Date: $(date)
Check logs: $LOG_FILE"
    
    send_notification "FAILED" "$error_message"
    exit 1
fi