# ── Backend Dockerfile ──────────────────────────────────────────────────────

# Use Node 18 on Alpine Linux (tiny, production standard)
FROM node:18-alpine

RUN apk add --no-cache docker-cli
# All commands run inside /app
WORKDIR /app

# Copy package files first for better layer caching
# If code changes but packages dont, Docker skips reinstalling
COPY package*.json ./

# Install only production dependencies, skip devDependencies
RUN npm install --omit=dev

# Copy rest of source code
COPY . .

# Tell Docker this container uses port 5005
EXPOSE 5005

# Start the server
CMD ["node", "server.js"]