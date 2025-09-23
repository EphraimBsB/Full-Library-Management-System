# Setup script for ISBAT LMS Backend

Write-Host "🚀 Setting up ISBAT LMS Backend..." -ForegroundColor Cyan

# Check if Node.js is installed
$nodeVersion = node -v
if (-not $nodeVersion) {
    Write-Host "❌ Node.js is not installed. Please install Node.js v18 or later from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found Node.js $nodeVersion" -ForegroundColor Green

# Check if npm is installed
$npmVersion = npm -v
if (-not $npmVersion) {
    Write-Host "❌ npm is not installed. Please install npm v9 or later" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found npm v$npmVersion" -ForegroundColor Green

# Create .env file if it doesn't exist
if (-not (Test-Path .env)) {
    Write-Host "📝 Creating .env file from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "✅ Created .env file. Please update it with your database credentials." -ForegroundColor Green
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Install required global packages if not installed
$requiredPackages = @(
    "@nestjs/cli"
)

foreach ($pkg in $requiredPackages) {
    $pkgInstalled = npm list -g $pkg --depth=0 2>$null
    if (-not $pkgInstalled) {
        Write-Host "🌍 Installing global package: $pkg" -ForegroundColor Yellow
        npm install -g $pkg
    } else {
        Write-Host "✅ $pkg is already installed globally" -ForegroundColor Green
    }
}

Write-Host "
✨ Setup completed successfully!" -ForegroundColor Green
Write-Host "
Next steps:" -ForegroundColor Cyan
Write-Host "1. Update the .env file with your database credentials"
Write-Host "2. Start the development server with: npm run start:dev"
Write-Host "3. Access the API documentation at: http://localhost:3000/api"
Write-Host "
Happy coding! 🚀" -ForegroundColor Cyan
