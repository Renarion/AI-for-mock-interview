"""
Script to seed the database with sample tasks.
Run this after migrations to populate the tasks table.
"""
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import async_session_maker, init_db
from app.models.task import Task

SAMPLE_TASKS = [
    # Product Analyst - Junior - Tier 1 - Statistics
    {
        "task_question": """У вас есть данные о посещаемости сайта за месяц. Среднее количество посещений в день составляет 10,000, стандартное отклонение — 2,000.

1. Какова вероятность, что в случайный день посещаемость будет больше 14,000?
2. В каком диапазоне будет находиться 95% всех значений посещаемости?

Предполагаем нормальное распределение.""",
        "task_answer": "1. z = (14000-10000)/2000 = 2. P(Z > 2) ≈ 2.28%. 2. 95% CI: μ ± 1.96σ = 10000 ± 3920 = [6080, 13920]",
        "company_tier": "tier1",
        "employee_level": "junior",
        "type": "product_analyst",
        "subtype": "statistics",
        "source": "internal",
    },
    {
        "task_question": """Вы работаете над метрикой конверсии в корзину. За последнюю неделю вы собрали следующие данные:
- Понедельник: 5.2%
- Вторник: 4.8%
- Среда: 5.1%
- Четверг: 5.5%
- Пятница: 4.9%
- Суббота: 6.2%
- Воскресенье: 6.0%

Рассчитайте среднюю конверсию и стандартное отклонение. Есть ли статистически значимые отличия между будними и выходными днями?""",
        "task_answer": "Средняя: 5.39%, Std: 0.51%. Будни: 5.1%, Выходные: 6.1%. Для проверки значимости нужен t-test, но выборка мала.",
        "company_tier": "tier1",
        "employee_level": "junior",
        "type": "product_analyst",
        "subtype": "statistics",
        "source": "internal",
    },
    # Product Analyst - Junior - Tier 1 - A/B Testing
    {
        "task_question": """Вы проводите A/B тест новой кнопки оформления заказа. Результаты за неделю:

Контроль (A): 10,000 пользователей, 250 конверсий
Тест (B): 10,000 пользователей, 300 конверсий

1. Рассчитайте конверсию для каждой группы
2. Можно ли утверждать, что вариант B лучше? Обоснуйте.
3. Какие факторы могли повлиять на результат помимо изменения кнопки?""",
        "task_answer": "CR_A = 2.5%, CR_B = 3.0%. Lift = 20%. Для статзначимости нужен chi-squared или z-test. При α=0.05 и таких размерах p-value ≈ 0.04, результат значим.",
        "company_tier": "tier1",
        "employee_level": "junior",
        "type": "product_analyst",
        "subtype": "ab_testing",
        "source": "internal",
    },
    {
        "task_question": """Вы хотите провести A/B тест нового алгоритма рекомендаций. Текущая конверсия — 3%, ожидаемый эффект — +10% (относительный). 

1. Какой минимальный размер выборки нужен для каждой группы при α=0.05 и power=0.8?
2. Сколько дней займёт тест, если на сайт приходит 50,000 пользователей в день?
3. Какие риски есть при недостаточном размере выборки?""",
        "task_answer": "Baseline CR = 3%, MDE = 0.3%. По формуле: n ≈ 16*(0.03*0.97)/(0.003)² ≈ 51,500 на группу. При 50k/день нужно ~2-3 дня.",
        "company_tier": "tier1",
        "employee_level": "junior",
        "type": "product_analyst",
        "subtype": "ab_testing",
        "source": "internal",
    },
    # Product Analyst - Junior - Tier 1 - SQL
    {
        "task_question": """У вас есть таблица orders с полями:
- order_id (int)
- user_id (int)
- order_date (date)
- amount (decimal)
- status (varchar) — 'completed', 'cancelled', 'pending'

Напишите SQL запрос, который выведет для каждого месяца 2024 года:
- Количество завершённых заказов
- Общую сумму завершённых заказов
- Средний чек
- Количество уникальных покупателей""",
        "task_answer": """SELECT 
  DATE_TRUNC('month', order_date) as month,
  COUNT(*) as orders,
  SUM(amount) as total,
  AVG(amount) as avg_check,
  COUNT(DISTINCT user_id) as unique_users
FROM orders 
WHERE status = 'completed' 
  AND order_date >= '2024-01-01' 
  AND order_date < '2025-01-01'
GROUP BY 1 ORDER BY 1;""",
        "company_tier": "tier1",
        "employee_level": "junior",
        "type": "product_analyst",
        "subtype": "sql",
        "source": "internal",
    },
    {
        "task_question": """Есть две таблицы:
- users: user_id, registration_date, country
- orders: order_id, user_id, order_date, amount

Напишите запрос, который найдёт когортную retention по месяцам. Для каждой когорты (месяц регистрации) покажите процент пользователей, сделавших заказ в 0, 1, 2 месяц после регистрации.""",
        "task_answer": """WITH cohorts AS (
  SELECT user_id, DATE_TRUNC('month', registration_date) as cohort_month
  FROM users
),
orders_months AS (
  SELECT user_id, DATE_TRUNC('month', order_date) as order_month
  FROM orders
)
SELECT 
  c.cohort_month,
  COUNT(DISTINCT c.user_id) as cohort_size,
  COUNT(DISTINCT CASE WHEN o.order_month = c.cohort_month THEN c.user_id END) * 100.0 / COUNT(DISTINCT c.user_id) as m0,
  COUNT(DISTINCT CASE WHEN o.order_month = c.cohort_month + INTERVAL '1 month' THEN c.user_id END) * 100.0 / COUNT(DISTINCT c.user_id) as m1,
  COUNT(DISTINCT CASE WHEN o.order_month = c.cohort_month + INTERVAL '2 month' THEN c.user_id END) * 100.0 / COUNT(DISTINCT c.user_id) as m2
FROM cohorts c
LEFT JOIN orders_months o ON c.user_id = o.user_id
GROUP BY 1 ORDER BY 1;""",
        "company_tier": "tier1",
        "employee_level": "junior",
        "type": "product_analyst",
        "subtype": "sql",
        "source": "internal",
    },
    # Data Analyst - Junior - Tier 1 - Python
    {
        "task_question": """Напишите функцию на Python, которая принимает список чисел и возвращает словарь с базовыми статистиками:
- count
- mean
- median
- std (стандартное отклонение выборки)
- min
- max

Не используйте внешние библиотеки типа numpy или pandas. Только стандартная библиотека Python.""",
        "task_answer": """def calculate_stats(numbers):
    n = len(numbers)
    if n == 0:
        return None
    
    sorted_nums = sorted(numbers)
    mean = sum(numbers) / n
    
    if n % 2 == 0:
        median = (sorted_nums[n//2-1] + sorted_nums[n//2]) / 2
    else:
        median = sorted_nums[n//2]
    
    variance = sum((x - mean) ** 2 for x in numbers) / (n - 1)
    std = variance ** 0.5
    
    return {
        'count': n,
        'mean': mean,
        'median': median,
        'std': std,
        'min': min(numbers),
        'max': max(numbers)
    }""",
        "company_tier": "tier1",
        "employee_level": "junior",
        "type": "data_analyst",
        "subtype": "python",
        "source": "internal",
    },
    # Data Analyst - Middle - Tier 1 - Statistics
    {
        "task_question": """Вы анализируете результаты маркетинговой кампании. Есть две группы пользователей:
- Получившие email-рассылку: 5000 человек, 150 конверсий
- Не получившие рассылку: 5000 человек, 100 конверсий

1. Проведите статистический тест для сравнения конверсий
2. Рассчитайте 95% доверительный интервал для разницы в конверсиях
3. Как бы вы интерпретировали результаты для бизнеса?
4. Какие confounding факторы могут влиять на результат?""",
        "task_answer": "CR1=3%, CR2=2%, diff=1%. Chi-squared или z-test. 95% CI для разницы ≈ [0.3%, 1.7%]. Статзначимо при α=0.05. Нужно учитывать selection bias.",
        "company_tier": "tier1",
        "employee_level": "middle",
        "type": "data_analyst",
        "subtype": "statistics",
        "source": "internal",
    },
    # Product Analyst - Senior - Tier 1 - A/B Testing
    {
        "task_question": """Вы отвечаете за A/B тестирование в крупном e-commerce. Бизнес просит протестировать редизайн главной страницы.

1. Как бы вы спроектировали эксперимент?
2. Какие метрики выбрали бы как основные и дополнительные?
3. Как учесть сетевые эффекты и каннибализацию?
4. Что делать, если тест показывает рост одной метрики и падение другой?
5. Как правильно коммуницировать результаты stakeholders?""",
        "task_answer": "Полный ответ включает: выбор unit of randomization, guardrail metrics, OEC, power analysis, duration, novelty effect, learning effect, multiple comparisons correction.",
        "company_tier": "tier1",
        "employee_level": "senior",
        "type": "product_analyst",
        "subtype": "ab_testing",
        "source": "internal",
    },
    # Tier 2 tasks
    {
        "task_question": """Объясните разницу между correlation и causation на примере из реального бизнеса. Как продуктовый аналитик может установить причинно-следственную связь?""",
        "task_answer": "Корреляция — статистическая связь, causation — причина. Примеры: мороженое и утопления. Для causation: A/B тесты, instrumental variables, RDD, diff-in-diff.",
        "company_tier": "tier2",
        "employee_level": "junior",
        "type": "product_analyst",
        "subtype": "statistics",
        "source": "internal",
    },
    {
        "task_question": """Что такое p-value? Объясните на простом примере. Почему p-value часто неправильно интерпретируют?""",
        "task_answer": "p-value — вероятность получить такой же или более экстремальный результат при условии, что H0 верна. НЕ вероятность что H0 верна. Ошибки: путают с P(H0|data).",
        "company_tier": "tier2",
        "employee_level": "junior",
        "type": "data_analyst",
        "subtype": "statistics",
        "source": "internal",
    },
    {
        "task_question": """Напишите SQL запрос для поиска пользователей, которые сделали покупку в первый день после регистрации, но не сделали ни одной покупки в течение следующих 30 дней.

Таблицы:
- users: user_id, registration_date
- purchases: purchase_id, user_id, purchase_date, amount""",
        "task_answer": """SELECT u.user_id
FROM users u
JOIN purchases p1 ON u.user_id = p1.user_id 
  AND p1.purchase_date = u.registration_date
LEFT JOIN purchases p2 ON u.user_id = p2.user_id 
  AND p2.purchase_date > u.registration_date 
  AND p2.purchase_date <= u.registration_date + INTERVAL '30 days'
WHERE p2.purchase_id IS NULL;""",
        "company_tier": "tier2",
        "employee_level": "middle",
        "type": "data_analyst",
        "subtype": "sql",
        "source": "internal",
    },
]


async def seed_tasks():
    """Seed the database with sample tasks."""
    await init_db()
    
    async with async_session_maker() as session:
        # Check if tasks already exist
        from sqlalchemy import select, func
        result = await session.execute(select(func.count()).select_from(Task))
        count = result.scalar()
        
        if count > 0:
            print(f"Database already has {count} tasks. Skipping seed.")
            return
        
        # Add tasks
        for task_data in SAMPLE_TASKS:
            task = Task(**task_data)
            session.add(task)
        
        await session.commit()
        print(f"Successfully seeded {len(SAMPLE_TASKS)} tasks.")


if __name__ == "__main__":
    asyncio.run(seed_tasks())
