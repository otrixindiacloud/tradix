// Test script to verify enquiry creation API
const testEnquiryCreation = async () => {
  try {
    const testData = {
      customerId: '2a66d91a-9c30-4323-a87f-421728f64fda', // Test Customer ID
      source: 'Web Form',
      targetDeliveryDate: '2025-12-31',
      notes: 'Test enquiry creation'
    };

    console.log('Testing enquiry creation with data:', testData);

    const response = await fetch('http://localhost:5000/api/enquiries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }

    const result = await response.json();
    console.log('Success! Created enquiry:', result);
  } catch (error) {
    console.error('Test failed:', error);
  }
};

// Run the test
testEnquiryCreation();
