# Use an official Node.js runtime as a parent image (LTS version)
FROM node:20

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
# This layer is cached if these files don't change
COPY package*.json ./

# Install app dependencies (including devDependencies needed for build)
# Using npm ci is generally preferred if you have a package-lock.json
# RUN npm ci
RUN npm install

# Copy the rest of the application code into the container
COPY . .

# Run the TypeScript build command
# This will compile TS files to JS in the 'dist' directory (based on tsconfig.json)
# If this step fails, it means the code has errors even in a clean environment
RUN npx tsc

# The backend app listens on port 3001
EXPOSE 3001

# Define the command to run the compiled backend server
# Assumes tsconfig.json compiles src/index.ts to dist/index.js
CMD [ "node", "dist/index.js" ] 