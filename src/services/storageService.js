import { supabase, handleSupabaseError } from '@/lib/supabase';

/**
 * Storage Service
 * Handles file uploads and management with Supabase Storage
 */

const BUCKET_NAME = 'booking-receipts';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

export const storageService = {
  /**
   * Validate file before upload
   */
  validateFile(file) {
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: 'File size exceeds 5MB limit' };
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return { valid: false, error: 'File type not allowed. Please upload JPG, PNG, or PDF' };
    }

    return { valid: true };
  },

  /**
   * Upload receipt for a booking
   */
  async uploadReceipt(bookingId, file) {
    try {
      console.log('📤 Starting upload for booking:', bookingId);
      console.log('📤 File:', file.name, 'Size:', file.size);

      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        console.log('❌ Validation failed:', validation.error);
        return { success: false, error: validation.error };
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `${bookingId}/${timestamp}.${fileExt}`;
      console.log('📤 Generated filename:', fileName);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('❌ Supabase upload error:', error);
        throw error;
      }

      console.log('✅ Upload successful, data.path:', data.path);

      // Store the path (not the signed URL, as it will expire)
      // We'll generate signed URLs on-demand when viewing
      return {
        success: true,
        path: data.path,
        url: data.path // Store path only
      };
    } catch (error) {
      console.error('❌ Upload receipt error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Get receipt URL from path (creates signed URL)
   */
  async getReceiptUrl(path) {
    console.log('🔧 storageService.getReceiptUrl called with path:', path);

    if (!path) {
      console.log('❌ No path provided');
      return null;
    }

    try {
      let filePath = path;

      // If it's a full URL (old data), extract the file path
      if (path.startsWith('http')) {
        console.log('⚠️ Path is a full URL, extracting file path from it');

        // Extract path from URL like:
        // https://xxx.supabase.co/storage/v1/object/public/booking-receipts/7557cc08.../1759852770877.jpg
        // We want: 7557cc08.../1759852770877.jpg
        const urlParts = path.split(`/${BUCKET_NAME}/`);
        if (urlParts.length > 1) {
          filePath = urlParts[1];
          console.log('✅ Extracted file path:', filePath);
        } else {
          console.error('❌ Could not extract file path from URL');
          return null;
        }
      }

      // Create a signed URL
      console.log('🔄 Creating signed URL from path:', filePath);
      console.log('🪣 Using bucket:', BUCKET_NAME);

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(filePath, 31536000); // 1 year

      if (error) {
        console.error('❌ Supabase error creating signed URL:', error);
        throw error;
      }

      console.log('✅ Signed URL created successfully:', data.signedUrl);
      return data.signedUrl;
    } catch (error) {
      console.error('❌ Error getting receipt URL:', error);
      return null;
    }
  },

  /**
   * Delete receipt file
   */
  async deleteReceipt(path) {
    try {
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([path]);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Delete receipt error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Download receipt file
   */
  async downloadReceipt(path) {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .download(path);

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Download receipt error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * List receipts for a booking
   */
  async listBookingReceipts(bookingId) {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list(bookingId, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) throw error;
      return { success: true, files: data };
    } catch (error) {
      console.error('List receipts error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  }
};
