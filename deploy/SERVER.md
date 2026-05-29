# Production server (Timeweb Cloud)

## Apply hardening after `git pull`

```bash
cd ~/AI-for-mock-interview
git pull

# 0. Verify merged ports (must be ONE line per service, 127.0.0.1 only)
docker compose -f docker-compose.yml -f docker-compose.prod.yml config | grep -A2 "backend:" | head -5
docker compose -f docker-compose.yml -f docker-compose.prod.yml config | grep "127.0.0.1"

# 1. Firewall — only SSH, HTTP, HTTPS (+ block direct app ports)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 3000/tcp
sudo ufw deny 8000/tcp
sudo ufw enable
sudo ufw status

# 2. Docker — no --build unless you changed code (Docker Hub may be slow)
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 3. Watchdog cron (restarts backend if it hangs again)
sudo cp deploy/scripts/health-watchdog.sh /usr/local/bin/
sudo chmod +x /usr/local/bin/health-watchdog.sh
(sudo crontab -l 2>/dev/null | grep -v health-watchdog; echo "*/2 * * * * /usr/local/bin/health-watchdog.sh >> /var/log/health-watchdog.log 2>&1") | sudo crontab -

# 4. Verify
docker ps
curl -s http://127.0.0.1:8000/health
curl -s http://127.0.0.1:3000/ -o /dev/null -w "frontend: %{http_code}\n"
curl -sk https://127.0.0.1/api/health
```

Expected in `docker ps`:
- `127.0.0.1:8000->8000/tcp` (NOT `0.0.0.0:8000`)
- `127.0.0.1:3000->3000/tcp`
- `(healthy)` for backend and frontend

## Reboot (recommended after kernel updates)

```bash
sudo reboot
```

After reboot:

```bash
curl -sk https://analyticsinterview.live/api/health
```

## If the site breaks again

```bash
docker ps -a
docker logs mock_interview_backend --tail 50
curl -v --max-time 5 http://127.0.0.1:8000/health
docker restart mock_interview_backend
```

## SSH password

Reset root password in Timeweb panel → **Доступ**, then:

```bash
ssh root@212.193.24.98
```
