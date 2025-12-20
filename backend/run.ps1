# Warm AI Backend Run Script
# Usage: .\run.ps1

Write-Host "🚀 Starting Warm AI Backend..." -ForegroundColor Cyan

# Activate virtual environment
& "$PSScriptRoot\.venv\Scripts\Activate.ps1"

# Run the FastAPI server with uvicorn
Write-Host "📍 Server running at http://localhost:8000" -ForegroundColor Green
Write-Host "📚 API Docs at http://localhost:8000/docs" -ForegroundColor Yellow

uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
