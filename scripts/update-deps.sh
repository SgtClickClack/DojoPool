#!/bin/bash

# Update npm to latest version
npm install -g npm@latest

# Clean npm cache
npm cache clean --force

# Remove existing node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Install dependencies with latest versions
npm install

# Run security audit fix
npm audit fix --force

# Update all dependencies to their latest versions
npm update

# Run security audit again to verify fixes
npm audit

# Generate new package-lock.json
npm install

echo "Dependencies updated successfully!" 