# Гайд: как получить ключи Clerk и OpenAI

Для работы сайта **analyticsinterview.live** нужны два набора ключей:

1. **Clerk** — авторизация (вход через Google и т.д.)
2. **OpenAI** — AI-фидбек по ответам на вопросы интервью

Ниже пошагово, что сделать в каждом сервисе.

---

## 1. Clerk (авторизация)

Clerk даёт вход через Google, email и т.д. Бесплатный тариф подходит для старта.

### Шаг 1: Регистрация

1. Открой: **https://clerk.com**
2. Нажми **Sign up** и зарегистрируйся (email или Google).
3. Подтверди почту, если попросят.

### Шаг 2: Создание приложения

1. В дашборде Clerk нажми **Create application**.
2. **Application name:** например `AI Mock Interview` или `analyticsinterview`.
3. **Sign-in options:** включи **Email** и **Google** (рекомендую).
4. Остальное можно оставить по умолчанию → **Create application**.

### Шаг 3: Где взять ключи

1. В левом меню выбери **API Keys**.
2. Увидишь два ключа:
   - **Publishable key** — начинается с `pk_test_` или `pk_live_`. Его можно показывать во фронтенде.
   - **Secret key** — начинается с `sk_test_` или `sk_live_`. Его храни только на сервере, никому не показывай.

Скопируй оба — они понадобятся в `frontend/.env.local` и `backend/.env`.

### Шаг 4: Настроить домен (для продакшена)

1. В меню Clerk: **Configure** → **Domains** (или **Settings** → **Domains**).
2. Добавь домен: `analyticsinterview.live` (и при желании `www.analyticsinterview.live`).
3. Сохрани. Clerk подскажет, какие CNAME/DNS записи добавить, если понадобится.

### Шаг 5: JWT Issuer (для бэкенда)

1. В Clerk: **Configure** → **JWT Templates** или **API Keys**.
2. Найди **Issuer URL** (JWT Issuer). Обычно выглядит так:  
   `https://твой-префикс.clerk.accounts.dev`
3. Скопируй этот URL — он нужен в `backend/.env` как `CLERK_JWT_ISSUER`.

Итого для Clerk у тебя будут:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (pk_test_...)
- `CLERK_SECRET_KEY` (sk_test_...)
- `CLERK_JWT_ISSUER` (https://....clerk.accounts.dev)

---

## 2. OpenAI (AI-фидбек)

OpenAI даёт модель для генерации фидбека по ответам. Есть платные запросы, но при регистрации часто дают стартовый кредит.

### Шаг 1: Регистрация и биллинг

1. Открой: **https://platform.openai.com**
2. Войди или зарегистрируйся (через Google или email).
3. Перейди: **Settings** (иконка профиля) → **Billing** → **Payment methods**.
4. Добавь способ оплаты (карта). Без этого API может не выдавать ключи или быстро отключать доступ. Часто дают бесплатный кредит при первом пополнении.

### Шаг 2: Создание API-ключа

1. В OpenAI: **API keys** (в меню слева или по ссылке https://platform.openai.com/api-keys).
2. Нажми **Create new secret key**.
3. Дай ключу имя, например `analyticsinterview`.
4. Скопируй ключ **сразу** — потом его не покажут снова. Ключ начинается с `sk-...`.

Этот ключ — твой `OPENAI_API_KEY` для `backend/.env`.

### Шаг 3: Лимиты (по желанию)

В **Settings** → **Limits** можно выставить лимит расходов в месяц, чтобы не переплатить.

---

## 3. Куда вставить ключи

### На сервере (в папке проекта)

**backend/.env** — добавь или замени:

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/mock_interview
CLERK_SECRET_KEY=sk_test_xxxxx
CLERK_JWT_ISSUER=https://xxxxx.clerk.accounts.dev
OPENAI_API_KEY=sk-xxxxx
LLM_PROVIDER=openai
SECRET_KEY=придумай-случайную-длинную-строку-32-символа
DEBUG=false
FRONTEND_URL=https://analyticsinterview.live
```

**frontend/.env.local** — добавь или замени:

```env
NEXT_PUBLIC_API_URL=https://analyticsinterview.live/api
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
```

Подставь вместо `xxxxx` свои реальные значения из Clerk и OpenAI.

### После изменения .env

Перезапусти контейнеры:

```bash
cd /root/AI-for-mock-interview
docker-compose down
docker-compose up -d
```

Если используешь плагин: `docker compose down` и `docker compose up -d`.

---

## 4. YooKassa (оплата) — по желанию

Оплата в проекте завязана на YooKassa. Если пока не нужна:

- В `backend/.env` можно оставить пустые значения:  
  `YOOKASSA_SHOP_ID=` и `YOOKASSA_SECRET_KEY=`
- Кнопка оплаты может не работать до настройки YooKassa — это нормально.

Когда захочешь включить оплату:

1. Регистрация: **https://yookassa.ru**
2. Подключи магазин, получи **Shop ID** и **Секретный ключ**.
3. Подставь их в `backend/.env` и перезапусти бэкенд.

---

## 5. Краткий чеклист

| Сервис   | Что получить                          | Куда вписать                    |
|----------|--------------------------------------|----------------------------------|
| Clerk    | Publishable key, Secret key, Issuer  | frontend/.env.local, backend/.env |
| OpenAI   | API key (sk-...)                     | backend/.env                     |
| YooKassa | Shop ID, Secret key (позже)          | backend/.env                     |

После того как ключи будут в `.env` и контейнеры перезапущены, авторизация и AI-фидбек на **analyticsinterview.live** должны заработать.
