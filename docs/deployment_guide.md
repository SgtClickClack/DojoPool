# Deployment Guide – DojoPool

This guide covers a fresh deployment to a Ubuntu 22.04 LTS host.

## Prerequisites

- Domain name pointing to the server's public IP.
- SSH access as a non-root user with sudo privileges.
- Node 20 & Python 3.11 installed (CI uses the same versions).
- **Certbot** for Let's Encrypt certificates.
- **NGINX 1.22+**.

## 1 ∙ Clone & Build

```bash
sudo apt update && sudo apt install -y git curl build-essential

# Application user
sudo adduser --system --group dojopool
sudo -iu dojopool

# Clone repository
git clone https://github.com/your-org/dojo-pool.git app
cd app

# Build frontend (Vite)
npm ci
npm run build
```

The build output is in `dist/`.

## 2 ∙ Backend (FastAPI example)

```bash
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Uvicorn systemd unit (~/app/deploy/uvicorn.service)
```

Create `deploy/uvicorn.service`:

```ini
[Unit]
Description=DojoPool API
After=network.target

[Service]
User=dojopool
Group=dojopool
WorkingDirectory=/home/dojopool/app
Environment="PYTHONPATH=/home/dojopool/app"
ExecStart=/home/dojopool/app/venv/bin/uvicorn src.backend.main:app --host 127.0.0.1 --port 5000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo cp deploy/uvicorn.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now uvicorn
```

## 3 ∙ Socket.IO Service

`src/services/network/WebSocketService.ts` expects `localhost:3101`. Provide a matching Node service or use the provided example:

```bash
sudo cp deploy/socket.service /etc/systemd/system/
sudo systemctl enable --now socket
```

## 4 ∙ NGINX

```bash
sudo cp nginx/dojopool.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/dojopool.conf /etc/nginx/sites-enabled/

# Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d dojo-pool.example.com --non-interactive --agree-tos -m admin@example.com

sudo nginx -t && sudo systemctl reload nginx
```

## 5 ∙ Post-Deploy Checklist

- `curl -I https://dojo-pool.example.com/health` returns **200**.
- Frontend loads via HTTPS without mixed-content warnings.
- WebSockets connect (check browser dev-tools → Network → WS).
- Systemd services are **active (running)**.
- `sudo nginx -T` shows the installed site config.

---

_Updated {{date}}_
