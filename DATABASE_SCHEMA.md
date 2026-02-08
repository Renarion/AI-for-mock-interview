# Схема базы данных

Описание таблиц и полей (источник правды — `backend/app/models/`).  
Таблицы создаются миграциями Alembic и при старте приложения (`init_db()` → `Base.metadata.create_all`).

---

## Таблица `users`

Пользователи: регистрация, авторизация, лимиты вопросов.

| Поле | Тип | Nullable | По умолчанию | Описание |
|------|-----|----------|--------------|----------|
| `user_id` | String | NO | — | PK, UUID |
| `created_dttm` | DateTime | YES | now() | Дата создания |
| `name` | String | NO | — | Имя для отображения |
| `email` | String | NO | — | Логин, уникальный |
| `telegram_username` | String | YES | — | Логин (опционально), уникальный |
| `password_hash` | String | NO | — | Хэш пароля (Argon2) |
| `trial_question_flg` | Boolean | YES | true | Есть ли 1 бесплатный вопрос |
| `paid_questions_number_left` | Integer | YES | 0 | Остаток оплаченных вопросов |
| `os` | String | YES | — | ОС (не используется) |
| `country` | String | YES | — | Страна (не используется) |
| `city` | String | YES | — | Город (не используется) |
| `registration_type` | String | YES | 'email' | Способ регистрации |

**Индексы:** `email` (unique), `telegram_username` (unique).

---

## Таблица `tasks`

Вопросы для мок-интервью. Выборка по роли, уровню, тиру и теме.

| Поле | Тип | Nullable | По умолчанию | Описание |
|------|-----|----------|--------------|----------|
| `task_id` | Integer | NO | auto | PK |
| `task_question` | Text | NO | — | Текст вопроса |
| `task_answer` | Text | YES | — | Эталонный ответ (для LLM) |
| `company_tier` | String | NO | — | tier1, tier2 |
| `employee_level` | String | NO | — | junior, middle, senior |
| `type` | String | NO | — | product_analyst, data_analyst |
| `subtype` | String | NO | — | statistics, ab_testing, probability, python, sql, random |
| `source` | String | YES | — | Источник вопроса |

---

## Таблица `payments`

Платежи (ЮKassa и др.).

| Поле | Тип | Nullable | По умолчанию | Описание |
|------|-----|----------|--------------|----------|
| `id` | Integer | NO | auto | PK |
| `user_id` | String | NO | — | FK → users.user_id |
| `transaction_id` | String | NO | — | ID в платёжке, уникальный |
| `payment_dttm` | DateTime | YES | now() | Время платежа |
| `status` | String | YES | 'pending' | pending, succeeded, failed, refunded |
| `transaction_sum` | Float | NO | — | Сумма |
| `payment_provider` | String | YES | 'yookassa' | Провайдер |
| `payment_type` | String | YES | — | card, wallet и т.д. |
| `product_id` | String | NO | — | 3_questions, 6_questions и т.д. |
| `currency` | String | YES | 'RUB' | Валюта |
| `ip_address` | String | YES | — | IP плательщика |

---

## Таблица `llm_answers`

Ответы LLM по задачам: фидбек и сырой текст для аналитики.

| Поле | Тип | Nullable | По умолчанию | Описание |
|------|-----|----------|--------------|----------|
| `id` | Integer | NO | auto | PK |
| `user_id` | String | NO | — | FK → users.user_id |
| `created_dttm` | DateTime | YES | now() | Время создания |
| `feedback_id` | String | NO | — | UUID фидбека, уникальный |
| `feedback_json` | JSON | YES | — | Структурированный фидбек |
| `provided_feedback` | Text | YES | — | Текстовый фидбек |
| `task_id` | Integer | YES | — | FK → tasks.task_id |
| `user_answer` | Text | YES | — | Ответ пользователя |

---

## Служебная таблица `alembic_version`

Создаётся и заполняется **Alembic** (не в `app/models`).  
Хранит одну запись — текущую применённую ревизию миграций (например, `001_custom_auth`).  
Не изменять вручную.

---

## Связи

- `payments.user_id` → `users.user_id`
- `llm_answers.user_id` → `users.user_id`
- `llm_answers.task_id` → `tasks.task_id`

---

## Где что лежит в коде

| Таблица | Модель (файл) |
|---------|----------------|
| users | `app/models/user.py` → `User` |
| tasks | `app/models/task.py` → `Task` |
| payments | `app/models/payment.py` → `Payment` |
| llm_answers | `app/models/llm_answer.py` → `LLMAnswer` |
