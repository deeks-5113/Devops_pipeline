FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build it
COPY . .
RUN npm run build

EXPOSE 8710

# Serve the production build utilizing Vite's preview server
# We configured the port and host natively inside vite.config.js
CMD ["npm", "run", "preview"]
