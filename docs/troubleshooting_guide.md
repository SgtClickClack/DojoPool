# Troubleshooting – DojoPool

| Problem | Quick Check | Fix |
|---------|-------------|-----|
| **NGINX 502 Bad Gateway** | `systemctl status uvicorn` & `socket` services | Restart or inspect logs in `/var/log/` |
| **WebSocket disconnects** | Browser console – WS close code | Ensure `/socket.io/` location exists and `proxy_set_header Upgrade` present |
| **Certbot renewal fails** | `sudo certbot renew --dry-run` | Make sure port 80 open, `server_name` correct |
| **Build fails (CI)** | GitHub Actions log – Node/Python version | Bump `ci.yml` versions / clear npm cache |
| **Rate limit 429** | Response header `X-RateLimit-Remaining` | Teach client to back-off or raise NGINX burst value |
| **Slow static assets** | `curl -I /assets/main.js` – `Cache-Control`? | Ensure build copied to `/var/www/dojopool/assets` |

## Logs & Monitoring

* **Systemd** – `journalctl -u uvicorn -f`
* **NGINX** – `/var/log/nginx/error.log`
* **Socket.IO** – `journalctl -u socket -f`

## Rebuild & Redeploy

```bash
cd ~/app
git pull
npm ci && npm run build
systemctl restart uvicorn socket
sudo nginx -t && sudo systemctl reload nginx
```

---

_Last updated {{date}}_