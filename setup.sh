#!/bin/bash
# Installation and Setup Script for Email Marketing Platform

echo "================================"
echo "Email Marketing Platform Setup"
echo "================================"
echo ""

# Check Node.js installation
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+."
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo "✅ npm $(npm -v) detected"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"
echo ""

# Setup instructions
echo "================================"
echo "Next Steps:"
echo "================================"
echo ""
echo "1️⃣  Configure Environment Variables"
echo "   Edit .env.local with your credentials:"
echo "   - MongoDB URI"
echo "   - Gmail OAuth2 credentials"
echo ""
echo "   See SETUP_GUIDE.md for detailed instructions"
echo ""

echo "2️⃣  (Optional) Seed Sample Data"
echo "   npm run db:seed"
echo ""

echo "3️⃣  Start Development Server"
echo "   npm run dev"
echo ""

echo "4️⃣  Open in Browser"
echo "   http://localhost:3000"
echo ""

echo "📚 Documentation:"
echo "   - README.md - Complete project docs"
echo "   - SETUP_GUIDE.md - Environment setup"
echo "   - QUICKSTART.md - Quick reference"
echo "   - PROJECT_SUMMARY.md - Feature overview"
echo ""

echo "================================"
echo "✅ Setup Complete!"
echo "================================"
