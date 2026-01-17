### Common context
1. Основная цель - сделать инструмент для онлайн прохождения мок-интервью на data-related позиции в российские тех компании.
2. Это должен быть одностраничный сайт с кнопкой Start по центру. 
3. Суть сайта в том, что он должен предлагать пройти интервью, давать задачи, после предложенных юзером решений он должен отдавать фидбек с помощью сторонней LLM модели.
4. В этом файле довольно подробное продуктовое описание чего мы хотим получить. Но не все требования супер обязательные. Если ты найдешь какие-то проблемы или неточности, поступай как считаешь нужным согласно общей логике.

### Main page design context
1. Визуальные референсы:
Изображение 1 (Сфера прогрузки начального экрана): начальный экран, при заходе в приложение юзер видит его с главной кнопкой по центру + другими кнопками по краям (оплатить и тд)

Изображение 2 (Пульсирующая сфера с разными цветами): через несколько секунд экран заменяется на такой, где на фоне кнопки пульсирующий эффект сферы, ассоциация с AI и искуственным интеллектом

Следующим после нажатия на кнопку должен быть чат с ботом, где будет проходить интервью и общение с ботом, надо сделать плавный переход после нажатия на кнопку старта

2. Технические требования:
Стек: выбери самый подходящий стек для реализация такого дизайна

Стилистика:

Фон: темный с эффектом сферы с градиентом

Кнопки: Основная кнопка "Start the interview" может быть статической по цвету, главное, чтобы выглядело современно

Шрифты: Без засечек, современный (например, Inter или Geist).

3. Задача:
Создай структуру главной страницы. Сначала реализуй фоновую композицию со сферой (можно использовать CSS-анимации или Framer Motion для плавности), а затем наложи UI-элементы: кнопку в центре, описание продукта под кнопкой и кнопку pay внизу

### Architecture
flowchart LR

U[User]
WA[Web App]

U -->|Init| WA

API[Backend API<br/>Interview Orchestrator<br/>auth interview access payment<br/>interview flow<br/>question selection<br/>LLM feedback]

WA <-->|REST HTTPS<br/>Start interview<br/>Submit answer<br/>Get report| API

subgraph DB[Database PostgreSQL]
  PAYDB[Payments<br/>transactions]
  HIST[Interview History]
  USERS[Users<br/>entitlements free attempts]
  TASKS[Tasks]
end

API -->|update payments| PAYDB
API -->|insert feedback| HIST
API -->|read write entitlements| USERS
API -->|read tasks| TASKS

YK[YooKassa]

API -->|create payment| YK
YK -.->|WEBHOOK| API

LLM[LLM API]

API -->|evaluate answer| LLM
LLM -->|feedback| API  

### User flow
graph TD
Start((Старт)) --> CheckUser[Определяем User: Новый/Оплачен/Триал]
CheckUser --> Landing[Лендинг с кнопкой Try for free / Start / Pay]
Landing --> Auth[Авторизация Google через Clerk]

Auth --> SelectSpec[Выбор специализации: Product/Data Analyst]
SelectSpec --> SelectExp[Выбор опыта работы]

SelectExp --> Junior[Junior]
SelectExp --> MidSen[Middle/Senior]

Junior --> SelectComp[Выбор компании]
MidSen --> SelectComp

SelectComp --> Tier1[Tier 1]
SelectComp --> Tier2[Tier 2]

Tier1 --> SelectTask[Выбор типа задач]
Tier2 --> SelectTask

SelectTask --> Topics[Темы: Статистика, A/B, Теорвер, Python, SQL, Рандом]

Topics --> Banner[Баннер: описание интервью]
Banner --> GetTask[Получает задачу N]

subgraph InterviewLoop [Цикл Интервью]
    GetTask --> SendAnswer[Отправляет текстовый ответ]
    SendAnswer --> Choice[Получает выбор]
    Choice -- Продолжить --> GetTask
    Choice -- Завершить / 3 задачи --> Feedback
