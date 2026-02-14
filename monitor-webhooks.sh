#!/bin/bash
# Monitor webhooks in real-time

echo "Monitoring webhooks (will check every 10 seconds)..."
echo "Press Ctrl+C to stop"
echo ""

LAST_COUNT=0

while true; do
  RESPONSE=$(curl -s https://<your-domain>.vercel.app/api/webhook/access-token)
  COUNT=$(echo "$RESPONSE" | jq '.count')

  if [ "$COUNT" -gt "$LAST_COUNT" ]; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🔔 NEW WEBHOOK RECEIVED!"
    echo "$RESPONSE" | jq '.tokens[0]'
    echo ""
    LAST_COUNT=$COUNT
  else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Current count: $COUNT (no new webhooks)"
  fi

  sleep 10
done
