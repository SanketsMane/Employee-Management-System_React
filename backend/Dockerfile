# Production-ready Node.js backend optimized for Ubuntu AWS deployment
FROM node:20-bullseye-slim AS production

# Install system dependencies and security updates
RUN apt-get update && \
    apt-get install -y curl dumb-init && \
    apt-get upgrade -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN groupadd --gid 1001 nodejs && \
    useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nodejs

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production --silent && \
    npm cache clean --force

# Copy application code
COPY . .

# Create necessary directories and set permissions
RUN mkdir -p uploads logs temp && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port 8000 for production
EXPOSE 8000

# Health check for port 8000
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]
