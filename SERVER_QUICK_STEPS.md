# Быстрые шаги на сервере (analyticsinterview.live)

IP сервера: **212.193.24.98**  
Домен: **analyticsinterview.live**

---

## 1. Установить Docker Compose

Подключись к серверу:

```bash
ssh root@212.193.24.98
```

Установи Docker Compose:

```bash
apt update
apt install docker-compose -y
docker-compose --version
```

Если после установки команда всё равно не найдена, попробуй плагин (тогда везде используй `docker compose` с пробелом):

```bash
apt install docker-compose-plugin -y
docker compose --version
```

---

## 2. DNS (в панели домена)

В настройках домена **analyticsinterview.live** создай две A-записи:

| Тип | Host | Value | TTL |
|-----|------|-------|-----|
| A | @ | 212.193.24.98 | 3600 |
| A | www | 212.193.24.98 | 3600 |

Сохрани и подожди 5–30 минут.

---

## 3. Запуск контейнеров

```bash
cd /root/AI-for-mock-interview
docker-compose up -d
```

(Если используешь плагин: `docker compose up -d`)

Проверка:

```bash
docker-compose ps
```

Должны быть запущены: `mock_interview_db`, `mock_interview_backend`, `mock_interview_frontend`.

Заполнение базы тестовыми задачами:

```bash
docker-compose exec backend python -m task_migrator.seed_tasks
```

---

## 4. Переменные окружения

Пошаговый гайд по ключам: **[KEYS_SETUP_GUIDE.md](KEYS_SETUP_GUIDE.md)**.

Создай на сервере:

- `backend/.env` — скопируй из `backend/.env.example`, укажи `SECRET_KEY`, `OPENAI_API_KEY`, `FRONTEND_URL=https://analyticsinterview.live`
- Корневой `.env` — для docker-compose: `NEXT_PUBLIC_API_URL=https://analyticsinterview.live/api`, `FRONTEND_URL=https://analyticsinterview.live`, `SECRET_KEY`

Перезапуск после изменения .env:

```bash
docker-compose down
docker-compose up -d
```

---

## 5. Nginx и HTTPS

Установка Nginx:

```bash
apt install nginx -y
```

Конфиг для домена (создай `/etc/nginx/sites-available/analyticsinterview`):

```nginx
server {
    listen 80;
    server_name analyticsinterview.live www.analyticsinterview.live;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        rewrite ^/api/(.*) /$1 break;
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /docs {
        proxy_pass http://127.0.0.1:8000/docs;
        proxy_set_header Host $host;
    }

    location /openapi.json {
        proxy_pass http://127.0.0.1:8000/openapi.json;
    }
}
```

Включение конфига и перезапуск Nginx:

```bash
ln -s /etc/nginx/sites-available/analyticsinterview /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

SSL (HTTPS):

```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d analyticsinterview.live -d www.analyticsinterview.live
```

---

## Если backend падает: `No such image` / `KeyError: 'ContainerConfig'`

Так бывает после `docker-compose build`, когда **старый контейнер** всё ещё ссылается на **удалённый образ**, а **docker-compose 1.29** ломается на новом Docker API. Сообщение `*** System restart required ***` к этому **не относится** (это просто напоминание Ubuntu про reboot).

**База не трогаем:** не используйте `docker-compose down -v`.

Выполните по порядку:

```bash
cd ~/AI-for-mock-interview

# 1. Остановить стек (тома БД сохранятся)
docker-compose down

# 2. Удалить «битый» контейнер backend по имени из docker-compose.yml
docker rm -f mock_interview_backend

# 3. На всякий случай убрать другие остановленные контейнеры с этим именем
docker ps -a --filter "name=mock_interview_backend" -q | xargs -r docker rm -f

# 4. Поднять заново (образ вы уже собрали)
docker-compose up -d
```

Если **снова** ошибка `ContainerConfig` — перейдите на **Compose V2** (рекомендуется на Ubuntu 24.04):

```bash
apt update && apt install -y docker-compose-plugin
docker compose version
cd ~/AI-for-mock-interview
docker compose down
docker rm -f mock_interview_backend
docker compose build --no-cache backend
docker compose up -d
```

Дальше везде используйте **`docker compose`** (с пробелом), а не `docker-compose`.

Проверка:

```bash
docker compose ps
docker compose logs --tail=40 backend
```

---

## Шпаргалка команд

| Действие | Команда |
|----------|---------|
| Статус контейнеров | `docker-compose ps` |
| Логи | `docker-compose logs -f` |
| Перезапуск | `docker-compose restart` |
| Остановить | `docker-compose down` |
| Запустить | `docker-compose up -d` |
| Пересобрать и запустить | `docker-compose up -d --build` |

Если установлен плагин — везде используй `docker compose` (с пробелом) вместо `docker-compose`.
