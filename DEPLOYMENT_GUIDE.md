# Полное руководство по развертыванию AI Mock Interview

Это руководство поможет тебе развернуть приложение на продакшн сервере и сделать его доступным по домену.

---

## Содержание

1. [Что такое Docker и зачем он нужен](#1-что-такое-docker-и-зачем-он-нужен)
2. [Настройка DNS для домена](#2-настройка-dns-для-домена)
3. [Подготовка сервера](#3-подготовка-сервера)
4. [Запуск Docker контейнеров](#4-запуск-docker-контейнеров)
5. [Настройка Nginx (reverse proxy)](#5-настройка-nginx-reverse-proxy)
6. [Получение SSL сертификата (HTTPS)](#6-получение-ssl-сертификата-https)
7. [Структура файлов проекта](#7-структура-файлов-проекта)
8. [FAQ](#8-faq)

---

## 1. Что такое Docker и зачем он нужен

### Простое объяснение

**Docker** — это инструмент для "упаковки" приложений в изолированные контейнеры. Представь, что контейнер — это как "виртуальный компьютер" с минимальным набором всего необходимого для работы одной программы.

### Зачем Docker нужен в этом проекте

| Без Docker | С Docker |
|------------|----------|
| Нужно устанавливать Python 3.11, Node.js 20, PostgreSQL 15 вручную | Все версии зависимостей уже "зашиты" в контейнеры |
| Конфликты версий между проектами | Каждый проект изолирован в своих контейнерах |
| "У меня локально работало" — классика | Одинаковое окружение везде: локально, на сервере, у коллег |
| Сложная настройка окружения | Одна команда `docker-compose up` запускает всё |

### Контейнеры в этом проекте

В `docker-compose.yml` определены 3 контейнера (сервиса):

```
┌─────────────────────────────────────────────────────────────┐
│                      VPS Сервер                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │     db      │  │   backend   │  │      frontend       │  │
│  │ PostgreSQL  │  │   FastAPI   │  │       Next.js       │  │
│  │   :5432     │  │   :8000     │  │        :3000        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│         ▲               │                    │              │
│         └───────────────┘                    │              │
│              (DB запросы)                    │              │
│                         ◄────────────────────┘              │
│                              (API запросы)                  │
└─────────────────────────────────────────────────────────────┘
```

### Нужно ли создавать новые контейнеры для новых страниц?

**НЕТ!** Контейнеры создаются для сервисов (бэкенд, фронтенд, база данных), а не для страниц.

- **Добавляешь новую страницу на сайт?** → Просто создаёшь файл в `frontend/src/app/`
- **Добавляешь новый API endpoint?** → Создаёшь файл в `backend/app/routers/`
- **Добавляешь новую базу данных (например, Redis)?** → Да, тогда нужен новый контейнер

Новые контейнеры нужны только когда добавляешь **новый сервис**, а не функционал.

---

## 2. Настройка DNS для домена

### Что такое DNS запись

DNS (Domain Name System) — это как "телефонная книга интернета". Она связывает доменное имя (например, `mysite.com`) с IP-адресом сервера (например, `195.123.45.67`).

### Какие записи нужно создать

Зайди в панель управления твоего домена (где покупал — Namecheap, GoDaddy, REG.RU, Timeweb и т.д.) и создай **A-записи**:

| Тип | Имя (Host) | Значение (Value) | TTL |
|-----|------------|------------------|-----|
| A   | `@`        | `ТВОЙ_IP_СЕРВЕРА` | 3600 |
| A   | `www`      | `ТВОЙ_IP_СЕРВЕРА` | 3600 |

**Пример для analyticsinterview.live (IP: 212.193.24.98):**

| Тип | Host | Value | TTL |
|-----|------|-------|-----|
| A   | @    | 212.193.24.98 | 3600 |
| A   | www  | 212.193.24.98 | 3600 |

### Пошаговая инструкция

1. **Найди IP-адрес своего VPS сервера** (обычно есть в письме от хостинга или в панели управления VPS)

2. **Зайди в DNS-настройки домена:**
   - **Namecheap**: Domain List → Manage → Advanced DNS
   - **GoDaddy**: My Products → DNS
   - **REG.RU**: Домены → Управление → DNS-серверы
   - **Timeweb**: Домены → DNS-записи

3. **Удали существующие A-записи** (если есть)

4. **Создай новые записи:**

   **Запись 1 (основной домен):**
   ```
   Type: A
   Host: @  (или пустое поле, или имя домена)
   Value: 195.123.45.67  (твой IP)
   TTL: Automatic или 3600
   ```

   **Запись 2 (с www):**
   ```
   Type: A
   Host: www
   Value: 195.123.45.67  (твой IP)
   TTL: Automatic или 3600
   ```

5. **Подожди 5-30 минут** (иногда до 24 часов) пока DNS обновится

### Проверка DNS

Проверь, что DNS работает:

```bash
# На сервере или локально
ping твой-домен.com

# Или через онлайн-сервис:
# https://www.whatsmydns.net/
```

---

## 3. Подготовка сервера

### Подключись к серверу

```bash
ssh root@ТВОЙ_IP_СЕРВЕРА
```

### Обнови систему

```bash
apt update && apt upgrade -y
```

### Установи Docker (если ещё не установлен)

```bash
# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

# Проверка
docker --version
```

### Установи Docker Compose (если команда `docker-compose` не найдена)

**Вариант 1 — через apt (проще всего):**

```bash
apt update
apt install docker-compose -y

# Проверка
docker-compose --version
```

**Вариант 2 — плагин Docker (команда будет `docker compose` с пробелом):**

```bash
apt update
apt install docker-compose-plugin -y

# Тогда используй команду с пробелом:
docker compose --version
docker compose up -d
```

> **Важно:** Если установил плагин (вариант 2), везде в этом гайде вместо `docker-compose` пиши `docker compose` (с пробелом). Если установил через `apt install docker-compose` (вариант 1), используй `docker-compose` (с дефисом).

### Установи Nginx

```bash
apt install nginx -y
systemctl enable nginx
systemctl start nginx
```

### Создай файлы переменных окружения

**Создай файл `backend/.env`:**

```bash
cd /root/AI-for-mock-interview
nano backend/.env
```

Вставь содержимое (замени значения на свои):

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/mock_interview
SECRET_KEY=сгенерируй-случайную-строку-минимум-32-символа
OPENAI_API_KEY=sk-ТВОЙ_OPENAI_КЛЮЧ
LLM_PROVIDER=openai
YOOKASSA_SHOP_ID=ТВОЙ_SHOP_ID
YOOKASSA_SECRET_KEY=ТВОЙ_СЕКРЕТНЫЙ_КЛЮЧ
DEBUG=false
FRONTEND_URL=https://твой-домен.com
```

> **SECRET_KEY** — обязателен для JWT (регистрация/логин). Сгенерировать: `openssl rand -hex 32`  
> **OpenAI:** пошаговый гайд — в файле **[KEYS_SETUP_GUIDE.md](KEYS_SETUP_GUIDE.md)**.

**Создай файл `frontend/.env.local`:**

```bash
nano frontend/.env.local
```

Вставь содержимое:

```env
NEXT_PUBLIC_API_URL=https://твой-домен.com/api
```

**Сохрани и выйди:** `Ctrl+X`, затем `Y`, затем `Enter`

---

## 4. Запуск Docker контейнеров

### Перейди в папку проекта

```bash
cd /root/AI-for-mock-interview
```

### Обнови docker-compose.yml для продакшена

Тебе нужно изменить некоторые настройки. Вот обновлённый `docker-compose.yml` для продакшена:

```bash
nano docker-compose.yml
```

Замени содержимое на:

```yaml
services:
  # PostgreSQL Database
  db:
    image: postgres:15-alpine
    container_name: mock_interview_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: mock_interview
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - app-network

  # FastAPI Backend
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: mock_interview_backend
    restart: unless-stopped
    ports:
      - "127.0.0.1:8000:8000"
    env_file:
      - ./backend/.env
    depends_on:
      db:
        condition: service_healthy
    networks:
      - app-network

  # Next.js Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: mock_interview_frontend
    restart: unless-stopped
    ports:
      - "127.0.0.1:3000:3000"
    env_file:
      - ./frontend/.env.local
    depends_on:
      - backend
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  postgres_data:
```

### Собери и запусти контейнеры

```bash
# Собрать образы (первый раз займёт 5-10 минут)
docker-compose build

# Запустить все контейнеры
docker-compose up -d

# Проверить статус
docker-compose ps
```

### Ожидаемый результат

```
NAME                      STATUS    PORTS
mock_interview_db         Up        5432/tcp
mock_interview_backend    Up        127.0.0.1:8000->8000/tcp
mock_interview_frontend   Up        127.0.0.1:3000->3000/tcp
```

### Проверь логи (если что-то не работает)

```bash
# Логи всех контейнеров
docker-compose logs

# Логи конкретного контейнера
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db
```

### Инициализируй базу данных

```bash
# Запусти seed script для заполнения базы тестовыми задачами
docker-compose exec backend python scripts/seed_tasks.py
```

---

## 5. Настройка Nginx (reverse proxy)

Nginx будет принимать запросы на портах 80/443 и перенаправлять их на контейнеры.

### Создай конфигурацию Nginx

```bash
nano /etc/nginx/sites-available/mock-interview
```

Вставь конфигурацию (замени `твой-домен.com` на свой домен):

```nginx
server {
    listen 80;
    server_name analyticsinterview.live www.analyticsinterview.live;

    # Redirect HTTP to HTTPS (раскомментируй после получения SSL)
    # return 301 https://$server_name$request_uri;

    # Для получения SSL сертификата
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Frontend (Next.js)
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

    # Backend API (FastAPI)
    location /api/ {
        rewrite ^/api/(.*) /$1 break;
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API docs
    location /docs {
        proxy_pass http://127.0.0.1:8000/docs;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    location /openapi.json {
        proxy_pass http://127.0.0.1:8000/openapi.json;
    }
}
```

### Активируй конфигурацию

```bash
# Создай символическую ссылку
ln -s /etc/nginx/sites-available/mock-interview /etc/nginx/sites-enabled/

# Удали дефолтную конфигурацию
rm /etc/nginx/sites-enabled/default

# Проверь конфигурацию на ошибки
nginx -t

# Перезапусти Nginx
systemctl restart nginx
```

### Проверь, что сайт доступен

Открой в браузере: `http://твой-домен.com`

---

## 6. Получение SSL сертификата (HTTPS)

### Установи Certbot

```bash
apt install certbot python3-certbot-nginx -y
```

### Получи сертификат

```bash
certbot --nginx -d analyticsinterview.live -d www.analyticsinterview.live
```

Следуй инструкциям:
1. Введи email для уведомлений
2. Согласись с условиями (Y)
3. Выбери, перенаправлять ли HTTP на HTTPS (рекомендую: 2 — Redirect)

### Настрой автоматическое обновление сертификата

```bash
# Тест автообновления
certbot renew --dry-run

# Автообновление уже настроено через cron/systemd timer
systemctl status certbot.timer
```

### Обнови переменные окружения

После получения SSL, обнови URL-ы в `.env` файлах:

```bash
# backend/.env
FRONTEND_URL=https://analyticsinterview.live

# frontend/.env.local  
NEXT_PUBLIC_API_URL=https://analyticsinterview.live/api
```

Перезапусти контейнеры:

```bash
docker-compose down
docker-compose up -d
```

---

## 7. Структура файлов проекта

### Общая архитектура

```
AI-for-mock-interview/
├── backend/                    # FastAPI бэкенд (Python)
├── frontend/                   # Next.js фронтенд (React/TypeScript)
├── docker-compose.yml          # Конфигурация Docker контейнеров
├── README.md                   # Основная документация
├── PLAN.md                     # План разработки
├── PRD.md                      # Product Requirements Document
└── DEPLOYMENT_GUIDE.md         # Это руководство
```

---

### Backend (FastAPI) — `/backend/`

#### Основные файлы

| Файл | Описание |
|------|----------|
| `Dockerfile` | Инструкция для сборки Docker-образа бэкенда |
| `requirements.txt` | Список Python-зависимостей |
| `alembic.ini` | Конфигурация для миграций базы данных |
| `alembic/` | Папка с миграциями базы данных |

#### Папка `/backend/app/` — Основной код

| Файл | Описание |
|------|----------|
| `__init__.py` | Пустой файл, делает папку Python-пакетом |
| `main.py` | **Точка входа FastAPI приложения**. Создаёт приложение, настраивает CORS, подключает роутеры |
| `config.py` | **Конфигурация приложения**. Загружает переменные окружения (API ключи, URL базы данных и т.д.) |
| `database.py` | **Подключение к базе данных**. Создаёт асинхронное соединение с PostgreSQL |

#### Папка `/backend/app/models/` — Модели базы данных (SQLAlchemy)

| Файл | Описание |
|------|----------|
| `user.py` | Модель пользователя (id, имя, email, telegram, password_hash, лимит вопросов) |
| `task.py` | Модель задачи/вопроса для интервью |
| `llm_answer.py` | Модель для сохранения ответов и фидбека от LLM |
| `payment.py` | Модель платежа (YooKassa) |

#### Папка `/backend/app/routers/` — API эндпоинты (роуты)

| Файл | Описание |
|------|----------|
| `auth.py` | **Авторизация**: `/auth/register`, `/auth/login`, `/auth/status`, `/auth/me`. Своя JWT-логика (email/Telegram + пароль) |
| `interview.py` | **Интервью**: `/interview/start`, `/interview/session/{id}`, `/interview/answer`. Логика прохождения интервью |
| `payment.py` | **Платежи**: `/payment/plans`, `/payment/create`, `/payment/webhook`. Интеграция с YooKassa |

#### Папка `/backend/app/schemas/` — Pydantic схемы (валидация данных)

| Файл | Описание |
|------|----------|
| `user.py` | Схемы для пользователя (UserCreate, UserResponse, UserStatus) |
| `interview.py` | Схемы для интервью (InterviewStart, InterviewAnswer, TaskFeedback, FinalReport) |
| `task.py` | Схемы для задач (TaskSelection, TaskResponse) |
| `payment.py` | Схемы для платежей |

#### Папка `/backend/app/services/` — Бизнес-логика

| Файл | Описание |
|------|----------|
| `auth.py` | Логика авторизации: регистрация/вход, хеширование паролей, выдача JWT |
| `interview.py` | **Основная логика интервью**: создание сессий, выдача задач, обработка ответов |
| `llm.py` | **Работа с LLM (OpenAI/Anthropic)**: генерация фидбека на ответы, итоговый отчёт |
| `payment.py` | Логика платежей: создание платежа в YooKassa, обработка webhook |

#### Папка `/backend/scripts/` — Утилиты

| Файл | Описание |
|------|----------|
| `seed_tasks.py` | Скрипт для заполнения базы данных тестовыми задачами |

---

### Frontend (Next.js) — `/frontend/`

#### Основные файлы

| Файл | Описание |
|------|----------|
| `Dockerfile` | Инструкция для сборки Docker-образа фронтенда |
| `package.json` | Список npm-зависимостей и скрипты запуска |
| `next.config.js` | Конфигурация Next.js |
| `tailwind.config.ts` | Конфигурация Tailwind CSS (стили) |
| `tsconfig.json` | Конфигурация TypeScript |
| `postcss.config.js` | Конфигурация PostCSS |
| `.eslintrc.json` | Конфигурация линтера |

#### Папка `/frontend/src/app/` — Страницы (App Router)

Next.js 13+ использует файловую систему для роутинга. Каждая папка = URL путь.

| Файл/Папка | URL | Описание |
|------------|-----|----------|
| `page.tsx` | `/` | **Главная страница**. Управляет экранами: лендинг → выбор → интервью → отчёт |
| `layout.tsx` | — | **Общий layout**. Шрифты + глобальные стили |
| `globals.css` | — | **Глобальные стили**. CSS переменные, анимации, базовые классы |
| `payment/mock/page.tsx` | `/payment/mock` | Страница мок-оплаты (для тестирования) |
| `payment/success/page.tsx` | `/payment/success` | Страница успешной оплаты |

#### Папка `/frontend/src/components/` — React компоненты

| Компонент | Описание |
|-----------|----------|
| `AnimatedSphere.tsx` | **Анимированная сфера** на главном экране. Canvas-анимация с эффектом пульсации |
| `LandingPage.tsx` | **Лендинг**. Отображает сферу, кнопку "Start", описание продукта |
| `SelectionFlow.tsx` | **Выбор параметров интервью**. Пошаговый выбор: специализация → опыт → tier компании → тема |
| `InterviewChat.tsx` | **Чат интервью**. Отображает задачи, принимает ответы, показывает фидбек, таймер |
| `FinalReport.tsx` | **Финальный отчёт**. Общая оценка, разбор каждой задачи, рекомендации |
| `PaymentModal.tsx` | **Модальное окно оплаты**. Выбор тарифа, интеграция с YooKassa |

#### Папка `/frontend/src/lib/` — Утилиты

| Файл | Описание |
|------|----------|
| `api.ts` | **API клиент**. Функции для запросов к бэкенду: `authApi`, `interviewApi`, `paymentApi` |

#### Папка `/frontend/src/store/` — Состояние (Zustand)

| Файл | Описание |
|------|----------|
| `interviewStore.ts` | **Глобальное состояние**. Хранит: выбор пользователя, ID сессии, задачи, ответы, фидбек, отчёт |

#### Файл `/frontend/src/middleware.ts`

Заглушка (проходящие middleware) — авторизация целиком реализована во фронте через модалку.

---

### Как добавлять новые страницы

**Пример: добавить страницу "О проекте" по URL `/about`**

1. Создай файл `frontend/src/app/about/page.tsx`:

```tsx
export default function AboutPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-3xl font-bold">О проекте</h1>
      <p>Описание проекта...</p>
    </div>
  )
}
```

2. Пересобери фронтенд:

```bash
docker-compose up -d --build frontend
```

3. Страница доступна по адресу: `https://твой-домен.com/about`

---

### Как добавлять новые API эндпоинты

**Пример: добавить эндпоинт `/analytics/stats`**

1. Создай файл `backend/app/routers/analytics.py`:

```python
from fastapi import APIRouter

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/stats")
async def get_stats():
    return {"total_users": 100, "total_interviews": 500}
```

2. Подключи роутер в `backend/app/main.py`:

```python
from app.routers.analytics import router as analytics_router
# ...
app.include_router(analytics_router)
```

3. Пересобери бэкенд:

```bash
docker-compose up -d --build backend
```

4. Эндпоинт доступен: `https://твой-домен.com/api/analytics/stats`

---

## 8. FAQ

### Как посмотреть логи?

```bash
# Все логи
docker-compose logs -f

# Логи конкретного сервиса
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Как перезапустить сервисы?

```bash
# Перезапустить всё
docker-compose restart

# Перезапустить конкретный сервис
docker-compose restart backend
```

### Как обновить код после изменений?

```bash
cd /root/AI-for-mock-interview
git pull origin main
docker-compose down
docker-compose up -d --build
```

### Как зайти внутрь контейнера?

```bash
# В контейнер бэкенда
docker-compose exec backend bash

# В контейнер фронтенда
docker-compose exec frontend sh

# В базу данных
docker-compose exec db psql -U postgres -d mock_interview
```

### Как очистить всё и начать заново?

```bash
# Остановить и удалить контейнеры + volumes (УДАЛИТ ДАННЫЕ!)
docker-compose down -v

# Удалить все неиспользуемые образы
docker system prune -a

# Запустить заново
docker-compose up -d --build
```

### Сайт не открывается — что проверить?

1. **Проверь статус контейнеров:**
   ```bash
   docker-compose ps
   ```

2. **Проверь логи на ошибки:**
   ```bash
   docker-compose logs
   ```

3. **Проверь Nginx:**
   ```bash
   nginx -t
   systemctl status nginx
   ```

4. **Проверь DNS:**
   ```bash
   ping твой-домен.com
   ```

5. **Проверь фаервол:**
   ```bash
   ufw status
   # Если active, разреши порты:
   ufw allow 80
   ufw allow 443
   ```

### Где хранятся данные базы?

Данные PostgreSQL хранятся в Docker volume `postgres_data`. При команде `docker-compose down` (без `-v`) данные сохраняются.

---

## Команды на каждый день

```bash
# Статус сервисов
docker-compose ps

# Логи в реальном времени
docker-compose logs -f

# Перезапуск после изменений
git pull && docker-compose up -d --build

# Остановка
docker-compose down

# Запуск
docker-compose up -d
```

---

**Готово!** Теперь твой сайт должен быть доступен по адресу `https://твой-домен.com`
