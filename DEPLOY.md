# Deployment Guide

Production runs on a **VPS** with **Docker** (Next.js app), **native PostgreSQL** (database), and **nginx** (reverse proxy).

**Live URL:** `https://tallyco.kalindkoirala.com.np`

---

## Architecture

```
Browser → Cloudflare → nginx (443/80) → Tallyco Docker container (host port 3010)
                                              ↓
                                    PostgreSQL on host (127.0.0.1:5432)
```

| Component | Role |
|-----------|------|
| **Docker** | Runs the Next.js app only (`docker-compose.prod.yml`) |
| **PostgreSQL (native)** | Database on the VPS — do **not** start Postgres from `docker-compose.yml` in production |
| **nginx** | Routes the subdomain to `127.0.0.1:3010` |
| **PM2** | Not used for Tallyco |

### Port allocation

Each site on the VPS uses its own host port. Example:

| Port | App |
|------|-----|
| 3000 | Other Next.js site |
| 3001 | martsewa / Blue Bird Mall |
| **3010** | **Tallyco** |

Pick a free port if `3010` is taken. Update `PORT` in `docker-compose.prod.yml` and the matching `proxy_pass` in nginx.

---

## Prerequisites (VPS)

- Ubuntu 24.04 (or similar), non-root deploy user (e.g. `kalind`)
- Node.js 22 (for host-side `db:push` / `db:seed` only)
- Docker, nginx, certbot
- DNS: subdomain A record (or Cloudflare proxy) pointing to the VPS

---

## One-time setup

### 1. PostgreSQL on the host

Use a dedicated app user. Prefer a **hex password** (letters and numbers only) so `DATABASE_URL` needs no URL-encoding.

```bash
openssl rand -hex 16   # save this as DB password

sudo -u postgres psql -c "CREATE USER tallyco_app WITH PASSWORD 'YOUR_DB_PASSWORD';"
sudo -u postgres psql -c "CREATE DATABASE tallyco OWNER tallyco_app;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE tallyco TO tallyco_app;"
```

Test:

```bash
PGPASSWORD='YOUR_DB_PASSWORD' psql -h 127.0.0.1 -U tallyco_app -d tallyco -c "SELECT 1;"
```

Do **not** expose port 5432 in UFW. Postgres should only be reachable from localhost.

### 2. Clone the repo

```bash
mkdir -p ~/projects
cd ~/projects
git clone https://github.com/kalind7/tally-software.git tally-software
cd tally-software
```

### 3. Host `.env` (migrations & seed)

Used when running Prisma on the **host** (not inside Docker):

```bash
cp .env.example .env
nano .env
```

```env
DATABASE_URL="postgresql://tallyco_app:YOUR_DB_PASSWORD@127.0.0.1:5432/tallyco"
AUTH_SECRET="paste-output-of-openssl-rand-base64-32"
AUTH_URL="https://tallyco.kalindkoirala.com.np"
AUTH_TRUST_HOST="true"
NODE_ENV="production"
```

Generate `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

### 4. Database schema & seed (on host)

```bash
npm ci
npx prisma db push
npm run db:seed
```

### 5. Configure production Docker env

Edit `docker-compose.prod.yml` and set real values for `AUTH_SECRET` and `DATABASE_URL` (same password as host `.env`). The file uses `network_mode: host` and `127.0.0.1` so the container can reach host Postgres.

Build and start:

```bash
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

Verify:

```bash
docker compose -f docker-compose.prod.yml ps
curl -I http://127.0.0.1:3010/login   # expect 200
```

Test DB from inside the container:

```bash
docker exec tallyco node -e "
const { Pool } = require('pg');
const p = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
p.query('SELECT 1 AS ok').then(r => console.log('DB OK:', r.rows)).catch(e => console.error('DB FAIL:', e.message)).finally(() => p.end());
"
```

**Important:**

- Always use `docker compose -f docker-compose.prod.yml` — never bare `docker compose up` in production (that starts dev Postgres from `docker-compose.yml` and conflicts on port 5432).
- Use `127.0.0.1` in `DATABASE_URL`, not `host.docker.internal` (causes DB timeouts on Linux).

