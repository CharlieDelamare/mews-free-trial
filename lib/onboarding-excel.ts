/**
 * Onboarding Excel parse and export utilities
 *
 * Handles the 21-sheet Mews RIA import file format:
 * - parseOnboardingExcel: reads a Buffer → ExcelData
 * - buildOnboardingExcel: writes ExcelData → Buffer for download
 */

import * as XLSX from 'xlsx';
import type {
  ExcelData,
  GeneralQuestionsData,
  ResourceCategory,
  Resource,
  ResourceFeature,
  BookableService,
  ProductCategory,
  BookableProduct,
  AdditionalService,
  AdditionalProduct,
  BusinessSegment,
  Department,
  RateGroup,
  BaseRate,
  DerivedRate,
  RatePrice,
  AccountingCategory,
  Translation,
  ExcelTask,
  ParametersData,
} from '@/types/onboarding';

// ─── Sheet name mapping ────────────────────────────────────────────────────

const SHEET_NAMES = {
  generalQuestions: 'General Questions',
  resourceCategories: 'Resource Categories',
  resources: 'Resources',
  resourceFeatures: 'Resource Features',
  bookableServices: 'Bookable Services',
  bookableProductCategories: 'Bookable Product Categories',
  bookableProducts: 'Bookable Products',
  additionalServices: 'Additional Services',
  additionalProductCategories: 'Additional Product Categories',
  additionalProducts: 'Additional Products',
  businessSegments: 'Business Segments',
  departments: 'Departments',
  rateGroups: 'Rate Groups',
  baseRates: 'Base Rates',
  derivedRates: 'Derived Rates',
  ratePrices: 'Rate Prices',
  accountingCategories: 'Accounting Categories',
  translations: 'Translations',
  tasks: 'Tasks',
  parameters: 'Parameters',
} as const;

// ─── Parse helpers ─────────────────────────────────────────────────────────

/**
 * Read a worksheet as an array of row objects.
 * Handles the Mews RIA format where sheets have banner rows before the actual
 * "ColumnHeaders" row (col A = "ColumnHeaders"). Multiline headers are
 * normalised to their first line. Falls back to standard sheet_to_json if no
 * "ColumnHeaders" marker is found.
 */
function sheetToRows<T extends Record<string, unknown>>(
  wb: XLSX.WorkBook,
  sheetName: string,
): T[] {
  const ws = wb.Sheets[sheetName];
  if (!ws) return [];

  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: undefined, raw: false });

  const headerRowIdx = rawRows.findIndex(
    (r) => String(((r as unknown[])[0]) ?? '').trim() === 'ColumnHeaders',
  );

  if (headerRowIdx === -1) {
    return XLSX.utils.sheet_to_json<T>(ws, { defval: undefined, raw: false });
  }

  // Normalise multiline column headers — take first line only
  const headerRow = rawRows[headerRowIdx] as unknown[];
  const headers = headerRow.slice(1).map((h) =>
    String(h ?? '').trim().split(/\r?\n/)[0].trim(),
  );

  const result: T[] = [];
  for (let i = headerRowIdx + 1; i < rawRows.length; i++) {
    const row = rawRows[i] as unknown[];
    const obj: Record<string, unknown> = {};
    let hasData = false;
    for (let j = 0; j < headers.length; j++) {
      const val = row[j + 1]; // col A (index 0) is the row marker — skip it
      if (headers[j] && val !== undefined && val !== '') {
        obj[headers[j]] = val;
        hasData = true;
      }
    }
    if (hasData) result.push(obj as T);
  }
  return result;
}

/**
 * Read a key-value worksheet.
 * Mews RIA format: col A = key, col D = "Your Answers".
 */
