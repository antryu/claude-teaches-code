#!/bin/bash

# Claude Teaches Code - Setup Script
# This script sets up the entire project

set -e

echo "🎓 Claude Teaches Code - Setup"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
echo -e "${BLUE}Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${YELLOW}Node.js version must be 18 or higher. Current: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node -v) detected${NC}"
echo ""

# Check npm
echo -e "${BLUE}Checking npm...${NC}"
if ! command -v npm &> /dev/null; then
    echo -e "${YELLOW}npm is not installed.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm $(npm -v) detected${NC}"
echo ""

# Install root dependencies
echo -e "${BLUE}Installing root dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Root dependencies installed${NC}"
echo ""

# Setup Backend
echo -e "${BLUE}Setting up backend...${NC}"
cd backend

# Install backend dependencies
echo "  Installing backend dependencies..."
npm install
echo -e "${GREEN}  ✓ Backend dependencies installed${NC}"

# Setup .env file
if [ ! -f .env ]; then
    echo "  Creating .env file..."
    cp .env.example .env
    echo -e "${YELLOW}  ⚠️  Please edit backend/.env and add your ANTHROPIC_API_KEY${NC}"
else
    echo -e "${GREEN}  ✓ .env file already exists${NC}"
fi

cd ..
echo ""

# Setup Frontend
echo -e "${BLUE}Setting up frontend...${NC}"
cd frontend

# Install frontend dependencies
echo "  Installing frontend dependencies..."
npm install
echo -e "${GREEN}  ✓ Frontend dependencies installed${NC}"

# Setup .env file
if [ ! -f .env ]; then
    echo "  Creating .env file..."
    cp .env.example .env
    echo -e "${GREEN}  ✓ Frontend .env created${NC}"
else
    echo -e "${GREEN}  ✓ .env file already exists${NC}"
fi

cd ..
echo ""

# Final instructions
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo ""
echo "1. Add your Anthropic API key to backend/.env:"
echo "   ${BLUE}ANTHROPIC_API_KEY=your_key_here${NC}"
echo ""
echo "2. Start the development servers:"
echo "   ${BLUE}npm run dev${NC}"
echo ""
echo "   Or start separately:"
echo "   ${BLUE}npm run dev:backend${NC}  # Terminal 1"
echo "   ${BLUE}npm run dev:frontend${NC} # Terminal 2"
echo ""
echo "3. Access the application:"
echo "   Frontend: ${BLUE}http://localhost:3000${NC}"
echo "   Backend:  ${BLUE}http://localhost:3001${NC}"
echo "   Health:   ${BLUE}http://localhost:3001/api/health${NC}"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
