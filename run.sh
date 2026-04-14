#!/bin/bash
# ───────────────────────────────────────────────────────
# SecondLife — Local Dev Launcher
# Starts both backend (Docker) and frontend (Next.js)
# Usage:  chmod +x run.sh && ./run.sh
# Stop:   ./run.sh stop
# ───────────────────────────────────────────────────────

set -e
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/second-hand-web-next"

# ── Colors ──
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# ── Stop command ──
if [ "$1" = "stop" ]; then
    echo -e "${YELLOW}Stopping backend...${NC}"
    cd "$BACKEND_DIR" && docker compose down 2>/dev/null || docker-compose down 2>/dev/null
    echo -e "${YELLOW}Stopping frontend (killing port 3000)...${NC}"
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    echo -e "${GREEN}✅ All stopped.${NC}"
    exit 0
fi

# ── 1. Backend .env ──
echo -e "${YELLOW}[1/4] Checking backend .env...${NC}"
if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo -e "${RED}No .env found. Creating default...${NC}"
    cat > "$BACKEND_DIR/.env" << 'EOF'
MONGODB_URI=mongodb+srv://admin:password123987@comp4121.rv6xhbd.mongodb.net/secondlife
JWT_SECRET=secondlife-jwt-secret-comp4121-2026
JWT_ALGORITHM=HS256
JWT_EXPIRE_HOURS=24
EOF
    echo -e "${GREEN}.env created.${NC}"
else
    echo -e "${GREEN}.env exists.${NC}"
fi

# ── 2. Start Backend (Docker) ──
echo -e "${YELLOW}[2/4] Starting backend (Docker)...${NC}"
cd "$BACKEND_DIR"
docker compose up --build -d 2>/dev/null || docker-compose up --build -d 2>/dev/null

# Wait for backend to be ready
echo -n "Waiting for backend"
for i in $(seq 1 30); do
    if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
        echo ""
        echo -e "${GREEN}✅ Backend running at http://localhost:8000${NC}"
        echo -e "${GREEN}   API docs: http://localhost:8000/docs${NC}"
        break
    fi
    echo -n "."
    sleep 1
done

if ! curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
    echo ""
    echo -e "${RED}❌ Backend failed to start. Check: docker compose logs${NC}"
    exit 1
fi

# ── 3. Frontend deps ──
echo -e "${YELLOW}[3/4] Checking frontend dependencies...${NC}"
cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ]; then
    echo "Installing npm packages..."
    npm install
else
    echo -e "${GREEN}node_modules exists.${NC}"
fi

# ── 4. Start Frontend ──
echo -e "${YELLOW}[4/4] Starting frontend (Next.js)...${NC}"

# Create .env.local if not exists
if [ ! -f "$FRONTEND_DIR/.env.local" ]; then
    cat > "$FRONTEND_DIR/.env.local" << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF
    echo -e "${GREEN}.env.local created.${NC}"
fi

# Kill any existing process on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
sleep 1

# Start Next.js dev server in background
npm run dev &
FRONTEND_PID=$!

# Wait for frontend
echo -n "Waiting for frontend"
for i in $(seq 1 30); do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo ""
        break
    fi
    echo -n "."
    sleep 1
done

# ── Done ──
echo ""
echo -e "${GREEN}════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✅ SecondLife is running!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════${NC}"
echo -e "  Frontend:  ${GREEN}http://localhost:3000${NC}"
echo -e "  Backend:   ${GREEN}http://localhost:8000${NC}"
echo -e "  API Docs:  ${GREEN}http://localhost:8000/docs${NC}"
echo -e "${GREEN}════════════════════════════════════════════════${NC}"
echo -e "  Stop all:  ${YELLOW}./run.sh stop${NC}"
echo ""

# Keep alive — Ctrl+C to stop frontend
wait $FRONTEND_PID
