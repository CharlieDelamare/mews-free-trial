import type { SpaceType, BoardType, ProductCategory } from '@/types/research';

export function inferSpaceType(name: string): SpaceType {
  const lower = name.toLowerCase();
  if (/suite|penthouse/.test(lower)) return 'Suite';
  if (/apartment|studio|residence/.test(lower)) return 'Apartment';
  if (/dorm|bunk|pod/.test(lower)) return 'Dorm';
  return 'Room';
}

export function inferBoardType(name: string): BoardType | null {
  const lower = name.toLowerCase();
  if (/all.?inclusive|all.?in\b/.test(lower)) return 'AI';
  if (/full.?board|\bfb\b/.test(lower)) return 'FB';
  if (/half.?board|\bhb\b/.test(lower)) return 'HB';
  if (/bed.and.breakfast|b&b|\bbb\b/.test(lower)) return 'BB';
  if (/room.?only|no.?meals|\bro\b/.test(lower)) return 'RO';
  return null;
}

export function inferProductCategory(name: string): ProductCategory {
  const lower = name.toLowerCase();
  if (/breakfast|dinner|lunch|restaurant|food|beverage|bar|mini.?bar|meal/.test(lower)) return 'Food & Beverage';
  if (/transfer|shuttle|taxi|transport|airport/.test(lower)) return 'Transport';
  if (/\bspa\b|massage|wellness|gym|fitness|sauna|pool/.test(lower)) return 'Wellness';
  if (/parking|valet|garage/.test(lower)) return 'Parking';
  return 'Other';
}
