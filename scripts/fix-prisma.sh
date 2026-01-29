#!/bin/bash

# Fix Prisma for Railway deployment
echo "Fixing Prisma for Railway deployment..."

# Install OpenSSL for Alpine Linux
apk add --no-cache openssl

# Regenerate Prisma client with correct binary targets
npx prisma generate

# Run migrations
npx prisma migrate deploy

echo "Prisma setup complete!"
