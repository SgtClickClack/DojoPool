# File Permissions & Access Controls – DojoPool

## Overview

We follow the _principle of least privilege_ – only grant the minimal filesystem & process capabilities required for tasks.

## Users & Groups

| User                | Purpose                                       |
| ------------------- | --------------------------------------------- |
| `dojopool` (system) | runs the API (Uvicorn) and Socket.IO services |
| `www-data`          | NGINX worker processes                        |
| `root`              | package management, system updates, TLS certs |

## Directory Layout & Permissions

```text
/var/www/dojopool        # Front-end build output
└── assets/              # Fingerprinted static files
/var/log/dojo/           # App logs (rotated by logrotate)
```

| Path                                | Owner    | Group    | Mode  |
| ----------------------------------- | -------- | -------- | ----- |
| `/var/www/dojopool`                 | dojopool | dojopool | `755` |
| `/var/www/dojopool/assets`          | dojopool | dojopool | `755` |
| `/var/www/dojopool/**/*.js/css/...` | dojopool | dojopool | `644` |
| `/var/log/dojo`                     | dojopool | adm      | `750` |
| NGINX conf files                    | root     | root     | `644` |
| SSL keys                            | root     | root     | `600` |

## SELinux / AppArmor (optional)

- Provide a profile that limits NGINX to read-only `/var/www/dojopool`.
- Uvicorn confined to network + SQLite path.

## Systemd Hardening

Snippet from `uvicorn.service`:

```ini
ProtectSystem=full
ProtectHome=true
PrivateTmp=true
NoNewPrivileges=true
CapabilityBoundingSet=
MemoryDenyWriteExecute=true
LockPersonality=true
```

These directives further contain the process.

---

_Last updated {{date}}_
