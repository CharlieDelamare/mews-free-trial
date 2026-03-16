export interface CountryBenchmark {
  country_name: string;
  currency: string;
  currency_symbol: string;
  // ── Core financial metrics (city hotel, local currency) ───────────────
  average_daily_rate: number;   // ADR for a mid-scale/upscale city hotel
  hourly_wage: number;          // Average hotel staff hourly wage (front desk / housekeeping)
  revpar: number;               // Revenue Per Available Room (city hotel)
  staff_turnover_rate: number;  // Annual hospitality staff turnover %
  occupancy_city: number;       // City hotel annual room occupancy % (used as baseline)
  // ── Online check-in adoption (% of reservations via digital check-in with Mews) ──
  // Source: Mews June 2025 survey. US=30%, global avg=20%. Tiered by regional digital maturity.
  online_checkin_adoption: number;
  // ── Optional per-hotel-type ADR overrides (local currency) ────────────
  adr_city_hotel?: number;
  adr_boutique_hotel?: number;
  adr_conference_hotel?: number;
  adr_serviced_apartment?: number;
  adr_short_term_rental?: number;
}

// ── Hotel-type operational benchmarks (global, not country-specific) ──────
// These cover metrics that vary by hotel type but not significantly by geography:
// check-in/out process times, F&B error rates, F&B revenue share, turnover adjustment.

export interface HotelTypeBenchmark {
  hotel_type: string;
  // Average front-desk process time WITHOUT digital tools (minutes per guest)
  checkin_time: number;
  checkout_time: number;
  // F&B billing error rate: % of F&B transactions with errors
  fb_error_rate: number;
  // F&B annual revenue as a fraction of annual room revenue
  fb_revenue_fraction: number;
  // Multiplier applied to country base staff_turnover_rate
  turnover_multiplier: number;
  // Occupancy multiplier applied to country occupancy_city baseline
  occupancy_multiplier: number;
}

// Sources: STR/CoStar, CBRE, HotStats, Mews research, HFTP, industry operator interviews.
// Check-in/check-out times represent traditional (non-digital) front-desk process times.
// F&B figures from CBRE Trends® 2024, HotStats 2024, The Highland Group 2024.
export const hotelTypeBenchmarks: HotelTypeBenchmark[] = [
  {
    hotel_type: 'City Hotel',
    // Standard 5-step check-in: ID verify, payment, assignment, key, info ~7 min.
    // Check-out: express folio review + key return ~3 min.
    checkin_time: 7,
    checkout_time: 3,
    // Full-service hotel F&B: ~26-27% of total revenue (CBRE Trends® 2024).
    fb_error_rate: 3.0,
    fb_revenue_fraction: 0.27,
    turnover_multiplier: 1.0,
    occupancy_multiplier: 1.0,
  },
  {
    hotel_type: 'Boutique Hotel',
    // More personalised arrival experience (welcome drink, property tour) ~8-10 min.
    // More attentive departure conversation ~3 min.
    checkin_time: 9,
    checkout_time: 3,
    // Lifestyle boutique hotels: F&B ~22% (The Highland Group 2024).
    // Smaller scale with dedicated staff → lower error rate ~2.5%.
    fb_error_rate: 2.5,
    fb_revenue_fraction: 0.22,
    // Better culture, higher pay relative to size → lower turnover.
    turnover_multiplier: 0.82,
    // Boutique hotels: US independent 63.2% occupancy vs 63% overall (The Highland Group 2024).
    occupancy_multiplier: 0.97,
  },
  {
    hotel_type: 'Conference Hotel',
    // Group pre-assignments reduce individual check-in time; express desk often used ~6 min.
    // Check-out: complex group master-account settlement ~4 min individual.
    checkin_time: 6,
    checkout_time: 4,
    // Banquet/event billing complexity: ~4.5% error rate. Multiple master accounts,
    // split billing, last-minute menu changes drive higher error exposure.
    fb_error_rate: 4.5,
    // Conference/convention hotels: F&B 35-40% of total revenue (CBRE 2024).
    fb_revenue_fraction: 0.38,
    turnover_multiplier: 1.0,
    // Group demand → lower peak season occupancy vs leisure-driven city hotels.
    occupancy_multiplier: 0.97,
  },
  {
    hotel_type: 'Serviced Apartment',
    // Extended apartment orientation: key fob, appliances, parking, local info ~12 min.
    // Thorough key/inventory check at departure ~5 min.
    checkin_time: 12,
    checkout_time: 5,
    // Minimal F&B (mostly communal kitchen/grab-and-go): ~1.5% error rate.
    fb_error_rate: 1.5,
    // Serviced apartments: F&B ~8% of room revenue.
    fb_revenue_fraction: 0.08,
    // Longer guest stays → more stable work environment → lower turnover.
    turnover_multiplier: 0.75,
    // HVS 2024: SA occupancy exceeded hotel occupancy expectations; ~10% above city hotels.
    occupancy_multiplier: 1.10,
  },
  {
    hotel_type: 'Short-Term Rental',
    // Typically self-service: smart lock code or key box → ~4 min host interaction (virtual).
    // Check-out: key return instruction only ~1 min.
    checkin_time: 4,
    checkout_time: 1,
    // Negligible F&B billing: ~0.5%.
    fb_error_rate: 0.5,
    // STR: almost no F&B revenue (self-catering) ~2% of room revenue.
    fb_revenue_fraction: 0.02,
    // Mix of part-time/gig workers; slightly lower turnover than city hotels.
    turnover_multiplier: 0.90,
    // H2 2024: STR occupancy ~56% EU/NA vs hotel ~65% → ratio ~0.86.
    occupancy_multiplier: 0.85,
  },
];

