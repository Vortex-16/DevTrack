#!/bin/bash

LOG_DIR="$HOME/activity-tracker/logs"
OUT="$LOG_DIR/summary_$(date +%F).txt"

echo "📊 DAILY ACTIVITY REPORT - $(date)" > "$OUT"
echo "==============================" >> "$OUT"

for file in "$LOG_DIR"/*.log; do
  name=$(basename "$file")
  total=$(awk -F'|' '{sum += $3} END {print sum}' "$file")
  echo "$name: $((total/60)) minutes" >> "$OUT"
done

echo "==============================" >> "$OUT"
echo "Top Apps:" >> "$OUT"
grep -h "|" "$LOG_DIR"/*.log \
  | awk -F'|' '{apps[$2]+=$3} END {for (a in apps) print a, apps[a]}' \
  | sort -nr -k2 | head -n 10 >> "$OUT"