function sheetToKeyValue(wb: XLSX.WorkBook, sheetName: string): Record<string, string> {
  const ws = wb.Sheets[sheetName];
  if (!ws) return {};
  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: undefined, raw: false });
  const result: Record<string, string> = {};
  for (const row of rawRows) {
    const r = row as (unknown)[];
    const key = r[0] != null ? String(r[0]).trim() : '';
    // Col D (index 3) = "Your Answers"
    const val = r[3] != null ? String(r[3]).trim() : '';
    if (key && val && key !== 'ColumnHeaders' && key !== 'Header' && key !== 'ColumnHeader') {
      result[key] = val;
    }
  }
  return result;
}

/** Parse the Parameters sheet which has one column per list of values. */
function parseParameters(wb: XLSX.WorkBook): ParametersData {
  const ws = wb.Sheets[SHEET_NAMES.parameters];
  const empty: ParametersData = {
    propertyTypes: [],
    pricingModes: [],
    spaceTypes: [],
    classifications: [],
    rateTypes: [],
    productTypes: [],
    consumptionMoments: [],
    countryCodes: [],
    reservationStrategies: [],
    availabilityStrategies: [],
    reservationPurposes: [],
  };
  if (!ws) return empty;

  // Sheet_to_json with header:1 gives raw arrays per row
  const rows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: '' });
  if (rows.length === 0) return empty;

  // Row 0 is the header row — column names map to our fields
  const headers = rows[0].map((h) => String(h).trim());
  const colMap: Record<string, number> = {};
  headers.forEach((h, i) => { colMap[h] = i; });

  function col(name: string): string[] {
    const idx = colMap[name];
    if (idx === undefined) return [];
    return rows.slice(1)
      .map((r) => String(r[idx] ?? '').trim())
      .filter(Boolean);
  }

  // Country codes — actual column names in the RIA file are "Country Code" and "Country"
  const codeIdx = colMap['Country Code'] ?? colMap['Code'] ?? colMap['CountryCode'];
  const nameIdx = colMap['Country'] ?? colMap['Name'] ?? colMap['CountryName'];
  const countryCodes = (codeIdx !== undefined && nameIdx !== undefined)
    ? rows.slice(1)
        .map((r) => ({ code: String(r[codeIdx] ?? '').trim(), name: String(r[nameIdx] ?? '').trim() }))
        .filter((c) => c.code)
    : [];

  return {
    propertyTypes: col('Type of property') || col('PropertyType') || col('PropertyTypes'),
    pricingModes: col('Pricing Mode') || col('PricingMode') || col('PricingModes'),
    spaceTypes: col('SpaceType') || col('SpaceTypes'),
    classifications: col('Classification') || col('Classifications'),
    rateTypes: col('RateType') || col('RateTypes'),
    productTypes: col('ProductType') || col('ProductTypes'),
    consumptionMoments: col('Consumption moment') || col('ConsumptionMoment') || col('ConsumptionMoments'),
    countryCodes,
    reservationStrategies: col('Reservation Strategy Ass') || col('ReservationStrategy') || col('ReservationStrategies'),
    availabilityStrategies: col('Availability calculation Strategy') || col('AvailabilityStrategy') || col('AvailabilityStrategies'),
    reservationPurposes: col('Default Reservation Purpose') || col('ReservationPurpose') || col('ReservationPurposes'),
  };
}

// ─── Field name normalisation ──────────────────────────────────────────────
// The Excel column headers may vary slightly (spaces, casing, different naming).
// These helpers pick the first matching key from a row object.

function pick<T>(row: Record<string, unknown>, ...keys: string[]): T | undefined {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== '') return v as T;
  }
  return undefined;
}

function pickStr(row: Record<string, unknown>, ...keys: string[]): string | undefined {
  const v = pick<string>(row, ...keys);
  return v ? String(v).trim() || undefined : undefined;
}

function pickNum(row: Record<string, unknown>, ...keys: string[]): number | undefined {
  const v = pick<string>(row, ...keys);
  if (v === undefined) return undefined;
  const n = Number(v);
  return isNaN(n) ? undefined : n;
}

