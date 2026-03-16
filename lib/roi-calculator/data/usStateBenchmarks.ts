// ── U.S. State-Level Benchmark Data ────────────────────────────────────────
// Sources:
//   ADR, RevPAR, Occupancy: STR/CoStar 2024-2025, AHLA State of the Industry 2025,
//     state tourism board reports, Smith Travel Research state-level aggregates
//   Hourly Wage: BLS OEWS May 2024, NAICS 7211 (Traveler Accommodation)
//   Turnover: BLS JOLTS regional data (Northeast/South/Midwest/West) applied as proxy
//
// Note: All values are for mid-scale/upscale city hotels in USD.
// RevPAR is computed as ADR × occupancy / 100 where not directly available.

export interface StateBenchmark {
  state_name: string;
  state_code: string;       // 2-letter USPS abbreviation
  average_daily_rate: number;
  hourly_wage: number;
  revpar: number;
  staff_turnover_rate: number;
  occupancy_city: number;
}

// BLS JOLTS regional turnover proxies for leisure & hospitality:
//   Northeast: 65%   South: 78%   Midwest: 70%   West: 72%
const TURNOVER_NORTHEAST = 65;
const TURNOVER_SOUTH = 78;
const TURNOVER_MIDWEST = 70;
const TURNOVER_WEST = 72;

