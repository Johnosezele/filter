FROM node:22-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY lib ./lib
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "lib/index.js"]
