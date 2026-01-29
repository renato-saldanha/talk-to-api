FROM node:20.2.0-alpine3.18 AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npm run build
RUN npx prisma generate

RUN apk add --no-cache netcat-openbsd

FROM node:20.2.0-alpine3.18

WORKDIR /app

RUN apk add --no-cache netcat-openbsd openssl1.1-compat libc6-compat && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy Prisma files and package.json first
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

# Install production dependencies first
RUN npm ci --only=production

# Copy Prisma CLI and engine from builder (already installed there)
# This ensures we have the correct Prisma Engine binary
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Regenerate Prisma Client to ensure it's correct for this stage
RUN npx prisma generate

# Copy built application
COPY --from=builder /app/dist ./dist

# Copy scripts from build context (not from builder stage)
COPY entrypoint.sh wait-for-postgres.sh ./

# Ensure scripts have execute permissions and LF line endings
RUN chmod +x entrypoint.sh wait-for-postgres.sh && \
    sed -i 's/\r$//' entrypoint.sh wait-for-postgres.sh || true

# Change ownership of all files to nestjs user
RUN chown -R nestjs:nodejs /app

# Switch to nestjs user
USER nestjs

EXPOSE 8000

ENTRYPOINT ["/bin/sh", "./entrypoint.sh"]