const stateBenchmarks: StateBenchmark[] = [
  // ── Northeast ──────────────────────────────────────────────────────────
  { state_name: 'Connecticut',    state_code: 'CT', average_daily_rate: 165, hourly_wage: 19, revpar: 107, staff_turnover_rate: TURNOVER_NORTHEAST, occupancy_city: 65 },
  { state_name: 'Delaware',       state_code: 'DE', average_daily_rate: 140, hourly_wage: 16, revpar: 85,  staff_turnover_rate: TURNOVER_NORTHEAST, occupancy_city: 61 },
  { state_name: 'Maine',          state_code: 'ME', average_daily_rate: 175, hourly_wage: 17, revpar: 96,  staff_turnover_rate: TURNOVER_NORTHEAST, occupancy_city: 55 },
  { state_name: 'Maryland',       state_code: 'MD', average_daily_rate: 155, hourly_wage: 18, revpar: 99,  staff_turnover_rate: TURNOVER_NORTHEAST, occupancy_city: 64 },
  { state_name: 'Massachusetts',  state_code: 'MA', average_daily_rate: 220, hourly_wage: 22, revpar: 159, staff_turnover_rate: TURNOVER_NORTHEAST, occupancy_city: 72 },
  { state_name: 'New Hampshire',  state_code: 'NH', average_daily_rate: 170, hourly_wage: 17, revpar: 97,  staff_turnover_rate: TURNOVER_NORTHEAST, occupancy_city: 57 },
  { state_name: 'New Jersey',     state_code: 'NJ', average_daily_rate: 175, hourly_wage: 20, revpar: 114, staff_turnover_rate: TURNOVER_NORTHEAST, occupancy_city: 65 },
  { state_name: 'New York',       state_code: 'NY', average_daily_rate: 280, hourly_wage: 25, revpar: 224, staff_turnover_rate: TURNOVER_NORTHEAST, occupancy_city: 80 },
  { state_name: 'Pennsylvania',   state_code: 'PA', average_daily_rate: 150, hourly_wage: 17, revpar: 95,  staff_turnover_rate: TURNOVER_NORTHEAST, occupancy_city: 63 },
  { state_name: 'Rhode Island',   state_code: 'RI', average_daily_rate: 175, hourly_wage: 18, revpar: 109, staff_turnover_rate: TURNOVER_NORTHEAST, occupancy_city: 62 },
  { state_name: 'Vermont',        state_code: 'VT', average_daily_rate: 185, hourly_wage: 17, revpar: 100, staff_turnover_rate: TURNOVER_NORTHEAST, occupancy_city: 54 },

  // ── South ──────────────────────────────────────────────────────────────
  { state_name: 'Alabama',        state_code: 'AL', average_daily_rate: 120, hourly_wage: 14, revpar: 69,  staff_turnover_rate: TURNOVER_SOUTH, occupancy_city: 58 },
  { state_name: 'Arkansas',       state_code: 'AR', average_daily_rate: 110, hourly_wage: 14, revpar: 62,  staff_turnover_rate: TURNOVER_SOUTH, occupancy_city: 56 },
  { state_name: 'Florida',        state_code: 'FL', average_daily_rate: 195, hourly_wage: 18, revpar: 137, staff_turnover_rate: TURNOVER_SOUTH, occupancy_city: 70 },
  { state_name: 'Georgia',        state_code: 'GA', average_daily_rate: 145, hourly_wage: 16, revpar: 91,  staff_turnover_rate: TURNOVER_SOUTH, occupancy_city: 63 },
  { state_name: 'Kentucky',       state_code: 'KY', average_daily_rate: 120, hourly_wage: 15, revpar: 70,  staff_turnover_rate: TURNOVER_SOUTH, occupancy_city: 58 },
  { state_name: 'Louisiana',      state_code: 'LA', average_daily_rate: 155, hourly_wage: 15, revpar: 99,  staff_turnover_rate: TURNOVER_SOUTH, occupancy_city: 64 },
  { state_name: 'Mississippi',    state_code: 'MS', average_daily_rate: 105, hourly_wage: 13, revpar: 57,  staff_turnover_rate: TURNOVER_SOUTH, occupancy_city: 54 },
  { state_name: 'North Carolina', state_code: 'NC', average_daily_rate: 140, hourly_wage: 16, revpar: 87,  staff_turnover_rate: TURNOVER_SOUTH, occupancy_city: 62 },
  { state_name: 'Oklahoma',       state_code: 'OK', average_daily_rate: 105, hourly_wage: 14, revpar: 58,  staff_turnover_rate: TURNOVER_SOUTH, occupancy_city: 55 },
  { state_name: 'South Carolina', state_code: 'SC', average_daily_rate: 150, hourly_wage: 15, revpar: 93,  staff_turnover_rate: TURNOVER_SOUTH, occupancy_city: 62 },
  { state_name: 'Tennessee',      state_code: 'TN', average_daily_rate: 155, hourly_wage: 16, revpar: 99,  staff_turnover_rate: TURNOVER_SOUTH, occupancy_city: 64 },
  { state_name: 'Texas',          state_code: 'TX', average_daily_rate: 140, hourly_wage: 16, revpar: 84,  staff_turnover_rate: TURNOVER_SOUTH, occupancy_city: 60 },
  { state_name: 'Virginia',       state_code: 'VA', average_daily_rate: 145, hourly_wage: 17, revpar: 91,  staff_turnover_rate: TURNOVER_SOUTH, occupancy_city: 63 },
  { state_name: 'West Virginia',  state_code: 'WV', average_daily_rate: 110, hourly_wage: 14, revpar: 59,  staff_turnover_rate: TURNOVER_SOUTH, occupancy_city: 54 },
  { state_name: 'Washington, D.C.', state_code: 'DC', average_daily_rate: 230, hourly_wage: 22, revpar: 161, staff_turnover_rate: TURNOVER_SOUTH, occupancy_city: 70 },

  // ── Midwest ────────────────────────────────────────────────────────────
  { state_name: 'Illinois',       state_code: 'IL', average_daily_rate: 175, hourly_wage: 19, revpar: 114, staff_turnover_rate: TURNOVER_MIDWEST, occupancy_city: 65 },
  { state_name: 'Indiana',        state_code: 'IN', average_daily_rate: 120, hourly_wage: 15, revpar: 70,  staff_turnover_rate: TURNOVER_MIDWEST, occupancy_city: 58 },
  { state_name: 'Iowa',           state_code: 'IA', average_daily_rate: 105, hourly_wage: 14, revpar: 58,  staff_turnover_rate: TURNOVER_MIDWEST, occupancy_city: 55 },
  { state_name: 'Kansas',         state_code: 'KS', average_daily_rate: 105, hourly_wage: 14, revpar: 57,  staff_turnover_rate: TURNOVER_MIDWEST, occupancy_city: 54 },
  { state_name: 'Michigan',       state_code: 'MI', average_daily_rate: 130, hourly_wage: 16, revpar: 78,  staff_turnover_rate: TURNOVER_MIDWEST, occupancy_city: 60 },
  { state_name: 'Minnesota',      state_code: 'MN', average_daily_rate: 140, hourly_wage: 17, revpar: 82,  staff_turnover_rate: TURNOVER_MIDWEST, occupancy_city: 59 },
  { state_name: 'Missouri',       state_code: 'MO', average_daily_rate: 125, hourly_wage: 15, revpar: 73,  staff_turnover_rate: TURNOVER_MIDWEST, occupancy_city: 58 },
  { state_name: 'Nebraska',       state_code: 'NE', average_daily_rate: 110, hourly_wage: 15, revpar: 62,  staff_turnover_rate: TURNOVER_MIDWEST, occupancy_city: 56 },
  { state_name: 'North Dakota',   state_code: 'ND', average_daily_rate: 105, hourly_wage: 16, revpar: 56,  staff_turnover_rate: TURNOVER_MIDWEST, occupancy_city: 53 },
  { state_name: 'Ohio',           state_code: 'OH', average_daily_rate: 125, hourly_wage: 16, revpar: 74,  staff_turnover_rate: TURNOVER_MIDWEST, occupancy_city: 59 },
  { state_name: 'South Dakota',   state_code: 'SD', average_daily_rate: 115, hourly_wage: 15, revpar: 61,  staff_turnover_rate: TURNOVER_MIDWEST, occupancy_city: 53 },
  { state_name: 'Wisconsin',      state_code: 'WI', average_daily_rate: 125, hourly_wage: 16, revpar: 71,  staff_turnover_rate: TURNOVER_MIDWEST, occupancy_city: 57 },

  // ── West ───────────────────────────────────────────────────────────────
  { state_name: 'Alaska',         state_code: 'AK', average_daily_rate: 200, hourly_wage: 20, revpar: 110, staff_turnover_rate: TURNOVER_WEST, occupancy_city: 55 },
  { state_name: 'Arizona',        state_code: 'AZ', average_daily_rate: 170, hourly_wage: 17, revpar: 112, staff_turnover_rate: TURNOVER_WEST, occupancy_city: 66 },
  { state_name: 'California',     state_code: 'CA', average_daily_rate: 210, hourly_wage: 22, revpar: 151, staff_turnover_rate: TURNOVER_WEST, occupancy_city: 72 },
  { state_name: 'Colorado',       state_code: 'CO', average_daily_rate: 175, hourly_wage: 19, revpar: 114, staff_turnover_rate: TURNOVER_WEST, occupancy_city: 65 },
  { state_name: 'Hawaii',         state_code: 'HI', average_daily_rate: 310, hourly_wage: 23, revpar: 236, staff_turnover_rate: TURNOVER_WEST, occupancy_city: 76 },
  { state_name: 'Idaho',          state_code: 'ID', average_daily_rate: 135, hourly_wage: 15, revpar: 76,  staff_turnover_rate: TURNOVER_WEST, occupancy_city: 56 },
  { state_name: 'Montana',        state_code: 'MT', average_daily_rate: 150, hourly_wage: 15, revpar: 80,  staff_turnover_rate: TURNOVER_WEST, occupancy_city: 53 },
  { state_name: 'Nevada',         state_code: 'NV', average_daily_rate: 185, hourly_wage: 19, revpar: 134, staff_turnover_rate: TURNOVER_WEST, occupancy_city: 72 },
  { state_name: 'New Mexico',     state_code: 'NM', average_daily_rate: 125, hourly_wage: 15, revpar: 73,  staff_turnover_rate: TURNOVER_WEST, occupancy_city: 58 },
  { state_name: 'Oregon',         state_code: 'OR', average_daily_rate: 155, hourly_wage: 18, revpar: 99,  staff_turnover_rate: TURNOVER_WEST, occupancy_city: 64 },
  { state_name: 'Utah',           state_code: 'UT', average_daily_rate: 145, hourly_wage: 16, revpar: 91,  staff_turnover_rate: TURNOVER_WEST, occupancy_city: 63 },
  { state_name: 'Washington',     state_code: 'WA', average_daily_rate: 175, hourly_wage: 21, revpar: 117, staff_turnover_rate: TURNOVER_WEST, occupancy_city: 67 },
  { state_name: 'Wyoming',        state_code: 'WY', average_daily_rate: 145, hourly_wage: 15, revpar: 73,  staff_turnover_rate: TURNOVER_WEST, occupancy_city: 50 },
];

export function getStateBenchmark(stateCode: string): StateBenchmark | undefined {
  return stateBenchmarks.find((s) => s.state_code === stateCode);
}

export function getStateBenchmarkByName(stateName: string): StateBenchmark | undefined {
  return stateBenchmarks.find((s) => s.state_name === stateName);
}

export { stateBenchmarks };
