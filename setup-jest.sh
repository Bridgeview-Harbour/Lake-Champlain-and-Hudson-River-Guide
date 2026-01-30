#!/bin/bash
# Quick Jest Setup Script for Lake Champlain Guide

echo "🧪 Setting up Jest for Lake Champlain & Hudson River Guide..."
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js first:"
    echo "   https://nodejs.org/"
    exit 1
fi

echo "📦 Installing Jest..."
npm install --save-dev jest @types/jest

echo ""
echo "✅ Jest installed successfully!"
echo ""
echo "Next steps:"
echo "1. Add exports to your JavaScript files (see instructions above)"
echo "2. Update test files to import functions"
echo "3. Run tests with: npm test"
echo ""
echo "Useful commands:"
echo "  npm test              - Run all tests"
echo "  npm run test:watch    - Run tests in watch mode"
echo "  npm run test:coverage - Generate coverage report"
echo ""
echo "Happy testing! 🎉"
