#!/bin/bash

echo "🚀 Starting BarReservas Backend..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  Creating .env file from template..."
    cp .env.example .env
    echo "📝 Please edit .env with your configuration"
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend && npm install

# Setup database
echo "🗃️  Setting up database..."
if [ -n "$DATABASE_URL" ]; then
    psql $DATABASE_URL -f schema.sql
else
    echo "⚠️  DATABASE_URL not set, skipping database setup"
fi

# Start backend server
echo "🎯 Starting backend server..."
npm run dev