function pickBool(row: Record<string, unknown>, ...keys: string[]): boolean | undefined {
  const v = pick<string>(row, ...keys);
  if (v === undefined) return undefined;
  const s = String(v).toLowerCase().trim();
  if (s === 'true' || s === 'yes' || s === '1') return true;
  if (s === 'false' || s === 'no' || s === '0') return false;
  return undefined;
}

// ─── Parse functions per sheet ─────────────────────────────────────────────

function parseGeneralQuestions(wb: XLSX.WorkBook): GeneralQuestionsData {
  // GeneralQuestions is a key-value sheet (col A = field name, col B = value)
  const kv = sheetToKeyValue(wb, SHEET_NAMES.generalQuestions);
  return {
    type: kv['Type'] || kv['PropertyType'] || undefined,
    name: kv['Name'] || kv['PropertyName'] || undefined,
    chainName: kv['ChainName'] || kv['Chain'] || undefined,
    email: kv['Email'] || undefined,
    telephone: kv['Telephone'] || kv['Phone'] || undefined,
    websiteUrl: kv['WebsiteUrl'] || kv['Website'] || undefined,
    addressLine1: kv['AddressLine1'] || kv['Address1'] || undefined,
    addressLine2: kv['AddressLine2'] || kv['Address2'] || undefined,
    city: kv['City'] || undefined,
    postalCode: kv['PostalCode'] || kv['Zip'] || undefined,
    countryCode: kv['CountryCode'] || kv['Country'] || undefined,
    timeZoneId: kv['TimeZoneId'] || kv['TimeZone'] || undefined,
    currency: kv['Currency'] || kv['CurrencyCode'] || undefined,
    checkInTime: kv['CheckInTime'] || kv['CheckIn'] || undefined,
    checkOutTime: kv['CheckOutTime'] || kv['CheckOut'] || undefined,
    pricingMode: kv['PricingMode'] || undefined,
  };
}

function parseResourceCategories(wb: XLSX.WorkBook): ResourceCategory[] {
  return sheetToRows<Record<string, unknown>>(wb, SHEET_NAMES.resourceCategories)
    .filter((r) => pickStr(r, 'Category Name', 'Name', 'CategoryName'))
    .map((r) => ({
      name: pickStr(r, 'Category Name', 'Name', 'CategoryName') ?? '',
      spaceType: pickStr(r, 'Type', 'SpaceType'),
      classification: pickStr(r, 'Classification'),
      capacity: pickNum(r, 'Standard occupancy', 'Capacity', 'MaxCapacity'),
      description: pickStr(r, 'Category description', 'Description'),
    }));
}

function parseResources(wb: XLSX.WorkBook): Resource[] {
  return sheetToRows<Record<string, unknown>>(wb, SHEET_NAMES.resources)
    .filter((r) => pickStr(r, 'Resource number', 'Name', 'ResourceName'))
    .map((r) => ({
      name: pickStr(r, 'Resource number', 'Name', 'ResourceName') ?? '',
      categoryName: pickStr(r, 'Resource Category', 'CategoryName', 'Category', 'ResourceCategoryName'),
      floor: pickStr(r, 'Floor', 'FloorNumber'),
      description: pickStr(r, 'Description'),
    }));
}

function parseResourceFeatures(wb: XLSX.WorkBook): ResourceFeature[] {
  return sheetToRows<Record<string, unknown>>(wb, SHEET_NAMES.resourceFeatures)
    .filter((r) => pickStr(r, 'Resource Feature Name', 'Name', 'FeatureName'))
    .map((r) => ({
      name: pickStr(r, 'Resource Feature Name', 'Name', 'FeatureName') ?? '',
      classification: pickStr(r, 'Classification'),
    }));
}

function parseBookableServices(wb: XLSX.WorkBook): BookableService[] {
  return sheetToRows<Record<string, unknown>>(wb, SHEET_NAMES.bookableServices)
    .filter((r) => pickStr(r, 'Service Name', 'Name', 'ServiceName'))
    .map((r) => ({
      name: pickStr(r, 'Service Name', 'Name', 'ServiceName') ?? '',
      productType: pickStr(r, 'ProductType', 'Type'),
      pricingMode: pickStr(r, 'PricingMode'),
      description: pickStr(r, 'Description'),
    }));
}

