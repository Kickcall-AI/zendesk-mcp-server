# Use Node.js LTS version
FROM node:20-slim

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies and mcp-proxy globally
RUN npm install && npm install -g mcp-proxy

# Copy source code
COPY . .

# Copy .env file into the container
COPY .env .env

# Expose MCP proxy port
EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production

# Start the application
CMD ["npm", "start"]