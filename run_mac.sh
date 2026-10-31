#!/usr/bin/env bash

# LegalSaathi AI - MacBook Execution Script
# Multilingual Legal Rights Awareness AI Assistant

echo "=========================================================="
echo "      LegalSaathi AI — Startup Script (macOS / Linux)"
echo "=========================================================="

# Check Python 3
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.10+ (brew install python3)."
    exit 1
fi
echo "✅ Python 3 detected: $(python3 --version)"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ (brew install node)."
    exit 1
fi
echo "✅ Node.js detected: $(node -v)"

# Check Ollama
if command -v ollama &> /dev/null; then
    echo "✅ Ollama detected: $(ollama --version)"
    echo "ℹ️  Tip: Run 'ollama serve' and 'ollama run llama3.1:latest' for local LLM inference."
else
    echo "⚠️  Ollama is not installed. LegalSaathi AI will run with direct statutory knowledge-base grounding."
    echo "    (To install Ollama on Mac: brew install ollama or visit https://ollama.com)"
fi

echo ""
echo "----------------------------------------------------------"
echo "Starting Backend Server (FastAPI on http://localhost:8000)"
echo "----------------------------------------------------------"

cd backend
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt

echo ""
echo "🚀 Backend dependencies ready. Starting FastAPI server..."
python3 app/main.py &
BACKEND_PID=$!
cd ..

echo ""
echo "----------------------------------------------------------"
echo "Starting Frontend Development Server (Vite on http://localhost:5173)"
echo "----------------------------------------------------------"

cd frontend
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

echo "🚀 Starting Vite dev server..."
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "=========================================================="
echo " LegalSaathi AI is now launching!"
echo " 👉 Web Interface: http://localhost:5173"
echo " 👉 Backend API & Docs: http://localhost:8000/docs"
echo " Press Ctrl+C in this terminal to stop both servers."
echo "=========================================================="

# Trap SIGINT to kill background processes cleanly
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM
wait
