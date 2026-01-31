// Language code mappings
export const preferredLanguage: Record<string, string> = {
  "Czech": "cs-CZ",
  "Danish": "da-DK",
  "German (Swiss)": "de-CH",
  "German": "de-DE",
  "Greek": "el-GR",
  "English (UK)": "en-GB",
  "Spanish": "es-ES",
  "Estonian": "et-EE",
  "Finnish": "fi-FI",
  "French (Canadian)": "fr-CA",
  "French": "fr-FR",
  "Italian": "it-IT",
  "Japanese": "ja-JP",
  "Korean": "ko-KR",
  "Dutch": "nl-NL",
  "Norwegian": "nb-NO",
  "Polish": "pl-PL",
  "Portuguese (Brazilian)": "pt-BR",
  "Portuguese": "pt-PT",
  "Russian": "ru-RU",
  "Slovak": "sk-SK",
  "Swedish": "sv-SE",
  "English (USA)": "en-US",
};

// Country configuration mappings
export interface CountryConfig {
  LE: string;
  Currency: string;
  Environment: "Gross" | "Net";
}

export const countries: Record<string, CountryConfig> = {
  "Andorra": { LE: "AD", Currency: "EUR", Environment: "Gross" },
  "Argentina": { LE: "AR", Currency: "ARS", Environment: "Gross" },
  "Aruba": { LE: "AW-2023", Currency: "USD", Environment: "Gross" },
  "Australia": { LE: "AU", Currency: "AUD", Environment: "Gross" },
  "Austria": { LE: "AT-2020", Currency: "EUR", Environment: "Gross" },
  "Bahamas": { LE: "BS", Currency: "USD", Environment: "Gross" },
  "Belgium": { LE: "BE", Currency: "EUR", Environment: "Gross" },
  "Bolivia": { LE: "BO", Currency: "USD", Environment: "Gross" },
  "Brazil": { LE: "BR-TAX-EXEMPT", Currency: "BRL", Environment: "Gross" },
  "Cambodia": { LE: "KH", Currency: "USD", Environment: "Gross" },
  "Canada": { LE: "CA-BC", Currency: "CAD", Environment: "Net" },
  "Chile": { LE: "CL", Currency: "USD", Environment: "Gross" },
  "Colombia": { LE: "CO", Currency: "USD", Environment: "Gross" },
  "Costa Rica": { LE: "CR", Currency: "USD", Environment: "Gross" },
  "Croatia": { LE: "HR", Currency: "USD", Environment: "Gross" },
  "Cyprus": { LE: "CY", Currency: "EUR", Environment: "Gross" },
  "Czech Republic": { LE: "CZ-2025", Currency: "CZK", Environment: "Gross" },
  "Denmark": { LE: "DK", Currency: "DKK", Environment: "Gross" },
  "Dominican Republic": { LE: "DO", Currency: "USD", Environment: "Gross" },
  "Ecuador": { LE: "EC", Currency: "USD", Environment: "Gross" },
  "Egypt": { LE: "EG", Currency: "EGP", Environment: "Gross" },
  "Estonia": { LE: "EE-2025-1", Currency: "EUR", Environment: "Gross" },
  "Finland": { LE: "FI-2025", Currency: "USD", Environment: "Gross" },
  "France": { LE: "FR", Currency: "EUR", Environment: "Gross" },
  "Georgia": { LE: "GE", Currency: "USD", Environment: "Gross" },
  "Germany": { LE: "DE-2020-1", Currency: "EUR", Environment: "Gross" },
  "Greece": { LE: "GR-2016", Currency: "EUR", Environment: "Gross" },
  "Hong Kong": { LE: "HK", Currency: "USD", Environment: "Gross" },
  "Hungary": { LE: "HU-2020", Currency: "HUF", Environment: "Gross" },
  "Iceland": { LE: "IS", Currency: "USD", Environment: "Gross" },
  "Indonesia": { LE: "ID", Currency: "USD", Environment: "Gross" },
  "Ireland": { LE: "IE", Currency: "EUR", Environment: "Gross" },
  "Israel": { LE: "IL", Currency: "USD", Environment: "Gross" },
  "Italy": { LE: "IT", Currency: "EUR", Environment: "Gross" },
  "Japan": { LE: "JP-2019", Currency: "JPY", Environment: "Gross" },
  "Kenya": { LE: "KE", Currency: "USD", Environment: "Gross" },
  "Latvia": { LE: "LV", Currency: "USD", Environment: "Gross" },
  "Luxembourg": { LE: "LU-2023", Currency: "USD", Environment: "Gross" },
  "Malaysia": { LE: "MY", Currency: "USD", Environment: "Gross" },
  "Malta": { LE: "MT", Currency: "USD", Environment: "Gross" },
  "Mauritius": { LE: "MU", Currency: "USD", Environment: "Gross" },
  "Mexico": { LE: "MX", Currency: "USD", Environment: "Gross" },
  "Montenegro": { LE: "ME", Currency: "USD", Environment: "Gross" },
  "Morocco": { LE: "MA-2025", Currency: "USD", Environment: "Gross" },
  "Netherlands": { LE: "NL-2019", Currency: "EUR", Environment: "Gross" },
  "New Zealand": { LE: "NZ", Currency: "NZD", Environment: "Gross" },
  "Nigeria": { LE: "NG", Currency: "USD", Environment: "Gross" },
  "Norway": { LE: "NO-2025", Currency: "NOK", Environment: "Gross" },
  "Panama": { LE: "PA", Currency: "USD", Environment: "Gross" },
  "Peru": { LE: "PE", Currency: "USD", Environment: "Gross" },
  "Philippines": { LE: "PH", Currency: "USD", Environment: "Gross" },
  "Poland": { LE: "PL", Currency: "PLN", Environment: "Gross" },
  "Portugal": { LE: "PT", Currency: "USD", Environment: "Gross" },
  "Serbia": { LE: "RS", Currency: "USD", Environment: "Gross" },
  "Singapore": { LE: "SG", Currency: "USD", Environment: "Gross" },
  "South Africa": { LE: "ZA-2019", Currency: "ZAR", Environment: "Gross" },
  "Spain": { LE: "ES-2016", Currency: "EUR", Environment: "Gross" },
  "Sweden": { LE: "SE", Currency: "SEK", Environment: "Gross" },
  "Switzerland": { LE: "CH-2018", Currency: "CHF", Environment: "Gross" },
  "Taiwan": { LE: "TW", Currency: "USD", Environment: "Gross" },
  "Thailand": { LE: "TH-2024", Currency: "USD", Environment: "Gross" },
  "Turkey": { LE: "TR", Currency: "USD", Environment: "Gross" },
  "Ukraine": { LE: "UA", Currency: "USD", Environment: "Gross" },
  "United Kingdom": { LE: "UK-2022", Currency: "GBP", Environment: "Gross" },
  "United States": { LE: "US-NY-NYC", Currency: "USD", Environment: "Net" },
  "Uruguay": { LE: "UY", Currency: "USD", Environment: "Gross" },
};

// Helper functions
export function getPreferredLanguage(language: string): string {
  return preferredLanguage[language] || "en-GB";
}

export function getLegalEnvironmentCode(country: string): string {
  return countries[country]?.LE || "UK-2022";
}

export function getCurrency(country: string): string {
  return countries[country]?.Currency || "GBP";
}

export function getPricingEnvironment(country: string): "Gross" | "Net" {
  return countries[country]?.Environment || "Gross";
}

// Export lists for dropdowns
export const languageOptions = Object.keys(preferredLanguage);
export const countryOptions = Object.keys(countries);
