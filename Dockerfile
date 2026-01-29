FROM node:18-bullseye-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl libssl1.1 \
  && rm -rf /var/lib/apt/lists/*

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
