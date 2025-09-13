// Test script to verify workflow button functionality
// Run this in the browser console on the dashboard page

console.log('🔧 Starting Workflow Button Functionality Test');

// Test 1: Check if WorkflowStepper component is rendered
function testWorkflowStepperRendering() {
    console.log('\n📋 Test 1: WorkflowStepper Component Rendering');
    
    const workflowStepper = document.querySelector('[data-testid="text-current-step"]');
    if (workflowStepper) {
        console.log('✅ WorkflowStepper component found');
        console.log('Current step text:', workflowStepper.textContent);
    } else {
        console.log('❌ WorkflowStepper component not found');
    }
    
    const markCompleteBtn = document.querySelector('[data-testid="button-mark-complete"]');
    const viewDetailsBtn = document.querySelector('[data-testid="button-view-details"]');
    
    if (markCompleteBtn) {
        console.log('✅ Mark Complete button found');
        console.log('Button text:', markCompleteBtn.textContent);
        console.log('Button visible:', markCompleteBtn.offsetParent !== null);
    } else {
        console.log('❌ Mark Complete button not found');
    }
    
    if (viewDetailsBtn) {
        console.log('✅ View Details button found');
        console.log('Button text:', viewDetailsBtn.textContent);
        console.log('Button visible:', viewDetailsBtn.offsetParent !== null);
    } else {
        console.log('❌ View Details button not found');
    }
}

// Test 2: Check button click handlers
function testButtonClickHandlers() {
    console.log('\n🖱️ Test 2: Button Click Handlers');
    
    const markCompleteBtn = document.querySelector('[data-testid="button-mark-complete"]');
    const viewDetailsBtn = document.querySelector('[data-testid="button-view-details"]');
    
    if (markCompleteBtn) {
        console.log('Testing Mark Complete button...');
        markCompleteBtn.click();
        console.log('Mark Complete button clicked');
    }
    
    if (viewDetailsBtn) {
        console.log('Testing View Details button...');
        viewDetailsBtn.click();
        console.log('View Details button clicked');
    }
}

// Test 3: Check API data loading
function testAPIDataLoading() {
    console.log('\n🌐 Test 3: API Data Loading');
    
    // Check if React Query is available
    if (window.__REACT_QUERY_DEVTOOLS_GLOBAL_HOOK__) {
        console.log('✅ React Query DevTools available');
    }
    
    // Check for quotations data in the page
    const quotationElements = document.querySelectorAll('[data-testid*="quotation"]');
    console.log('Quotation elements found:', quotationElements.length);
    
    // Check for any error messages
    const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"]');
    if (errorElements.length > 0) {
        console.log('⚠️ Error elements found:', errorElements.length);
        errorElements.forEach((el, index) => {
            console.log(`Error ${index + 1}:`, el.textContent);
        });
    }
}

// Test 4: Check navigation functionality
function testNavigationFunctionality() {
    console.log('\n🧭 Test 4: Navigation Functionality');
    
    // Check if wouter is available
    if (window.location) {
        console.log('Current URL:', window.location.href);
        console.log('Current pathname:', window.location.pathname);
    }
    
    // Check for navigation elements
    const navElements = document.querySelectorAll('a[href*="/quotations"]');
    console.log('Navigation elements to quotations found:', navElements.length);
    
    // Check if the buttons are actually clickable
    const markCompleteBtn = document.querySelector('[data-testid="button-mark-complete"]');
    const viewDetailsBtn = document.querySelector('[data-testid="button-view-details"]');
    
    if (markCompleteBtn) {
        const rect = markCompleteBtn.getBoundingClientRect();
        console.log('Mark Complete button position:', {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            visible: rect.width > 0 && rect.height > 0
        });
    }
    
    if (viewDetailsBtn) {
        const rect = viewDetailsBtn.getBoundingClientRect();
        console.log('View Details button position:', {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            visible: rect.width > 0 && rect.height > 0
        });
    }
}

// Test 5: Check for JavaScript errors
function testJavaScriptErrors() {
    console.log('\n🚨 Test 5: JavaScript Errors');
    
    // Override console.error to catch errors
    const originalError = console.error;
    const errors = [];
    
    console.error = function(...args) {
        errors.push(args.join(' '));
        originalError.apply(console, args);
    };
    
    // Restore after a short delay
    setTimeout(() => {
        console.error = originalError;
        if (errors.length > 0) {
            console.log('JavaScript errors detected:', errors.length);
            errors.forEach((error, index) => {
                console.log(`Error ${index + 1}:`, error);
            });
        } else {
            console.log('✅ No JavaScript errors detected');
        }
    }, 1000);
}

// Test 6: Check CSS and styling
function testCSSAndStyling() {
    console.log('\n🎨 Test 6: CSS and Styling');
    
    const markCompleteBtn = document.querySelector('[data-testid="button-mark-complete"]');
    const viewDetailsBtn = document.querySelector('[data-testid="button-view-details"]');
    
    if (markCompleteBtn) {
        const styles = window.getComputedStyle(markCompleteBtn);
        console.log('Mark Complete button styles:', {
            display: styles.display,
            visibility: styles.visibility,
            opacity: styles.opacity,
            pointerEvents: styles.pointerEvents,
            backgroundColor: styles.backgroundColor,
            color: styles.color
        });
    }
    
    if (viewDetailsBtn) {
        const styles = window.getComputedStyle(viewDetailsBtn);
        console.log('View Details button styles:', {
            display: styles.display,
            visibility: styles.visibility,
            opacity: styles.opacity,
            pointerEvents: styles.pointerEvents,
            backgroundColor: styles.backgroundColor,
            color: styles.color
        });
    }
}

// Run all tests
function runAllTests() {
    console.log('🚀 Running comprehensive workflow button tests...\n');
    
    testWorkflowStepperRendering();
    testAPIDataLoading();
    testNavigationFunctionality();
    testCSSAndStyling();
    testJavaScriptErrors();
    
    // Wait a bit then test click handlers
    setTimeout(() => {
        testButtonClickHandlers();
        console.log('\n✅ All tests completed!');
        console.log('Check the console output above for any issues.');
    }, 2000);
}

// Auto-run tests
runAllTests();

// Also provide manual test functions
window.testWorkflowButtons = {
    runAllTests,
    testWorkflowStepperRendering,
    testButtonClickHandlers,
    testAPIDataLoading,
    testNavigationFunctionality,
    testCSSAndStyling,
    testJavaScriptErrors
};

console.log('\n📝 Manual test functions available:');
console.log('- testWorkflowButtons.runAllTests()');
console.log('- testWorkflowButtons.testButtonClickHandlers()');
console.log('- testWorkflowButtons.testCSSAndStyling()');
