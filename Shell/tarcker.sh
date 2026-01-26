#!/bin/bash

# ============================================
# DevTrack Activity Tracker - Shell Agent
# Tracks active applications and sends to backend
# ============================================

BASE_DIR="$HOME/activity-tracker"
LOG_DIR="$BASE_DIR/logs"
CONF="$BASE_DIR/categories.conf"
BACKEND_URL="http://localhost:5000"

mkdir -p "$LOG_DIR"

ACTIVE_APP=""
START_TIME=$(date +%s)

# ============== FUNCTIONS ==============
get_active_app() {
  xdotool getactivewindow getwindowpid 2>/dev/null \
    | xargs -I{} ps -p {} -o comm= 2>/dev/null
}

get_category() {
  local app="$1"
  local cat
  cat=$(grep -i "^$app=" "$CONF" | cut -d= -f2)
  [ -z "$cat" ] && echo "application" || echo "$cat"
}

# Send to Python backend API
send_to_backend() {
  local app="$1"
  local duration="$2"
  local category="$3"
  
  curl -s -X POST "$BACKEND_URL/app_log" \
    -H "Content-Type: application/json" \
    -d "{\"app\":\"$app\",\"duration\":$duration,\"category\":\"$category\"}" \
    >/dev/null 2>&1 &
}

log_activity() {
  local app="$1"
  local duration="$2"
  local category
  category=$(get_category "$app")

  # Log to local files (backup)
  local logfile="$LOG_DIR/$category.log"
  echo "$(date '+%F %T') | $app | ${duration}s" >> "$logfile"
  echo "$(date '+%F %T') | $app | ${duration}s" >> "$LOG_DIR/system.log"
  
  # Send to backend API
  send_to_backend "$app" "$duration" "$category"
}

while true; do
  CURRENT_APP=$(get_active_app)

  if [ -z "$CURRENT_APP" ]; then
    sleep 5
    continue
  fi

  if [ "$CURRENT_APP" != "$ACTIVE_APP" ]; then
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))

    if [ -n "$ACTIVE_APP" ]; then
      log_activity "$ACTIVE_APP" "$DURATION"
    fi

    ACTIVE_APP="$CURRENT_APP"
    START_TIME=$(date +%s)
  fi

  sleep 5
done