function parseProductCategories(wb: XLSX.WorkBook, sheetName: string): ProductCategory[] {
  return sheetToRows<Record<string, unknown>>(wb, sheetName)
    .filter((r) => pickStr(r, 'Category Name', 'Name', 'CategoryName'))
    .map((r) => ({
      name: pickStr(r, 'Category Name', 'Name', 'CategoryName') ?? '',
      serviceName: pickStr(r, 'Bookable Service', 'ServiceName', 'Service'),
    }));
}

function parseBookableProducts(wb: XLSX.WorkBook): BookableProduct[] {
  return sheetToRows<Record<string, unknown>>(wb, SHEET_NAMES.bookableProducts)
    .filter((r) => pickStr(r, 'Product Name', 'Name', 'ProductName'))
    .map((r) => ({
      name: pickStr(r, 'Product Name', 'Name', 'ProductName') ?? '',
      categoryName: pickStr(r, 'Product Category Name (optional)', 'CategoryName', 'Category'),
      productType: pickStr(r, 'ProductType', 'Type'),
      pricingMode: pickStr(r, 'PricingMode'),
      pricing: pickStr(r, 'Price ', 'Price', 'Pricing'),
      consumptionMoment: pickStr(r, 'ConsumptionMoment'),
      description: pickStr(r, 'Description'),
    }));
}

function parseAdditionalServices(wb: XLSX.WorkBook): AdditionalService[] {
  return sheetToRows<Record<string, unknown>>(wb, SHEET_NAMES.additionalServices)
    .filter((r) => pickStr(r, 'Service Name', 'Name', 'ServiceName'))
    .map((r) => ({
      name: pickStr(r, 'Service Name', 'Name', 'ServiceName') ?? '',
      productType: pickStr(r, 'ProductType', 'Type'),
      pricingMode: pickStr(r, 'PricingMode'),
      description: pickStr(r, 'Description'),
    }));
}

function parseAdditionalProducts(wb: XLSX.WorkBook): AdditionalProduct[] {
  return sheetToRows<Record<string, unknown>>(wb, SHEET_NAMES.additionalProducts)
    .filter((r) => pickStr(r, 'Product Name', 'Name', 'ProductName'))
    .map((r) => ({
      name: pickStr(r, 'Product Name', 'Name', 'ProductName') ?? '',
      serviceName: pickStr(r, 'Product Service Name', 'ServiceName', 'Service'),
      categoryName: pickStr(r, 'Product Category Name (optional)', 'CategoryName', 'Category'),
      productType: pickStr(r, 'ProductType', 'Type'),
      pricingMode: pickStr(r, 'PricingMode'),
      pricing: pickStr(r, 'Price ', 'Price', 'Pricing'),
      consumptionMoment: pickStr(r, 'ConsumptionMoment'),
      description: pickStr(r, 'Description'),
    }));
}

function parseBusinessSegments(wb: XLSX.WorkBook): BusinessSegment[] {
  return sheetToRows<Record<string, unknown>>(wb, SHEET_NAMES.businessSegments)
    .filter((r) => pickStr(r, 'Business Segment Name', 'Name', 'SegmentName'))
    .map((r) => ({
      name: pickStr(r, 'Business Segment Name', 'Name', 'SegmentName') ?? '',
      description: pickStr(r, 'Description'),
    }));
}

function parseDepartments(wb: XLSX.WorkBook): Department[] {
  return sheetToRows<Record<string, unknown>>(wb, SHEET_NAMES.departments)
    .filter((r) => pickStr(r, 'Department Name', 'Name', 'DepartmentName'))
    .map((r) => ({
      name: pickStr(r, 'Department Name', 'Name', 'DepartmentName') ?? '',
      description: pickStr(r, 'Description'),
    }));
}

