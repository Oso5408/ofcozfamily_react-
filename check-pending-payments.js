import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rlfrwsyqletwegvflqip.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZnJ3c3lxbGV0d2VndmZscWlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0ODQ3NzAsImV4cCI6MjA3NTA2MDc3MH0.inDvJO8WSfvIE8dkNyefTUtOG4k0r0pN1sG5G6gQMBk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPendingPayments() {
  // Check for pending_payment status
  const { data: pendingPaymentBookings, error: error1 } = await supabase
    .from('bookings')
    .select('id, status, payment_status, created_at, rooms(name), users(full_name, email)')
    .eq('status', 'pending_payment');

  console.log('\n📊 Bookings with status = "pending_payment":');
  console.log(`Count: ${pendingPaymentBookings?.length || 0}`);
  if (pendingPaymentBookings?.length) {
    console.log(JSON.stringify(pendingPaymentBookings, null, 2));
  }

  // Check for payment_status = pending
  const { data: pendingPaymentStatus, error: error2 } = await supabase
    .from('bookings')
    .select('id, status, payment_status, created_at, rooms(name), users(full_name, email)')
    .eq('payment_status', 'pending');

  console.log('\n📊 Bookings with payment_status = "pending":');
  console.log(`Count: ${pendingPaymentStatus?.length || 0}`);
  if (pendingPaymentStatus?.length) {
    console.log(JSON.stringify(pendingPaymentStatus, null, 2));
  }

  // Check all bookings grouped by status
  const { data: allBookings, error: error3 } = await supabase
    .from('bookings')
    .select('status, payment_status');

  console.log('\n📊 All bookings summary:');
  const statusCounts = {};
  const paymentStatusCounts = {};

  allBookings?.forEach(booking => {
    statusCounts[booking.status] = (statusCounts[booking.status] || 0) + 1;
    paymentStatusCounts[booking.payment_status] = (paymentStatusCounts[booking.payment_status] || 0) + 1;
  });

  console.log('\nBooking Status Breakdown:');
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`);
  });

  console.log('\nPayment Status Breakdown:');
  Object.entries(paymentStatusCounts).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}`);
  });

  console.log(`\nTotal bookings: ${allBookings?.length || 0}`);
}

checkPendingPayments().catch(console.error);
