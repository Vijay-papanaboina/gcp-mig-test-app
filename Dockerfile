FROM node:20-alpine

WORKDIR /app

# Copy package files first (for layer caching)
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application code
COPY main.js ./

# Expose port 80
EXPOSE 8080

# Run as non-root user (Alpine node image has 'node' user)
USER node

# Start the application
CMD ["node", "main.js"]
