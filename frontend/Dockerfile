# Multi-Tenant SaaS Platform - Frontend Dockerfile
# Production build with optimized static serving

# Build stage
FROM node:20-alpine as builder
WORKDIR /app
COPY package.json ./
RUN npm install
COPY index.html vite.config.js ./
COPY .env.development ./
COPY src ./src
RUN npm run build

# Runtime stage - use lightweight httpserver
FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist

# Expose port 3000
EXPOSE 3000

# Serve built files without file watching
CMD ["serve", "-s", "dist", "-l", "3000"]
