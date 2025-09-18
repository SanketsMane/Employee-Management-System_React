#!/bin/bash

# 🔄 EMS Disaster Recovery System
# Comprehensive recovery solution for Employee Management System

set -e

# Configuration
BACKUP_DIR="/app/backups"
LOG_FILE="/var/log/ems-recovery.log"
APP_DIR="/opt/Employee-Management-System_React"

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
    echo -e "${RED}❌ Recovery failed: $1${NC}"
    exit 1
}

# Success logging
success() {
    log "SUCCESS: $1"
    echo -e "${GREEN}✅ $1${NC}"
}

# List available backups
list_backups() {
    echo -e "${BLUE}📋 Available Backups:${NC}"
    echo ""
    
    echo -e "${YELLOW}Full Backup Archives:${NC}"
    if ls "$BACKUP_DIR/archive"/ems_full_backup_*.tar.gz >/dev/null 2>&1; then
        ls -lh "$BACKUP_DIR/archive"/ems_full_backup_*.tar.gz | awk '{print $9, $5, $6, $7, $8}'
    else
        echo "No full backup archives found"
    fi
    
    echo ""
    echo -e "${YELLOW}Database Backups:${NC}"
    if ls "$BACKUP_DIR/database"/db_*.tar.gz >/dev/null 2>&1; then
        ls -lh "$BACKUP_DIR/database"/db_*.tar.gz | awk '{print $9, $5, $6, $7, $8}' | tail -10
    else
        echo "No database backups found"
    fi
    
    echo ""
    echo -e "${YELLOW}Application Backups:${NC}"
    if ls "$BACKUP_DIR/application"/app_*.tar.gz >/dev/null 2>&1; then
        ls -lh "$BACKUP_DIR/application"/app_*.tar.gz | awk '{print $9, $5, $6, $7, $8}' | tail -10
    else
        echo "No application backups found"
    fi
}

