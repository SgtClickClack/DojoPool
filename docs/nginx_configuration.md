# NGINX Configuration for DojoPool

This document describes the production NGINX setup used to serve the DojoPool platform.

## Features

1. **HTTP→HTTPS redirect** – all HTTP traffic is permanently redirected to HTTPS.
2. **Modern TLS** – TLS 1.2/1.3 only, with Mozilla "modern" cipher-suite.
3. **HSTS** – 2-year max-age, includeSubDomains.
4. **Security headers** – CSP, XFO, XSS, Referrer, Permissions-Policy.
5. **WebSocket support** – `/socket.io/` proxied to the Socket.IO service on `localhost:3101` with the required upgrade headers.
6. **Rate limiting** – `10 req/sec` with a `20` burst for all `/api/*` and websocket requests. Limits are applied per remote IP using the shared memory zone `req_limit_per_ip`.
7. **Static files** – all assets built by Vite are served from `/assets/*` via the `alias` directive with 30-day immutable cache headers.
8. **Progressive Web App** – service worker and manifest are cached with `must-revalidate` to ensure clients always pick up new versions.
9. **Health endpoint** – `/health` returns `200 OK` so load-balancers and uptime monitors can verify instance health without hitting the application runtime.

## File Locations

| Path | Purpose |
|------|---------|
| `/etc/nginx/nginx.conf` | global NGINX config |
| `/etc/nginx/sites-enabled/dojopool.conf` | site-specific config imported from `nginx/dojopool.conf` in this repo |
| `/var/www/dojopool` | built frontend (copied from `dist/`) |
| `/var/www/dojopool/assets` | fingerprinted static assets |

## Deploy Steps

```bash
# 1. Install NGINX (>= 1.22 for stable HTTP/2 & TLSv1.3)
apt install nginx

# 2. Copy config
cp nginx/dojopool.conf /etc/nginx/sites-available/
ln -s /etc/nginx/sites-available/dojopool.conf /etc/nginx/sites-enabled/

# 3. Obtain/renew certificates (LetsEncrypt)
certbot certonly --nginx -d dojo-pool.example.com

# 4. Reload NGINX
nginx -t && systemctl reload nginx
```

> **Tip** Run `curl -I https://dojo-pool.example.com/health` to verify that the instance is healthy after deployment.

## WebSocket Notes

Browsers initiate a `GET` with `Upgrade: websocket`; the location block for `/socket.io/` passes the `Upgrade`/`Connection` headers to the Socket.IO service.

## Rate-Limiting Tuning

* Increase the zone size (`10m`) if the server sees high cardinality of client IPs.
* Adjust the `rate` or `burst` directives to soften or harden limits.
* To exempt internal traffic, add `limit_req_status 429;` and handle 429s client-side.

## Security Checklist

* 🔒 **Certificates**: managed by Certbot; auto-renew cron job installed by Certbot.
* 🕵️ **Headers**: all modern security headers enabled.
* 📈 **Monitoring**: `/health` provides a lightweight probe.

---

_Last updated: {{date}}_