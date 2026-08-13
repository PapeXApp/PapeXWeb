# Running the merchant dashboard locally (and over a Cloudflare tunnel)

The merchant dashboard is `app/merchant/*` in this repo. It is not a separate
project — it is served from the same Vercel deployment, selected by **Host
header**, and that one fact is the source of every surprise below.

## Quick start

```bash
npm install
npm run tunnel:merchant          # localhost + a public https://…trycloudflare.com URL
npm run tunnel:merchant -- --local-only   # localhost only, no tunnel
```

The script prints the URL to open and the URL to share. `Ctrl-C` stops the dev
server and the tunnel together.

| Command | What you get |
|---|---|
| `npm run tunnel:merchant` | dev server + public quick-tunnel URL (needs `cloudflared`) |
| `npm run tunnel:merchant -- --local-only` | dev server only |
| `npm run tunnel:merchant -- --port 4000` | different port |
| `npm run tunnel:merchant -- --mock` / `-- --live` | force mock data / the real RDH API |
| `npm run dev:merchant` | bare `next dev`, any host serves the dashboard |
| `npm run dev` | bare `next dev`, production-shaped host routing |

`cloudflared` for the tunnel: `brew install cloudflared` on macOS, or
<https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/>.

## Host routing — the part that trips people up

`middleware.ts` (logic in `lib/merchantHost.ts`) rewrites by Host:

| Host | Path | Result |
|---|---|---|
| `merchant.*` | `/` | rewrite → `/merchant` (the dashboard) |
| anything else | `/merchant/*` | rewrite → 404, so the dashboard isn't reachable at `papex.app/merchant/…` |
| anything else | everything else | untouched (marketing site, `/r`, `/rdh`, `/api`) |

Rewrites, never redirects — a Vercel redirect once silently broke Apple's AASA
fetch, and the project has rewritten for host routing ever since.

Two consequences for local work:

**`npm run dev` → open `http://merchant.localhost:3000`**, not `localhost:3000`.
Chrome and Firefox resolve `*.localhost` to 127.0.0.1 automatically. Safari does
not — add `127.0.0.1 merchant.localhost` to `/etc/hosts` if you use it.

**A tunnel hostname is random** (`https://polite-otter-xyz.trycloudflare.com`)
and does not start with `merchant.`, so the isolation rule above would 404 the
whole dashboard. The escape hatch is `NEXT_PUBLIC_MERCHANT_DEMO_HOST_ANY=1`,
which makes *every* host serve the dashboard. `tunnel:merchant` and
`dev:merchant` set it inline for the process they start.

> **Never set that flag on a deployment.** It would turn `papex.app` itself into
> the merchant dashboard and take the marketing site down. It is deliberately
> absent from `.env.example` and `.env.local` so it cannot be enabled by
> accident — pass it per-process only. See the comment in `lib/merchantHost.ts`.

## Data: mock vs live

`.env.local` (gitignored):

```bash
NEXT_PUBLIC_MERCHANT_MOCK=1                      # synthetic dataset, no backend
NEXT_PUBLIC_RDH_API_BASE=https://api.papex.app   # used when MOCK is not 1
```

Mock mode serves `lib/merchantMock.ts` and needs no backend at all — the right
default for UI work and demos. Live mode reads through
`app/api/rdh/merchant/[...path]/route.ts`, a same-origin server-side proxy, so
there is no CORS dependency on whatever hostname you happen to be running under.
That matters for tunnels: the browser only ever talks to the tunnel origin.

Live mode needs the merchant-api Lambda deployed (`Papex_RDH_Backend`,
`merchant-dashboard` branch) and a merchant provisioned via
`scripts/provision-merchant.mjs`.

## Signing in

The auth gate in `app/merchant/layout.tsx` applies in mock mode too — you always
land on `/merchant/login`. Accounts are Firebase email/password in the
`papexweb-aed97` project, admin-provisioned; there is no self-signup.

Firebase email/password works from any origin, so a tunnel hostname signs in
fine without touching the Firebase authorized-domains list (that list only
governs OAuth popup/redirect, which this dashboard doesn't use).

## Troubleshooting

**Marketing site instead of the dashboard** — you're on `localhost` rather than
`merchant.localhost`, or the demo flag isn't set. `npm run dev:merchant` sidesteps
both.

**404 on the tunnel URL** — same cause; use `tunnel:merchant`, which sets the flag.

**Port already in use** — a previous `next dev` survived. `pkill -f "next dev"`,
or use `--port`.

**Tunnel URL changed** — quick tunnels are ephemeral; every run gets a new
hostname and the URL dies with the process. For a stable hostname you need a
named tunnel with a Cloudflare account, which is more setup than a demo warrants.

**Running from a cloud dev environment** — quick tunnels need egress to
`api.trycloudflare.com` (443) and `*.argotunnel.com` (7844). Sandboxes that
allowlist egress will block both; `cloudflared` reports
`Host not in allowlist: api.trycloudflare.com`. Run the tunnel from your own
machine instead.
