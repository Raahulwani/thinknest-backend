# Minimal runtime image that self-contains a tiny Node server
# Stage 1 - build the TypeScript backend from subfolder
FROM node:18-alpine AS builder
WORKDIR /app
ENV NODE_ENV=development

# Copy package and tsconfig from the subfolder
COPY thinknest-backend/package*.json ./
COPY thinknest-backend/tsconfig*.json ./

RUN npm ci

# Copy source code
COPY thinknest-backend/src ./src

# Build to dist/
RUN npm run build

# Stage 2 - production runtime
FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/server.js"]
