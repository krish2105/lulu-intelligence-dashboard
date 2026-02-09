FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build for production
RUN npm run build

# Copy static assets into standalone output
RUN cp -r .next/static .next/standalone/.next/static 2>/dev/null || true
RUN cp -r public .next/standalone/public 2>/dev/null || true

# Expose port
EXPOSE 3000

# Run standalone server
CMD ["node", ".next/standalone/server.js"]
