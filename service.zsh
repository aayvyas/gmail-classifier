#!/bin/zsh

# Determine the directory where this script is located (works when sourced)
_GMAIL_CLASSIFIER_SCRIPT_PATH="${(%):-%x}"
_GMAIL_CLASSIFIER_ROOT="$(cd "$(dirname "$_GMAIL_CLASSIFIER_SCRIPT_PATH")" && pwd)"

gmail-classifier() {
  # Use environment variable if set, otherwise default to the script's directory
  local PROJECT_DIR="${GMAIL_CLASSIFIER_DIR:-$_GMAIL_CLASSIFIER_ROOT}"
  local PID_FILE="$PROJECT_DIR/service.pid"
  local LOG_FILE="$PROJECT_DIR/service.log"
  local ENV_FILE="$PROJECT_DIR/.env"

  # --- Validation ---

  # 1. Check Project Directory
  if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ Error: Project directory not found at: $PROJECT_DIR"
    return 1
  fi

  # 2. Check .env file
  if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: .env file not found in $PROJECT_DIR"
    echo "   Please run: cp $PROJECT_DIR/.env.example $PROJECT_DIR/.env"
    echo "   And configure your variables."
    return 1
  fi

  # 3. Check Dependencies
  if [ ! -d "$PROJECT_DIR/node_modules" ]; then
    echo "❌ Error: node_modules not found."
    echo "   Please run 'npm install' in $PROJECT_DIR"
    return 1
  fi

  # --- Commands ---

  case "$1" in
    start)
      if [ -f "$PID_FILE" ]; then
        if ps -p $(cat "$PID_FILE") > /dev/null; then
          echo "✅ Service is already running (PID: $(cat "$PID_FILE"))"
          return
        else
          echo "⚠️  Stale PID file found. Removing..."
          rm "$PID_FILE"
        fi
      fi
      
      echo "🚀 Starting Gmail Classifier..."
      cd "$PROJECT_DIR"
      
      # Run in background
      # We use 'npm run dev' or direct 'npx ts-node'
      nohup npx ts-node src/index.ts > "$LOG_FILE" 2>&1 &
      
      local PID=$!
      echo $PID > "$PID_FILE"
      echo "✅ Service started with PID $PID"
      echo "📄 Logs: $LOG_FILE"
      ;;
      
    stop)
      if [ -f "$PID_FILE" ]; then
        local PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null; then
          kill "$PID"
          echo "🛑 Service stopped (PID: $PID)"
        else
          echo "⚠️  Service was not running (stale PID file removed)"
        fi
        rm "$PID_FILE"
      else
        echo "ℹ️  Service is not running (no PID file)"
      fi
      ;;
      
    status)
      if [ -f "$PID_FILE" ] && ps -p $(cat "$PID_FILE") > /dev/null; then
        echo "✅ Service is running (PID: $(cat "$PID_FILE"))"
        echo "   Dir: $PROJECT_DIR"
      else
        echo "⚪️ Service is NOT running"
      fi
      ;;
      
    log)
      if [ -f "$LOG_FILE" ]; then
        echo "📄 Tailing logs from $LOG_FILE (Ctrl+C to exit)..."
        tail -f "$LOG_FILE"
      else
        echo "❌ No log file found at $LOG_FILE"
      fi
      ;;
      
    *)
      echo "Usage: gmail-classifier {start|stop|status|log}"
      ;;
  esac
}
