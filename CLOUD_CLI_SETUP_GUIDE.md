# Cloud CLI Setup Guide for DojoPool Bootstrap Kit

This guide will help you set up the necessary tools to automatically generate the DojoPool bootstrap kit using cloud infrastructure.

## 🎯 Overview

The automated workflow uses **DigitalOcean's CLI (`doctl`)** to:
1. Create a temporary cloud server
2. Install dependencies and generate the cache
3. Download the cache file
4. Automatically destroy the server

**Total cost:** ~$0.10-0.20 per run (server runs for ~10-15 minutes)

---

## 📋 Prerequisites

- **DigitalOcean Account:** [Sign up here](https://cloud.digitalocean.com/registrations/new)
- **SSH Key:** For secure server access
- **Command Line Access:** PowerShell (Windows) or Bash (Linux/Mac)

---

## 🔧 Step 1: Install DigitalOcean CLI (`doctl`)

### Windows (PowerShell)

```powershell
# Method 1: Using Chocolatey (recommended)
choco install doctl

# Method 2: Using Scoop
scoop install doctl

# Method 3: Manual download
# Visit: https://github.com/digitalocean/doctl/releases
# Download the Windows binary and add to PATH
```

### Linux/macOS

```bash
# Method 1: Using package managers
# Ubuntu/Debian:
sudo snap install doctl

# macOS with Homebrew:
brew install doctl

# Method 2: Direct download
wget https://github.com/digitalocean/doctl/releases/download/v1.94.0/doctl-1.94.0-linux-amd64.tar.gz
tar xf doctl-1.94.0-linux-amd64.tar.gz
sudo mv doctl /usr/local/bin
```

### Verify Installation

```bash
doctl version
```

---

## 🔑 Step 2: Generate SSH Key (if you don't have one)

### Windows (PowerShell)

```powershell
# Generate SSH key
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# Save to default location: C:\Users\USER\.ssh\id_rsa
# Press Enter for no passphrase (or set one if preferred)

# Display public key
Get-Content C:\Users\USER\.ssh\id_rsa.pub
```

### Linux/macOS

```bash
# Generate SSH key
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# Display public key
cat ~/.ssh/id_rsa.pub
```

---

## 🌐 Step 3: Add SSH Key to DigitalOcean

1. **Copy your public key** from the previous step
2. **Go to DigitalOcean Control Panel:**
   - Visit: https://cloud.digitalocean.com/account/security
   - Click "Add SSH Key"
   - Paste your public key
   - Give it a name (e.g., "DojoPool-Bootstrap")
   - Click "Add SSH Key"

3. **Get the SSH Key Fingerprint:**
   ```bash
   doctl compute ssh-key list
   ```
   Copy the fingerprint (looks like: `aa:bb:cc:dd:ee:ff:00:11:22:33:44:55:66:77:88:99`)

---

## 🔐 Step 4: Authenticate doctl

1. **Generate API Token:**
   - Go to: https://cloud.digitalocean.com/account/api/tokens
   - Click "Generate New Token"
   - Give it a name (e.g., "DojoPool-Bootstrap")
   - Select "Full Access" scope
   - Click "Generate Token"
   - **Copy the token immediately** (you won't see it again!)

2. **Authenticate doctl:**
   ```bash
   doctl auth init
   ```
   - Paste your API token when prompted
   - Press Enter

3. **Verify Authentication:**
   ```bash
   doctl account get
   ```

---

## 🚀 Step 5: Run the Bootstrap Kit Generator

### Windows (PowerShell)

```powershell
# Navigate to your DojoPool directory
cd "C:\Users\USER\Dojo Pool\DojoPool"

# Run the PowerShell script
.\scripts\generate-bootstrap-kit.ps1 -SshKeyFingerprint "your_ssh_key_fingerprint"
```

### Linux/macOS (Bash)

```bash
# Navigate to your DojoPool directory
cd /path/to/DojoPool

# Make the script executable
chmod +x scripts/generate-bootstrap-kit.sh

# Set SSH key fingerprint environment variable
export SSH_KEY_FINGERPRINT="your_ssh_key_fingerprint"

# Run the script
./scripts/generate-bootstrap-kit.sh
```

---

## 📊 What Happens During Execution

The script will automatically:

1. **✅ Pre-flight Checks**
   - Verify `doctl` is installed and authenticated
   - Validate SSH key fingerprint

2. **🚀 Create Server**
   - Spin up a temporary Ubuntu 22.04 server
   - Wait for SSH to be available

3. **🔧 Setup Server**
   - Install Node.js 20
   - Enable Corepack for Yarn
   - Clone DojoPool repository
   - Install all dependencies (populates cache)

4. **📦 Generate Cache**
   - Create `dojopool-yarn-cache.zip`
   - Verify the archive

5. **⬇️ Download Cache**
   - Download the cache file to your local machine
   - Verify the downloaded file

6. **🗑️ Cleanup**
   - Automatically destroy the temporary server
   - **No ongoing charges!**

---

## 💰 Cost Breakdown

| Component | Cost | Duration |
|-----------|------|----------|
| Droplet (s-1vcpu-1gb) | $0.012/hour | ~15 minutes |
| **Total per run** | **~$0.003** | **One-time** |

**Note:** The server is automatically destroyed, so you only pay for the ~15 minutes it runs.

---

## 🔍 Troubleshooting

### Common Issues

#### 1. "doctl not found"
```bash
# Reinstall doctl
# Windows:
choco install doctl

# Linux:
sudo snap install doctl
```

#### 2. "Authentication failed"
```bash
# Re-authenticate
doctl auth init
# Enter your API token again
```

#### 3. "SSH connection failed"
- Check your SSH key is added to DigitalOcean
- Verify the fingerprint is correct
- Ensure your local SSH agent is running

#### 4. "Server creation failed"
- Check your DigitalOcean account has sufficient credits
- Try a different region (change `-DropletRegion` parameter)

### Debug Mode

Add verbose output to see what's happening:

```bash
# Bash version
bash -x ./scripts/generate-bootstrap-kit.sh

# PowerShell version
.\scripts\generate-bootstrap-kit.ps1 -SshKeyFingerprint "fingerprint" -Verbose
```

---

## 🎉 Success!

Once the script completes successfully, you'll have:

- ✅ `dojopool-yarn-cache.zip` in your project directory
- ✅ Ready-to-use offline cache (~1.2GB)
- ✅ Zero ongoing cloud costs

### Next Steps

1. **Extract the cache:**
   ```powershell
   # Windows
   Expand-Archive dojopool-yarn-cache.zip -DestinationPath .yarn/
   
   # Linux/macOS
   unzip dojopool-yarn-cache.zip -d .yarn/
   ```

2. **Build with Docker:**
   ```bash
   docker-compose build
   ```

3. **Enjoy instant builds!** ⚡

---

## 🔄 Alternative Cloud Providers

If you prefer other cloud providers, the scripts can be adapted for:

- **AWS EC2** (using `aws` CLI)
- **Google Cloud** (using `gcloud` CLI)
- **Azure** (using `az` CLI)
- **Linode** (using `linode-cli`)

The core workflow remains the same - only the CLI commands change.

---

## 📞 Support

If you encounter issues:

1. **Check the troubleshooting section above**
2. **Verify all prerequisites are met**
3. **Run with debug mode for detailed output**
4. **Check DigitalOcean account status and credits**

The scripts include comprehensive error handling and will guide you through any issues that arise.
