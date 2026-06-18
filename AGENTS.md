<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Deployment

Production is self-hosted on a VPS: Docker app (`docker-compose.prod.yml`), native PostgreSQL, nginx. See [DEPLOY.md](./DEPLOY.md) before changing Docker, env vars, or Prisma schema in production.
