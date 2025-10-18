/**
 * Migration Utility - LocalStorage to Supabase
 *
 * This script helps migrate existing localStorage data to Supabase database.
 * Run this ONCE after setting up your Supabase project and running the schema.sql
 *
 * IMPORTANT: Make sure to backup your localStorage data before running migration!
 */

import { supabase } from '@/lib/supabase';
import { roomsData } from '@/data/roomsData';

/**
 * Backup localStorage data
 */
export const backupLocalStorageData = () => {
  const backup = {
    users: localStorage.getItem('ofcoz_users'),
    bookings: localStorage.getItem('ofcoz_bookings'),
    timestamp: new Date().toISOString(),
  };

  // Save backup to file
  const dataStr = JSON.stringify(backup, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
  const exportFileDefaultName = `localStorage-backup-${Date.now()}.json`;

  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();

  console.log('✅ Backup created:', exportFileDefaultName);
  return backup;
};

/**
 * Migrate rooms data to Supabase
 */
export const migrateRooms = async () => {
  try {
    console.log('🔄 Starting room migration...');

    // Check if rooms already exist
    const { data: existingRooms, error: checkError } = await supabase
      .from('rooms')
      .select('id');

    if (checkError) throw checkError;

    if (existingRooms && existingRooms.length > 0) {
      console.log('⚠️  Rooms already exist in database. Skipping migration.');
      return { success: false, message: 'Rooms already exist' };
    }

    // Transform and insert rooms
    const roomsToInsert = roomsData.map(room => ({
      id: room.id,
      name: room.name,
      capacity: room.capacity,
      size: room.size,
      description: room.description,
      features: room.features,
      booking_options: room.bookingOptions,
      prices: room.prices,
      image_url: room.image,
      hidden: room.hidden,
    }));

    const { data, error } = await supabase
      .from('rooms')
      .insert(roomsToInsert)
      .select();

    if (error) throw error;

    console.log(`✅ Successfully migrated ${data.length} rooms`);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Room migration failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Migrate users from localStorage to Supabase
 * NOTE: This requires users to re-register with Supabase Auth
 */
export const exportUsersForMigration = () => {
  try {
    const usersJson = localStorage.getItem('ofcoz_users');
    if (!usersJson) {
      console.log('ℹ️  No users found in localStorage');
      return { success: false, message: 'No users found' };
    }

    const users = JSON.parse(usersJson);

    // Export user data (excluding passwords)
    const usersToExport = users.map(user => ({
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      tokens: user.tokens || 0,
      isAdmin: user.isAdmin || false,
      tokenValidUntil: user.tokenValidUntil,
      createdAt: user.createdAt,
    }));

    const dataStr = JSON.stringify(usersToExport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `users-export-${Date.now()}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    console.log(`✅ Exported ${users.length} users for migration`);
    console.log('ℹ️  Users will need to re-register with Supabase Auth');

    return { success: true, count: users.length };
  } catch (error) {
    console.error('❌ User export failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create admin user in Supabase
 * This should be run from the browser console after signing up
 */
export const promoteToAdmin = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ is_admin: true })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    console.log('✅ User promoted to admin:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Admin promotion failed:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Full migration process
 */
export const runFullMigration = async () => {
  console.log('🚀 Starting full migration process...');

  // Step 1: Backup
  console.log('\n📦 Step 1: Creating backup...');
  backupLocalStorageData();

  // Step 2: Migrate rooms
  console.log('\n🏠 Step 2: Migrating rooms...');
  const roomsResult = await migrateRooms();

  // Step 3: Export users
  console.log('\n👥 Step 3: Exporting users...');
  const usersResult = exportUsersForMigration();

  console.log('\n✅ Migration process completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Users need to re-register with their email/password');
  console.log('2. After registration, promote admin users using promoteToAdmin(userId)');
  console.log('3. Users can then start making bookings in the new system');

  return {
    success: true,
    rooms: roomsResult,
    users: usersResult,
  };
};

// Export functions for browser console usage
if (typeof window !== 'undefined') {
  window.supabaseMigration = {
    backup: backupLocalStorageData,
    migrateRooms,
    exportUsers: exportUsersForMigration,
    promoteToAdmin,
    runFull: runFullMigration,
  };

  console.log('Migration tools loaded! Available commands:');
  console.log('- window.supabaseMigration.backup()');
  console.log('- window.supabaseMigration.migrateRooms()');
  console.log('- window.supabaseMigration.exportUsers()');
  console.log('- window.supabaseMigration.promoteToAdmin(userId)');
  console.log('- window.supabaseMigration.runFull()');
}
