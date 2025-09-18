# Production-ready frontend optimized for Ubuntu AWS deployment
FROM nginx:stable-alpine AS production

# Install curl for health checks and security updates
RUN apk update && \
    apk add --no-cache curl && \
    apk upgrade

# Copy pre-built application files
COPY dist/ /usr/share/nginx/html

# Copy optimized nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Set proper permissions for security
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Create nginx user directories
RUN mkdir -p /var/cache/nginx/client_temp && \
    chown -R nginx:nginx /var/cache/nginx

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Start nginx with non-daemon mode
CMD ["nginx", "-g", "daemon off;"]
