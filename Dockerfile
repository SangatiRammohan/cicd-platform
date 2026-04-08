# ── Stage 1: deps ─────────────────────────────────────────────────────────────
# Purpose: install ONLY production dependencies
# We do this in a separate stage so the cache is reused on every build
# as long as package.json and package-lock.json haven't changed
FROM node:20-alpine AS deps
WORKDIR /app

# Copy lockfiles FIRST — Docker layer cache key
# If these files are unchanged, the npm ci below is served from cache
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ── Stage 2: build ────────────────────────────────────────────────────────────
# Purpose: install ALL deps (including devDeps) and run the build step
# For plain JS (no TypeScript) the build step just copies src as-is
# If you add TypeScript later, you run tsc here
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Copy all source files
COPY src/ ./src/

# ── Stage 3: runner (final production image) ──────────────────────────────────
# Purpose: lean runtime-only image — no devDeps, no build tools, no test files
# Only what is needed to run the app in production is copied here
FROM node:20-alpine AS runner
WORKDIR /app

# Create a non-root user and group
# Running as root inside a container is a critical security risk:
# if an attacker escapes the container they get root on the host node
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy production node_modules from deps stage (no devDeps)
COPY --from=deps  --chown=appuser:appgroup /app/node_modules ./node_modules

# Copy application source from build stage
COPY --from=build --chown=appuser:appgroup /app/src ./src

# Copy package.json so process.env.npm_package_version works
COPY --chown=appuser:appgroup package.json .

# Switch to non-root user — all subsequent commands run as appuser
USER appuser

# Document which port the app listens on (does not publish it)
EXPOSE 3000

# Health check — Docker itself will call this every 30s
# K8s ignores this and uses its own probes, but useful for local testing
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

# MUST use exec form ["node", "..."] not shell form "node ..."
# Exec form: node is PID 1, receives SIGTERM directly → graceful shutdown works
# Shell form: /bin/sh is PID 1, swallows SIGTERM → graceful shutdown BREAKS
CMD ["node", "src/server.js"]