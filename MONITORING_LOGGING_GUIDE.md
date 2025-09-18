# 📊 EMS Monitoring & Logging Configuration

## Overview
This document provides comprehensive monitoring and logging setup for the Employee Management System (EMS) production environment.

## 🔍 Application Monitoring

### 1. Health Check Endpoints

The application includes built-in health check endpoints:

- **Backend Health**: `GET /api/health`
- **Database Health**: `GET /api/health/db`
- **System Health**: `GET /api/health/system`

### 2. PM2 Monitoring Setup

```bash
# Install PM2 globally
npm install -g pm2

# Start application with monitoring
pm2 start ecosystem.config.js --env production

# Enable monitoring
pm2 install pm2-server-monit

# View monitoring dashboard
pm2 monit

# View application logs
pm2 logs
pm2 logs --lines 100
pm2 logs --follow
```

### 3. System Resource Monitoring

```bash
# Create system monitoring script
cat > /opt/system-monitor.sh << 'EOF'
#!/bin/bash

LOG_FILE="/var/log/ems-system-monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# CPU Usage
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)

# Memory Usage
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.2f", ($3/$2) * 100.0}')

# Disk Usage
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | cut -d'%' -f1)

# Load Average
LOAD_AVG=$(uptime | awk -F'load average:' '{print $2}' | xargs)

# Log metrics
echo "[$DATE] CPU: ${CPU_USAGE}%, Memory: ${MEMORY_USAGE}%, Disk: ${DISK_USAGE}%, Load: ${LOAD_AVG}" >> $LOG_FILE

# Alert if thresholds exceeded
if (( $(echo "$CPU_USAGE > 80" | bc -l) )); then
    echo "[$DATE] ALERT: High CPU usage: ${CPU_USAGE}%" >> $LOG_FILE
fi

if (( $(echo "$MEMORY_USAGE > 85" | bc -l) )); then
    echo "[$DATE] ALERT: High memory usage: ${MEMORY_USAGE}%" >> $LOG_FILE
fi

if [ "$DISK_USAGE" -gt 85 ]; then
    echo "[$DATE] ALERT: High disk usage: ${DISK_USAGE}%" >> $LOG_FILE
fi

EOF

chmod +x /opt/system-monitor.sh

# Add to crontab for monitoring every 5 minutes
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/system-monitor.sh") | crontab -
```

## 📝 Logging Configuration

### 1. Application Logging Setup

#### Backend Logging (Winston)

```javascript
// Add to backend/utils/logger.js
const winston = require('winston');
const path = require('path');

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'ems-backend' },
  transports: [
    // Write all logs to combined.log
    new winston.transports.File({ 
      filename: '/app/logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 10
    }),
    
    // Write error logs to error.log
    new winston.transports.File({ 
      filename: '/app/logs/error.log', 
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5
    }),
    
    // Write access logs to access.log
    new winston.transports.File({ 
      filename: '/app/logs/access.log',
      level: 'http',
      maxsize: 10485760, // 10MB
      maxFiles: 20
    })
  ]
});

// Add console logging in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

### 2. Nginx Access Logs

```nginx
# Add to nginx configuration
http {
    # Custom log format
    log_format detailed '$remote_addr - $remote_user [$time_local] '
                       '"$request" $status $body_bytes_sent '
                       '"$http_referer" "$http_user_agent" '
                       '$request_time $upstream_response_time';
    
    # Access logs
    access_log /var/log/nginx/ems_access.log detailed;
    error_log /var/log/nginx/ems_error.log warn;
    
    server {
        # Application-specific logs
        access_log /var/log/nginx/ems_app_access.log detailed;
        error_log /var/log/nginx/ems_app_error.log;
        
        # Rest of server configuration...
    }
}
```

### 3. Log Rotation Configuration

```bash
# Create logrotate configuration
sudo tee /etc/logrotate.d/ems << 'EOF'
/app/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0644 www-data www-data
    postrotate
        pm2 reloadLogs
    endscript
}

/var/log/nginx/ems_*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0644 www-data adm
    postrotate
        sudo systemctl reload nginx
    endscript
}

/var/log/ems-system-monitor.log {
    weekly
    rotate 8
    compress
    delaycompress
    missingok
    notifempty
    create 0644 root root
}
EOF

# Test logrotate configuration
sudo logrotate -d /etc/logrotate.d/ems
```

## 📈 Performance Monitoring

### 1. Database Monitoring

```bash
# Create MongoDB monitoring script
cat > /opt/mongodb-monitor.sh << 'EOF'
#!/bin/bash

LOG_FILE="/var/log/ems-mongodb-monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Connect to MongoDB and get stats
mongo "$MONGODB_URI" --quiet --eval "
    var stats = db.runCommand('dbStats');
    var serverStatus = db.runCommand('serverStatus');
    
    print('[$DATE] DB Size: ' + (stats.dataSize / 1024 / 1024).toFixed(2) + 'MB');
    print('[$DATE] Collections: ' + stats.collections);
    print('[$DATE] Connections: ' + serverStatus.connections.current + '/' + serverStatus.connections.available);
    print('[$DATE] Operations: ' + JSON.stringify(serverStatus.opcounters));
