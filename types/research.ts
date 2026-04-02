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

export interface HotelResearchData {
  hotelName: string;
  address: string;
  starRating: number | null;
  source: ResearchSource;
  roomTypes: RoomType[];
  ratePlans: RatePlan[];
  products: Product[];
  generalFacilities: string[];
}
