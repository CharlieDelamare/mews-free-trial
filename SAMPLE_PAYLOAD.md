# Sample Enterprise API Payload

This document provides example payloads for testing the Mews `addSample` endpoint in Postman.

## Endpoint

```
POST https://app.mews-demo.com/api/general/v1/enterprises/addSample
```

## Headers

```
Content-Type: application/json
```

## Example Payload: Hotel (Default)

```json
{
  "Client": "Free Trial Generator",
  "AccessToken": "YOUR_MEWS_SAMPLE_TOKEN_HERE",
  "LanguageCode": "en-GB",
  "CultureCode": "en-GB",
  "Name": "Test Hotel London",
  "LegalEnvironmentCode": "UK-ENG",
  "CurrencyCode": "GBP",
  "Pricing": "Gross",
  "TaxPrecision": 2,
  "StartOffset": 2,
  "EndOffset": 4,
  "AutomaticCheckIn": true,
  "AutomaticCheckOut": true,
  "Occupancy": 0.5,
  "Lifetime": "P0Y0M45DT0H0M0S",
  "CategoryCount": 4,
  "FloorCount": 4,
  "FloorRoomCount": 5,
  "FloorDormCount": 0,
  "DormBedCount": 0,
  "User": {
    "Email": "test.customer@example.com"
  },
  "Users": [
    {
      "Email": "trial@mews.li"
    }
  ]
}
```

## Example Payload: Hostel

```json
{
  "Client": "Free Trial Generator",
  "AccessToken": "YOUR_MEWS_SAMPLE_TOKEN_HERE",
  "LanguageCode": "de-DE",
  "CultureCode": "de-DE",
  "Name": "Test Hostel Berlin",
  "LegalEnvironmentCode": "DE",
  "CurrencyCode": "EUR",
  "Pricing": "Gross",
  "TaxPrecision": 2,
  "StartOffset": 2,
  "EndOffset": 4,
  "AutomaticCheckIn": true,
  "AutomaticCheckOut": true,
  "Occupancy": 0.5,
  "Lifetime": "P0Y0M45DT0H0M0S",
  "CategoryCount": 4,
  "FloorCount": 4,
  "FloorRoomCount": 5,
  "FloorDormCount": 2,
  "DormBedCount": 4,
  "User": {
    "Email": "test.customer@example.com"
  },
  "Users": [
    {
      "Email": "trial@mews.li"
    }
  ]
}
```

## Example Payload: Apartments

```json
{
  "Client": "Free Trial Generator",
  "AccessToken": "YOUR_MEWS_SAMPLE_TOKEN_HERE",
  "LanguageCode": "fr-FR",
  "CultureCode": "fr-FR",
  "Name": "Test Apartments Paris",
  "LegalEnvironmentCode": "FR",
  "CurrencyCode": "EUR",
  "Pricing": "Gross",
  "TaxPrecision": 2,
  "StartOffset": 2,
  "EndOffset": 4,
  "AutomaticCheckIn": true,
  "AutomaticCheckOut": true,
  "Occupancy": 0.5,
  "Lifetime": "P0Y0M45DT0H0M0S",
  "CategoryCount": 4,
  "FloorCount": 4,
  "FloorRoomCount": 0,
  "FloorApartmentCount": 5,
  "FloorDormCount": 0,
  "DormBedCount": 0,
  "User": {
    "Email": "test.customer@example.com"
  },
  "Users": [
    {
      "Email": "trial@mews.li"
    }
  ]
}
```

## Example Payload: Net Pricing (USA)