" >> $LOG_FILE 2>&1

EOF

chmod +x /opt/mongodb-monitor.sh

# Add to crontab (every 10 minutes)
(crontab -l 2>/dev/null; echo "*/10 * * * * /opt/mongodb-monitor.sh") | crontab -
```

### 2. Application Performance Metrics

```javascript
// Add to backend middleware
const performanceMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      timestamp: new Date().toISOString()
    };
    
    // Log slow requests (>1000ms)
    if (duration > 1000) {
      logger.warn('Slow request detected', logData);
    }
    
    // Log performance metrics
    logger.http('Request completed', logData);
  });
  
  next();
};

module.exports = performanceMiddleware;
```

## 🚨 Alerting System

### 1. Email Alerts

```bash
# Install mail utilities
sudo apt install -y mailutils

# Create alert script
cat > /opt/alert-system.sh << 'EOF'
#!/bin/bash

ALERT_EMAIL="admin@formonex.in"
LOG_FILE="/var/log/ems-alerts.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

send_alert() {
    local subject="$1"
    local message="$2"
    
    echo "[$DATE] ALERT: $subject - $message" >> $LOG_FILE
    echo "$message" | mail -s "EMS Alert: $subject" $ALERT_EMAIL
}

# Check if application is running
if ! curl -f http://localhost:8000/health >/dev/null 2>&1; then
    send_alert "Application Down" "EMS backend is not responding on port 8000"
fi

# Check if frontend is accessible
if ! curl -f http://localhost:3000 >/dev/null 2>&1; then
    send_alert "Frontend Down" "EMS frontend is not accessible on port 3000"
fi

# Check disk space
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | cut -d'%' -f1)
if [ "$DISK_USAGE" -gt 90 ]; then
    send_alert "Disk Space Critical" "Disk usage is at ${DISK_USAGE}%"
fi

# Check memory usage
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", ($3/$2) * 100.0}')
if [ "$MEMORY_USAGE" -gt 90 ]; then
    send_alert "Memory Usage Critical" "Memory usage is at ${MEMORY_USAGE}%"
fi

EOF

chmod +x /opt/alert-system.sh

# Add to crontab (every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/alert-system.sh") | crontab -
```

### 2. Slack Integration (Optional)

```bash
# Create Slack webhook alert
cat > /opt/slack-alert.sh << 'EOF'
#!/bin/bash

SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"

send_slack_alert() {
    local message="$1"
    local color="$2"  # good, warning, danger
    
    curl -X POST -H 'Content-type: application/json' \
        --data "{
            \"attachments\": [{
                \"color\": \"$color\",
                \"title\": \"EMS Production Alert\",
                \"text\": \"$message\",
                \"footer\": \"EMS Monitoring\",
                \"ts\": $(date +%s)
            }]
        }" \
        $SLACK_WEBHOOK_URL
}

# Usage example:
# send_slack_alert "Application is down" "danger"
# send_slack_alert "High CPU usage detected" "warning"
# send_slack_alert "Application restarted successfully" "good"

EOF

