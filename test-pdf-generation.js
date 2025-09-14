// ESM Test script for PDF generation (uses global fetch in modern Node)

async function testPDFGeneration() {
  console.log('Testing PDF Generation for Tradix for Golden Tag...\n');

  try {
    // Test quotation PDF generation
    console.log('1. Testing Quotation PDF Generation...');
    const quotationResponse = await fetch('http://localhost:5000/api/quotations');
    const quotations = await quotationResponse.json();
    
    if (quotations && quotations.length > 0) {
      const firstQuotation = quotations[0];
      console.log(`   Found quotation: ${firstQuotation.quoteNumber}`);
      
      const pdfResponse = await fetch(`http://localhost:5000/api/quotations/${firstQuotation.id}/pdf`);
      if (pdfResponse.ok) {
        console.log('   ✅ Quotation PDF generation successful');
        console.log(`   Content-Type: ${pdfResponse.headers.get('content-type')}`);
        console.log(`   Content-Length: ${pdfResponse.headers.get('content-length')} bytes`);
      } else {
        console.log('   ❌ Quotation PDF generation failed');
        console.log(`   Status: ${pdfResponse.status} ${pdfResponse.statusText}`);
      }
    } else {
      console.log('   ⚠️  No quotations found to test');
    }

    console.log('\n2. Testing Invoice PDF Generation...');
    const invoiceResponse = await fetch('http://localhost:5000/api/invoices');
    const invoices = await invoiceResponse.json();
    
    if (invoices && invoices.length > 0) {
      const firstInvoice = invoices[0];
      console.log(`   Found invoice: ${firstInvoice.invoiceNumber}`);
      
      const pdfResponse = await fetch(`http://localhost:5000/api/invoices/${firstInvoice.id}/pdf`);
      if (pdfResponse.ok) {
        console.log('   ✅ Invoice PDF generation successful');
        console.log(`   Content-Type: ${pdfResponse.headers.get('content-type')}`);
        console.log(`   Content-Length: ${pdfResponse.headers.get('content-length')} bytes`);
      } else {
        console.log('   ❌ Invoice PDF generation failed');
        console.log(`   Status: ${pdfResponse.status} ${pdfResponse.statusText}`);
      }
    } else {
      console.log('   ⚠️  No invoices found to test');
    }

    console.log('\n✅ PDF Generation test completed!');
    console.log('\nTo test manually:');
    console.log('1. Start the server: npm run dev');
    console.log('2. Open browser and navigate to quotations or invoices');
    console.log('3. Click "Download PDF" button on any quotation or invoice');
    console.log('4. Check that PDF downloads with proper formatting');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\nMake sure the server is running on port 5000');
    console.log('Run: npm run dev');
  }
}

testPDFGeneration();
