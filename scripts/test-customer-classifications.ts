/**
 * Test script to verify if Classifications and Notes are saved by Mews API
 *
 * This script:
 * 1. Creates a test customer with Classifications and Notes
 * 2. Retrieves the customer using getAll endpoint
 * 3. Compares what was sent vs what was saved
 *
 * Usage: ts-node scripts/test-customer-classifications.ts <accessToken>
 */

const MEWS_CLIENT_TOKEN = 'B7DB2BC5307849758EB9B00A00E85B69-77E0E354A6E058C0E1A456B5238BFA0';
const MEWS_API_URL = 'https://api.mews-demo.com';

interface TestResult {
  sent: {
    email: string;
    classifications: string[];
    notes: string;
  };
  received: {
    email: string;
    classifications?: string[];
    notes?: string;
  };
  match: boolean;
}

async function testCustomerClassifications(accessToken: string): Promise<TestResult> {
  const testEmail = `test-${Date.now()}@classifications-test.com`;
  const testClassifications = ['Returning', 'VeryImportant'];
  const testNotes = 'This is a test customer to verify Classifications and Notes are saved correctly.';

  console.log('🧪 Testing Classifications and Notes persistence...\n');
  console.log('📤 Creating test customer with:');
  console.log('  Email:', testEmail);
  console.log('  Classifications:', testClassifications);
  console.log('  Notes:', testNotes, '\n');

  // Step 1: Create customer with Classifications and Notes
  const createResponse = await fetch(`${MEWS_API_URL}/api/connector/v1/customers/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ClientToken: MEWS_CLIENT_TOKEN,
      AccessToken: accessToken,
      Client: 'Classifications Test Script',
      FirstName: 'Test',
      LastName: 'Customer',
      Email: testEmail,
      Classifications: testClassifications,
      Notes: testNotes
    })
  });

  if (!createResponse.ok) {
    const error = await createResponse.json();
    throw new Error(`Failed to create customer: ${JSON.stringify(error)}`);
  }

  const createData = await createResponse.json();
  console.log('✅ Customer created with ID:', createData.Id, '\n');

  // Step 2: Wait a moment for data to propagate
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Step 3: Retrieve customer using getAll endpoint
  console.log('📥 Fetching customer to verify saved data...\n');

  const getAllResponse = await fetch(`${MEWS_API_URL}/api/connector/v1/customers/getAll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ClientToken: MEWS_CLIENT_TOKEN,
      AccessToken: accessToken,
      Client: 'Classifications Test Script',
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
    throw new Error(`Failed to fetch customer: ${JSON.stringify(error)}`);
  }

  const getAllData = await getAllResponse.json();
  const customer = getAllData.Customers?.[0];

  if (!customer) {
    throw new Error('Customer not found in getAll response');
  }

  console.log('✅ Customer retrieved\n');
  console.log('📊 Comparison:');
  console.log('  Sent Classifications:', testClassifications);
  console.log('  Received Classifications:', customer.Classifications || '(none)');
  console.log('  Sent Notes:', testNotes);
  console.log('  Received Notes:', customer.Notes || '(none)', '\n');

  const classificationsMatch = JSON.stringify(testClassifications.sort()) === JSON.stringify((customer.Classifications || []).sort());
  const notesMatch = testNotes === customer.Notes;
  const overallMatch = classificationsMatch && notesMatch;

  console.log('🔍 Results:');
  console.log('  Classifications saved:', classificationsMatch ? '✅ YES' : '❌ NO');
  console.log('  Notes saved:', notesMatch ? '✅ YES' : '❌ NO');
  console.log('  Overall:', overallMatch ? '✅ PASS' : '❌ FAIL', '\n');

  if (!overallMatch) {
    console.log('⚠️  CONCLUSION: The Mews demo API accepts but does NOT save Classifications and/or Notes.');
    console.log('   This is likely a limitation of the demo environment.\n');
  }

  return {
    sent: {
      email: testEmail,
      classifications: testClassifications,
      notes: testNotes
    },
    received: {
      email: customer.Email,
      classifications: customer.Classifications,
      notes: customer.Notes
    },
    match: overallMatch
  };
}

// Main execution
const accessToken = process.argv[2];

if (!accessToken) {
  console.error('❌ Error: Access token required');
  console.error('Usage: ts-node scripts/test-customer-classifications.ts <accessToken>');
  process.exit(1);
}

testCustomerClassifications(accessToken)
  .then(result => {
    console.log('✅ Test completed');
    process.exit(result.match ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  });
