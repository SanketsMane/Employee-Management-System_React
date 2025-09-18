# Multi-stage build for optimized production image
# Stage 1: Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build arguments for environment variables (Same domain API via proxy)
ARG VITE_API_BASE_URL=https://ems.formonex.in/api
ARG VITE_WEBSOCKET_URL=wss://ems.formonex.in
ARG VITE_APP_NAME=Formonex EMS - Employee Management System
ARG VITE_APP_VERSION=1.0.0
ARG VITE_ENVIRONMENT=production
ARG VITE_COMPANY_NAME=Formonex
ARG VITE_ENABLE_WEBSOCKET=true
ARG VITE_ENABLE_NOTIFICATIONS=true
ARG VITE_ENABLE_FILE_UPLOAD=true

# Set environment variables for build
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_WEBSOCKET_URL=${VITE_WEBSOCKET_URL}
ENV VITE_APP_NAME=${VITE_APP_NAME}
ENV VITE_APP_VERSION=${VITE_APP_VERSION}
ENV VITE_ENVIRONMENT=${VITE_ENVIRONMENT}
ENV VITE_COMPANY_NAME=${VITE_COMPANY_NAME}
ENV VITE_ENABLE_WEBSOCKET=${VITE_ENABLE_WEBSOCKET}
ENV VITE_ENABLE_NOTIFICATIONS=${VITE_ENABLE_NOTIFICATIONS}
ENV VITE_ENABLE_FILE_UPLOAD=${VITE_ENABLE_FILE_UPLOAD}

# Build the application
RUN npm run build

# Stage 2: Production stage
FROM nginx:1.25-alpine AS production

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built application from build stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create nginx user and set permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80 || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
