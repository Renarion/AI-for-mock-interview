#!/bin/sh
# Restarts backend/frontend if health endpoints stop responding.
# Install: sudo cp deploy/scripts/health-watchdog.sh /usr/local/bin/
#          sudo chmod +x /usr/local/bin/health-watchdog.sh
# Cron (every 2 min): */2 * * * * /usr/local/bin/health-watchdog.sh >> /var/log/health-watchdog.log 2>&1

BACKEND_URL="${BACKEND_URL:-http://127.0.0.1:8000/health}"
FRONTEND_URL="${FRONTEND_URL:-http://127.0.0.1:3000/}"
TIMEOUT="${TIMEOUT:-5}"

check() {
  curl -sf --max-time "$TIMEOUT" "$1" >/dev/null 2>&1
}

if ! check "$BACKEND_URL"; then
  echo "$(date -Is) backend unhealthy — restarting mock_interview_backend"
  docker restart mock_interview_backend
fi

if ! check "$FRONTEND_URL"; then
  echo "$(date -Is) frontend unhealthy — restarting mock_interview_frontend"
  docker restart mock_interview_frontend
fi
