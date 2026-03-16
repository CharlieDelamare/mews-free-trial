/**
 * API endpoint to test if Classifications and Notes are saved by Mews API
 *
 * GET /api/test-classifications?accessToken=xxx&enterpriseId=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMewsClientToken, getMewsApiUrl } from '@/lib/config';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const accessToken = searchParams.get('accessToken');
  const enterpriseId = searchParams.get('enterpriseId');

  if (!accessToken) {
    return NextResponse.json({ success: false, error: 'accessToken parameter required' }, { status: 400 });
  }

  const testEmail = `test-${Date.now()}@classifications-test.com`;
  const testClassifications = ['Returning', 'VeryImportant'];
  const testNotes = 'This is a test customer to verify Classifications and Notes are saved correctly.';

  try {
    console.log('[TEST] Creating test customer with Classifications and Notes...');

    // Step 1: Create customer
    const createResponse = await fetch(`${getMewsApiUrl()}/api/connector/v1/customers/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ClientToken: getMewsClientToken(),
        AccessToken: accessToken,
        Client: 'Classifications Test',
        FirstName: 'Test',
        LastName: 'Customer',
        Email: testEmail,
        Classifications: testClassifications,
        Notes: testNotes
      })
    });

    if (!createResponse.ok) {
      const error = await createResponse.json();
      return NextResponse.json({
        success: false,
        error: 'Failed to create customer',
        details: error
      }, { status: 500 });
    }

    const createData = await createResponse.json();
    console.log('[TEST] Customer created with ID:', createData.Id);

    // Step 2: Wait for data propagation
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 3: Retrieve customer
    console.log('[TEST] Fetching customer to verify...');

    const getAllResponse = await fetch(`${getMewsApiUrl()}/api/connector/v1/customers/getAll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ClientToken: getMewsClientToken(),
        AccessToken: accessToken,
        Client: 'Classifications Test',
        Extent: {
          Customers: true,
          Addresses: false
        },
        Limitation: {
          Count: 10
        },
        CustomerIds: [createData.Id]
      })
    });

    if (!getAllResponse.ok) {
      const error = await getAllResponse.json();
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch customer',
        details: error
      }, { status: 500 });
    }

    const getAllData = await getAllResponse.json();
    const customer = getAllData.Customers?.[0];

    if (!customer) {
      return NextResponse.json({
        success: false,
        error: 'Customer not found after creation'
      }, { status: 500 });
    }

    // Compare results
    const classificationsMatch =
      JSON.stringify(testClassifications.sort()) ===
      JSON.stringify((customer.Classifications || []).sort());

    const notesMatch = testNotes === customer.Notes;
    const overallMatch = classificationsMatch && notesMatch;

    console.log('[TEST] Results:', {
      classificationsMatch,
      notesMatch,
      overallMatch
    });

    return NextResponse.json({
      success: true,
      testPassed: overallMatch,
      sent: {
        email: testEmail,
        classifications: testClassifications,
        notes: testNotes
      },
      received: {
        email: customer.Email,
        classifications: customer.Classifications || null,
        notes: customer.Notes || null
      },
      comparison: {
        classificationsMatch,
        notesMatch
      },
      conclusion: overallMatch
        ? 'Classifications and Notes are saved correctly ✅'
        : 'Classifications and/or Notes are NOT being saved by the Mews demo API ❌'
    });

  } catch (error) {
    console.error('[TEST] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
