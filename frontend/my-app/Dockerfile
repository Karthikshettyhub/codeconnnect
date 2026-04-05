# ── Frontend Dockerfile ─────────────────────────────────────────────────────

# ── Stage 1: Build the React app ────────────────────────────────────────────
# Named "builder" so Stage 2 can copy files from it
FROM node:22-alpine AS builder

WORKDIR /app

# Accept environment variables at build time from docker-compose
# VITE_ variables are baked into the JS bundle at build time
# They are NOT runtime variables - Vite embeds them during npm run build
ARG VITE_BACKEND_URL=http://localhost:5005
ARG VITE_JUDGE0_API=https://ce.judge0.com/submissions?base64_encoded=false&wait=true

ENV VITE_BACKEND_URL=$VITE_BACKEND_URL
ENV VITE_JUDGE0_API=$VITE_JUDGE0_API

# Copy package files first for layer caching
COPY package*.json ./

# npm ci is stricter than npm install
# Uses exact versions from package-lock.json - production standard
RUN npm ci

# Copy rest of source code
COPY . .

# Build React app - output goes to /app/dist
RUN npm run build

# ── Stage 2: Serve with Nginx ────────────────────────────────────────────────
# Throws away Node completely after build
# Final image only has Nginx + your built static files
# Much smaller and more secure than keeping Node around
FROM nginx:alpine

# Copy only the built files from Stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx config
# Handles SPA routing so page refresh works on /room/:roomId
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]