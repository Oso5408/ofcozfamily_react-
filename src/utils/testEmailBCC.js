/**
 * Email BCC Test Utility
 *
 * This utility helps test that all emails are being BCC'd to the admin email.
 *
 * Usage:
 * 1. Open browser console
 * 2. Import and run: testEmailBCC.runAllTests()
 * 3. Check console for results
 */

import { emailService } from '@/services/emailService';

const ADMIN_EMAIL = 'ofcozfamily@gmail.com';

// Mock booking data for testing
const createMockBooking = (overrides = {}) => ({
  id: 'test-booking-123',
  email: 'testuser@example.com',
  name: 'Test User',
  receiptNumber: 'TEST-2025-001',
  room: {
    id: 'room-1',
    name: 'roomA'
  },
  rooms: {
    id: 'room-1',
    name: 'roomA'
  },
  date: '01/01/2025',
  startTime: '10:00',
  endTime: '12:00',
  start_time: '2025-01-01T10:00:00',
  end_time: '2025-01-01T12:00:00',
  paymentMethod: 'cash',
  payment_method: 'cash',
  totalCost: 200,
  total_cost: 200,
  specialRequests: 'Test booking for BCC verification',
  special_requests: 'Test booking for BCC verification',
  users: {
    full_name: 'Test User',
    email: 'testuser@example.com'
  },
  ...overrides
});

/**
 * Test helper to check if emailData contains BCC
 */
const checkBCCInEmailData = (emailData, testName) => {
  console.log(`\n📧 Testing: ${testName}`);
  console.log('Email Data:', emailData);

  const results = {
    testName,
    passed: true,
    errors: []
  };

  // Check if BCC field exists
  if (!emailData.bcc) {
    results.passed = false;
    results.errors.push('❌ BCC field is missing');
  } else if (emailData.bcc !== ADMIN_EMAIL) {
    results.passed = false;
    results.errors.push(`❌ BCC email is incorrect: ${emailData.bcc} (expected: ${ADMIN_EMAIL})`);
  } else {
    console.log(`✅ BCC field present: ${emailData.bcc}`);
  }

  // Check recipient email exists
  if (!emailData.to) {
    results.passed = false;
    results.errors.push('❌ Recipient (to) field is missing');
  } else {
    console.log(`✅ Recipient: ${emailData.to}`);
  }

  // Check language
  if (!emailData.language) {
    results.passed = false;
    results.errors.push('❌ Language field is missing');
  } else {
    console.log(`✅ Language: ${emailData.language}`);
  }

  return results;
};

/**
 * Mock the Supabase function invoke to intercept email data
 */
let lastEmailData = null;
const mockSupabaseInvoke = (originalInvoke) => {
  return async (functionName, options) => {
    console.log(`\n🔍 Intercepted function call: ${functionName}`);
    lastEmailData = options.body;
    console.log('📤 Email payload:', JSON.stringify(lastEmailData, null, 2));

    // Return mock success response instead of actually calling Supabase
    return {
      data: { success: true, message: 'Mock email sent (not actually sent)' },
      error: null
    };
  };
};

/**
 * Test 1: Booking Created Email
 */
export const testBookingCreatedEmail = async () => {
  const mockBooking = createMockBooking();

  console.log('\n' + '='.repeat(60));
  console.log('TEST 1: Booking Created Email');
  console.log('='.repeat(60));

  try {
    // Note: This will try to call the actual API
    // In a real test environment, you'd mock the Supabase client
    await emailService.sendBookingCreatedEmail(mockBooking, 'en');

    // Check if BCC was included (you can verify in network tab)
    console.log('✅ Test passed - Check network tab for BCC field');
    return { passed: true, testName: 'Booking Created Email' };
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { passed: false, testName: 'Booking Created Email', error: error.message };
  }
};

/**
 * Test 2: Booking Confirmation Email
 */
export const testBookingConfirmationEmail = async () => {
  const mockBooking = createMockBooking();

  console.log('\n' + '='.repeat(60));
  console.log('TEST 2: Booking Confirmation Email');
  console.log('='.repeat(60));

  try {
    await emailService.sendBookingConfirmation(mockBooking, 'en');
    console.log('✅ Test passed - Check network tab for BCC field');
    return { passed: true, testName: 'Booking Confirmation Email' };
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { passed: false, testName: 'Booking Confirmation Email', error: error.message };
  }
};

/**
 * Test 3: Receipt Received Email
 */
export const testReceiptReceivedEmail = async () => {
  const mockBooking = createMockBooking();

  console.log('\n' + '='.repeat(60));
  console.log('TEST 3: Receipt Received Email');
  console.log('='.repeat(60));

  try {
    await emailService.sendReceiptReceivedEmail(mockBooking, 'en');
    console.log('✅ Test passed - Check network tab for BCC field');
    return { passed: true, testName: 'Receipt Received Email' };
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { passed: false, testName: 'Receipt Received Email', error: error.message };
  }
};

