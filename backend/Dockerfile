# Multi-Tenant SaaS Platform - Backend Dockerfile
# Multi-stage build for optimized production deployment

# Base stage: Node.js 20 Alpine for smaller image size
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies first (cached layer)
COPY package.json ./
RUN npm install --production

# Copy application code
COPY src ./src
COPY migrations ./migrations
COPY seeds ./seeds

# Install curl for Docker health checks
RUN apk add --no-cache curl

# Expose port 5000 for API server
EXPOSE 5000

# Start application
# index.js automatically runs migrations and seeds on startup
CMD ["node", "src/index.js"]
