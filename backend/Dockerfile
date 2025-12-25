# Multi-Tenant SaaS Platform - Backend Dockerfile
# Production-ready Node.js API server with PostgreSQL support

FROM node:20-alpine

WORKDIR /app

# Install system dependencies including curl for health checks
RUN apk add --no-cache curl

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies for better compatibility)
RUN npm install

# Copy application code
COPY src ./src
COPY migrations ./migrations

# Create seeds directory if it doesn't exist
RUN mkdir -p ./seeds

# Expose port 5000
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start the application using npm start (which runs: node src/index.js)
CMD ["npm", "start"]
