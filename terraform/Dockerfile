# Stage 1 - build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig*.json ./
COPY src ./src
RUN npm ci --omit=dev
RUN npm run build

# Stage 2 - runtime
FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.js"]
