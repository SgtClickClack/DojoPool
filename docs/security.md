# Security Guide – DojoPool

## Threat Model

1. **Transport** – Protect data in transit with TLS 1.2+/HSTS.
2. **Application** – Sanitise user input, enforce auth.
3. **Infrastructure** – Least-privilege file & process ownership, rate limiting, logging.

## TLS Configuration

* TLS versions: `TLSv1.2`, `TLSv1.3` only.
* Ciphers: Mozilla modern suite (see `nginx/dojopool.conf`).
* HSTS: `max-age=63072000; includeSubDomains`.
* OCSP stapling enabled by default with Certbot.

## HTTP Security Headers

| Header | Value |
|--------|-------|
| X-Frame-Options | DENY |
| X-Content-Type-Options | nosniff |
| X-XSS-Protection | 1; mode=block |
| Content-Security-Policy | See NGINX config |
| Referrer-Policy | strict-origin-when-cross-origin |
| Permissions-Policy | camera=(), microphone=(), geolocation=() |

## Rate Limiting

`10r/s` per IP with `burst=20`. Adjust in NGINX config if needed.

## File & Process Ownership

| Path | Owner | Perms |
|------|-------|-------|
| `/var/www/dojopool` | `dojopool:dojopool` | `755` (dirs) / `644` (files) |
| `/etc/nginx/sites-available/dojopool.conf` | `root:root` | `644` |
| SSL keys | `root:root` | `600` |
| Logs `/var/log/dojo*` | `dojopool:adm` | `640` |

Systemd units run as **non-root** `dojopool` user.

## Secrets Management

* Environment variables loaded via `/etc/systemd/system/uvicorn.service.d/env.conf` (not in repo).
* GitHub Secrets store CI tokens – never commit `.env`.

## Patching & Updates

* Enable unattended-upgrades on Ubuntu.
* Weekly: `npm audit fix --production` & `pip install --upgrade --security`.

## Incident Response

1. Rotate compromised secrets.
2. Restore from latest good build (Docker / build artifacts).
3. Review logs for IOC.

---

_Last updated {{date}}_