chmod +x /opt/slack-alert.sh
```

## 📊 Dashboard Setup

### 1. Simple Status Dashboard

```html
<!-- Create /var/www/html/status/index.html -->
<!DOCTYPE html>
<html>
<head>
    <title>EMS System Status</title>
    <meta http-equiv="refresh" content="30">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .status { padding: 10px; margin: 10px 0; border-radius: 5px; }
        .online { background-color: #d4edda; color: #155724; }
        .offline { background-color: #f8d7da; color: #721c24; }
        .warning { background-color: #fff3cd; color: #856404; }
    </style>
</head>
<body>
    <h1>EMS System Status</h1>
    <div id="status-container">
        <!-- Status will be populated by JavaScript -->
    </div>
    
    <script>
        async function checkStatus() {
            const services = [
                { name: 'Backend API', url: '/api/health' },
                { name: 'Database', url: '/api/health/db' },
                { name: 'Frontend', url: '/' }
            ];
            
            const container = document.getElementById('status-container');
            container.innerHTML = '';
            
            for (const service of services) {
                const statusDiv = document.createElement('div');
                statusDiv.className = 'status';
                
                try {
                    const response = await fetch(service.url);
                    if (response.ok) {
                        statusDiv.className += ' online';
                        statusDiv.innerHTML = `✅ ${service.name}: Online`;
                    } else {
                        statusDiv.className += ' offline';
                        statusDiv.innerHTML = `❌ ${service.name}: Offline (${response.status})`;
                    }
                } catch (error) {
                    statusDiv.className += ' offline';
                    statusDiv.innerHTML = `❌ ${service.name}: Error - ${error.message}`;
                }
                
                container.appendChild(statusDiv);
            }
            
            // Add timestamp
            const timestamp = document.createElement('div');
            timestamp.innerHTML = `Last updated: ${new Date().toLocaleString()}`;
            timestamp.style.fontSize = '12px';
            timestamp.style.color = '#666';
            timestamp.style.marginTop = '20px';
            container.appendChild(timestamp);
        }
        
        // Check status on load and every 30 seconds
        checkStatus();
        setInterval(checkStatus, 30000);
    </script>
</body>
</html>
```

### 2. Log Viewer Setup

```bash
# Create simple log viewer
cat > /var/www/html/logs/index.php << 'EOF'
<?php
// Simple log viewer (password protected)
session_start();

$password = 'your-secure-log-viewer-password';

if (!isset($_SESSION['authenticated'])) {
    if (isset($_POST['password']) && $_POST['password'] === $password) {
        $_SESSION['authenticated'] = true;
    } else {
        ?>
        <!DOCTYPE html>
        <html>
        <head><title>Log Viewer - Login</title></head>
        <body>
            <form method="post">
                <input type="password" name="password" placeholder="Password" required>
                <button type="submit">Login</button>
            </form>
        </body>
        </html>
        <?php
        exit;
    }
}

$logFiles = [
    'Application Logs' => '/app/logs/combined.log',
    'Error Logs' => '/app/logs/error.log',
    'Nginx Access' => '/var/log/nginx/ems_access.log',
    'Nginx Error' => '/var/log/nginx/ems_error.log',
    'System Monitor' => '/var/log/ems-system-monitor.log'
];

$selectedLog = $_GET['log'] ?? array_values($logFiles)[0];
$lines = $_GET['lines'] ?? 100;
?>

<!DOCTYPE html>
<html>
<head>
    <title>EMS Log Viewer</title>
    <style>
        body { font-family: monospace; margin: 20px; }
        select, input { margin: 5px; padding: 5px; }
        .log-content { background: #f5f5f5; padding: 15px; border: 1px solid #ddd; }
        pre { white-space: pre-wrap; word-wrap: break-word; }
    </style>
</head>
<body>
    <h1>EMS Log Viewer</h1>
    
    <form method="get">
        <select name="log">
            <?php foreach ($logFiles as $name => $path): ?>
                <option value="<?= $path ?>" <?= $selectedLog === $path ? 'selected' : '' ?>>
                    <?= $name ?>
                </option>
            <?php endforeach; ?>
        </select>
        
        <input type="number" name="lines" value="<?= $lines ?>" min="10" max="1000">
        <button type="submit">View Logs</button>
        <a href="?refresh=1">Auto Refresh</a>
    </form>
    
    <div class="log-content">
        <pre><?php
            if (file_exists($selectedLog)) {
                echo htmlspecialchars(shell_exec("tail -n $lines " . escapeshellarg($selectedLog)));
            } else {
                echo "Log file not found: $selectedLog";
            }
        ?></pre>
    </div>
    
    <?php if (isset($_GET['refresh'])): ?>
    <script>setTimeout(() => location.reload(), 10000);</script>
    <?php endif; ?>
</body>
</html>
EOF
```

## 🔧 Monitoring Commands

### Daily Monitoring Commands

```bash
# System status
systemctl status nginx
pm2 status
docker ps  # if using Docker

# Resource usage
htop
df -h
free -h
iostat

# Network connections
netstat -tlnp
ss -tlnp

# Log analysis
tail -f /app/logs/combined.log
tail -f /var/log/nginx/ems_access.log
journalctl -u nginx -f

# Database status
mongo "$MONGODB_URI" --eval "db.runCommand('ping')"
mongo "$MONGODB_URI" --eval "db.stats()"
```

### Performance Analysis

```bash
# Analyze slow requests
grep -E "duration\":[5-9][0-9]{2,}" /app/logs/combined.log | tail -20

# Check error patterns
grep "ERROR" /app/logs/error.log | tail -20

# Monitor real-time requests
tail -f /var/log/nginx/ems_access.log | grep -E "(4[0-9]{2}|5[0-9]{2})"

# Database query analysis
mongo "$MONGODB_URI" --eval "db.runCommand('profile', {get: 'system.profile'})"
```

This comprehensive monitoring and logging setup provides:

1. **Health Monitoring**: Application, database, and system health checks
2. **Performance Tracking**: Request duration, resource usage, and bottleneck identification
3. **Alerting**: Email and Slack notifications for critical issues
4. **Log Management**: Centralized logging with rotation and analysis tools
5. **Dashboards**: Simple status dashboard and log viewer
6. **Automated Monitoring**: Cron jobs for continuous monitoring

The system is designed to be lightweight yet comprehensive, providing essential monitoring capabilities without significant overhead.