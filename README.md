# RPL Frontend (React + Vite)

## Dev setup

```bash
# 1. Start backend (from project root)
./mvnw spring-boot:run        # or: docker-compose up

# 2. Start frontend dev server (from this folder)
npm install
npm run dev
# → http://localhost:5173
```

The Vite dev server proxies all `/api/*` requests to `http://localhost:8080`
so you never need to touch CORS settings.

## Production build

```bash
npm run build   # outputs to frontend/dist/
```

Serve `dist/` with any static host (Nginx, Vercel, etc.) and point the backend
URL at your deployed Spring Boot instance.

## Pages

| Route | Description |
|---|---|
| `/` | Dashboard — pool balances, alert indicators, plan status summary |
| `/plans` | List + create plans |
| `/plans/:id` | Collapsible plan tree, node selection |
| `/plans/:id/report` | Depth-first traversal report with allocations (F10) |
| `/actions/:id` | State transitions, allocations CRUD, execution diff (F5/F6) |
| `/ledger` | Account list + entries per account |
| `/protocols` | Protocol list + create |
| `/resource-types` | Resource type list + create |
| `/audit-log` | Full audit event log |
