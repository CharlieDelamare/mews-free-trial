# Access Token Webhook Setup

This application includes a webhook endpoint to receive Access Tokens from the Mews hotel creation process.

## Webhook Endpoint

**URL:** `POST /api/webhook/access-token`

When a sample hotel is created, Mews will send a webhook to this endpoint containing an Access Token that will be stored automatically.

## Expected Payload

The webhook expects a JSON payload with at minimum:

```json
{
  "accessToken": "your-access-token-here",
  "enterpriseId": "optional-enterprise-id",
  "clientToken": "optional-client-token"
}
```

Any additional fields in the payload will be stored in the `metadata` field.

## Storage

Access tokens are stored in `/data/access-tokens.json` as an array of token objects:

```json
[
  {
    "accessToken": "...",
    "enterpriseId": "...",
    "clientToken": "...",
    "receivedAt": "2026-01-31T12:00:00.000Z",
    "metadata": { }
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

1. Deploy your application to a publicly accessible URL
2. Configure Mews to send the webhook to: `https://your-domain.com/api/webhook/access-token`
3. (Optional) Set up Slack notifications by adding `SLACK_BOT_TOKEN` and `SLACK_CHANNEL_ID` to your `.env` file

## Security Considerations

- The `/data` directory should never be committed to git (already configured in `.gitignore`)
- Consider implementing webhook signature verification for production use
- For production deployments, consider using a database instead of file storage
- Restrict access to the GET endpoint in production environments
