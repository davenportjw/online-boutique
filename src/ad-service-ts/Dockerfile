# Use the official Node.js 22 image.
FROM node:22-slim

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure both package.json AND package-lock.json are copied.
# Copying this first prevents re-running npm install on every code change.
COPY package*.json ./

# Install production dependencies.
RUN npm install --production

# Copy local code to the container image.
COPY . .

# Build the TypeScript code.
RUN npm run build

# Run the web service on container startup.
CMD [ "npm", "start" ]