### 6. nginx

```bash
sudo nano /etc/nginx/sites-available/tallyco
```

```nginx
server {
    listen 80;
    server_name tallyco.kalindkoirala.com.np;

    location / {
        proxy_pass http://127.0.0.1:3010;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -sf /etc/nginx/sites-available/tallyco /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7. SSL

```bash
sudo certbot --nginx -d tallyco.kalindkoirala.com.np
```

**Cloudflare:** SSL/TLS mode → **Full** or **Full (strict)**.

Ensure `AUTH_URL` uses `https://` with no trailing slash.

---

## Deploying updates

```bash
cd ~/projects/tally-software
git pull

# If schema changed:
npx prisma db push

docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

Logs:

```bash
docker compose -f docker-compose.prod.yml logs -f --tail 50
```

---

## Rotating secrets & passwords

### Database password

```bash
openssl rand -hex 16

sudo -u postgres psql -c "ALTER USER tallyco_app WITH PASSWORD 'NEW_PASSWORD';"
```

Update **both**:

1. Host `~/projects/tally-software/.env` → `DATABASE_URL`
2. `docker-compose.prod.yml` → `DATABASE_URL`

Then:

```bash
docker compose -f docker-compose.prod.yml up -d
```

### AUTH_SECRET

```bash
openssl rand -base64 32
```

Update host `.env` and `docker-compose.prod.yml`, then recreate the container. Rotating `AUTH_SECRET` logs out all users.

### AUTH_URL

Must match the exact public URL (no trailing slash), e.g. `https://tallyco.kalindkoirala.com.np`. Update `docker-compose.prod.yml` and restart.

---

## Accessing the database

### From the VPS (CLI)

```bash
PGPASSWORD='YOUR_DB_PASSWORD' psql -h 127.0.0.1 -U tallyco_app -d tallyco
```

```sql
\dt
SELECT email, role FROM "User";
\q
```

### From your laptop (SSH tunnel)

```bash
ssh -L 5433:127.0.0.1:5432 kalind@YOUR_VPS_IP
```

Connect TablePlus/DBeaver to `localhost:5433`, user `tallyco_app`, database `tallyco`.

---

## Demo login

After seeding:

- Email: `admin@tallyco.local`
- Password: `admin123`

Change the admin password after first login in production.

---

## Local development

```bash
cp .env.example .env
# Edit DATABASE_URL and AUTH_SECRET for localhost

docker compose up -d          # Postgres only (dev)
npm run db:push
npm run db:seed
npm run dev
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Login stuck on "Please wait..." | DB unreachable from container. Use `network_mode: host` and `127.0.0.1` in `DATABASE_URL`. Check with `docker exec tallyco printenv DATABASE_URL`. |
| `Operation has timed out` / `P1008` in logs | Same — replace `host.docker.internal` with `127.0.0.1` and recreate container. |
| `ENOTFOUND host.docker.internal` | `DATABASE_URL` still uses `host.docker.internal`. Fix `docker-compose.prod.yml`, run `docker compose -f docker-compose.prod.yml down && ... up -d`. |
| Port 5432 already in use | Ran `docker compose up` without `-f` and started dev Postgres. Run `docker compose down`; use only `docker-compose.prod.yml`. |
| Wrong site on curl (wrong title) | Port collision — another app uses that port. Pick a free port, update `PORT` and nginx `proxy_pass`. |
| `/login` returns 404 | Wrong app on that port, or outdated code. `git pull` and rebuild. |
| Login redirects to localhost | Set `AUTH_URL` to your HTTPS domain. Set `AUTH_TRUST_HOST=true`. |
| `prisma generate` fails in Docker build | `Dockerfile` must copy `prisma/` and `prisma.config.ts` **before** `npm ci`. |
| nginx `301` on HTTP | Normal if HTTPS redirect is enabled — use `https://` in the browser. |

---

## Optional: Render deployment

The repo also includes `render.yaml` and `.github/workflows/deploy.yml` for Render + Neon via GitHub Actions. VPS Docker deployment is independent — you do not need Render when self-hosting.
