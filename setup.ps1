# B2B2C Marketplace Setup Script for Windows
# This script sets up the backend and frontend environments

Write-Host "Starting B2B2C Marketplace Setup..." -ForegroundColor Green

# Create necessary directories if they don't exist
if (-not (Test-Path -Path "backend")) {
    New-Item -Path "backend" -ItemType Directory
    Write-Host "Created backend directory" -ForegroundColor Cyan
}

if (-not (Test-Path -Path "frontend")) {
    New-Item -Path "frontend" -ItemType Directory
    Write-Host "Created frontend directory" -ForegroundColor Cyan
}

# Setup Backend
Write-Host "`nSetting up Backend Environment..." -ForegroundColor Yellow
Set-Location -Path "backend"

# Create Python virtual environment
Write-Host "Creating Python virtual environment..." -ForegroundColor Cyan
python -m venv venv

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Cyan
& .\venv\Scripts\Activate.ps1

# Install backend dependencies
Write-Host "Installing backend dependencies..." -ForegroundColor Cyan
pip install fastapi uvicorn sqlalchemy pydantic python-multipart python-jose[cryptography] passlib[bcrypt] python-dotenv pyotp

# Create app directory if it doesn't exist
if (-not (Test-Path -Path "app")) {
    New-Item -Path "app" -ItemType Directory
    Write-Host "Created app directory" -ForegroundColor Cyan
}

# Initialize the database with seed data
Write-Host "Initializing database with seed data..." -ForegroundColor Cyan
python -c "from app.init_db import run_init_db; print(run_init_db())"

# Return to root directory
Set-Location -Path ".."

# Setup Frontend
Write-Host "`nSetting up Frontend Environment..." -ForegroundColor Yellow
Set-Location -Path "frontend"

# Initialize npm and install Vite
Write-Host "Initializing npm and installing Vite..." -ForegroundColor Cyan
npm init -y
npm install -g vite
npm install react react-dom
npm install -D tailwindcss postcss autoprefixer @vitejs/plugin-react

# Create Vite project
Write-Host "Setting up Vite with React..." -ForegroundColor Cyan
npx vite@latest . --template react

# Install additional frontend dependencies
Write-Host "Installing additional frontend dependencies..." -ForegroundColor Cyan
npm install axios react-router-dom @headlessui/react @heroicons/react qrcode.react

# Initialize Tailwind CSS
Write-Host "Initializing Tailwind CSS..." -ForegroundColor Cyan
npx tailwindcss init -p

# Return to root directory
Set-Location -Path ".."

Write-Host "`nSetup Complete!" -ForegroundColor Green
Write-Host "To start the backend server:" -ForegroundColor Cyan
Write-Host "  1. cd backend" -ForegroundColor White
Write-Host "  2. .\venv\Scripts\Activate.ps1" -ForegroundColor White
Write-Host "  3. uvicorn app.main:app --reload" -ForegroundColor White

Write-Host "`nTo start the frontend development server:" -ForegroundColor Cyan
Write-Host "  1. cd frontend" -ForegroundColor White
Write-Host "  2. npm run dev" -ForegroundColor White

Write-Host "`nHappy coding!" -ForegroundColor Magenta