# Restore database
restore_database() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        echo "Available database backups:"
        ls -1 "$BACKUP_DIR/database"/db_*.tar.gz 2>/dev/null | tail -10
        read -p "Enter backup file name (or full path): " backup_file
    fi
    
    # Handle relative path
    if [[ "$backup_file" != /* ]]; then
        backup_file="$BACKUP_DIR/database/$backup_file"
    fi
    
    if [ ! -f "$backup_file" ]; then
        error_exit "Backup file not found: $backup_file"
    fi
    
    log "Starting database restoration from: $backup_file"
    
    # Extract backup
    local temp_dir="/tmp/ems_db_restore_$$"
    mkdir -p "$temp_dir"
    tar -xzf "$backup_file" -C "$temp_dir"
    
    # Find extracted directory
    local extracted_dir=$(find "$temp_dir" -name "db_*" -type d | head -1)
    if [ -z "$extracted_dir" ]; then
        rm -rf "$temp_dir"
        error_exit "Could not find extracted database directory"
    fi
    
    # Backup current database (safety measure)
    log "Creating safety backup of current database..."
    local safety_backup="/tmp/db_safety_backup_$(date +%Y%m%d_%H%M%S)"
    mongodump --uri="$MONGODB_URI" --out="$safety_backup" 2>/dev/null || log "WARNING: Could not create safety backup"
    
    # Restore database
    echo -e "${YELLOW}⚠️  WARNING: This will overwrite the current database!${NC}"
    read -p "Are you sure you want to continue? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        rm -rf "$temp_dir"
        log "Database restoration cancelled by user"
        return
    fi
    
    log "Restoring database..."
    mongorestore --uri="$MONGODB_URI" --drop "$extracted_dir"/* || error_exit "Database restoration failed"
    
    # Cleanup
    rm -rf "$temp_dir"
    
    success "Database restored successfully from: $(basename $backup_file)"
    log "Safety backup available at: $safety_backup"
}

# Restore application
restore_application() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        echo "Available application backups:"
        ls -1 "$BACKUP_DIR/application"/app_*.tar.gz 2>/dev/null | tail -10
        read -p "Enter backup file name (or full path): " backup_file
    fi
    
    # Handle relative path
    if [[ "$backup_file" != /* ]]; then
        backup_file="$BACKUP_DIR/application/$backup_file"
    fi
    
    if [ ! -f "$backup_file" ]; then
        error_exit "Backup file not found: $backup_file"
    fi
    
    log "Starting application restoration from: $backup_file"
    
    # Backup current application
    if [ -d "$APP_DIR" ]; then
        local safety_backup="${APP_DIR}.backup.$(date +%Y%m%d_%H%M%S)"
        log "Creating safety backup of current application..."
        cp -r "$APP_DIR" "$safety_backup"
        log "Safety backup created at: $safety_backup"
    fi
    
    # Stop application services
    log "Stopping application services..."
    pm2 stop all 2>/dev/null || true
    sudo systemctl stop nginx 2>/dev/null || true
    
    # Extract application backup
    local parent_dir=$(dirname "$APP_DIR")
    log "Extracting application backup..."
    tar -xzf "$backup_file" -C "$parent_dir" || error_exit "Failed to extract application backup"
    
    # Set permissions
    chown -R $USER:$USER "$APP_DIR"
    
    # Install dependencies
    log "Installing application dependencies..."
    cd "$APP_DIR/backend" && npm ci --production
    cd "$APP_DIR/frontend" && npm ci && npm run build
    
    # Start services
    log "Starting application services..."
    pm2 start ecosystem.config.js --env production
    sudo systemctl start nginx
    
    success "Application restored successfully from: $(basename $backup_file)"
}

# Restore uploads
restore_uploads() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        echo "Available upload backups:"
        ls -1 "$BACKUP_DIR/uploads"/uploads_*.tar.gz 2>/dev/null | tail -10
        read -p "Enter backup file name (or full path): " backup_file
    fi
    
    # Handle relative path
    if [[ "$backup_file" != /* ]]; then
        backup_file="$BACKUP_DIR/uploads/$backup_file"
    fi
    
    if [ ! -f "$backup_file" ]; then
        error_exit "Backup file not found: $backup_file"
    fi
    
    log "Starting uploads restoration from: $backup_file"
    
    # Backup current uploads
    if [ -d "/app/uploads" ]; then
        local safety_backup="/app/uploads.backup.$(date +%Y%m%d_%H%M%S)"
        log "Creating safety backup of current uploads..."
        cp -r "/app/uploads" "$safety_backup"
        log "Safety backup created at: $safety_backup"
    fi
    
    # Extract uploads backup
    log "Extracting uploads backup..."
    tar -xzf "$backup_file" -C "/app" || error_exit "Failed to extract uploads backup"
    
    # Set permissions
    chown -R www-data:www-data "/app/uploads"
    chmod -R 755 "/app/uploads"
    
    success "Uploads restored successfully from: $(basename $backup_file)"
}

# Restore configuration
restore_configuration() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        echo "Available configuration backups:"
        ls -1 "$BACKUP_DIR/config"/config_*.tar.gz 2>/dev/null | tail -10
        read -p "Enter backup file name (or full path): " backup_file
    fi
    
    # Handle relative path
    if [[ "$backup_file" != /* ]]; then
        backup_file="$BACKUP_DIR/config/$backup_file"
    fi
    
    if [ ! -f "$backup_file" ]; then
        error_exit "Backup file not found: $backup_file"
    fi
    
    log "Starting configuration restoration from: $backup_file"
    
    # Extract configuration backup
    local temp_dir="/tmp/ems_config_restore_$$"
    mkdir -p "$temp_dir"
    tar -xzf "$backup_file" -C "$temp_dir" 2>/dev/null || true
    
    # Restore application configurations
    if [ -f "$temp_dir/.env.prod" ]; then
        cp "$temp_dir/.env.prod" "$APP_DIR/"
        log "Restored .env.prod"
    fi
    
    if [ -f "$temp_dir/docker-compose.production.yml" ]; then
        cp "$temp_dir/docker-compose.production.yml" "$APP_DIR/"
        log "Restored docker-compose.production.yml"
    fi
    
    if [ -f "$temp_dir/nginx-production-config.conf" ]; then
        cp "$temp_dir/nginx-production-config.conf" "$APP_DIR/"
        log "Restored nginx-production-config.conf"
    fi
    
    if [ -f "$temp_dir/ecosystem.config.js" ]; then
        cp "$temp_dir/ecosystem.config.js" "$APP_DIR/"
        log "Restored ecosystem.config.js"
    fi
    
    # Cleanup
    rm -rf "$temp_dir"
    
    success "Configuration restored successfully from: $(basename $backup_file)"
}

# Full system restore
full_restore() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        echo "Available full backup archives:"
        ls -1 "$BACKUP_DIR/archive"/ems_full_backup_*.tar.gz 2>/dev/null | tail -5
        read -p "Enter backup archive name (or full path): " backup_file
    fi
    
    # Handle relative path
    if [[ "$backup_file" != /* ]]; then
        backup_file="$BACKUP_DIR/archive/$backup_file"
    fi
    
    if [ ! -f "$backup_file" ]; then
        error_exit "Backup archive not found: $backup_file"
    fi
    
    echo -e "${YELLOW}⚠️  WARNING: This will perform a complete system restore!${NC}"
    echo "This includes:"
    echo "- Database (complete replacement)"
    echo "- Application code"
    echo "- User uploads"
    echo "- Configuration files"
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        log "Full system restore cancelled by user"
        return
    fi
    
    log "Starting full system restore from: $backup_file"
    
    # Extract full backup archive
    local temp_dir="/tmp/ems_full_restore_$$"
    mkdir -p "$temp_dir"
    tar -xzf "$backup_file" -C "$temp_dir" || error_exit "Failed to extract full backup archive"
    
    # Restore each component
    echo -e "${BLUE}🔄 Restoring database...${NC}"
    restore_database "$temp_dir/database/db_*.tar.gz"
    
    echo -e "${BLUE}🔄 Restoring application...${NC}"
    restore_application "$temp_dir/application/app_*.tar.gz"
    
    echo -e "${BLUE}🔄 Restoring uploads...${NC}"
    restore_uploads "$temp_dir/uploads/uploads_*.tar.gz"
    
    echo -e "${BLUE}🔄 Restoring configuration...${NC}"
    restore_configuration "$temp_dir/config/config_*.tar.gz"
    
    # Cleanup
    rm -rf "$temp_dir"
    
    # Restart all services
    log "Restarting all services..."
    pm2 restart all
    sudo systemctl restart nginx
    
    success "Full system restore completed successfully from: $(basename $backup_file)"
    echo -e "${GREEN}🎉 System restoration completed!${NC}"
}

# Validate system after restore
validate_system() {
    log "Validating system after restore..."
    
    local validation_failed=false
    
    # Check database connection
    if ! mongo "$MONGODB_URI" --eval "db.runCommand('ping')" >/dev/null 2>&1; then
        log "ERROR: Database connection failed"
        validation_failed=true
    else
        log "Database connection: OK"
    fi
    
    # Check application processes
    if ! pm2 list | grep -q "online"; then
        log "ERROR: Application processes not running"
        validation_failed=true
    else
        log "Application processes: OK"
    fi
    
    # Check nginx
    if ! sudo systemctl is-active nginx >/dev/null 2>&1; then
        log "ERROR: Nginx is not running"
        validation_failed=true
    else
        log "Nginx service: OK"
    fi
    
    # Check application endpoints
    if ! curl -f http://localhost:8000/health >/dev/null 2>&1; then
        log "ERROR: Backend health check failed"
        validation_failed=true
    else
        log "Backend health check: OK"
    fi
    
    if ! curl -f http://localhost:3000 >/dev/null 2>&1; then
        log "ERROR: Frontend access failed"
        validation_failed=true
    else
        log "Frontend access: OK"
    fi
    
    if [ "$validation_failed" = true ]; then
        echo -e "${RED}❌ System validation failed${NC}"
        echo "Check logs: $LOG_FILE"
        return 1
    else
        echo -e "${GREEN}✅ System validation passed${NC}"
        success "System validation completed successfully"
        return 0
    fi
}

# Usage information
usage() {
    echo -e "${BLUE}EMS Disaster Recovery System${NC}"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  list                     List available backups"
    echo "  restore-db [file]        Restore database from backup"
    echo "  restore-app [file]       Restore application from backup"
    echo "  restore-uploads [file]   Restore uploads from backup"
    echo "  restore-config [file]    Restore configuration from backup"
    echo "  full-restore [file]      Perform complete system restore"
    echo "  validate                 Validate system after restore"
    echo ""
    echo "Examples:"
    echo "  $0 list"
    echo "  $0 restore-db db_20250918_120000.tar.gz"
    echo "  $0 full-restore ems_full_backup_20250918_120000.tar.gz"
    echo ""
}

# Main function
main() {
    case "$1" in
        "list")
            list_backups
            ;;
        "restore-db")
            restore_database "$2"
            validate_system
            ;;
        "restore-app")
            restore_application "$2"
            validate_system
            ;;
        "restore-uploads")
            restore_uploads "$2"
            ;;
        "restore-config")
            restore_configuration "$2"
            ;;
        "full-restore")
            full_restore "$2"
            validate_system
            ;;
        "validate")
            validate_system
            ;;
        *)
            usage
            ;;
    esac
}

# Run main function
main "$@"