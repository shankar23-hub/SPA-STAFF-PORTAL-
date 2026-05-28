#!/bin/bash
# SPA Employee Portal – Start Script
# Backend  → http://localhost:5002    (MongoDB: spa_db – shared with Admin)
# Frontend → http://localhost:5174

set -e

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   SPA Employee Portal v2.1                   ║"
echo "║   (DB shared with SPA Admin Portal)          ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# ── Backend ───────────────────────────────────────────────────────────────────
echo "▶  Starting Backend (Flask + MongoDB) on port 5002 ..."
cd backend

if [ ! -d ".venv" ]; then
  echo "   Creating Python virtual environment ..."
  python3 -m venv .venv
fi

source .venv/bin/activate
pip install -r requirements.txt -q

PORT=5002 python app.py &
BACKEND_PID=$!
cd ..

sleep 2

# ── Frontend ──────────────────────────────────────────────────────────────────
echo "▶  Starting Frontend (React + Vite) on port 5174 ..."
cd frontend

if [ ! -d "node_modules" ]; then
  echo "   Installing npm dependencies ..."
  npm install -q
fi

npm run dev &
FRONTEND_PID=$!
cd ..

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "✅  Employee Portal is running:"
echo "    Frontend  →  http://localhost:5174"
echo "    Backend   →  http://localhost:5002"
echo "    MongoDB   →  mongodb://localhost:27017/spa_db   (must match Admin)"
echo ""
echo "    Press Ctrl+C to stop all services."
echo ""

trap "echo ''; echo 'Stopping ...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT
wait
