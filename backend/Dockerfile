# ── Backend Dockerfile ──────────────────────────────────────────────────────
FROM node:18-alpine

# install docker CLI so backend can spin up sandbox containers
RUN apk add --no-cache docker-cli

# Set working directory inside container
WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm install --omit=dev

# Copy application source
COPY . .

# Expose backend port
EXPOSE 5005

# Start backend server directly
CMD ["node", "server.js"]
