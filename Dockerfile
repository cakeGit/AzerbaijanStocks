# Multi-stage Dockerfile for AZT Stock Exchange

# Stage 1: build backend
FROM node:18-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install --production
COPY backend ./

# Stage 2: build frontend
FROM node:18-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend ./
RUN npm run build

# Stage 3: production image
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

# Copy backend with dependencies
COPY --from=backend-build /app/backend ./backend
# Copy frontend build
COPY --from=frontend-build /app/frontend/dist ./frontend/dist
# Copy data directory
COPY data ./data

EXPOSE 3001

CMD ["node", "backend/server.js"]