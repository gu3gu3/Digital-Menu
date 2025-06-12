# Use Node.js 18 as base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install dependencies using npm ci for production
RUN npm ci --only=production

# Copy the rest of the application files
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose port from environment variable, default to 3001
ENV PORT 3001
EXPOSE $PORT

# Health check (Adjusted to use ENV PORT)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:${process.env.PORT}/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["npm", "start"] 