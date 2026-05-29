# Production server (Timeweb Cloud)

## Apply after `git pull`

```bash
cd ~/AI-for-mock-interview
git pull

# Verify ports will be published (must show 127.0.0.1:8000 and 127.0.0.1:3000)
docker compose -f docker-compose.yml -f docker-compose.prod.yml config | grep "127.0.0.1"

# Restart stack
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Verify — PORTS column must show 127.0.0.1:8000->8000 and 127.0.0.1:3000->3000
docker ps
curl -s http://127.0.0.1:8000/health
curl -sk https://127.0.0.1/api/health

# Watchdog (auto-restart if backend hangs)
sudo cp deploy/scripts/health-watchdog.sh /usr/local/bin/
sudo chmod +x /usr/local/bin/health-watchdog.sh
(sudo crontab -l 2>/dev/null | grep -v health-watchdog; echo "*/2 * * * * /usr/local/bin/health-watchdog.sh >> /var/log/health-watchdog.log 2>&1") | sudo crontab -
```

## Firewall

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 3000/tcp
sudo ufw deny 8000/tcp
sudo ufw enable
```

## Reboot

```bash
sudo reboot
```

After reboot: `curl -sk https://analyticsinterview.live/api/health`
