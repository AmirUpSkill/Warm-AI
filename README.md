# 🚀 Warm AI
**AI-Native LinkedIn Intelligence & Automation Platform**

Warm AI combines generative reasoning (Gemini) with real-time professional data (Exa AI) to transform how users search for talent and companies.

## 🛠️ Tech Stack
- **Frontend:** Next.js 14 (App Router), Tailwind CSS, ShadCN UI, Zustand.
- **Backend:** FastAPI (Python 3.12), SQLAlchemy (Async), UV.
- **AI/Search:** Gemini 2.0 Flash/Pro, Exa AI SDK.
- **Database:** PostgreSQL.
- **Infra:** Docker & Docker Compose.

## 📁 Project Structure
- `/backend`: FastAPI modular monolith.
- `/frontend`: Next.js application.
- `/notebooks`: AI prototyping (Exa + Gemini SDK tests).

## 🚀 Quick Start
1. **Clone & Setup Env:**
   ```bash
   cp .env.example .env
   # Add your EXA_API_KEY and GEMINI_API_KEY