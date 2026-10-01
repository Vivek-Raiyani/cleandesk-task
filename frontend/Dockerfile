FROM oven/bun:1-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy all source files
COPY . .

# Build the Next.js app
RUN bun run build

# Expose the frontend port
EXPOSE 3000

# Start the Next.js production server
CMD ["bun", "run", "start"]
