# Deployment Guide

Tallyco deploys to **Vercel** via GitHub Actions on every push to `main`.

## Live URLs

After a successful deploy, the production URL appears in the GitHub Actions run summary:

https://github.com/vikrantpaudel76-lgtm/tallyco/actions

Typical Vercel URL format: `https://tallyco-<hash>.vercel.app` or your custom domain.

## One-time setup

### 1. PostgreSQL (Neon — free tier)

1. Create a project at https://neon.tech
2. Copy the connection string (pooled or direct)
3. Save it as `DATABASE_URL`

### 2. Vercel project

```bash
npm i -g vercel
vercel login
cd tallyco
vercel link
```

From `.vercel/project.json`, copy `orgId` and `projectId`.

Create a token at https://vercel.com/account/tokens

### 3. GitHub repository secrets

Go to **Settings → Secrets and variables → Actions** and add:

| Secret | Value |
|--------|-------|
| `VERCEL_TOKEN` | Vercel account token |
| `VERCEL_ORG_ID` | From `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | From `.vercel/project.json` |
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `AUTH_SECRET` | `openssl rand -base64 32` |

### 4. Vercel environment variables

In the Vercel project dashboard, set the same `DATABASE_URL` and `AUTH_SECRET` for **Production**.

### 5. Trigger deploy

Push to `main` or run the workflow manually:

**Actions → Deploy to Vercel → Run workflow**

## Demo login

After seeding (`npm run db:seed` against production DB):

- Email: `admin@tallyco.local`
- Password: `admin123`
