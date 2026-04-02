import { NextRequest, NextResponse } from 'next/server';
import { searchLiteAPI } from '@/lib/research/liteapi';
import { searchSerpApi } from '@/lib/research/serpapi';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const name = searchParams.get('name')?.trim();
  const city = searchParams.get('city')?.trim();
  const countryCode = searchParams.get('countryCode')?.trim() || undefined;

  if (!name || !city) {
    return NextResponse.json(
      { success: false, error: 'name and city are required' },
      { status: 400 }
    );
  }

  try {
    let candidates = await searchLiteAPI(name, city, countryCode);

    if (candidates.length === 0) {
      candidates = await searchSerpApi(name, city);
    }

    return NextResponse.json({ success: true, candidates });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Search failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
