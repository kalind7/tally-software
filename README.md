# Tallyco Soft

Browser-based double-entry accounting for Nepali small businesses — voucher-first workflow inspired by TallyPrime.

**Production:** [https://tallyco.kalindkoirala.com.np](https://tallyco.kalindkoirala.com.np)

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

Production runs on a VPS with **Docker** (app), **native PostgreSQL**, and **nginx**. See [DEPLOY.md](./DEPLOY.md) for the full procedure, including password rotation and database access.

Quick update on the server:

```bash
git pull
npx prisma db push          # if schema changed
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

## Docs

- [DEPLOY.md](./DEPLOY.md) — VPS Docker production hosting
- [docs/SYSTEM_DESIGN.md](./docs/SYSTEM_DESIGN.md) — architecture & accounting flow
- [PROJECT_ANALYSIS.md](./PROJECT_ANALYSIS.md) — codebase overview
