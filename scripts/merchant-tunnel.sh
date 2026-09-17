#!/usr/bin/env bash
#
# scripts/merchant-tunnel.sh
#
# Bring up the merchant dashboard on localhost and (optionally) expose it on a
# public Cloudflare quick-tunnel URL so it can be demoed from a phone, a POS
# terminal, or someone else's laptop without deploying.
#
# Why this script exists rather than "npm run dev + cloudflared":
#
#   1. Host routing. middleware.ts only serves app/merchant/* when the Host
#      header starts with "merchant." (lib/merchantHost.ts). A quick tunnel
#      hands you a random <words>.trycloudflare.com hostname, which does not —
#      so a plain `cloudflared tunnel --url localhost:3000` shows the marketing
#      site at / and a 404 at /merchant. This script sets the documented escape
#      hatch NEXT_PUBLIC_MERCHANT_DEMO_HOST_ANY=1 for the dev server it starts,
#      which makes every host serve the dashboard.
#
#      That flag is passed inline, per-process — never written to .env.local or
#      any committed env file. lib/merchantHost.ts's comment is explicit about
#      why: on a production deployment it would turn papex.app itself into the
#      merchant dashboard and take the marketing site down. Keeping it out of
#      env files means it cannot be enabled by accident.
#
#   2. Lifecycle. Two long-lived processes that must die together. Ctrl-C here
#      tears down both; a stray dev server left holding port 3000 is the usual
#      way this goes wrong.
#
#   3. The tunnel URL is buried in cloudflared's log output. This prints it once,
#      on its own, next to the login URL you actually want to send someone.
#
# Usage:
#   ./scripts/merchant-tunnel.sh                # dev server + public tunnel URL
#   ./scripts/merchant-tunnel.sh --local-only   # dev server only, no tunnel
#   ./scripts/merchant-tunnel.sh --port 4000    # different port
#   ./scripts/merchant-tunnel.sh --mock         # force mock data (no backend)
#   ./scripts/merchant-tunnel.sh --live         # force the real RDH API
#
# Data source defaults to whatever .env.local says (NEXT_PUBLIC_MERCHANT_MOCK);
# --mock / --live override it for this run only.

set -euo pipefail

PORT=3000
TUNNEL=1
MOCK_OVERRIDE=""

while [ $# -gt 0 ]; do
  case "$1" in
    --port) PORT="${2:?--port needs a value}"; shift 2 ;;
    --local-only) TUNNEL=0; shift ;;
    --mock) MOCK_OVERRIDE=1; shift ;;
    --live) MOCK_OVERRIDE=0; shift ;;
    -h|--help) sed -n '2,40p' "$0"; exit 0 ;;
    *) echo "unknown option: $1 (try --help)" >&2; exit 2 ;;
  esac
done

cd "$(dirname "$0")/.."

if [ ! -d node_modules ]; then
  echo "==> node_modules missing, running npm install"
  npm install --no-audit --no-fund
fi

# cloudflared is only needed for the tunnel; --local-only skips the check.
if [ "$TUNNEL" = 1 ] && ! command -v cloudflared >/dev/null 2>&1; then
  cat >&2 <<'EOF'
cloudflared is not installed.

  macOS:   brew install cloudflared
  Linux:   see https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/

Or run with --local-only to skip the tunnel and just use http://merchant.localhost:PORT.
EOF
  exit 1
fi

DEV_PID=""
TUNNEL_PID=""
cleanup() {
  # Kill the process groups, not just the leaders: `next dev` spawns workers
  # that outlive their parent and keep the port bound otherwise.
  [ -n "$TUNNEL_PID" ] && kill -- "-$TUNNEL_PID" 2>/dev/null || true
  [ -n "$DEV_PID" ] && kill -- "-$DEV_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

TUNNEL_LOG="$(mktemp -t merchant-tunnel.XXXXXX)"
DEV_LOG="$(mktemp -t merchant-dev.XXXXXX)"

echo "==> starting Next dev server on port $PORT"
# NEXT_PUBLIC_MERCHANT_DEMO_HOST_ANY: see the header comment. Inline, never committed.
DEV_ENV=(env "NEXT_PUBLIC_MERCHANT_DEMO_HOST_ANY=1")
if [ "$MOCK_OVERRIDE" = "1" ]; then
  DEV_ENV+=("NEXT_PUBLIC_MERCHANT_MOCK=1")
elif [ "$MOCK_OVERRIDE" = "0" ]; then
  DEV_ENV+=("NEXT_PUBLIC_MERCHANT_MOCK=0")
fi

set -m  # own process group per child, so cleanup() can kill the whole tree
"${DEV_ENV[@]}" npx next dev --turbopack --port "$PORT" >"$DEV_LOG" 2>&1 &
DEV_PID=$!
set +m

# Wait for the dev server to actually bind before pointing a tunnel at it —
# cloudflared started too early reports a dead origin and never recovers.
echo -n "==> waiting for localhost:$PORT "
for _ in $(seq 1 90); do
  if curl -sS -o /dev/null --max-time 2 "http://127.0.0.1:$PORT/" 2>/dev/null; then
    echo "ready"
    break
  fi
  if ! kill -0 "$DEV_PID" 2>/dev/null; then
    echo
    echo "dev server exited before binding. Last 30 lines:" >&2
    tail -30 "$DEV_LOG" >&2
    exit 1
  fi
  echo -n "."
  sleep 1
done

if ! curl -sS -o /dev/null --max-time 2 "http://127.0.0.1:$PORT/" 2>/dev/null; then
  echo
  echo "timed out waiting for the dev server. Last 30 lines:" >&2
  tail -30 "$DEV_LOG" >&2
  exit 1
fi

if [ "$TUNNEL" = 0 ]; then
  cat <<EOF

  Merchant dashboard (local)
    http://localhost:$PORT/merchant/login
    http://merchant.localhost:$PORT/login     (production-shaped host routing)

  Ctrl-C to stop.

EOF
  wait "$DEV_PID"
  exit 0
fi

echo "==> opening Cloudflare quick tunnel"
set -m
cloudflared tunnel --url "http://localhost:$PORT" --no-autoupdate >"$TUNNEL_LOG" 2>&1 &
TUNNEL_PID=$!
set +m

PUBLIC_URL=""
for _ in $(seq 1 60); do
  PUBLIC_URL="$(grep -Eo 'https://[a-z0-9-]+\.trycloudflare\.com' "$TUNNEL_LOG" | head -1 || true)"
  [ -n "$PUBLIC_URL" ] && break
  if ! kill -0 "$TUNNEL_PID" 2>/dev/null; then
    echo "cloudflared exited before publishing a URL. Last 30 lines:" >&2
    tail -30 "$TUNNEL_LOG" >&2
    exit 1
  fi
  sleep 1
done

if [ -z "$PUBLIC_URL" ]; then
  echo "cloudflared never printed a tunnel URL. Last 30 lines:" >&2
  tail -30 "$TUNNEL_LOG" >&2
  exit 1
fi

cat <<EOF

  ────────────────────────────────────────────────────────────
  Merchant dashboard is live

    Public   $PUBLIC_URL/merchant/login
    Local    http://localhost:$PORT/merchant/login

  The public URL is unauthenticated at the edge — anyone with the link
  reaches the login page. Firebase sign-in is still required to see data.
  The URL dies with this process; a new run gets a new hostname.

  Ctrl-C to stop both the tunnel and the dev server.
  ────────────────────────────────────────────────────────────

EOF

# Surface dev-server output from here on so compile errors are visible.
tail -f "$DEV_LOG" &
wait "$DEV_PID"
