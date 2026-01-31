FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build for production to avoid chunk loading issues
RUN npm run build

# Expose port
EXPOSE 3000

# Run in production mode
CMD ["npm", "start"]
