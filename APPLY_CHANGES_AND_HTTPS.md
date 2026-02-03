# Применение изменений (новая авторизация) и настройка HTTPS

Краткая инструкция: как применить логику без Clerk и включить HTTPS на сервере.

---

## Часть 1. Применить изменения (новая авторизация)

### 1.1. На сервере: обновить код

```bash
cd /root/AI-for-mock-interview   # или путь, где лежит проект
git pull origin main
```

### 1.2. Обновить переменные окружения

**Backend — `backend/.env`**

Убери переменные Clerk (если есть) и оставь/добавь:

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/mock_interview
SECRET_KEY=придумай-длинную-случайную-строку-минимум-32-символа
OPENAI_API_KEY=sk-твой-ключ
LLM_PROVIDER=openai
YOOKASSA_SHOP_ID=твой-shop-id
YOOKASSA_SECRET_KEY=твой-секрет
DEBUG=false
FRONTEND_URL=https://analyticsinterview.live
```

`SECRET_KEY` — обязателен для JWT (регистрация/логин). Сгенерировать можно так:

```bash
openssl rand -hex 32
```

**Frontend — `frontend/.env.local`**

Достаточно одного параметра (Clerk больше не нужен):

```env
NEXT_PUBLIC_API_URL=https://analyticsinterview.live/api
```

### 1.3. Пересобрать и запустить контейнеры

```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

Если используешь плагин: `docker compose` вместо `docker-compose`.

### 1.4. Применить миграции БД (новая таблица users)

Один раз после обновления:

```bash
docker-compose exec backend alembic upgrade head
```

Если таблица `users` уже была со старой схемой (Clerk), миграция добавит поля (email, telegram, password и т.д.) и уберёт `clerk_user_id`. Старых пользователей без пароля войти не смогут — только новые регистрации.

### 1.5. Заполнить задачи (если ещё не делал)

```bash
docker-compose exec backend python scripts/seed_tasks.py
```

### 1.6. Проверка

- Открой в браузере: `http://твой-ip` или `http://analyticsinterview.live` (если DNS уже указывает на сервер).
- Нажми «Start the interview» — должна открыться модалка **Вход / Регистрация** (без Clerk).
- Зарегистрируй тестового пользователя и проверь вход и профиль (иконка справа сверху).

---

## Часть 2. Включить HTTPS

HTTPS нужен, чтобы сайт открывался по `https://analyticsinterview.live` и браузер не ругался на «небезопасное соединение».

### 2.1. Установить Certbot (Let's Encrypt)

На сервере:

```bash
apt update
apt install certbot python3-certbot-nginx -y
```

### 2.2. Nginx уже слушает 80 порт

В `nginx-optimized.conf` уже есть:

- `listen 80;`
- `location /.well-known/acme-challenge/` — нужен для проверки домена Let's Encrypt.

Если конфиг ещё не подключён:

```bash
# Пример: скопировать конфиг из проекта
cp /root/AI-for-mock-interview/nginx-optimized.conf /etc/nginx/sites-available/analyticsinterview
ln -sf /etc/nginx/sites-available/analyticsinterview /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

### 2.3. Получить SSL-сертификат

```bash
certbot --nginx -d analyticsinterview.live -d www.analyticsinterview.live
```

- Введи email для уведомлений от Let's Encrypt.
- Согласись с условиями (Y).
- На вопрос «Redirect HTTP to HTTPS?» выбери **2 (Redirect)** — весь трафик по HTTP будет перенаправляться на HTTPS.

Certbot сам добавит в конфиг Nginx блок `listen 443 ssl` и пути к сертификатам.

### 2.4. Проверить автообновление сертификата

```bash
certbot renew --dry-run
```

Если команда проходит без ошибок, продление сертификата будет работать по таймеру.

### 2.5. Убедиться, что в приложении везде HTTPS

В `backend/.env` и `frontend/.env.local` уже должны быть:

- `FRONTEND_URL=https://analyticsinterview.live`
- `NEXT_PUBLIC_API_URL=https://analyticsinterview.live/api`

После смены на HTTPS перезапусти контейнеры, чтобы бэкенд подхватил `FRONTEND_URL`:

```bash
docker-compose up -d --force-recreate
```

---

## Краткий чеклист

| Шаг | Команда / действие |
|-----|--------------------|
| 1 | `git pull origin main` |
| 2 | Обновить `backend/.env` (SECRET_KEY, без Clerk) и `frontend/.env.local` (только NEXT_PUBLIC_API_URL) |
| 3 | `docker-compose down && docker-compose build --no-cache && docker-compose up -d` |
| 4 | `docker-compose exec backend alembic upgrade head` |
| 5 | При необходимости: `docker-compose exec backend python scripts/seed_tasks.py` |
| 6 | HTTPS: `apt install certbot python3-certbot-nginx -y` |
| 7 | `certbot --nginx -d analyticsinterview.live -d www.analyticsinterview.live` |
| 8 | Выбрать редирект HTTP → HTTPS |
| 9 | `certbot renew --dry-run` |
| 10 | Открыть https://analyticsinterview.live и проверить вход/регистрацию |

После этого новая логика авторизации применена, сайт работает по HTTPS без Clerk.
