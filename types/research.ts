export type SpaceType = 'Room' | 'Suite' | 'Apartment' | 'Dorm' | 'Other';
export type BoardType = 'RO' | 'BB' | 'HB' | 'FB' | 'AI';
export type ProductCategory = 'Food & Beverage' | 'Transport' | 'Wellness' | 'Parking' | 'Other';
export type ResearchSource = 'liteapi' | 'serpapi';

export interface HotelCandidate {
  hotelId: string;
  name: string;
  address: string;
  starRating: number | null;
  country: string | null;
  source: ResearchSource;
  /** SerpApi only — needed to fetch full property data */
  propertyToken?: string;
}

export interface RoomType {
  name: string;
  description: string | null;
  maxOccupancy: number | null;
  bedType: string | null;
  sizeSqm: number | null;
  amenities: string[];
  spaceType: SpaceType;
}

export interface RatePlan {
  name: string;
  boardType: BoardType | null;
  cancellationPolicy: string | null;
  isRefundable: boolean | null;
}

export interface Product {
  name: string;
  category: ProductCategory;
}

export interface HotelImage {
  url: string;
  urlHd: string | null;
  caption: string | null;
  isDefault: boolean;
}

export interface HotelPolicy {
  type: string;
  name: string;
  description: string;
}

export interface SentimentCategory {
  name: string;
  rating: number;
  description: string;
}

export interface HotelResearchData {
  hotelName: string;
  address: string;
  starRating: number | null;
  source: ResearchSource;

  // Rich content
  description: string | null;
  importantInfo: string | null;
  mainPhoto: string | null;
  images: HotelImage[];

  // Timing
  checkinTime: string | null;
  checkoutTime: string | null;
  checkinInstructions: string[];

  // Identity
  hotelType: string | null;
  chain: string | null;
  airportCode: string | null;

  // Contact
  phone: string | null;
  email: string | null;

  // Guest policies
  parking: boolean | null;
  childAllowed: boolean | null;
  petsAllowed: boolean | null;
  policies: HotelPolicy[];

  // Reviews & sentiment
  reviewRating: number | null;
  reviewCount: number | null;
  sentimentPros: string[];
  sentimentCons: string[];
  sentimentCategories: SentimentCategory[];

  // Location
  latitude: number | null;
  longitude: number | null;

  // Inventory
  roomTypes: RoomType[];
  ratePlans: RatePlan[];
  products: Product[];
  generalFacilities: string[];
}