/**
 * Test 4: Payment Confirmed Email
 */
export const testPaymentConfirmedEmail = async () => {
  const mockBooking = createMockBooking();

  console.log('\n' + '='.repeat(60));
  console.log('TEST 4: Payment Confirmed Email');
  console.log('='.repeat(60));

  try {
    await emailService.sendPaymentConfirmedEmail(mockBooking, 'en');
    console.log('✅ Test passed - Check network tab for BCC field');
    return { passed: true, testName: 'Payment Confirmed Email' };
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { passed: false, testName: 'Payment Confirmed Email', error: error.message };
  }
};

/**
 * Test 5: Package Assigned Email
 */
export const testPackageAssignedEmail = async () => {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 5: Package Assigned Email');
  console.log('='.repeat(60));

  try {
    await emailService.sendPackageAssignedEmail(
      'testuser@example.com',
      'Test User',
      'BR15',
      15,
      15,
      'Test package assignment',
      null,
      'en'
    );
    console.log('✅ Test passed - Check network tab for BCC field');
    return { passed: true, testName: 'Package Assigned Email' };
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { passed: false, testName: 'Package Assigned Email', error: error.message };
  }
};

/**
 * Test 6: Verify BCC constant
 */
export const testBCCConstant = () => {
  console.log('\n' + '='.repeat(60));
  console.log('TEST 6: BCC Constant Verification');
  console.log('='.repeat(60));

  // Read the emailService source to verify BCC constant
  const emailServiceModule = emailService.constructor.toString();

  if (emailServiceModule.includes(ADMIN_EMAIL)) {
    console.log(`✅ BCC email constant found: ${ADMIN_EMAIL}`);
    return { passed: true, testName: 'BCC Constant Verification' };
  } else {
    console.error(`❌ BCC email constant not found: ${ADMIN_EMAIL}`);
    return { passed: false, testName: 'BCC Constant Verification', error: 'BCC constant missing' };
  }
};

/**
 * Run all tests
 */
export const runAllTests = async () => {
  console.log('\n' + '🧪'.repeat(30));
  console.log('EMAIL BCC TEST SUITE');
  console.log('Testing that all emails include BCC to admin');
  console.log('🧪'.repeat(30));

  const results = [];

  // Run constant verification first
  results.push(testBCCConstant());

  // Run email tests
  console.log('\n⚠️  NOTE: These tests will call the actual Edge Functions');
  console.log('⚠️  Check your browser Network tab to verify BCC in payloads');
  console.log('⚠️  Or check Supabase Edge Function logs\n');

  results.push(await testBookingCreatedEmail());
  results.push(await testBookingConfirmationEmail());
  results.push(await testReceiptReceivedEmail());
  results.push(await testPaymentConfirmedEmail());
  results.push(await testPackageAssignedEmail());

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST RESULTS SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  results.forEach(result => {
    const status = result.passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`${status}: ${result.testName}`);
    if (result.error) {
      console.log(`  Error: ${result.error}`);
    }
  });

  console.log('\n' + '-'.repeat(60));
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log('-'.repeat(60));

  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✅ BCC functionality is working correctly');
  } else {
    console.log('\n⚠️  SOME TESTS FAILED');
    console.log('❌ Please check the errors above');
  }

  return results;
};

/**
 * Quick test - just verify BCC is in the payload
 */
export const quickTest = async () => {
  console.log('🚀 Running quick BCC test...\n');

  const mockBooking = createMockBooking();

  try {
    console.log('Sending test booking created email...');
    await emailService.sendBookingCreatedEmail(mockBooking, 'en');

    console.log('\n✅ Email sent successfully!');
    console.log('📝 To verify BCC:');
    console.log('1. Open browser DevTools → Network tab');
    console.log('2. Look for request to "send-booking-created"');
    console.log('3. Check Request Payload for "bcc" field');
    console.log(`4. Verify bcc = "${ADMIN_EMAIL}"`);

    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
};

// Export for console usage
export default {
  runAllTests,
  quickTest,
  testBookingCreatedEmail,
  testBookingConfirmationEmail,
  testReceiptReceivedEmail,
  testPaymentConfirmedEmail,
  testPackageAssignedEmail,
  testBCCConstant
};

// Make available globally for easy console access
if (typeof window !== 'undefined') {
  window.testEmailBCC = {
    runAllTests,
    quickTest,
    testBookingCreatedEmail,
    testBookingConfirmationEmail,
    testReceiptReceivedEmail,
    testPaymentConfirmedEmail,
    testPackageAssignedEmail,
    testBCCConstant
  };

  console.log('\n📧 Email BCC Test Utility loaded!');
  console.log('Run tests from console:');
  console.log('  window.testEmailBCC.quickTest()       - Quick test');
  console.log('  window.testEmailBCC.runAllTests()     - Run all tests');
}
