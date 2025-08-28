#!/bin/bash

echo "🚀 Starting AZT Stock Exchange Simulator..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ and try again."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm and try again."
    exit 1
fi

echo "📦 Installing dependencies..."

# Install root dependencies
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo ""
echo "✅ Dependencies installed successfully!"
echo ""

# Create terminal sessions for backend and frontend
echo "🔥 Starting backend server (http://localhost:3001)..."
cd backend
start "AZT Backend" npm run dev
cd ..

echo "🎨 Starting frontend server (http://localhost:3000)..."
cd frontend
start "AZT Frontend" npm start
cd ..

echo ""
echo "🎉 AZT Stock Exchange is starting up!"
echo ""
echo "📈 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:3001"
echo ""
echo "Press any key to exit..."
read -n 1
