// Simple test for jsPDF import
import jsPDF from 'jspdf';

console.log('jsPDF type:', typeof jsPDF);
console.log('jsPDF properties:', Object.keys(jsPDF));
console.log('jsPDF.constructor:', typeof jsPDF.constructor);

try {
  const doc = new jsPDF();
  console.log('✅ jsPDF instance created successfully');
} catch (error) {
  console.log('❌ Error creating jsPDF:', error.message);
  
  // Try the alternative import
  try {
    const { jsPDF: jsPDFClass } = await import('jspdf');
    const doc = new jsPDFClass();
    console.log('✅ Alternative import works');
  } catch (altError) {
    console.log('❌ Alternative import failed:', altError.message);
  }
}