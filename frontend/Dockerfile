# ---- Build Stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependency files and install them
# This layer is cached unless package.json or lockfile changes, speeding up rebuilds
COPY package*.json ./
RUN npm ci --only=production

# Copy the rest of the application source code
COPY . .

# Build the Next.js application, which will generate the .next/standalone output
RUN npm run build

# ---- Runtime Stage ----
FROM node:20-alpine AS runner
WORKDIR /app

# Set production environment variables
ENV NODE_ENV=production
# Essential for listening to connections inside the container
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy the necessary build output from the builder stage
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Switch to the non-root user
USER nextjs

# Expose the port the app runs on
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]