function parseRateGroups(wb: XLSX.WorkBook): RateGroup[] {
  return sheetToRows<Record<string, unknown>>(wb, SHEET_NAMES.rateGroups)
    .filter((r) => pickStr(r, 'Rate Group Name', 'Name', 'RateGroupName'))
    .map((r) => ({
      name: pickStr(r, 'Rate Group Name', 'Name', 'RateGroupName') ?? '',
      rateType: pickStr(r, 'RateType', 'Type'),
      description: pickStr(r, 'Description'),
    }));
}

function parseBaseRates(wb: XLSX.WorkBook): BaseRate[] {
  return sheetToRows<Record<string, unknown>>(wb, SHEET_NAMES.baseRates)
    .filter((r) => pickStr(r, 'Rate Name', 'Name', 'RateName'))
    .map((r) => ({
      name: pickStr(r, 'Rate Name', 'Name', 'RateName') ?? '',
      rateGroupName: pickStr(r, 'Rate Group', 'RateGroupName', 'RateGroup'),
      isEnabled: pickBool(r, 'IsEnabled', 'Enabled', 'Active'),
      description: pickStr(r, 'Description'),
    }));
}

function parseDerivedRates(wb: XLSX.WorkBook): DerivedRate[] {
  return sheetToRows<Record<string, unknown>>(wb, SHEET_NAMES.derivedRates)
    .filter((r) => pickStr(r, 'Rate Name', 'Name', 'RateName'))
    .map((r) => ({
      name: pickStr(r, 'Rate Name', 'Name', 'RateName') ?? '',
      baseRateName: pickStr(r, 'Derived from Rate', 'BaseRateName', 'BaseRate'),
      adjustment: pickStr(r, 'Adjustment', 'AdjustmentType'),
      description: pickStr(r, 'Description'),
    }));
}

function parseRatePrices(wb: XLSX.WorkBook): RatePrice[] {
  return sheetToRows<Record<string, unknown>>(wb, SHEET_NAMES.ratePrices)
    .filter((r) => pickStr(r, 'Base Rate Name', 'BaseRateName', 'RateName'))
    .map((r) => ({
      baseRateName: pickStr(r, 'Base Rate Name', 'BaseRateName', 'RateName'),
      startDate: pickStr(r, 'Start Date', 'StartDate', 'From'),
      endDate: pickStr(r, 'End Date', 'EndDate', 'To'),
      value: pickNum(r, 'Value', 'Price', 'Amount'),
      currencyCode: pickStr(r, 'CurrencyCode', 'Currency'),
    }));
}

function parseAccountingCategories(wb: XLSX.WorkBook): AccountingCategory[] {
  return sheetToRows<Record<string, unknown>>(wb, SHEET_NAMES.accountingCategories)
    .filter((r) => pickStr(r, 'Name', 'CategoryName'))
    .map((r) => ({
      name: pickStr(r, 'Name', 'CategoryName') ?? '',
      code: pickStr(r, 'Code', 'AccountCode'),
      classification: pickStr(r, 'Classification'),
      description: pickStr(r, 'Description'),
    }));
}

function parseTranslations(wb: XLSX.WorkBook): Translation[] {
  const rows = sheetToRows<Record<string, unknown>>(wb, SHEET_NAMES.translations);
  return rows.map((r) => {
    const t: Translation = {};
    for (const [k, v] of Object.entries(r)) {
      if (v !== undefined && v !== '') t[k] = String(v);
    }
    return t;
  });
}

function parseTasks(wb: XLSX.WorkBook): ExcelTask[] {
  return sheetToRows<Record<string, unknown>>(wb, SHEET_NAMES.tasks)
    .filter((r) => pickStr(r, 'Name', 'TaskName'))
    .map((r) => ({
      name: pickStr(r, 'Name', 'TaskName'),
      description: pickStr(r, 'Description'),
      departmentName: pickStr(r, 'DepartmentName', 'Department'),
    }));
}

