# Production server (Timeweb Cloud)

## Apply hardening after `git pull`

```bash
cd /root/AI-for-mock-interview   # or your project path

# 1. Firewall — only SSH, HTTP, HTTPS (note: 22, not 222)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status

# 2. Docker — localhost ports + healthchecks + autoheal
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# 3. Verify
curl -s http://127.0.0.1:8000/health
curl -s http://127.0.0.1:3000/ -o /dev/null -w "%{http_code}\n"
curl -sk https://127.0.0.1/api/health
docker ps   # STATUS should show "(healthy)" for backend/frontend

# 4. Optional: update nginx rate limits
sudo cp deploy/nginx/analyticsinterview.live.conf /etc/nginx/sites-available/analyticsinterview
sudo ln -sf /etc/nginx/sites-available/analyticsinterview /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## Reboot (recommended after kernel updates)

When the console shows `System restart required`:

```bash
sudo reboot
```

After reboot, containers start automatically (`restart: unless-stopped`). Wait ~1 min, then:

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

With `autoheal` running, unhealthy backend should restart within ~30–120 seconds without manual intervention.

## SSH password

Reset root password in Timeweb panel → **Доступ**, then:

```bash
ssh root@212.193.24.98
```