export function getHotelTypeBenchmark(hotelType: string): HotelTypeBenchmark | undefined {
  return hotelTypeBenchmarks.find((b) => b.hotel_type === hotelType);
}

// ── Country benchmark data ────────────────────────────────────────────────
// All monetary values in LOCAL CURRENCY.
// Sources: STR/CoStar 2024, Eurostat, ERI SalaryExpert, national hotel associations,
// HVS, CBRE, Cushman & Wakefield, PwC Hospitality, MKG Consulting 2024.
//
// occupancy_city = Annual room occupancy % for a typical city/urban hotel (STR methodology).
// Note: Eurostat "bed place" occupancy rates are lower; we use STR room occupancy rates.

const benchmarks: CountryBenchmark[] = [
  // ── Non-EUR Individual Countries ──────────────────────────────────────

  // United States (USD)
  // STR/CoStar 2024: Record ADR $158.67, RevPAR $99.94. Occupancy 63%.
  // BLS nonsupervisory hospitality wage ~$19.61/hr. Annual turnover ~73%.
  {
    country_name: 'United States',
    currency: 'USD',
    currency_symbol: '$',
    average_daily_rate: 159,
    hourly_wage: 20,
    revpar: 100,
    staff_turnover_rate: 73,
    occupancy_city: 63,
    online_checkin_adoption: 30,   // Mews US data: 10.5% portal + 20% kiosk; mature market
  },

  // United Kingdom (GBP)
  // London ADR £168, regional ~£87; blended city ~£120. National occupancy ~78%.
  // NLW £11.44 (2024), hospitality average ~£12/hr. UK hospitality turnover ~30%.
  {
    country_name: 'United Kingdom',
    currency: 'GBP',
    currency_symbol: '£',
    average_daily_rate: 120,
    hourly_wage: 12,
    revpar: 80,
    staff_turnover_rate: 30,
    occupancy_city: 78,
    online_checkin_adoption: 30,   // Mature market, strong tech adoption
  },

  // Switzerland (CHF)
  // National ADR CHF 148, Zurich/Geneva ~CHF 262; city hotel blended ~CHF 200.
  // CBA minimum CHF 19-21/hr, avg hotel worker CHF 22/hr. Very low turnover.
  {
    country_name: 'Switzerland',
    currency: 'CHF',
    currency_symbol: 'CHF',
    average_daily_rate: 200,
    hourly_wage: 22,
    revpar: 130,
    staff_turnover_rate: 20,
    occupancy_city: 62,
    online_checkin_adoption: 30,   // Mature market, high digital literacy
  },

  // Australia (AUD)
  // ADR ~A$245. Hospitality minimum A$24.10/hr, average ~A$27/hr. Turnover ~45%.
  // APAC average occupancy 66%; Australian cities (Sydney, Melbourne) ~70%.
  {
    country_name: 'Australia',
    currency: 'AUD',
    currency_symbol: 'A$',
    average_daily_rate: 245,
    hourly_wage: 27,
    revpar: 165,
    staff_turnover_rate: 45,
    occupancy_city: 70,
    online_checkin_adoption: 30,   // Mature market, strong tech adoption
  },

  // Canada (CAD)
  // CoStar 2024: Record ADR C$208.71, RevPAR C$137.17. Occupancy 65.7%.
  // Hospitality ~C$18/hr. CloudBeds churn 28%.
  {
    country_name: 'Canada',
    currency: 'CAD',
    currency_symbol: 'C$',
    average_daily_rate: 209,
    hourly_wage: 18,
    revpar: 137,
    staff_turnover_rate: 28,
    occupancy_city: 66,
    online_checkin_adoption: 30,   // Mature market, strong tech adoption
  },

  // Japan (JPY)
  // H1 2024 national occupancy 74.4%. ADR ~¥18,000 (Tokyo ¥18,965).
  // Hotel receptionist ¥1,384-1,759/hr. Very low turnover culture ~15%.
  {
    country_name: 'Japan',
    currency: 'JPY',
    currency_symbol: '¥',
    average_daily_rate: 18000,
    hourly_wage: 1400,
    revpar: 12500,
    staff_turnover_rate: 15,
    occupancy_city: 74,
    online_checkin_adoption: 35,   // High digital literacy, tech-forward market
  },

  // Singapore (SGD)
  // CoStar YTD Nov 2024 ADR S$322, HVS RevPAR S$226. Occupancy 81.8%.
  // Hotel staff entry S$10-12/hr, average ~S$13/hr.
  {
    country_name: 'Singapore',
    currency: 'SGD',
    currency_symbol: 'S$',
    average_daily_rate: 290,
    hourly_wage: 13,
    revpar: 226,
    staff_turnover_rate: 35,
    occupancy_city: 82,
    online_checkin_adoption: 35,   // Tech-forward market, high digital literacy
  },

  // United Arab Emirates (AED)
  // UAE-wide ADR ~$178 (~AED 654). Dubai Feb 2024 ADR AED 887 (premium).
  // City hotel blended ~AED 700. UAE occupancy ~78% (5% above 2019 levels).
  // Hotel worker avg AED 41/hr Dubai, but entry much lower; use AED 20.
  {
    country_name: 'United Arab Emirates',
    currency: 'AED',
    currency_symbol: 'AED',
    average_daily_rate: 700,
    hourly_wage: 20,
    revpar: 550,
    staff_turnover_rate: 45,
    occupancy_city: 78,
    online_checkin_adoption: 25,   // Rapidly modernising hospitality, new-build digital-first
  },

  // ── Nordic (non-EUR currencies) ───────────────────────────────────────

  // Denmark (DKK)
  // Receptionist avg DKK 139-156/hr. Copenhagen occupancy ~72%.
  // ADR estimated ~DKK 1,200.
  {
    country_name: 'Denmark',
    currency: 'DKK',
    currency_symbol: 'kr',
    average_daily_rate: 1200,
    hourly_wage: 150,
    revpar: 850,
    staff_turnover_rate: 25,
    occupancy_city: 72,
    online_checkin_adoption: 35,   // Nordic tech-forward, high digital literacy
  },

  // Sweden (SEK)
  // Scandic Q4 2024 ADR ~SEK 1,279, RevPAR ~SEK 768. Stockholm occupancy ~72%.
  // Hotel front desk SEK 135-155/hr.
  {
    country_name: 'Sweden',
    currency: 'SEK',
    currency_symbol: 'kr',
    average_daily_rate: 1300,
    hourly_wage: 145,
    revpar: 800,
    staff_turnover_rate: 25,
    occupancy_city: 72,
    online_checkin_adoption: 35,   // Nordic tech-forward, high digital literacy
  },

  // ── Nordic (EUR) ──────────────────────────────────────────────────────

  // Finland (EUR)
  // Hotel receptionist ~€14/hr. ADR ~€130. Occupancy ~66%.
  {
    country_name: 'Finland',
    currency: 'EUR',
    currency_symbol: '€',
    average_daily_rate: 130,
    hourly_wage: 15,
    revpar: 85,
    staff_turnover_rate: 25,
    occupancy_city: 66,
    online_checkin_adoption: 35,   // Nordic tech-forward, high digital literacy
  },

  // ── Western EU (EUR) ──────────────────────────────────────────────────

  // Austria (EUR) — Vienna is a strong business and leisure market.
  {
    country_name: 'Austria',
    currency: 'EUR',
    currency_symbol: '€',
    average_daily_rate: 130,
    hourly_wage: 14,
    revpar: 90,
    staff_turnover_rate: 30,
    occupancy_city: 67,
    online_checkin_adoption: 30,   // Mature market, strong tech adoption
  },

  // Belgium (EUR) — Brussels business travel. High labour costs.
  {
    country_name: 'Belgium',
    currency: 'EUR',
    currency_symbol: '€',
    average_daily_rate: 130,
    hourly_wage: 15,
    revpar: 85,
    staff_turnover_rate: 30,
    occupancy_city: 66,
    online_checkin_adoption: 25,   // Solid digital infrastructure, moderate adoption
  },

  // France (EUR) — Paris ADR €212, national city hotel ~€160. Occupancy ~68%.
  // Front desk €14/hr.
  {
    country_name: 'France',
    currency: 'EUR',
    currency_symbol: '€',
    average_daily_rate: 160,
    hourly_wage: 14,
    revpar: 105,
    staff_turnover_rate: 30,
    occupancy_city: 68,
    online_checkin_adoption: 25,   // Solid digital infrastructure, moderate adoption
  },

  // Germany (EUR) — Front desk €15-18/hr. City hotel ADR ~€120. Occupancy ~67%.
  {
    country_name: 'Germany',
    currency: 'EUR',
    currency_symbol: '€',
    average_daily_rate: 120,
    hourly_wage: 15,
    revpar: 80,
    staff_turnover_rate: 30,
    occupancy_city: 67,
    online_checkin_adoption: 30,   // Mature market, strong tech adoption
  },

  // Netherlands (EUR) — Amsterdam premium market. ADR ~€140. Occupancy ~71%.
  {
    country_name: 'Netherlands',
    currency: 'EUR',
    currency_symbol: '€',
    average_daily_rate: 140,
    hourly_wage: 14,
    revpar: 100,
    staff_turnover_rate: 30,
    occupancy_city: 71,
    online_checkin_adoption: 35,   // Tech-forward market, high digital literacy (Postillion case study)
  },

  // Luxembourg (EUR) — Highest labour costs in EU. Premium business travel.
  {
    country_name: 'Luxembourg',
    currency: 'EUR',
    currency_symbol: '€',
    average_daily_rate: 150,
    hourly_wage: 16,
    revpar: 95,
    staff_turnover_rate: 25,
    occupancy_city: 66,
    online_checkin_adoption: 25,   // Solid digital infrastructure, moderate adoption
  },

  // Ireland (EUR) — Dublin city hotel. Led European occupancy rankings ~80%.
  // Irish minimum wage ~€12.70.
  {
    country_name: 'Ireland',
    currency: 'EUR',
    currency_symbol: '€',
    average_daily_rate: 140,
    hourly_wage: 13,
    revpar: 95,
    staff_turnover_rate: 30,
    occupancy_city: 80,
    online_checkin_adoption: 30,   // Mature market, strong tech adoption
  },

  // ── Southern EU (EUR) ─────────────────────────────────────────────────

  // Italy (EUR) — Rome strong, national city average ~€140. Occupancy ~68%.
  // Receptionist €7-8/hr, avg hotel worker ~€10/hr.
  {
    country_name: 'Italy',
    currency: 'EUR',
    currency_symbol: '€',
    average_daily_rate: 140,
    hourly_wage: 10,
    revpar: 95,
    staff_turnover_rate: 33,
    occupancy_city: 68,
    online_checkin_adoption: 25,   // Solid digital infrastructure, moderate adoption
  },

  // Spain (EUR) — 2025 national ADR €133. Receptionist €8-9/hr. Occupancy ~71%.
  {
    country_name: 'Spain',
    currency: 'EUR',
    currency_symbol: '€',
    average_daily_rate: 135,
    hourly_wage: 10,
    revpar: 90,
    staff_turnover_rate: 33,
    occupancy_city: 71,
    online_checkin_adoption: 25,   // Solid digital infrastructure, moderate adoption
  },

  // Portugal (EUR) — Competitive pricing, strong occupancy ~72%.
  {
    country_name: 'Portugal',
    currency: 'EUR',
    currency_symbol: '€',
    average_daily_rate: 120,
    hourly_wage: 8,
    revpar: 85,
    staff_turnover_rate: 33,
    occupancy_city: 72,
    online_checkin_adoption: 20,   // Growing digital adoption
  },

  // Greece (EUR) — Seasonal leisure market, high peak. City annual ~74%.
  {
    country_name: 'Greece',
    currency: 'EUR',
    currency_symbol: '€',
    average_daily_rate: 110,
    hourly_wage: 8,
    revpar: 80,
    staff_turnover_rate: 35,
    occupancy_city: 74,
    online_checkin_adoption: 20,   // Growing digital adoption
  },

  // Cyprus (EUR) — Strong island tourism. Annual occupancy ~76%.
  {
    country_name: 'Cyprus',
    currency: 'EUR',
    currency_symbol: '€',
    average_daily_rate: 105,
    hourly_wage: 8,
    revpar: 70,
    staff_turnover_rate: 35,
    occupancy_city: 76,
    online_checkin_adoption: 20,   // Growing digital adoption
  },

  // Malta (EUR) — Small island market. Occupancy ~74%.
  {
    country_name: 'Malta',
    currency: 'EUR',
    currency_symbol: '€',
    average_daily_rate: 100,
    hourly_wage: 9,
    revpar: 70,
    staff_turnover_rate: 30,
    occupancy_city: 74,
    online_checkin_adoption: 20,   // Growing digital adoption
  },

  // ── Eastern EU (non-EUR currencies) ───────────────────────────────────

  // Czechia (CZK)
  // Prague 2024 ADR ~€113 (~CZK 2,800), RevPAR ~€78 (~CZK 1,950).
  // Hotel housekeeping CZK 146-161/hr. Prague city occupancy 71%.
  {
    country_name: 'Czechia',
    currency: 'CZK',
    currency_symbol: 'Kč',
    average_daily_rate: 2800,
    hourly_wage: 155,
    revpar: 1950,
    staff_turnover_rate: 35,
    occupancy_city: 71,
    online_checkin_adoption: 25,   // Prague strong tourism tech, solid digital infrastructure
  },

  // Hungary (HUF)
  // Budapest 2024 ADR ~€111 (~HUF 44,000), RevPAR ~€75 (~HUF 30,000).
  // Hotel housekeeping attendant ~HUF 1,749/hr in Budapest. Occupancy 67.9%.
  {
    country_name: 'Hungary',
    currency: 'HUF',
    currency_symbol: 'Ft',
    average_daily_rate: 44000,
    hourly_wage: 1750,
    revpar: 30000,
    staff_turnover_rate: 35,
    occupancy_city: 68,
    online_checkin_adoption: 15,   // Earlier-stage digital hospitality adoption
  },

  // Poland (PLN)
  // Warsaw/Krakow city hotel ~€90-100 (~PLN 400). Housekeeping PLN 28-30/hr.
  // City occupancy ~60%.
  {
    country_name: 'Poland',
    currency: 'PLN',
    currency_symbol: 'zł',
    average_daily_rate: 400,
    hourly_wage: 30,
    revpar: 270,
    staff_turnover_rate: 35,
    occupancy_city: 60,
    online_checkin_adoption: 20,   // Growing digital adoption
  },

  // Romania (RON)
  // Bucharest city hotel ~€90 (~RON 450). Hotel housekeeping ~RON 22/hr.
  // City occupancy ~55%.
  {
    country_name: 'Romania',
    currency: 'RON',
    currency_symbol: 'lei',
    average_daily_rate: 450,
    hourly_wage: 25,
    revpar: 300,
    staff_turnover_rate: 35,
    occupancy_city: 55,
    online_checkin_adoption: 15,   // Earlier-stage digital hospitality adoption
  },

  // Bulgaria (BGN)
  // Sofia city hotel ~€90 (~BGN 176). Hotel housekeeping ~BGN 9/hr.
  // City occupancy ~58%.
  {
    country_name: 'Bulgaria',
    currency: 'BGN',
    currency_symbol: 'лв',
    average_daily_rate: 180,
    hourly_wage: 10,
    revpar: 120,
    staff_turnover_rate: 35,
    occupancy_city: 58,
    online_checkin_adoption: 15,   // Earlier-stage digital hospitality adoption
  },

  // ── Eastern EU (EUR) ──────────────────────────────────────────────────

  // Slovakia (EUR) — Bratislava city hotel. Lower occupancy ~55%.
  {
    country_name: 'Slovakia',
    currency: 'EUR',
    currency_symbol: '€',
    average_daily_rate: 90,
    hourly_wage: 8,
    revpar: 55,
    staff_turnover_rate: 35,
    occupancy_city: 55,
    online_checkin_adoption: 20,   // Growing digital adoption
  },

  // Croatia (EUR) — Zagreb + coastal, seasonal influence. City ~65%.
  {
    country_name: 'Croatia',
    currency: 'EUR',
    currency_symbol: '€',
    average_daily_rate: 110,
    hourly_wage: 9,
    revpar: 70,
    staff_turnover_rate: 33,
    occupancy_city: 65,
    online_checkin_adoption: 20,   // Growing digital adoption
  },

  // Slovenia (EUR) — Ljubljana city hotel. Occupancy ~63%.
  {
    country_name: 'Slovenia',
    currency: 'EUR',
    currency_symbol: '€',
    average_daily_rate: 100,
    hourly_wage: 10,
    revpar: 65,
    staff_turnover_rate: 30,
    occupancy_city: 63,
    online_checkin_adoption: 20,   // Growing digital adoption
  },

  // Latvia (EUR) — Riga city hotel. Strong growth; ADR +20.9% in 2025. Occupancy ~68%.
  {
    country_name: 'Latvia',
    currency: 'EUR',
    currency_symbol: '€',
    average_daily_rate: 85,
    hourly_wage: 8,
    revpar: 55,
    staff_turnover_rate: 35,
    occupancy_city: 68,
    online_checkin_adoption: 20,   // Growing digital adoption
  },

  // Lithuania (EUR) — Vilnius city hotel. Occupancy ~63%.
  {
    country_name: 'Lithuania',
    currency: 'EUR',
    currency_symbol: '€',
    average_daily_rate: 80,
    hourly_wage: 8,
    revpar: 52,
    staff_turnover_rate: 35,
    occupancy_city: 63,
    online_checkin_adoption: 20,   // Growing digital adoption
  },

  // Estonia (EUR) — Tallinn city hotel. Slightly higher wages than LV/LT. Occupancy ~65%.
  {
    country_name: 'Estonia',
    currency: 'EUR',
    currency_symbol: '€',
    average_daily_rate: 85,
    hourly_wage: 9,
    revpar: 55,
    staff_turnover_rate: 33,
    occupancy_city: 65,
    online_checkin_adoption: 35,   // Tech-forward Baltic state, high digital literacy
  },
];

export function getCountryBenchmark(countryName: string): CountryBenchmark | null {
  return benchmarks.find((b) => b.country_name === countryName) ?? null;
}
