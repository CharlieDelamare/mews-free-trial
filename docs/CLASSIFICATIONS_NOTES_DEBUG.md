# Customer Classifications and Notes Debugging Guide

## Issue Summary

Customers are being created successfully, but Classifications and Notes fields are not being saved despite being sent correctly in the API request.

## What We Know

### ✅ Code is Correct

1. **Sample Data**: Customer profiles in `lib/sample-customers.ts` have Classifications and Notes defined
2. **API Request**: `lib/customer-service.ts:267-268` correctly includes Classifications and Notes in the request body
3. **Data Format**: Classifications is an array of strings, Notes is a string - both match Mews API spec
4. **Valid Values**: All Classification values used (Returning, VeryImportant, Military, etc.) are valid per Mews API documentation

### 📚 API Documentation

According to [Mews Connector API docs](https://docs.mews.com/connector-api/operations/customers):

- **Classifications**: Array of strings with predefined values (Returning, VeryImportant, Military, Staff, etc.)
- **Notes**: String field for internal notes
- Both fields were added to the API in 2017 and are actively supported
- Both fields are returned in the `customers/getAll` response

### 🤔 Likely Explanation

**The Mews demo environment accepts but doesn't persist Classifications and Notes.**

This is a common limitation in demo/sandbox environments where:
- The API validates and accepts the fields without error
- The customer is created successfully (returns customer ID)
- But certain fields are not actually saved to the database
- This prevents confusion/clutter in demo environments

## Testing the Issue

### Method 1: API Endpoint (Easiest)

1. Get an access token from any trial environment in the logs dashboard
2. Call the test endpoint:

```bash
curl "http://localhost:3000/api/test-classifications?accessToken=YOUR_TOKEN"
```

3. Check the response - it will show what was sent vs what was received

### Method 2: Standalone Script

```bash
# Install ts-node if needed
npm install -g ts-node

# Run the test
ts-node scripts/test-customer-classifications.ts YOUR_ACCESS_TOKEN
```

### Method 3: Manual Test in Mews UI

1. Create a trial environment
2. Log into the Mews demo portal
3. Navigate to Customer profiles
4. Check if any customers have Classifications or Notes visible

## Expected Test Results

### If Classifications/Notes ARE saved ✅

```json
{
  "testPassed": true,
  "sent": {
    "classifications": ["Returning", "VeryImportant"],
    "notes": "This is a test..."
  },
  "received": {
    "classifications": ["Returning", "VeryImportant"],
    "notes": "This is a test..."
  }
}
```

### If Classifications/Notes are NOT saved ❌

```json
{
  "testPassed": false,
  "sent": {
    "classifications": ["Returning", "VeryImportant"],
    "notes": "This is a test..."
  },
  "received": {
    "classifications": null,
    "notes": null
  },
  "conclusion": "Classifications and/or Notes are NOT being saved by the Mews demo API"
}
```

## Solutions

### If Demo Environment Limitation

**Option 1: Accept the limitation**
- Keep the code as-is (it's correct)
- Document that Classifications/Notes work in production but not demo
- The fields will work when customers use their production Mews instances

**Option 2: Remove the fields**
- Remove Classifications and Notes from `lib/sample-customers.ts`
- Remove them from API requests in `lib/customer-service.ts`
- Simplifies demo data but removes valuable profile enrichment

### If API Bug

**Option 3: Contact Mews Support**
- Report that Classifications/Notes aren't persisting in demo environment
- Provide test results from this diagnostic tool
- Ask if this is expected behavior or a bug

## Debugging Additions

Recent changes to `lib/customer-service.ts` include logging when customers with Classifications/Notes are created. Check logs for entries like:

```
[CUSTOMERS] ℹ Created customer with Classifications: {
  email: 'emma.thompson@gmail.com',
  id: '12345678-abcd-...',
  sentClassifications: ['Returning', 'Important'],
  sentNotes: 'Regular guest who visits quarterly...'
}
```

This confirms the data is being sent correctly even if not persisted.

## Files Modified

- `lib/customer-service.ts` - Added debug logging (line 284-293)
- `scripts/test-customer-classifications.ts` - New test script
- `app/api/test-classifications/route.ts` - New API endpoint for testing

## Sources

- [Mews Connector API - Customers](https://docs.mews.com/connector-api/operations/customers)
- [Mews Connector API - Add Customer](https://docs.mews.com/connector-api/operations/customers#add-customer)
