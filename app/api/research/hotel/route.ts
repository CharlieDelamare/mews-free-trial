import { NextRequest, NextResponse } from 'next/server';
import { fetchLiteAPIHotel } from '@/lib/research/liteapi';
import { fetchSerpApiHotel } from '@/lib/research/serpapi';
import type { ResearchSource } from '@/types/research';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const hotelId = searchParams.get('hotelId')?.trim();
  const source = searchParams.get('source')?.trim() as ResearchSource | null;

  if (!hotelId) {
    return NextResponse.json(
      { success: false, error: 'hotelId is required' },
      { status: 400 }
    );
  }

  if (source !== 'liteapi' && source !== 'serpapi') {
    return NextResponse.json(
      { success: false, error: 'source must be "liteapi" or "serpapi"' },
      { status: 400 }
    );
  }

  try {
    const hotel =
      source === 'liteapi'
        ? await fetchLiteAPIHotel(hotelId)
        : await fetchSerpApiHotel(hotelId);

    return NextResponse.json({ success: true, hotel });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch hotel data';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
