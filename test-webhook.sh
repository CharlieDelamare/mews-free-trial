#!/bin/bash
# Test webhook script for Mews access token endpoint

WEBHOOK_URL="https://<your-domain>.vercel.app/api/webhook/access-token"

echo "Sending test webhook to: $WEBHOOK_URL"
echo ""

curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "Action": "IntegrationCreated",
    "Data": {
      "Enterprise": {
        "Id": "test-enterprise-'$(date +%s)'",
        "Name": "Test Property for Webhook Testing"
      },
      "Service": {
        "Id": "test-service-123",
        "Name": "Test Service"
      },
      "Integration": {
        "Id": "test-integration-456",
        "Name": "Mews Free Trial"
      },
      "AccessToken": "TEST-TOKEN-'$(date +%s)'-ABCDEF123456",
      "CreatedUtc": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
      "IsEnabled": true
    }
  }' | jq '.'

echo ""
echo "Test webhook sent! Check the logs above for the response."
