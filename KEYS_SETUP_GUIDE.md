# Гайд по ключам (OpenAI + YooKassa)

На продакшн-сервере **analyticsinterview.live** больше не используется Clerk.  
Нужны только:

1. **OpenAI (или Anthropic)** — модель для AI-фидбека.
2. **YooKassa** — приём платежей (по желанию).

---

## 1. OpenAI (AI-фидбек)

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

## 2. YooKassa (оплата) — опционально

Если оплата пока не нужна — оставь `YOOKASSA_SHOP_ID` и `YOOKASSA_SECRET_KEY` пустыми.

Чтобы подключить:

1. Зарегистрируйся на **https://yookassa.ru**.
2. Создай магазин, получи **Shop ID** и **Secret key**.
3. Впиши в `backend/.env`, перезапусти бэкенд.

---

## 3. Куда заносить значения

### backend/.env (копия backend/.env.example)

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/mock_interview
SECRET_KEY=случайная-длинная-строка
OPENAI_API_KEY=sk-xxxx
LLM_PROVIDER=openai
YOOKASSA_SHOP_ID=
YOOKASSA_SECRET_KEY=
DEBUG=false
FRONTEND_URL=https://analyticsinterview.live
```

### frontend/.env.local

```env
NEXT_PUBLIC_API_URL=https://analyticsinterview.live/api
```

После изменения `.env` перезапусти контейнеры:

```bash
cd ~/AI-for-mock-interview
docker-compose down
docker-compose up -d
```

---

### Краткий чеклист

| Сервис  | Что получить        | Куда вписать |
|---------|---------------------|--------------|
| OpenAI  | `OPENAI_API_KEY`    | backend/.env |
| YooKassa| Shop ID + Secret    | backend/.env |

Авторизация теперь полностью кастомная (email/Telegram + пароль + JWT), ключи Clerk не нужны.
