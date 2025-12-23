# Multi-Tenant SaaS Platform - Frontend Dockerfile
# Development server configuration using Vite

# Base image: Node.js 20 Alpine for smaller size
FROM node:20-alpine
WORKDIR /app

# Install dependencies first (cached layer)
COPY package.json ./
RUN npm install

# Copy application code
COPY index.html ./
COPY vite.config.js ./
COPY src ./src

# Expose port 3000 for Vite dev server
EXPOSE 3000

# Start Vite development server
# --host 0.0.0.0 allows external connections (required in Docker)
CMD ["npm", "run", "dev"]