// ─── Public parse function ─────────────────────────────────────────────────

export function parseOnboardingExcel(buffer: Buffer): ExcelData {
  const wb = XLSX.read(buffer, { type: 'buffer', raw: false, cellDates: false });

  return {
    generalQuestions: parseGeneralQuestions(wb),
    resourceCategories: parseResourceCategories(wb),
    resources: parseResources(wb),
    resourceFeatures: parseResourceFeatures(wb),
    bookableServices: parseBookableServices(wb),
    bookableProductCategories: parseProductCategories(wb, SHEET_NAMES.bookableProductCategories),
    bookableProducts: parseBookableProducts(wb),
    additionalServices: parseAdditionalServices(wb),
    additionalProductCategories: parseProductCategories(wb, SHEET_NAMES.additionalProductCategories),
    additionalProducts: parseAdditionalProducts(wb),
    businessSegments: parseBusinessSegments(wb),
    departments: parseDepartments(wb),
    rateGroups: parseRateGroups(wb),
    baseRates: parseBaseRates(wb),
    derivedRates: parseDerivedRates(wb),
    ratePrices: parseRatePrices(wb),
    accountingCategories: parseAccountingCategories(wb),
    translations: parseTranslations(wb),
    tasks: parseTasks(wb),
    parameters: parseParameters(wb),
  };
}

/** Brief stats for the parse summary shown on Step 1. */
export interface ParseSummary {
  roomCount: number;
  categoryCount: number;
  rateCount: number;
  productCount: number;
  serviceCount: number;
  propertyName: string | undefined;
}

export function summariseExcelData(data: ExcelData): ParseSummary {
  return {
    propertyName: data.generalQuestions.name,
    roomCount: data.resources.length,
    categoryCount: data.resourceCategories.length,
    rateCount: data.baseRates.length + data.derivedRates.length,
    productCount: data.bookableProducts.length + data.additionalProducts.length,
    serviceCount: data.bookableServices.length + data.additionalServices.length,
  };
}

// ─── Export / build functions ──────────────────────────────────────────────

/** Write a key-value worksheet for GeneralQuestions. */
function buildGeneralQuestionsSheet(data: GeneralQuestionsData): XLSX.WorkSheet {
  const rows: [string, string][] = [
    ['Type', data.type ?? ''],
    ['Name', data.name ?? ''],
    ['ChainName', data.chainName ?? ''],
    ['Email', data.email ?? ''],
    ['Telephone', data.telephone ?? ''],
    ['WebsiteUrl', data.websiteUrl ?? ''],
    ['AddressLine1', data.addressLine1 ?? ''],
    ['AddressLine2', data.addressLine2 ?? ''],
    ['City', data.city ?? ''],
    ['PostalCode', data.postalCode ?? ''],
    ['CountryCode', data.countryCode ?? ''],
    ['TimeZoneId', data.timeZoneId ?? ''],
    ['Currency', data.currency ?? ''],
    ['CheckInTime', data.checkInTime ?? ''],
    ['CheckOutTime', data.checkOutTime ?? ''],
    ['PricingMode', data.pricingMode ?? ''],
  ];
  return XLSX.utils.aoa_to_sheet([['Key', 'Value'], ...rows]);
}

function buildSheet<T extends object>(items: T[], headers?: string[]): XLSX.WorkSheet {
  if (items.length === 0) {
    const ws = XLSX.utils.aoa_to_sheet(headers ? [headers] : [[]]);
    return ws;
  }
  return XLSX.utils.json_to_sheet(items);
}

