#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# FinPolicy Compiler — Project Setup (Linux / macOS)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

echo ""
echo "🚀 FinPolicy Compiler — Project Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Install all workspace dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# 2. Copy environment files if they don't already exist
echo ""
echo "📋 Copying environment files..."

if [ ! -f backend/.env ]; then
  cp backend/.env.example backend/.env
  echo "   ✅ backend/.env created from .env.example"
else
  echo "   ⚡ backend/.env already exists — skipping"
fi

if [ ! -f frontend/.env ]; then
  cp frontend/.env.example frontend/.env
  echo "   ✅ frontend/.env created from .env.example"
else
  echo "   ⚡ frontend/.env already exists — skipping"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅  Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit  backend/.env  with your PostgreSQL credentials"
echo "  2. Run:  npm run db:migrate   — create database tables"
echo "  3. Run:  npm run db:seed      — seed default users"
echo "  4. Run:  npm run dev          — start all services"
echo ""
