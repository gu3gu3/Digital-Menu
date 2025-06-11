# Use Node.js 18 as base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy all files from the current directory to the container
# .dockerignore will prevent copying unnecessary files
COPY . .

# Install dependencies
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Create uploads directory (it might be excluded by .dockerignore, so we ensure it exists)
RUN mkdir -p uploads

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["npm", "start"] 