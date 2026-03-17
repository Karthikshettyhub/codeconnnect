# ── Backend Dockerfile ──────────────────────────────────────────────────────
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm install --omit=dev

# Copy application source
COPY . .

# Expose backend port
EXPOSE 5005

# Start the server
CMD ["node", "server.js"]
