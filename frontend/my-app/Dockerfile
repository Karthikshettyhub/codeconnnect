# ── Frontend Dockerfile (multi-stage production build) ───────────────────────

# Stage 1: Build the Vite React app
FROM node:22-alpine AS builder

WORKDIR /app

# Accept build-time env vars (VITE_ vars are baked in at build time)
ARG VITE_BACKEND_URL=http://localhost:5005
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx config (handles SPA routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