end

Feedback[Финальный фидбек + детальный разбор]

Feedback --> ActionRepeat[Повторить]
Feedback --> ActionRec[Порекомендовать]

ActionRec --> LinkSite[Ссылка на сайт]
ActionRepeat --> CheckLimit{Задачи закончились?}

CheckLimit -- Да --> Paywall[Тарифная сетка 3/6/12/24 вопроса]
CheckLimit -- Нет --> SelectSpec

Paywall --> Payment[Перевод на оплату]
Payment --> Paid[Оплатил]
Paid --> Landing


### User flow notes for context
1. State Management: "Используй Zustand/Redux (или Context API) для хранения выбранных настроек (Tier, Level, Topic) и истории чата, чтобы при рефреше страницы данные не терялись."
2. Error Handling: "Если API LLM вернет ошибку, покажи кнопку 'Попробовать снова', а не крашь приложение." Такая логика обработки ошибок нужна на выдаче задания, выдаче фидбека, выдаче финальных рекомендаций, оплаты.
3. Markdown Support: "Ответы AI и фидбек должны рендериться через Markdown (для красивого отображения кода и жирного текста)."
4. После любого перезахода первый шаг воспроизводится. Но при перезагрузке страницы все остается как есть.
5. Референс основной странички сайта - это страничка "Моя волна на яндекс музыке". Внизу краткое описание продукта. Внизу странички всегда есть кнопка Pay. При этом юзер узнает свой статус только после нажатия на единую кнопку "Start".
6. После нажатия на кнопку Start, если юзер не авторизован, то происходит авторизация после нажатия на Try For Free. Нужно сделать бесшовный опыт с помощью Google авторизации через Clerk
7. На этапе выбора типов задач, если юзер выбрал "Рандом", то нужно сделать 3 рандом задачи из разных категорий и сделать так, чтобы не было повторов задач
8. На этапе когда юзер готов получить свою первую задачу, описываем формат. Пишем что мы тебе покажем 3 задачи, что нужно будет ответить текстом, после каждой задачи мы предлагаем получить финальные рекомендации, завершив флоу ИЛИ продолжить решение задач и получить финальный фидбек в конце.
9. На этапе получения и решения задания добавляем таймер, но чтобы не усложнять код с таймингом ничего не делаем. А просто просим уложится в 20 минут и посвечиваем время.
10. На этапе ввода решения ставим ограничение на кол-во символов в пару абзацев + пишем рекомендацию о краткости и содержательности.
11. После отправки решения нужно сделать Loader ожидания процессинга LLM, что юзер не думал что сайт завис.
12. Максимум задач за сессию прохождения мок-интервью = 3
13. На этапе получения фидбека хочется чтобы был развернутный фидбек по каждой из задач. И в конце красивая картинка с мотивацией и рекомендациями что мы советуем доизучить.
14. После окончания сессии в случае окончания задач на балансе мы показываем тарифную сетку и при выборе тарифка перекидываем на Юкассы для оплаты.

### Database
1. user (the table with users' information for being used by backend to check if there is a trial attempt or not and to check how many paid questions left, also for gathering a little information about users): user_id, created_dttm, trial_question_flg, paid_questions_number_left, os, country, city, registration_type
2. task (this table is for pulling tasks for mock-interview based on chosen parameters in steps): task_id, task_question, task_answer, company_tier, employee_level, type, subtype, source
3. payments (the table to store the information on whole payments over the provider and for checking some bugs and errors provided by users, if anything goes wrong): user_id, transaction_id, payment_dttm, status, transaction_sum,payment_provider, payment_type, product_id, currency, ip_address
4.llm_answers (the table for storing a part of llm answers to validate if some of them are wrong or incorrect, this helps to remark the template of answers, temperature or other settings): user_id, created_dttm, feedback_id, feedback_json, provided_feedback


  
