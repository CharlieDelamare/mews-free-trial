# Access Token Webhook Setup

This application includes a webhook endpoint to receive Access Tokens from the Mews hotel creation process.

## Webhook Endpoint

**Production URL:** `https://mews-free-trial-2.onrender.com/api/webhook/access-token`

**Local Development:** `POST /api/webhook/access-token`

When a sample hotel is created, Mews will send a webhook to this endpoint containing an Access Token that will be stored automatically.

## Expected Payload

The webhook expects a JSON payload in the Mews format:

```json
{
  "Action": "IntegrationCreated",
  "Data": {
    "Enterprise": {
      "Id": "8865aa96-f62d-4f9b-a912-ab2100f60f42",
      "Name": "Sample Chain Hotel 1"
    },
    "Service": {
      "Id": "9745ce3a-8dbb-4cc0-a550-55f9ff67b242",
      "Name": "Accommodation"
    },
    "Requestor": null,
    "AccessToken": "9E5E84E9974D4F169662AB2200F27CB1-00B343A0DDA725CACAC028E38E3EABF",
    "CreatedUtc": "2019-12-13T14:42:52Z",
    "IsEnabled": true,
    "Integration": {
      "Id": "9e5e84e9-974d-4f16-9662-ab2200f27cb1",
      "Name": "WebhookTEST"
    }
  }
}
```

## Storage

Access tokens are stored in `/data/access-tokens.json` as an array of token objects:

```json
[
  {
    "accessToken": "9E5E84E9974D4F169662AB2200F27CB1-00B343A0DDA725CACAC028E38E3EABF",
    "enterpriseId": "8865aa96-f62d-4f9b-a912-ab2100f60f42",
    "enterpriseName": "Sample Chain Hotel 1",
    "serviceId": "9745ce3a-8dbb-4cc0-a550-55f9ff67b242",
    "serviceName": "Accommodation",
    "integrationId": "9e5e84e9-974d-4f16-9662-ab2200f27cb1",
    "integrationName": "WebhookTEST",
    "createdUtc": "2019-12-13T14:42:52Z",
    "receivedAt": "2026-01-31T12:00:00.000Z",
    "isEnabled": true,
    "action": "IntegrationCreated"
  }
]
```

**Note:** The `/data` directory is git-ignored to prevent sensitive tokens from being committed.

## Notifications

If you have Slack configured (see `.env.example`), the webhook will automatically send a notification to your Slack channel when an Access Token is received.

## Retrieving Tokens

You can retrieve stored tokens using the GET endpoint:

```bash
# Get all tokens
curl https://your-domain.com/api/webhook/access-token

# Get tokens for a specific enterprise
curl https://your-domain.com/api/webhook/access-token?enterpriseId=xxx
```

## Configuration

To enable this webhook:

1. **Production:** Configure Mews to send the webhook to:
   ```
   https://mews-free-trial-2.onrender.com/api/webhook/access-token
   ```

2. **Local Development:** Use a tool like ngrok to expose your local server, then configure Mews to send the webhook to:
   ```
   https://your-ngrok-url.ngrok.io/api/webhook/access-token
   ```

3. (Optional) Set up Slack notifications by adding `SLACK_BOT_TOKEN` and `SLACK_CHANNEL_ID` to your `.env` file

## Security Considerations

- The `/data` directory should never be committed to git (already configured in `.gitignore`)
- Consider implementing webhook signature verification for production use
- For production deployments, consider using a database instead of file storage
- Restrict access to the GET endpoint in production environments
