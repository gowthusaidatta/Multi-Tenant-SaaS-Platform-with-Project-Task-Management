# Multi-stage build for backend
FROM node:20-alpine AS base
WORKDIR /app

COPY package.json ./
RUN npm install --production

COPY src ./src
COPY migrations ./migrations
COPY seeds ./seeds

# install curl for healthcheck
RUN apk add --no-cache curl

EXPOSE 5000

CMD ["node", "src/index.js"]
