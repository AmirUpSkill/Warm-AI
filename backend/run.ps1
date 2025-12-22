# Warm AI Backend Run Script
# Usage: .\run.ps1

Write-Host "🚀 Starting Warm AI Backend..." -ForegroundColor Cyan

# Activate virtual environment
& "$PSScriptRoot\.venv\Scripts\Activate.ps1"

# Display server information
Write-Host "📍 Server will run at http://localhost:8000" -ForegroundColor Green
Write-Host "📚 API Docs will be at http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host ""

# Run the FastAPI server with uvicorn
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
