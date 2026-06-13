# Deployment Guide

Tallyco is deployed via **GitHub Actions only** — there is no Vercel integration and no Git-host auto-deploy.

**Pipeline:** push to `main` → GitHub Actions builds & syncs DB → triggers [Render](https://render.com) deploy hook.

**Runtime:** Render free web service (always-on enough for client demos; may sleep after ~15 min idle on free tier).

## Architecture

```
GitHub (main) → GitHub Actions → Render Web Service
                      ↓
                 Neon PostgreSQL
```

## One-time setup

### 1. Disconnect Vercel (if previously connected)

1. Open [Vercel Dashboard](https://vercel.com/dashboard) → your Tallyco project
2. **Settings → Git** → disconnect the repository
3. Optionally delete the Vercel project
4. Remove old GitHub secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

### 2. PostgreSQL (Neon — free tier)

1. Create a project at https://neon.tech
2. Copy the **pooled** connection string
3. Save it — you will use it as `DATABASE_URL` everywhere

### 3. Render web service

1. Push this repo to GitHub (with `render.yaml` on `main`)
2. Go to https://dashboard.render.com/blueprints → **New Blueprint Instance**
3. Connect your GitHub repo and apply the blueprint
4. When prompted, set these environment variables on the Render service:
   - `DATABASE_URL` — Neon connection string
   - `AUTH_SECRET` — run `openssl rand -base64 32`
   - `AUTH_URL` — your Render URL, e.g. `https://tallyco.onrender.com` (no trailing slash)
5. After the service is created:
   - **Settings → Build & Deploy → Auto-Deploy** → set to **Off** (GitHub Actions is the only deploy trigger)
   - **Settings → Deploy Hook** → copy the hook URL

### 4. GitHub repository configuration

**Settings → Secrets and variables → Actions → Secrets:**

| Secret | Value |
|--------|-------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `AUTH_SECRET` | Same value as on Render |
| `RENDER_DEPLOY_HOOK_URL` | Deploy hook URL from Render |

**Settings → Secrets and variables → Actions → Variables:**

| Variable | Value |
|----------|-------|
| `AUTH_URL` | Same as Render, e.g. `https://tallyco.onrender.com` |
| `RENDER_SERVICE_URL` | Same URL (shown in Actions run summary) |

### 5. Seed production database (once)

```bash
DATABASE_URL="your-neon-url" npm run db:seed
```

### 6. Deploy

Push to `main` or run manually:

**Actions → Deploy → Run workflow**

The live URL appears in the workflow summary (if `RENDER_SERVICE_URL` is set).

## Demo login

After seeding:

- Email: `admin@tallyco.local`
- Password: `admin123`

## Local development

```bash
cp .env.example .env
# Edit DATABASE_URL and AUTH_SECRET
docker compose up -d
npm run db:push
npm run db:seed
npm run dev
```

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `prisma generate` fails on missing `DATABASE_URL` | Ensure `DATABASE_URL` is set in GitHub secrets and on Render |
| Login redirects fail in production | Set `AUTH_URL` to your exact Render URL on both Render and GitHub variables |
| Deploy hook returns 404 | Regenerate the deploy hook in Render and update the GitHub secret |
| App sleeps on free tier | First visit after idle takes ~30s to wake — normal for Render free tier |
