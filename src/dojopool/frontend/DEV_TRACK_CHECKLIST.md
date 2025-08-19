# DojoPoolONE Professional Flask+SocketIO Setup Checklist

## 1. Project Structure

- [ ] Modular, scalable folder structure
- [ ] All extensions in a central `extensions.py`
- [ ] Blueprints for each feature
- [ ] WebSocket events in dedicated modules

## 2. Environment Management

- [ ] `.env` file for secrets/config
- [ ] `python-dotenv` loads env vars

## 3. SocketIO Setup

- [ ] SocketIO initialized in `extensions.py`
- [ ] `socketio.init_app(app)` called in app factory
- [ ] Use `eventlet`/`gevent` for async in prod
- [ ] SSL handled by reverse proxy in prod
- [ ] Adhoc SSL only for dev/testing

## 4. Entry Points

- [ ] `main.py`/`run.py` for dev
- [ ] `wsgi.py` for prod
- [ ] Port availability check in entrypoints
- [ ] Startup diagnostics/logs
- [ ] Correct async mode detection

## 5. Logging & Error Handling

- [ ] Structured logging
- [ ] Clear startup diagnostics
- [ ] Fail fast on misconfiguration

## 6. Testing & Linting

- [ ] Automated tests (pytest)
- [ ] Linting (flake8, black)
- [ ] CI/CD pipeline

## 7. Reverse Proxy (Production)

- [ ] nginx/Caddy config for SSL termination
- [ ] WebSocket upgrade headers set
- [ ] Only HTTP between proxy and Flask

## 8. Documentation

- [ ] README with run/dev/prod instructions
- [ ] Document env vars and SocketIO usage

## 9. Automated Testing

- [ ] Pytest for backend
- [ ] Selenium/Playwright for websockets

## 10. CI/CD Pipeline

- [ ] Lint, test, build, deploy automatically

---

_Update this checklist as you progress. Each item is critical for a professional, production-ready Flask+SocketIO project._
