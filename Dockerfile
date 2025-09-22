# Minimal runtime image that self-contains a tiny Node server
# Stage 1 - build the TypeScript backend from subfolder
FROM node:18-alpine AS builder
WORKDIR /app
ENV NODE_ENV=development

# Copy the entire backend subfolder (simplifies path issues)
COPY thinknest-backend ./thinknest-backend

# Install and build from within the subfolder
WORKDIR /app/thinknest-backend
RUN npm install
RUN npm run build

# Stage 2 - production runtime
FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Copy only the runtime artifacts from the built subfolder
COPY --from=builder /app/thinknest-backend/package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/thinknest-backend/dist ./dist

EXPOSE 3000
CMD ["node", "dist/server.js"]
