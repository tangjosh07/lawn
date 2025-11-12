#!/bin/bash

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok is not installed."
    echo ""
    echo "Install it with:"
    echo "  brew install ngrok/ngrok/ngrok"
    echo "  OR download from https://ngrok.com/download"
    echo ""
    exit 1
fi

# Start the server in the background
echo "🚀 Starting server on port 3001..."
node server.js &
SERVER_PID=$!

# Wait for server to start
sleep 2

# Check if server started successfully
if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo "❌ Failed to start server"
    exit 1
fi

# Start ngrok tunnel
echo "🌐 Starting ngrok tunnel..."
ngrok http 3001 --log=stdout > ngrok.log 2>&1 &
NGROK_PID=$!

# Wait for ngrok to start
sleep 4

# Get the public URL from ngrok API
NGROK_URL=""
for i in {1..10}; do
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"https://[^"]*"' | head -1 | cut -d'"' -f4)
    if [ ! -z "$NGROK_URL" ]; then
        break
    fi
    sleep 1
done

if [ -z "$NGROK_URL" ]; then
    echo "❌ Failed to get ngrok URL."
    echo "Check if ngrok is running: http://localhost:4040"
    echo "Check ngrok.log for errors"
    kill $SERVER_PID $NGROK_PID 2>/dev/null
    exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ Server running on: http://localhost:3001"
echo "✅ Public URL: $NGROK_URL"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "⚠️  IMPORTANT STEPS:"
echo ""
echo "1. Update your Google OAuth redirect URI to:"
echo "   $NGROK_URL/api/auth/google/callback"
echo ""
echo "2. Update your .env file with:"
echo "   BASE_URL=$NGROK_URL"
echo ""
echo "3. Restart this script after updating .env"
echo ""
echo "📊 ngrok dashboard: http://localhost:4040"
echo ""
echo "Press Ctrl+C to stop both server and ngrok"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping server and ngrok..."
    kill $SERVER_PID $NGROK_PID 2>/dev/null
    wait $SERVER_PID $NGROK_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for processes
wait
