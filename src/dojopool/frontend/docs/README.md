# DojoPoolONE: Professional Flask + SocketIO Setup

## Overview
DojoPoolONE is a real-time web application built on Flask and Flask-SocketIO, structured for maintainability, scalability, and production-readiness.

---

## Development Quickstart

1. **Install dependencies**
   ```sh
   pip install -r requirements.txt
   ```
2. **Set environment variables** (see `.env.example`)
   - `PORT`: Port to run the server (default: 5000)
   - `FLASK_SSL`: Set to `on` for HTTPS in dev (uses adhoc SSL)
   - `FLASK_SECRET_KEY`, `DATABASE_URL`, etc.
3. **Run the development server**
   ```sh
   python src/main.py
   # or
   python DojoPool/[PY]run.py
   # or
   python DojoPool/[DEV]dev.py
   ```
4. **Access the app**
   - Web: `http://127.0.0.1:5000`
   - WebSocket: `ws://127.0.0.1:5000`

---

## Production Deployment

- **Recommended:**
  - Use a reverse proxy (nginx, Caddy, etc.) to terminate SSL and forward HTTP/WebSocket traffic to Flask app.
  - Run with `eventlet` or `gevent` for async support.
  - Use `wsgi.py` or a similar entry point for WSGI/ASGI servers.

### Example nginx config (snippet)
```
server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/ssl/certs/your.crt;
    ssl_certificate_key /etc/ssl/private/your.key;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## Testing & Quality
- Automated tests: `pytest`
- Linting: `flake8`, `black`
- CI/CD: Recommended via GitHub Actions or similar

---

## Structure
- `src/dojopool/core/extensions.py`: All Flask extensions, including SocketIO
- `src/dojopool/app.py`: Application factory
- `src/main.py`, `[PY]run.py`, `[DEV]dev.py`: Entrypoints
- `src/dojopool/core/sockets/`: WebSocket event handlers

---

## Environment Variables
See `.env.example` for all supported variables.

---

## Developer Checklist
See `frontend/DEV_TRACK_CHECKLIST.md` for a professional setup guide.

---

## Support
For issues, consult the checklist and README first. For advanced help, contact the maintainers.