```json
{
  "Client": "Free Trial Generator",
  "AccessToken": "YOUR_MEWS_SAMPLE_TOKEN_HERE",
  "LanguageCode": "en-US",
  "CultureCode": "en-US",
  "Name": "Test Hotel New York",
  "LegalEnvironmentCode": "US-NY",
  "CurrencyCode": "USD",
  "Pricing": "Net",
  "StartOffset": 2,
  "EndOffset": 4,
  "AutomaticCheckIn": true,
  "AutomaticCheckOut": true,
  "Occupancy": 0.5,
  "Lifetime": "P0Y0M45DT0H0M0S",
  "CategoryCount": 4,
  "FloorCount": 4,
  "FloorRoomCount": 5,
  "FloorDormCount": 0,
  "DormBedCount": 0,
  "User": {
    "Email": "test.customer@example.com"
  },
  "Users": [
    {
      "Email": "trial@mews.li"
    }
  ]
}
```

## Field Descriptions

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `Client` | string | Name of the client application | ✓ |
| `AccessToken` | string | Mews Sample Token (from env var) | ✓ |
| `LanguageCode` | string | Language code (e.g., "en-GB", "de-DE") | ✓ |
| `CultureCode` | string | Culture code (typically same as LanguageCode) | ✓ |
| `Name` | string | Property name | ✓ |
| `LegalEnvironmentCode` | string | Legal environment code (e.g., "UK-ENG", "DE", "US-NY") | ✓ |
| `CurrencyCode` | string | ISO 4217 currency code (e.g., "GBP", "EUR", "USD") | ✓ |
| `Pricing` | string | "Gross" or "Net" pricing | ✓ |
| `TaxPrecision` | number | Tax precision (only for Gross pricing) | Conditional |
| `StartOffset` | number | Start offset for sample data (days from now) | ✓ |
| `EndOffset` | number | End offset for sample data (days from now) | ✓ |
| `AutomaticCheckIn` | boolean | Enable automatic check-in | ✓ |
| `AutomaticCheckOut` | boolean | Enable automatic check-out | ✓ |
| `Occupancy` | number | Occupancy rate (0.0-1.0) | ✓ |
| `Lifetime` | string | Trial lifetime in ISO 8601 duration format | ✓ |
| `CategoryCount` | number | Number of room categories | ✓ |
| `FloorCount` | number | Number of floors | ✓ |
| `FloorRoomCount` | number | Number of rooms per floor | ✓ |
| `FloorDormCount` | number | Number of dorms per floor (hostels) | Hotel dependent |
| `DormBedCount` | number | Number of beds per dorm (hostels) | Hotel dependent |
| `FloorApartmentCount` | number | Number of apartments per floor (apartments) | Hotel dependent |
| `User` | object | Primary user account | ✓ |
| `User.Email` | string | Primary user email address | ✓ |
| `Users` | array | Additional user accounts | ✓ |
| `Users[].Email` | string | Additional user email address | ✓ |

## Notes

- **Lifetime Format**: `P0Y0M45DT0H0M0S` = 0 years, 0 months, 45 days, 0 hours, 0 minutes, 0 seconds
- **TaxPrecision**: Only include this field when `Pricing: "Gross"`. Omit for `"Net"` pricing.
- **Property Types**: Adjust room configuration fields based on property type:
  - **Hotel**: `FloorRoomCount: 5`, `FloorDormCount: 0`, `DormBedCount: 0`
  - **Hostel**: `FloorRoomCount: 5`, `FloorDormCount: 2`, `DormBedCount: 4`
  - **Apartments**: `FloorRoomCount: 0`, `FloorApartmentCount: 5`, `FloorDormCount: 0`

## Testing in Postman

1. Create a new POST request
2. Set URL: `https://app.mews-demo.com/api/general/v1/enterprises/addSample`
3. Set Headers: `Content-Type: application/json`
4. Copy one of the example payloads above
5. Replace `YOUR_MEWS_SAMPLE_TOKEN_HERE` with your actual token from `.env`
6. Replace `test.customer@example.com` with a valid email address
7. Send the request
8. Document the response structure you receive

## Expected Response

The response structure is not fully documented. Based on code analysis, it may contain:

- `EnterpriseId` (direct field)
- `Enterprise.Id` (nested field)
- `Id` (direct field)

Please test and document the actual response structure!
