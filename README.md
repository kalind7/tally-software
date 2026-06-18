# Tallyco Soft

Browser-based double-entry accounting for Nepali small businesses — voucher-first workflow inspired by TallyPrime.

## Local development

```bash
cp .env.example .env
docker compose up -d
npm install
npm run db:push
npm run db:seed
npm run dev
```

Open http://localhost:3000 — demo login: `admin@tallyco.local` / `admin123`

## Deployment

Deployments run through **GitHub Actions** → **Render** (no Vercel). See [DEPLOY.md](./DEPLOY.md) for full setup.

## Docs

- [DEPLOY.md](./DEPLOY.md) — production hosting setup
- [docs/SYSTEM_DESIGN.md](./docs/SYSTEM_DESIGN.md) — architecture & accounting flow
- [PROJECT_ANALYSIS.md](./PROJECT_ANALYSIS.md) — codebase overview
