# Где что запускать: Mac vs сервер

## В чём путаница

- **Твой Mac** (Renats-MacBook-Pro) — это твой компьютер. На нём **нет** папки `/root/`, нет команд `apt`, и Docker нужно ставить отдельно (Docker Desktop для Mac).
- **Сервер (VPS)** с IP 212.193.24.98 — это удалённый Linux-сервер. Команды из DEPLOYMENT_GUIDE и SERVER_QUICK_STEPS нужно выполнять **там**, после подключения по SSH.

---

## 1. Запуск на сервере (чтобы сайт был в интернете)

Сайт **analyticsinterview.live** должен работать на **сервере**, а не на твоём Mac.

### Шаг 1: Подключись к серверу по SSH

**На своём Mac** в терминале выполни:

```bash
ssh root@212.193.24.98
```

(Подставь своего пользователя, если не root, например `ssh ubuntu@212.193.24.98`.)

После ввода пароля ты окажешься **внутри сервера** — приглашение командной строки изменится (будет что-то вроде `root@server:~#`).

### Шаг 2: На сервере перейди в папку проекта

Папка `/root/AI-for-mock-interview` существует **только на сервере** (если ты уже клонировал туда репозиторий). На сервере выполни:

```bash
cd /root/AI-for-mock-interview
# или куда ты клонировал репозиторий на сервере
```

Если репозитория на сервере ещё нет — сначала клонируй его на сервер (на сервере):

```bash
cd /root
git clone https://github.com/ТВОЙ_USERNAME/AI-for-mock-interview.git
cd AI-for-mock-interview
```

### Шаг 3: На сервере установи Docker и Docker Compose

**Всё ещё на сервере** (после SSH):

```bash
# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

# Установка Docker Compose
apt update
apt install docker-compose -y

# Проверка
docker --version
docker-compose --version
```

Дальше по **SERVER_QUICK_STEPS.md** или **DEPLOYMENT_GUIDE.md** — все команды выполняются **на сервере**.

---

## 2. Запуск на Mac (для разработки и тестов)

Если хочешь запускать проект **локально на Mac** (чтобы разрабатывать и проверять без сервера):

### Шаг 1: Установи Docker на Mac

На Mac нет `apt`. Нужен **Docker Desktop**:

1. Скачай: https://www.docker.com/products/docker-desktop/
2. Установи Docker Desktop (перетащи в Applications).
3. Запусти Docker Desktop и дождись, пока в меню появится "Docker is running".
4. В терминале проверь:

```bash
docker --version
docker compose version
```

На Mac обычно используется **`docker compose`** (с пробелом), а не `docker-compose`.

### Шаг 2: Перейди в папку проекта на Mac

На Mac проект у тебя, судя по пути, здесь:

```bash
cd ~/AI-for-mock-interview
# или полный путь:
cd /Users/renario/AI-for-mock-interview/AI-for-mock-interview
```

(`~` = твоя домашняя папка на Mac.)

### Шаг 3: Запуск контейнеров на Mac

```bash
docker compose up -d
# или, если установлен отдельно docker-compose:
docker-compose up -d
```

Проверка:

```bash
docker compose ps
```

Сайт будет доступен локально: http://localhost:3000  
API: http://localhost:8000

---

## Кратко

| Где | Что делать | Путь к проекту |
|-----|------------|----------------|
| **Сервер** (после `ssh root@212.193.24.98`) | Деплой, Nginx, SSL, чтобы сайт был в интернете | `/root/AI-for-mock-interview` (или куда клонировал) |
| **Mac** (твой компьютер) | Разработка, локальный запуск | `~/AI-for-mock-interview` или `/Users/renario/.../AI-for-mock-interview` |

Команды с `apt`, `/root/`, Nginx — только **на сервере**.  
На Mac — Docker Desktop и `docker compose` в папке с проектом.
