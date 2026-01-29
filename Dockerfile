FROM node:18-alpine

WORKDIR /app

# Install OpenSSL and other dependencies for Prisma
RUN apk add --no-cache openssl openssl-dev

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client with correct binary targets
RUN npx prisma generate

# Run database migrations
RUN npx prisma migrate deploy || echo "No migrations to run"

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "run", "start:production"]
