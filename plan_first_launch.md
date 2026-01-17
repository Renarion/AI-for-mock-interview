# План первого запуска AI Mock Interview

## Цель

Задеплоить текущую версию продукта на сервер и протестировать основной функционал **БЕЗ** доработок интеграций (Clerk, YooKassa и т.д.). Используем заглушки и mock-режимы.

## Варианты деплоя

### Вариант 1: Docker Compose (Рекомендуется) ⭐

Самый простой способ - всё в контейнерах.

### Вариант 2: Локальный запуск

Если Docker недоступен, запускаем напрямую на сервере.

---

## Вариант 1: Docker Compose

### Шаг 1: Подготовка сервера

**Требования:**
- Ubuntu 20.04+ / Debian 11+ / любая Linux с Docker
- Минимум 2GB RAM, 10GB свободного места
- Порты: 3000 (frontend), 8000 (backend), 5432 (PostgreSQL, опционально для внешнего доступа)

**Установка Docker и Docker Compose:**
```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Проверка
docker --version
docker-compose --version
```

### Шаг 2: Клонирование проекта

```bash
# Если проект в Git
git clone <your-repo-url> ai-mock-interview
cd ai-mock-interview

# Или загрузить архив и распаковать
```

### Шаг 3: Настройка переменных окружения

**Создай файл `backend/.env`:**
```bash
cd backend
cat > .env << EOF
# Database (используется из docker-compose, но можно переопределить)
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/mock_interview

# Clerk (заглушки - можно оставить пустыми для теста)
CLERK_SECRET_KEY=
CLERK_PUBLISHABLE_KEY=
CLERK_JWT_ISSUER=

# LLM API (ОБЯЗАТЕЛЬНО для работы фидбека!)
# Получи ключ на https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-your-openai-key-here
# или
# ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
LLM_PROVIDER=openai

# YooKassa (заглушки - можно оставить пустыми)
YOOKASSA_SHOP_ID=
YOOKASSA_SECRET_KEY=

# App Settings
SECRET_KEY=$(openssl rand -hex 32)
DEBUG=true
FRONTEND_URL=http://localhost:3000
EOF
```

**Создай файл `frontend/.env.local`:**
```bash
cd ../frontend
cat > .env.local << EOF
# API URL (для Docker используй имя сервиса, для локального - localhost)
NEXT_PUBLIC_API_URL=http://localhost:8000

# Clerk (заглушки - можно оставить пустыми)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
EOF
```

**Важно:** 
- `OPENAI_API_KEY` или `ANTHROPIC_API_KEY` **обязателен** для генерации фидбека
- Остальные ключи можно оставить пустыми - приложение будет работать с ограничениями

### Шаг 4: Обновление docker-compose.yml для продакшена

Если деплоишь на сервер (не localhost), обнови `FRONTEND_URL`:

```bash
cd ..
# Отредактируй docker-compose.yml, замени localhost на IP сервера или домен
nano docker-compose.yml
```

В секции `backend` измени:
```yaml
environment:
  - FRONTEND_URL=http://YOUR_SERVER_IP:3000  # или http://yourdomain.com
```

### Шаг 5: Запуск приложения

```bash
# Вернись в корень проекта
cd /path/to/ai-mock-interview

# Запусти все сервисы
docker-compose up -d

# Проверь статус
docker-compose ps

# Посмотри логи (если есть ошибки)
docker-compose logs -f
```

### Шаг 6: Инициализация базы данных

```bash
# Дождись запуска всех контейнеров (30-60 секунд)
sleep 30

# Запусти миграции
docker-compose exec backend alembic upgrade head

# Заполни базу тестовыми задачами
docker-compose exec backend python scripts/seed_tasks.py
```

### Шаг 7: Проверка работоспособности

```bash
# Проверь health check backend
curl http://localhost:8000/health
# Должен вернуть: {"status":"healthy"}

# Проверь API docs
# Открой в браузере: http://YOUR_SERVER_IP:8000/docs

# Проверь frontend
# Открой в браузере: http://YOUR_SERVER_IP:3000
```

### Шаг 8: Настройка файрвола (если нужно)

```bash
# Разреши доступ к портам
sudo ufw allow 3000/tcp  # Frontend
sudo ufw allow 8000/tcp  # Backend API
sudo ufw allow 22/tcp    # SSH (если нужен)
sudo ufw enable
```

---

## Вариант 2: Локальный запуск (без Docker)

### Шаг 1: Установка зависимостей

**PostgreSQL:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Создай базу данных
sudo -u postgres psql << EOF
CREATE DATABASE mock_interview;
CREATE USER mock_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE mock_interview TO mock_user;
\q
EOF
```

**Python 3.11+:**
```bash
sudo apt install python3.11 python3.11-venv python3-pip -y
```

**Node.js 20+:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### Шаг 2: Настройка Backend

```bash
cd backend

# Создай виртуальное окружение
python3.11 -m venv venv
source venv/bin/activate

# Установи зависимости
pip install -r requirements.txt

# Создай .env файл (см. Шаг 3 из Варианта 1)
# Обнови DATABASE_URL:
# DATABASE_URL=postgresql+asyncpg://mock_user:your_secure_password@localhost:5432/mock_interview

