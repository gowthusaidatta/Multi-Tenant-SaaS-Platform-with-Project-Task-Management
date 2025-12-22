FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY index.html ./
COPY vite.config.js ./
COPY src ./src
EXPOSE 3000
CMD ["npm", "run", "dev"]
