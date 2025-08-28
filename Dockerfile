# Multi-stage build for combined frontend and backend
FROM node:18-alpine as builder

# Set working directory
WORKDIR /app

# Copy package files for both frontend and backend
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies for both
RUN cd backend && npm ci --only=production
RUN cd frontend && npm ci

# Copy source code
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Build frontend for production
RUN cd frontend && npm run build

# Production stage
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy backend with dependencies
COPY --from=builder /app/backend/ ./backend/

# Copy built frontend
COPY --from=builder /app/frontend/build/ ./frontend/build/

# Copy data directory
COPY data/ ./data/

# Expose port
EXPOSE 3001

# Create volume for data persistence
VOLUME ["/app/data"]

# Start the backend server (which now serves frontend too)
WORKDIR /app/backend
CMD ["node", "server.js"]
