FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY server.js version.json ./

EXPOSE 3000
CMD ["node", "server.js"]