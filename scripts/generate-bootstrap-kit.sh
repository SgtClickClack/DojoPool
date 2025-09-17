#!/bin/bash

# DojoPool Bootstrap Kit Generator
# This script creates a temporary cloud server, generates the offline cache,
# downloads it, and cleans up - all automatically

set -e  # Exit on any error

# Configuration
DROPLET_NAME="dojo-cache-builder-$(date +%s)"
DROPLET_SIZE="s-1vcpu-1gb"
DROPLET_REGION="nyc3"
DROPLET_IMAGE="ubuntu-22-04-x64"
REPO_URL="https://github.com/SgtClickClack/DojoPool.git"
CACHE_FILE="dojopool-yarn-cache.zip"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if doctl is installed and authenticated
check_doctl() {
    if ! command -v doctl &> /dev/null; then
        print_error "doctl is not installed. Please install it first:"
        echo "  Visit: https://docs.digitalocean.com/reference/doctl/how-to/install/"
        exit 1
    fi
    
    if ! doctl account get &> /dev/null; then
        print_error "doctl is not authenticated. Please run:"
        echo "  doctl auth init"
        exit 1
    fi
    
    print_success "doctl is installed and authenticated"
}

# Function to check if SSH key exists
check_ssh_key() {
    if [ -z "$SSH_KEY_FINGERPRINT" ]; then
        print_error "SSH_KEY_FINGERPRINT environment variable is not set."
        echo "Please set it with your DigitalOcean SSH key fingerprint:"
        echo "  export SSH_KEY_FINGERPRINT=your_key_fingerprint"
        echo ""
        echo "To get your SSH key fingerprint, run:"
        echo "  doctl compute ssh-key list"
        exit 1
    fi
    
    print_success "SSH key fingerprint is set: $SSH_KEY_FINGERPRINT"
}

# Function to create the droplet
create_droplet() {
    print_status "Creating temporary cloud server..."
    
    DROPLET_ID=$(doctl compute droplet create $DROPLET_NAME \
        --image $DROPLET_IMAGE \
        --size $DROPLET_SIZE \
        --region $DROPLET_REGION \
        --ssh-keys $SSH_KEY_FINGERPRINT \
        --wait \
        --format "ID" \
        --no-header)
    
    if [ -z "$DROPLET_ID" ]; then
        print_error "Failed to create droplet"
        exit 1
    fi
    
    print_success "Server created with ID: $DROPLET_ID"
    
    # Wait for server to be fully ready
    print_status "Waiting for server to be ready..."
    sleep 30
    
    # Get the server's IP address
    DROPLET_IP=$(doctl compute droplet get $DROPLET_ID --format "PublicIPv4" --no-header)
    print_success "Server IP is: $DROPLET_IP"
    
    # Wait for SSH to be available
    print_status "Waiting for SSH to be available..."
    for i in {1..30}; do
        if ssh -o "StrictHostKeyChecking=no" -o "ConnectTimeout=5" root@$DROPLET_IP "echo 'SSH ready'" &> /dev/null; then
            break
        fi
        echo -n "."
        sleep 2
    done
    echo ""
}

# Function to setup server and generate cache
setup_server_and_generate_cache() {
    print_status "Setting up server and generating cache..."
    
    ssh -o "StrictHostKeyChecking=no" root@$DROPLET_IP << 'EOF'
        set -e
        
        echo "🔄 Updating system packages..."
        apt update && apt install git zip curl wget -y
        
        echo "🔄 Installing Node.js 20..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
        
        echo "🔄 Enabling Corepack for Yarn..."
        corepack enable
        
        echo "🔄 Cloning DojoPool repository..."
        git clone https://github.com/SgtClickClack/DojoPool.git
        cd DojoPool
        
        echo "🔄 Installing dependencies to populate cache..."
        yarn install
        
        echo "🔄 Creating cache archive..."
        zip -r dojopool-yarn-cache.zip .yarn/cache
        
        echo "🔄 Verifying cache archive..."
        ls -lh dojopool-yarn-cache.zip
        
        echo "✅ Cache generation completed successfully!"
EOF
    
    print_success "Cache has been generated and zipped on the server"
}

# Function to download the cache file
download_cache() {
    print_status "Downloading cache file..."
    
    # Download the file
    scp -o "StrictHostKeyChecking=no" root@$DROPLET_IP:/root/DojoPool/$CACHE_FILE .
    
    if [ -f "$CACHE_FILE" ]; then
        FILE_SIZE=$(ls -lh $CACHE_FILE | awk '{print $5}')
        print_success "Cache file downloaded: $CACHE_FILE ($FILE_SIZE)"
    else
        print_error "Failed to download cache file"
        exit 1
    fi
}

# Function to destroy the droplet
cleanup_droplet() {
    print_status "Destroying temporary server..."
    
    doctl compute droplet delete $DROPLET_ID --force
    
    print_success "Server destroyed successfully"
}

# Function to verify the downloaded cache
verify_cache() {
    print_status "Verifying downloaded cache..."
    
    if [ ! -f "$CACHE_FILE" ]; then
        print_error "Cache file not found: $CACHE_FILE"
        return 1
    fi
    
    # Check if it's a valid zip file
    if ! unzip -t $CACHE_FILE &> /dev/null; then
        print_error "Cache file is corrupted or not a valid zip file"
        return 1
    fi
    
    # Count files in the cache
    FILE_COUNT=$(unzip -l $CACHE_FILE | tail -1 | awk '{print $2}')
    print_success "Cache verification passed: $FILE_COUNT files in archive"
    
    return 0
}

# Main execution
main() {
    echo "🚀 DojoPool Bootstrap Kit Generator"
    echo "=================================="
    echo ""
    
    # Pre-flight checks
    check_doctl
    check_ssh_key
    
    # Set up trap to ensure cleanup on exit
    trap cleanup_droplet EXIT
    
    # Execute the workflow
    create_droplet
    setup_server_and_generate_cache
    download_cache
    verify_cache
    
    echo ""
    print_success "🎉 Bootstrap kit generation completed successfully!"
    echo ""
    echo "📦 Your cache file: $CACHE_FILE"
    echo "📁 File size: $(ls -lh $CACHE_FILE | awk '{print $5}')"
    echo ""
    echo "🔧 Next steps:"
    echo "  1. Extract the cache: unzip $CACHE_FILE -d .yarn/"
    echo "  2. Build with Docker: docker-compose build"
    echo ""
    echo "💡 Your Docker builds will now be instant and offline!"
}

# Run the main function
main "$@"
