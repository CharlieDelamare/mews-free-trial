import { NextRequest, NextResponse } from 'next/server';

// Define response types
interface MewsResponse {
  Reservations?: Array<{
    Id: string;
    Number: string;
  }>;
  Message?: string;
}

interface ReservationResult {
  success: boolean;
  reservationId?: string;
  confirmationNumber?: string;
  error?: string;
  details?: MewsResponse;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    
    const {
      firstName,
      lastName,
      email,
      phone,
      companyName,
      startDate,
      endDate,
      notes
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get environment variables
    const clientToken = process.env.MEWS_CLIENT_TOKEN;
    const accessToken = process.env.MEWS_ACCESS_TOKEN;
    const serviceId = process.env.MEWS_BOOKABLE_SERVICE_ID;
    const rateId = process.env.MEWS_RATE_ID;
    const resourceCategoryId = process.env.MEWS_RESOURCE_CATEGORY_ID;
    const apiUrl = process.env.MEWS_API_URL || 'https://api.mews.com';

    if (!clientToken || !accessToken || !serviceId || !rateId || !resourceCategoryId) {
      console.error('Missing Mews configuration');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Step 1: Create or get customer
    const customerResponse = await fetch(`${apiUrl}/api/connector/v1/customers/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ClientToken: clientToken,
        AccessToken: accessToken,
        Client: 'Mews Free Trial App',
        FirstName: firstName,
        LastName: lastName,
        Email: email,
        Phone: phone || undefined,
        CompanyIdentifier: companyName ? { Name: companyName } : undefined
      })
    });

    const customerData = await customerResponse.json();
    
    if (!customerResponse.ok || !customerData.Id) {
      console.error('Customer creation failed:', customerData);
      return NextResponse.json(
        { success: false, error: 'Failed to create customer', details: customerData },
        { status: 500 }
      );
    }

    const customerId = customerData.Id;

    // Step 2: Create the reservation
    const reservationResponse = await fetch(`${apiUrl}/api/connector/v1/reservations/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ClientToken: clientToken,
        AccessToken: accessToken,
        Client: 'Mews Free Trial App',
        ServiceId: serviceId,
        Reservations: [
          {
            CustomerId: customerId,
            StartUtc: new Date(startDate).toISOString(),
            EndUtc: new Date(endDate).toISOString(),
            RateId: rateId,
            RequestedResourceCategoryId: resourceCategoryId,
            Notes: notes || `Free trial request from ${firstName} ${lastName} - ${companyName || 'No company'}`
          }
        ]
      })
    });

    const reservationData: MewsResponse = await reservationResponse.json();

    if (!reservationResponse.ok) {
      console.error('Reservation creation failed:', reservationData);
      return NextResponse.json(
        { success: false, error: 'Failed to create reservation', details: reservationData },
        { status: 500 }
      );
    }

    const result: ReservationResult = {
      success: true,
      reservationId: reservationData.Reservations?.[0]?.Id,
      confirmationNumber: reservationData.Reservations?.[0]?.Number,
      details: reservationData
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
