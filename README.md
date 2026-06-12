# Toronto STR Explorer Frontend

Next.js frontend for exploring City of Toronto short-term rental (STR)
registrations on an interactive map. Users can search registrations, filter by
property type, inspect ward totals, and open individual registration details.

The frontend is one part of the wider application:

- `frontend-app`: this Next.js application
- `go-api`: API used to query registration and map data
- `go-ingest`: worker that imports Toronto open data into the database

## Tech Stack

- Next.js 16 with the App Router
- React 19 and TypeScript
- Tailwind CSS 4
- Mapbox GL JS
- Vercel Analytics
- Bun for dependency management

## Prerequisites

- Bun
- A Mapbox public access token
- A running `go-api` instance
- The same internal API key configured in both this app and `go-api`

## Local Setup

From `frontend-app`:

```bash
bun install
```

Create `.env.local`:

```dotenv
API_BASE_URL=http://localhost:8080
INTERNAL_API_KEY=replace-with-a-shared-secret
NEXT_PUBLIC_MAPBOX_TOKEN=replace-with-a-mapbox-public-token
```

Then start the development server:

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

The Go API must be reachable at `API_BASE_URL`. See
[`../go-api/README.md`](../go-api/README.md) for its configuration and startup
instructions.

## Environment Variables

| Variable | Scope | Description |
| --- | --- | --- |
| `API_BASE_URL` | Server only | Base URL of the Go API, such as `http://localhost:8080`. |
| `INTERNAL_API_KEY` | Server only | Shared secret sent to the Go API as `X-Internal-API-Key`. |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Browser | Public Mapbox token used to render the interactive map. |

Do not prefix the API base URL or internal key with `NEXT_PUBLIC_`; that would
expose them in the browser bundle. Do not commit `.env.local` or production
secrets.

## Available Commands

```bash
bun run dev      # Start the local development server
bun run build    # Create a production build
bun run start    # Run the production server
bun run lint     # Run ESLint
```

## Application Architecture

Browser-side API calls use relative `/api/*` URLs. The catch-all route at
`app/api/[...path]/route.ts` forwards GET requests to the Go API and adds the
server-only internal API key. Query strings and selected cache headers are
preserved.

```text
Browser
  -> Next.js /api/*
  -> Go API /api/* with X-Internal-API-Key
  -> Postgres/PostGIS
```

This proxy keeps backend credentials out of client-side JavaScript and avoids
requiring the browser to call the Go service directly.

The map requests data for the current viewport rather than loading the complete
dataset. Requests are refreshed after map movement and when search or property
type filters change. Low zoom levels return clusters; individual registrations
are shown at higher zoom levels.

## Routes

| Route | Description |
| --- | --- |
| `/` | Interactive Toronto STR registration explorer |
| `/terms-of-use` | Terms of use |
| `/privacy-policy` | Privacy policy |
| `/api/[...path]` | Server-side proxy to the Go API |

The frontend currently consumes:

- `GET /api/meta`
- `GET /api/listings/map`
- `GET /api/listings/{id}`
- `GET /api/stats/wards`

## Project Structure

```text
app/
  api/[...path]/route.ts  Backend API proxy
  layout.tsx              Root layout, metadata, analytics, and footer
  page.tsx                Explorer page
  privacy-policy/         Privacy policy route
  terms-of-use/           Terms of use route
components/
  str-explorer.tsx        Search, filters, panels, and data state
  toronto-map.tsx         Mapbox map, layers, and interactions
  legal-page.tsx          Shared legal page layout
lib/
  api.ts                  API types and request helpers
```

## Production Deployment

The application is designed to run as a Next.js server deployment, such as on
Vercel. Configure all three environment variables in the hosting platform and
set `API_BASE_URL` to the deployed Go API URL.

`INTERNAL_API_KEY` must match the value configured on the Go API. Restrict the
Mapbox public token to the expected production and local origins in the Mapbox
dashboard.

Before deploying:

```bash
bun run lint
bun run build
```

## Troubleshooting

### The map remains on the loading state

Confirm that `NEXT_PUBLIC_MAPBOX_TOKEN` is set, valid, and permitted for the
current origin. Restart the development server after changing environment
variables.

### API requests return `502`

Check the Next.js server logs. A `502` from the proxy usually means
`API_BASE_URL` is missing, the Go API is unavailable, or `INTERNAL_API_KEY` is
not configured.

### API requests return `401`

Ensure `INTERNAL_API_KEY` has exactly the same value in the frontend and Go API
environments.
