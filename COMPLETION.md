# Pulse Assessment Completion

## What was built (frontend)
- Dashboard: Portfolio summary from `/api/portfolio`, top gainers/losers, recent news, active alerts, AI insights, upcoming events, and a portfolio trend chart derived from asset histories. Includes loading states, retry errors, and formatted numbers/timestamps.
- Assets: Unified stocks + crypto table/cards with filters (all/stocks/crypto), search, sorting, color-coded changes, and a modal with price-history chart. Live data from `/api/stocks` and `/api/crypto`.
- News: Category filters, search, and refresh against `/api/news`, sorted by recency.
- Alerts: Grouped by severity with filter chips and refresh using `/api/alerts`.
- Portfolio: Detailed view using `/api/portfolio`, `/api/portfolio/performance`, `/api/assets` with allocation pie, best/worst performers, holdings table, watchlist, and value trend chart.

## How to run
- Backend: `cd backend && npm install && npm start` (http://localhost:5000).
- Frontend: `cd frontend && npm install && npm run dev` (proxy to backend on /api; default http://localhost:3000).