# Запусти миграции
alembic upgrade head

# Заполни базу задач
python scripts/seed_tasks.py

# Запусти сервер
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Шаг 3: Настройка Frontend

**В новом терминале:**
```bash
cd frontend

# Установи зависимости
npm install

# Создай .env.local (см. Шаг 3 из Варианта 1)
# NEXT_PUBLIC_API_URL=http://localhost:8000

# Запусти dev сервер
npm run dev
```

**Или собери production версию:**
```bash
npm run build
npm start
```

---

## Тестирование функционала

### 1. Проверка Landing Page

1. Открой `http://YOUR_SERVER_IP:3000`
2. Должна появиться анимированная сфера
3. Кнопка "Start the interview" должна быть видна

### 2. Тест без авторизации (mock режим)

**Важно:** В текущей версии Clerk работает в упрощённом режиме (debug mode). Для теста можно:

**Вариант A:** Создать тестовый аккаунт Clerk (5 минут)
1. Зайди на https://clerk.com
2. Создай бесплатный аккаунт
3. Создай новое приложение
4. Скопируй ключи в `.env` файлы

**Вариант B:** Временно обойти авторизацию (для быстрого теста)

Можно временно закомментировать проверку авторизации в `backend/app/routers/auth.py` для теста, но это только для разработки!

### 3. Тест интервью (если авторизация работает)

1. Нажми "Start the interview"
2. Пройди выбор параметров (специализация, уровень, tier, тема)
3. Получи первую задачу
4. Напиши ответ
5. Получи фидбек от LLM (нужен OpenAI/Anthropic ключ!)

### 4. Проверка API напрямую

```bash
# Проверь доступность API
curl http://localhost:8000/

# Проверь список специализаций
curl http://localhost:8000/interview/specializations

# Проверь список тарифов
curl http://localhost:8000/payment/plans
```

---

## Возможные проблемы и решения

### Проблема: Backend не запускается

**Решение:**
```bash
# Проверь логи
docker-compose logs backend

# Проверь подключение к БД
docker-compose exec backend python -c "from app.database import engine; import asyncio; asyncio.run(engine.connect())"
```

### Проблема: Frontend не подключается к Backend

**Решение:**
1. Проверь `NEXT_PUBLIC_API_URL` в `frontend/.env.local`
2. Проверь CORS настройки в `backend/app/main.py`
3. Убедись что backend запущен: `curl http://localhost:8000/health`

### Проблема: Ошибка при генерации фидбека

**Решение:**
- Убедись что `OPENAI_API_KEY` или `ANTHROPIC_API_KEY` установлен
- Проверь баланс API ключа
- Посмотри логи: `docker-compose logs backend | grep -i error`

### Проблема: База данных пустая

**Решение:**
```bash
# Перезапусти seed скрипт
docker-compose exec backend python scripts/seed_tasks.py

# Проверь количество задач
docker-compose exec backend python -c "from app.database import async_session_maker; from app.models.task import Task; from sqlalchemy import select, func; import asyncio; async def check(): async with async_session_maker() as s: r = await s.execute(select(func.count()).select_from(Task)); print(r.scalar()); asyncio.run(check())"
```

---

## Минимальная конфигурация для теста

Если хочешь максимально быстро запустить для теста:

**Минимальный `backend/.env`:**
```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/mock_interview
OPENAI_API_KEY=sk-your-key-here
LLM_PROVIDER=openai
DEBUG=true
FRONTEND_URL=http://localhost:3000
SECRET_KEY=test-secret-key-change-in-production
```

**Минимальный `frontend/.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Остальные переменные можно оставить пустыми - приложение будет работать с ограничениями (mock-режимы).

---

## Следующие шаги после успешного запуска

1. ✅ Протестируй основной flow интервью
2. ✅ Проверь генерацию фидбека от LLM
3. ✅ Протестируй на мобильном устройстве
4. 📝 Зафиксируй найденные баги
5. 🚀 После теста - переходи к доработкам из `PLAN.md`

---

## Полезные команды

```bash
# Остановить все сервисы
docker-compose down

# Остановить и удалить данные (БД будет очищена!)
docker-compose down -v

# Перезапустить один сервис
docker-compose restart backend

# Посмотреть логи конкретного сервиса
docker-compose logs -f backend

# Войти в контейнер
docker-compose exec backend bash

# Обновить код и перезапустить
git pull
docker-compose up -d --build
```

---

## Безопасность для продакшена

⚠️ **ВНИМАНИЕ:** Текущая конфигурация подходит только для тестирования!

Для продакшена обязательно:
1. Измени `SECRET_KEY` на случайную строку
2. Установи `DEBUG=false`
3. Настрой HTTPS (nginx reverse proxy)
4. Настрой реальные ключи Clerk и YooKassa
5. Используй сильные пароли для БД
6. Настрой файрвол (закрой порт 5432 от внешнего доступа)

---

## Поддержка

Если что-то не работает:
1. Проверь логи: `docker-compose logs`
2. Проверь статус контейнеров: `docker-compose ps`
3. Убедись что все переменные окружения установлены
4. Проверь что порты не заняты: `netstat -tulpn | grep -E '3000|8000|5432'`
