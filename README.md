# 🚀 Warm AI
**AI-Native LinkedIn Intelligence & Automation Platform**

Warm AI combines generative reasoning (Gemini) with real-time professional data (Exa AI) to transform how users search for talent and companies.

## 🛠️ Tech Stack
- **Frontend:** Next.js 14 (Vite), Tailwind CSS, ShadCN UI, Zustand, **pnpm**.
- **Backend:** FastAPI (Python 3.12), SQLAlchemy (Async), **UV**.
- **AI/Search:** Gemini 2.0 Flash/Pro, Exa AI SDK.
- **Database:** PostgreSQL.
- **Infra:** Docker & Docker Compose.

## 📁 Project Structure
- `/backend`: FastAPI modular monolith.
- `/frontend`: React application (Vite).
- `/notebooks`: AI prototyping (Exa + Gemini SDK tests).

## 🚀 Quick Start

### 1. Prerequisites
- Python 3.12+
- Node.js 18+
- Docker
- Gemini & Exa API Keys

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Add your EXA_API_KEY and GEMINI_API_KEY
docker-compose up -d postgres
uv sync
uv run alembic upgrade head
uv run python -m app.main
```

### 3. Frontend Setup
```bash
cd frontend
pnpm install
pnpm dev
```

## 🌟 Key Features
- **Omni Search:** Natural language search for people and companies on LinkedIn via Exa AI.
- **AI Chat:** Intelligent reasoning and professional insights powered by Gemini.
- **Knowledge Search (RAG):** Upload documents (PDF/TXT) and query them with AI-powered grounding and citations.
- **History:** Persistent chat and search history stored in PostgreSQL.

---
*Built with ❤️ by Warm AI Team*