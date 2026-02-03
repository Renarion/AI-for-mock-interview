# AI Mock Interview

AI-powered mock interview platform for Data Analyst and Product Analyst positions in Russian tech companies.

## 🚀 Features

- **Animated Landing Page** - Beautiful pulsating sphere animation inspired by AI/futuristic themes
- **Custom Authentication** - Registration and login by email or Telegram nickname + password (no external providers, works without VPN)
- **Interview Selection** - Choose specialization, experience level, company tier, and topic
- **AI-Powered Feedback** - Get detailed feedback on your answers from LLM (OpenAI/Anthropic)
- **Final Reports** - Comprehensive analysis with study recommendations
- **Payment Integration** - YooKassa integration for purchasing question packs

## 🏗️ Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend   │────▶│  PostgreSQL │
│   (Next.js) │     │  (FastAPI)  │     │   Database  │
└─────────────┘     └──────┬──────┘     └─────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌─────────┐  ┌─────────┐  ┌─────────┐
        │ JWT +   │  │   LLM   │  │YooKassa │
        │ DB Auth │  │   API   │  │ Payment │
        └─────────┘  └─────────┘  └─────────┘
```

## 📁 Project Structure

```
.
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── models/         # SQLAlchemy models
│   │   ├── routers/        # API routes
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   ├── config.py       # Settings
│   │   ├── database.py     # DB connection
│   │   └── main.py         # FastAPI app
│   ├── alembic/            # Database migrations
│   ├── scripts/            # Utility scripts
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/           # Pages (App Router)
│   │   ├── components/    # React components
│   │   ├── lib/           # Utilities & API client
│   │   └── store/         # Zustand state management
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml      # Docker composition
└── README.md
```

## 🛠️ Setup

### Prerequisites

- Docker & Docker Compose (recommended)
- Or: Python 3.11+, Node.js 20+, PostgreSQL 15+

### Environment Variables

Create three files (examples are provided in the repo):

1. **Project root `.env`** — copy `.env.example`
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   FRONTEND_URL=http://localhost:3000
   SECRET_KEY=local-dev-secret
   ```
   This file is used by `docker-compose` for variable substitution during builds.

2. **`backend/.env`** — copy `backend/.env.example`
   ```env
   DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/mock_interview
   SECRET_KEY=change-me-in-production
   OPENAI_API_KEY=sk-xxxxx
   # or ANTHROPIC_API_KEY=sk-ant-xxxxx
   LLM_PROVIDER=openai
   YOOKASSA_SHOP_ID=xxxxx
   YOOKASSA_SECRET_KEY=xxxxx
   DEBUG=false
   FRONTEND_URL=https://analyticsinterview.live
   ```
   > For local development without Docker set the host in `DATABASE_URL` to `localhost`.

3. **`frontend/.env.local`** (for local dev)
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```
   For production build, set `NEXT_PUBLIC_API_URL` in `.env` before `docker-compose build`.

### Running with Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# (Optional) seed database with tasks
docker-compose exec backend python scripts/seed_tasks.py
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

> Backend container automatically runs `alembic upgrade head` on each start (`backend/start.sh`).

### Running Locally (Development)

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Seed tasks
python scripts/seed_tasks.py

# Start server (migrations run automatically in docker image via start.sh)
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## 📱 User Flow

1. **Landing** - User sees animated sphere, clicks "Start the interview"
2. **Auth** - If not logged in, a modal opens: login (email or Telegram + password) or register (name, email, optional Telegram, password)
3. **Selection** - Choose specialization → experience level → company tier → topic
4. **Interview** - Answer 3 questions with 20-minute timer each
5. **Feedback** - Get AI-powered feedback after each answer
6. **Report** - View final report with scores and recommendations
7. **Payment** - If no questions left, purchase more via YooKassa

## 🎨 Design

The UI is inspired by:
- Yandex Music's "My Wave" page
- Futuristic AI/tech aesthetics
- Dark theme with cyan and purple gradients

Key components:
- `AnimatedSphere` - Canvas-based pulsating sphere animation
- `InterviewChat` - Chat-like interface for Q&A
- `FinalReport` - Detailed results with motivational elements

## 🔌 API Endpoints

### Auth
- `POST /auth/register` - Register (name, email, optional telegram_username, password)
- `POST /auth/login` - Login (login = email or telegram, password)
- `GET /auth/status` - Get user status (optional Bearer token)
- `GET /auth/me` - Get current user profile (Bearer token required)

### Interview
- `POST /interview/start` - Start new interview session
- `GET /interview/session/{id}` - Get session state
- `POST /interview/session/{id}/answer` - Submit answer
- `POST /interview/session/{id}/finish` - Finish and get report

### Payment
- `GET /payment/plans` - Get pricing plans
- `POST /payment/create` - Create payment
- `POST /payment/webhook` - YooKassa webhook

## 🧩 TODOs / Stubs

The following features have stubs for further implementation:

- **YooKassa Integration** - Mock payment flow, needs real integration
- **Redis Session Storage** - Currently in-memory, add Redis for production
- **More Tasks** - Add more interview questions to the database
- **Analytics** - Add tracking for user behavior
- **Admin Panel** - Manage tasks and view analytics

## 📄 License

MIT
