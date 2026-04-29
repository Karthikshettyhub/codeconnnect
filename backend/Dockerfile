# Use lightweight Node.js image
FROM node:18-alpine

# install docker CLI so backend can spin up sandbox containers
RUN apk add --no-cache docker-cli

# Set working directory inside container
WORKDIR /app

# Copy package.json and package-lock.json (if any)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all backend code
COPY . .

# Expose backend port
EXPOSE 5005

# Start backend server directly
CMD ["node", "server.js"]