export function buildOnboardingExcel(data: ExcelData): Buffer {
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, buildGeneralQuestionsSheet(data.generalQuestions), SHEET_NAMES.generalQuestions);
  XLSX.utils.book_append_sheet(wb, buildSheet(data.resourceCategories), SHEET_NAMES.resourceCategories);
  XLSX.utils.book_append_sheet(wb, buildSheet(data.resources), SHEET_NAMES.resources);
  XLSX.utils.book_append_sheet(wb, buildSheet(data.resourceFeatures), SHEET_NAMES.resourceFeatures);
  XLSX.utils.book_append_sheet(wb, buildSheet(data.bookableServices), SHEET_NAMES.bookableServices);
  XLSX.utils.book_append_sheet(wb, buildSheet(data.bookableProductCategories), SHEET_NAMES.bookableProductCategories);
  XLSX.utils.book_append_sheet(wb, buildSheet(data.bookableProducts), SHEET_NAMES.bookableProducts);
  XLSX.utils.book_append_sheet(wb, buildSheet(data.additionalServices), SHEET_NAMES.additionalServices);
  XLSX.utils.book_append_sheet(wb, buildSheet(data.additionalProductCategories), SHEET_NAMES.additionalProductCategories);
  XLSX.utils.book_append_sheet(wb, buildSheet(data.additionalProducts), SHEET_NAMES.additionalProducts);
  XLSX.utils.book_append_sheet(wb, buildSheet(data.businessSegments), SHEET_NAMES.businessSegments);
  XLSX.utils.book_append_sheet(wb, buildSheet(data.departments), SHEET_NAMES.departments);
  XLSX.utils.book_append_sheet(wb, buildSheet(data.rateGroups), SHEET_NAMES.rateGroups);
  XLSX.utils.book_append_sheet(wb, buildSheet(data.baseRates), SHEET_NAMES.baseRates);
  XLSX.utils.book_append_sheet(wb, buildSheet(data.derivedRates), SHEET_NAMES.derivedRates);
  XLSX.utils.book_append_sheet(wb, buildSheet(data.ratePrices), SHEET_NAMES.ratePrices);
  XLSX.utils.book_append_sheet(wb, buildSheet(data.accountingCategories), SHEET_NAMES.accountingCategories);
  XLSX.utils.book_append_sheet(wb, buildSheet(data.translations), SHEET_NAMES.translations);
  XLSX.utils.book_append_sheet(wb, buildSheet(data.tasks), SHEET_NAMES.tasks);

  // Parameters sheet: rebuild from stored data
  const paramsData = data.parameters;
  const maxLen = Math.max(
    paramsData.propertyTypes.length,
    paramsData.pricingModes.length,
    paramsData.spaceTypes.length,
    paramsData.classifications.length,
    paramsData.rateTypes.length,
    paramsData.productTypes.length,
    paramsData.consumptionMoments.length,
    paramsData.countryCodes.length,
    paramsData.reservationStrategies.length,
    paramsData.availabilityStrategies.length,
    paramsData.reservationPurposes.length,
    0,
  );
  const paramsRows: Record<string, string>[] = [];
  for (let i = 0; i < maxLen; i++) {
    paramsRows.push({
      PropertyType: paramsData.propertyTypes[i] ?? '',
      PricingMode: paramsData.pricingModes[i] ?? '',
      SpaceType: paramsData.spaceTypes[i] ?? '',
      Classification: paramsData.classifications[i] ?? '',
      RateType: paramsData.rateTypes[i] ?? '',
      ProductType: paramsData.productTypes[i] ?? '',
      ConsumptionMoment: paramsData.consumptionMoments[i] ?? '',
      Code: paramsData.countryCodes[i]?.code ?? '',
      Name: paramsData.countryCodes[i]?.name ?? '',
      ReservationStrategy: paramsData.reservationStrategies[i] ?? '',
      AvailabilityStrategy: paramsData.availabilityStrategies[i] ?? '',
      ReservationPurpose: paramsData.reservationPurposes[i] ?? '',
    });
  }
  XLSX.utils.book_append_sheet(wb, buildSheet(paramsRows), SHEET_NAMES.parameters);

  const arrayBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return Buffer.from(arrayBuffer);
}
