#!/usr/bin/env bash
# Retry pnpm install with exponential backoff. Useful when registry access is flaky.
# Usage: ./scripts/pnpm-install-retry.sh [max_attempts] [initial_delay_seconds]


set -euo pipefail

# Force CI mode so package managers behave consistently in CI-like environments
export CI=true

MAX_ATTEMPTS=${1:-6}
DELAY=${2:-2}

PROG_NAME=$(basename "$0")

echo "$PROG_NAME: will try pnpm install up to $MAX_ATTEMPTS times (initial delay ${DELAY}s). CI=true is set."

# If corepack is available, try to prepare pnpm. This may still fail if outbound
# network is blocked; we don't want to abort the script for that reason.
if command -v corepack >/dev/null 2>&1; then
  echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] Attempting corepack prepare pnpm@latest --activate (best-effort)"
  corepack prepare pnpm@latest --activate || echo "corepack prepare failed (continuing to retry pnpm install)"
fi

attempt=1
while [ $attempt -le $MAX_ATTEMPTS ]; do
  echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] Attempt #$attempt: running pnpm install..."
  if pnpm install --no-frozen-lockfile; then
    echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] pnpm install succeeded on attempt #$attempt"
    exit 0
  fi

  echo "[$(date -u '+%Y-%m-%dT%H:%M:%SZ')] pnpm install failed on attempt #$attempt"
  if [ $attempt -eq $MAX_ATTEMPTS ]; then
    echo "Reached max attempts ($MAX_ATTEMPTS). Exiting with failure."
    exit 1
  fi

  sleep_seconds=$(( DELAY * 2 ** (attempt - 1) ))
  echo "Sleeping $sleep_seconds seconds before next attempt..."
  sleep $sleep_seconds
  attempt=$(( attempt + 1 ))
done

exit 1
