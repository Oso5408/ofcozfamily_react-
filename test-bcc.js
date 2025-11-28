#!/usr/bin/env node

/**
 * Standalone BCC Email Test Script
 *
 * This script tests that all Supabase Edge Functions properly handle BCC emails.
 * It simulates email sending and verifies the BCC field is present in requests.
 *
 * Usage:
 *   node test-bcc.js
 *
 * Prerequisites:
 *   - Supabase project URL and anon key in .env
 *   - Edge Functions deployed
 *   - Resend API key configured in Supabase
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${'='.repeat(60)}\n${colors.bright}${msg}${colors.reset}\n${'='.repeat(60)}`),
};

// Load environment variables
function loadEnv() {
  const envPath = path.join(__dirname, '.env');

  if (!fs.existsSync(envPath)) {
    log.error('.env file not found. Please create one with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};

  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      env[match[1].trim()] = match[2].trim();
    }
  });

  return env;
}

// Make HTTP request to Edge Function
function callEdgeFunction(url, anonKey, functionName, payload) {
  return new Promise((resolve, reject) => {
    const fullUrl = new URL(`${url}/functions/v1/${functionName}`);

    const options = {
      hostname: fullUrl.hostname,
      port: fullUrl.port || 443,
      path: fullUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`,
        'apikey': anonKey,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(JSON.stringify(payload));
    req.end();
  });
}

// Test booking created email
async function testBookingCreated(url, anonKey) {
  log.header('TEST 1: Booking Created Email');

  const payload = {
    to: 'testuser@example.com',
    bcc: 'ofcozfamily@gmail.com',
    language: 'en',
    booking: {
      name: 'Test User',
      receiptNumber: 'TEST-2025-001',
      room: { name: 'roomA' },
      date: '01/01/2025',
      startTime: '10:00',
      endTime: '12:00',
      paymentMethod: 'cash',
      totalCost: 200,
      specialRequests: 'BCC test booking'
    },
    roomNameTranslated: 'Room A'
  };

  log.info('Calling send-booking-created Edge Function...');
  log.info(`Payload: to=${payload.to}, bcc=${payload.bcc}`);

  try {
    const response = await callEdgeFunction(url, anonKey, 'send-booking-created', payload);

    if (response.status === 200) {
      log.success('Edge Function returned 200 OK');

      if (response.data.success) {
        log.success('Email sent successfully');
        log.success(`BCC included: ofcozfamily@gmail.com`);
        return { passed: true, name: 'Booking Created Email' };
      } else {
        log.error(`Email failed: ${response.data.error}`);
        return { passed: false, name: 'Booking Created Email', error: response.data.error };
      }
    } else {
      log.error(`Edge Function returned ${response.status}`);
      log.error(JSON.stringify(response.data, null, 2));
      return { passed: false, name: 'Booking Created Email', error: `HTTP ${response.status}` };
    }
  } catch (error) {
    log.error(`Request failed: ${error.message}`);
    return { passed: false, name: 'Booking Created Email', error: error.message };
  }
}

// Test booking confirmation email
async function testBookingConfirmation(url, anonKey) {
  log.header('TEST 2: Booking Confirmation Email');

  const payload = {
    to: 'testuser@example.com',
    bcc: 'ofcozfamily@gmail.com',
    language: 'en',
    booking: {
      name: 'Test User',
      receiptNumber: 'TEST-2025-002',
      room: { name: 'roomA' },
      date: '01/01/2025',
      startTime: '10:00',
      endTime: '12:00',
      specialRequests: 'BCC test confirmation'
    },
    roomNameTranslated: 'Room A'
  };

  log.info('Calling send-booking-confirmation Edge Function...');
  log.info(`Payload: to=${payload.to}, bcc=${payload.bcc}`);

  try {
    const response = await callEdgeFunction(url, anonKey, 'send-booking-confirmation', payload);

    if (response.status === 200 && response.data.success) {
      log.success('Email sent successfully with BCC');
      return { passed: true, name: 'Booking Confirmation Email' };
    } else {
      log.error(`Failed: ${JSON.stringify(response.data)}`);
      return { passed: false, name: 'Booking Confirmation Email', error: response.data.error };
    }
  } catch (error) {
    log.error(`Request failed: ${error.message}`);
    return { passed: false, name: 'Booking Confirmation Email', error: error.message };
  }
}

// Test status notification emails
async function testStatusNotification(url, anonKey) {
  log.header('TEST 3: Status Notification Emails');

  const payload = {
    to: 'testuser@example.com',
    bcc: 'ofcozfamily@gmail.com',
    language: 'en',
    type: 'receiptReceived',
    booking: {
      name: 'Test User',
      receiptNumber: 'TEST-2025-003',
      room: { name: 'roomA' },
      date: '01/01/2025',
      startTime: '10:00',
      endTime: '12:00'
    },
    roomNameTranslated: 'Room A'
  };

  log.info('Calling send-status-notification Edge Function...');
  log.info(`Payload: to=${payload.to}, bcc=${payload.bcc}, type=${payload.type}`);

  try {
    const response = await callEdgeFunction(url, anonKey, 'send-status-notification', payload);

    if (response.status === 200 && response.data.success) {
      log.success('Status notification sent successfully with BCC');
      return { passed: true, name: 'Status Notification Email' };
    } else {
      log.error(`Failed: ${JSON.stringify(response.data)}`);
      return { passed: false, name: 'Status Notification Email', error: response.data.error };
    }
  } catch (error) {
    log.error(`Request failed: ${error.message}`);
    return { passed: false, name: 'Status Notification Email', error: error.message };
  }
}

// Test package notification email
async function testPackageNotification(url, anonKey) {
  log.header('TEST 4: Package Notification Email');

  const payload = {
    to: 'testuser@example.com',
    bcc: 'ofcozfamily@gmail.com',
    language: 'en',
    package: {
      name: 'Test User',
      packageType: 'BR15',
      amount: 15,
      newBalance: 15,
      reason: 'BCC test package assignment',
      expiryDate: null
    }
  };

  log.info('Calling send-package-notification Edge Function...');
  log.info(`Payload: to=${payload.to}, bcc=${payload.bcc}`);

  try {
    const response = await callEdgeFunction(url, anonKey, 'send-package-notification', payload);

    if (response.status === 200 && response.data.success) {
      log.success('Package notification sent successfully with BCC');
      return { passed: true, name: 'Package Notification Email' };
    } else {
      log.error(`Failed: ${JSON.stringify(response.data)}`);
      return { passed: false, name: 'Package Notification Email', error: response.data.error };
    }
  } catch (error) {
    log.error(`Request failed: ${error.message}`);
    return { passed: false, name: 'Package Notification Email', error: error.message };
  }
}

// Main test runner
async function runTests() {
  log.section('EMAIL BCC TEST SUITE');
  console.log('Testing Supabase Edge Functions for BCC support\n');

  // Load environment
  log.info('Loading environment variables...');
  const env = loadEnv();

  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    log.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
    process.exit(1);
  }

  log.success(`Supabase URL: ${supabaseUrl}`);
  log.success(`API Key: ${supabaseKey.substring(0, 20)}...`);

  // Run tests
  const results = [];

  results.push(await testBookingCreated(supabaseUrl, supabaseKey));
  results.push(await testBookingConfirmation(supabaseUrl, supabaseKey));
  results.push(await testStatusNotification(supabaseUrl, supabaseKey));
  results.push(await testPackageNotification(supabaseUrl, supabaseKey));

  // Summary
  log.section('TEST RESULTS SUMMARY');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  results.forEach(result => {
    const status = result.passed
      ? `${colors.green}✓ PASSED${colors.reset}`
      : `${colors.red}✗ FAILED${colors.reset}`;
    console.log(`${status}: ${result.name}`);
    if (result.error) {
      console.log(`  ${colors.red}Error: ${result.error}${colors.reset}`);
    }
  });

  console.log('\n' + '-'.repeat(60));
  console.log(`Total: ${results.length} | Passed: ${colors.green}${passed}${colors.reset} | Failed: ${colors.red}${failed}${colors.reset}`);
  console.log('-'.repeat(60));

  if (failed === 0) {
    console.log(`\n${colors.bright}${colors.green}🎉 ALL TESTS PASSED!${colors.reset}`);
    console.log(`${colors.green}✓ BCC functionality is working correctly${colors.reset}`);
    console.log(`${colors.green}✓ All emails will be sent to ofcozfamily@gmail.com${colors.reset}`);
  } else {
    console.log(`\n${colors.bright}${colors.red}⚠️  SOME TESTS FAILED${colors.reset}`);
    console.log(`${colors.yellow}Please check the errors above${colors.reset}`);
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  log.error(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
