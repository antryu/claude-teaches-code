# Installation & Troubleshooting Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Manual Installation](#manual-installation)
4. [Configuration](#configuration)
5. [Verification](#verification)
6. [Troubleshooting](#troubleshooting)
7. [Advanced Setup](#advanced-setup)

---

## Prerequisites

### Required Software

#### 1. Node.js (v18 or higher)
```bash
# Check current version
node --version

# Download from: https://nodejs.org/
# Or use nvm (recommended):
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

#### 2. npm (comes with Node.js)
```bash
# Check version
npm --version

# Update npm if needed
npm install -g npm@latest
```

#### 3. Anthropic API Key
1. Visit: https://console.anthropic.com/
2. Create account or sign in
3. Go to API Keys section
4. Create new API key
5. Copy the key (starts with `sk-ant-...`)

### Optional Software
- **Git**: For version control
- **VSCode**: Recommended IDE with extensions
- **Postman/curl**: For API testing

---

## Quick Start

### Automated Setup (Recommended)

```bash
# 1. Clone repository
git clone <repository-url>
cd claude-teaches-code

# 2. Run setup script
chmod +x setup.sh
./setup.sh

# 3. Add API key to backend/.env
echo "ANTHROPIC_API_KEY=your_key_here" >> backend/.env

# 4. Start development servers
npm run dev
```

**Access:**
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Health: http://localhost:3001/api/health

---

## Manual Installation

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd claude-teaches-code
```

### Step 2: Install Root Dependencies
```bash
npm install
```

### Step 3: Setup Backend
```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env and add your API key
nano .env  # or use any text editor
```

**Backend .env Configuration:**
```env
ANTHROPIC_API_KEY=sk-ant-your_key_here  # REQUIRED
PORT=3001
NODE_ENV=development
DEFAULT_LANGUAGE=en
EXTENDED_THINKING_BUDGET=10000
CACHE_TTL=3600
```

### Step 4: Setup Frontend
```bash
cd ../frontend

# Install dependencies
npm install

# Create .env file (optional)
cp .env.example .env
```

**Frontend .env Configuration (optional):**
```env
VITE_API_URL=http://localhost:3001
```

### Step 5: Verify Installation
```bash
# From backend directory
npm run type-check  # TypeScript check

# From frontend directory
npm run build  # Build check
```

---

## Configuration

### Backend Configuration

#### Environment Variables
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | ✅ | - | Your Anthropic API key |
| `PORT` | ❌ | 3001 | Backend server port |
| `NODE_ENV` | ❌ | development | Environment mode |
| `DEFAULT_LANGUAGE` | ❌ | en | Default UI language |
| `EXTENDED_THINKING_BUDGET` | ❌ | 10000 | Token budget for deep analysis |
| `CACHE_TTL` | ❌ | 3600 | Cache lifetime (seconds) |

#### Locale Configuration
Edit `backend/src/locales/en.json` or `ko.json` to customize AI prompts.

### Frontend Configuration

#### Environment Variables
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | ❌ | /api | Backend API URL |

#### Vite Proxy
The frontend proxies `/api` requests to `http://localhost:3001` in development.

Edit `frontend/vite.config.ts` to change:
```typescript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:3001',  // Change if needed
      changeOrigin: true,
    },
  },
}
```

---

## Verification

### 1. Backend Health Check
```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Check health
curl http://localhost:3001/api/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "model": "claude-sonnet-4-5-20250929",
  "extendedThinking": {
    "enabled": true,
    "budget": 10000
  }
}
```

### 2. Frontend Build
```bash
cd frontend
npm run build

# Should complete without errors
# Output: dist/ directory created
```

### 3. Full System Test
```bash
# From root directory
npm run dev

# Visit: http://localhost:3000
# Enter prompt: "Create a hello world function in Python"
# Verify: Code appears with thinking process
```

---

## Troubleshooting

### Common Issues

#### 1. "ANTHROPIC_API_KEY is required" Error

**Problem:** Backend can't find API key

**Solutions:**
```bash
# Check if .env exists
ls backend/.env

# Check if key is set
cat backend/.env | grep ANTHROPIC_API_KEY

# Verify no spaces around =
# CORRECT: ANTHROPIC_API_KEY=sk-ant-...
# WRONG:   ANTHROPIC_API_KEY = sk-ant-...

# Restart backend after changing .env
```

#### 2. "Cannot find module" Errors

**Problem:** Dependencies not installed

**Solutions:**
```bash
# Clean install
cd backend
rm -rf node_modules package-lock.json
npm install

cd ../frontend
rm -rf node_modules package-lock.json
npm install

# If using npm workspaces
cd ..
npm run install:all
```

#### 3. Port Already in Use

**Problem:** Port 3000 or 3001 already occupied

**Solutions:**
```bash
# Find process using port
lsof -i :3001  # For backend
lsof -i :3000  # For frontend

# Kill process
kill -9 <PID>

# Or change port in .env
# Backend: PORT=3002
# Frontend: vite.config.ts -> server.port
```

#### 4. CORS Errors

**Problem:** Frontend can't connect to backend

**Solutions:**
```bash
# Verify backend CORS setup
# backend/src/index.ts should have:
app.use(cors())

# Check proxy in vite.config.ts
# Ensure proxy target matches backend URL

# If using different domains:
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}))
```

#### 5. SSE Streaming Not Working

**Problem:** Code generation hangs or doesn't stream

**Solutions:**
```bash
# Check browser console for errors
# Common causes:

# 1. Proxy misconfiguration
# Fix in vite.config.ts

# 2. HTTP/2 issues
# SSE requires HTTP/1.1
# Check server configuration

# 3. Network firewall
# Disable VPN/proxy temporarily

# 4. Browser extension blocking
# Try incognito mode
```

#### 6. Monaco Editor Not Loading

**Problem:** Code editor area is blank

**Solutions:**
```bash
# Check browser console for errors

# Reinstall Monaco
cd frontend
npm uninstall @monaco-editor/react
npm install @monaco-editor/react@latest

# Clear Vite cache
rm -rf node_modules/.vite

# Restart dev server
npm run dev
```

#### 7. i18n Language Toggle Not Working

**Problem:** Language doesn't switch

**Solutions:**
```bash
# Check translation files exist
ls frontend/src/i18n/en.json
ls frontend/src/i18n/ko.json

# Verify i18n initialization
# Should see in browser console:
# i18next: initialized

# Check React DevTools
# Language state should change
```

#### 8. Extended Thinking Not Showing

**Problem:** No deep analysis in Thinking panel

**Solutions:**
```bash
# Check backend .env
cat backend/.env | grep EXTENDED_THINKING_BUDGET
# Should be > 0 (default: 10000)

# Verify API response includes thinking
curl -X POST http://localhost:3001/api/explain-line \
  -H "Content-Type: application/json" \
  -d '{"code":"const x=5","lineNumber":1,"language":"en"}'

# Check for extendedThinking field in response
```

#### 9. Build Errors

**TypeScript Errors:**
```bash
# Backend
cd backend
npm run type-check
# Fix type errors shown

# Frontend
cd frontend
npm run build
# Fix compilation errors
```

**Lint Errors:**
```bash
cd frontend
npm run lint
# Fix ESLint warnings/errors
```

#### 10. Performance Issues

**Slow Generation:**
```bash
# Check API rate limits
# View Anthropic console

# Reduce token budget
# backend/.env:
EXTENDED_THINKING_BUDGET=5000

# Enable caching
# Restart backend to clear cache
```

**High Memory Usage:**
```bash
# Check Node.js version (18+ recommended)
node --version

# Increase Node memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run dev

# Clear caches
rm -rf backend/dist
rm -rf frontend/dist
rm -rf */node_modules/.cache
```

---

## Advanced Setup

### Production Build

#### Backend
```bash
cd backend

# Build TypeScript
npm run build

# Output: dist/ directory

# Run production
NODE_ENV=production npm start
```

#### Frontend
```bash
cd frontend

# Build for production
npm run build

# Output: dist/ directory

# Preview production build
npm run preview
```

#### Full Production
```bash
# From root
npm run build

# Start both servers
npm run start
```

### Docker Setup (Optional)

**Backend Dockerfile:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
```

**Frontend Dockerfile:**
```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

**Docker Compose:**
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
```

### Environment-Specific Configs

#### Development
```bash
# .env.development
NODE_ENV=development
PORT=3001
EXTENDED_THINKING_BUDGET=10000
```

#### Staging
```bash
# .env.staging
NODE_ENV=staging
PORT=3001
EXTENDED_THINKING_BUDGET=8000
CACHE_TTL=7200
```

#### Production
```bash
# .env.production
NODE_ENV=production
PORT=3001
EXTENDED_THINKING_BUDGET=5000
CACHE_TTL=3600
```

### Monitoring Setup

#### Backend Logging
```typescript
// Add to backend/src/index.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

#### Performance Monitoring
```bash
# Add to package.json
npm install clinic --save-dev

# Profile performance
npm run clinic -- doctor -- node dist/index.js
```

### Testing Setup

#### Backend Tests
```bash
cd backend
npm install --save-dev jest @types/jest ts-jest

# Create jest.config.js
npx ts-jest config:init

# Add test script
# package.json:
"scripts": {
  "test": "jest"
}
```

#### Frontend Tests
```bash
cd frontend
npm install --save-dev vitest @testing-library/react

# Add test script
# package.json:
"scripts": {
  "test": "vitest"
}
```

---

## Getting Help

### Resources
- **Documentation**: See [README.md](README.md)
- **Architecture**: See [ARCHITECTURE.md](ARCHITECTURE.md)
- **Demo Guide**: See [DEMO.md](DEMO.md)
- **Project Summary**: See [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)

### Support Channels
1. **GitHub Issues**: Report bugs or request features
2. **Anthropic Discord**: Claude API questions
3. **Stack Overflow**: Technical questions (tag: `claude-api`)

### Debugging Tips

1. **Enable Verbose Logging:**
```bash
# Backend
DEBUG=* npm run dev

# Frontend (browser console)
localStorage.debug = '*'
```

2. **Check Network Tab:**
- Open browser DevTools
- Go to Network tab
- Filter by "api" or "localhost:3001"
- Check request/response details

3. **Inspect SSE Stream:**
```bash
# Using curl
curl -N http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test","language":"en"}'

# Watch streaming data
```

4. **Test Individual Components:**
```bash
# Test Orchestrator
curl -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"explain async/await","language":"en"}'

# Test ExplainAgent
curl -X POST http://localhost:3001/api/explain-line \
  -H "Content-Type: application/json" \
  -d '{"code":"const x = 5;","lineNumber":1,"language":"en"}'
```

---

## Checklist

### Installation Complete ✅
- [ ] Node.js 18+ installed
- [ ] Repository cloned
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] `.env` files configured
- [ ] API key added
- [ ] Health check passes
- [ ] Frontend builds successfully
- [ ] Both servers start
- [ ] Can generate code
- [ ] Can explain lines
- [ ] Language toggle works
- [ ] Theme toggle works

### Ready for Development 🚀
- [ ] VSCode extensions installed (optional)
- [ ] Git configured
- [ ] Familiar with project structure
- [ ] Read documentation
- [ ] Tested demo scenarios

---

**Need more help?** Check [README.md](README.md) or open an issue!
