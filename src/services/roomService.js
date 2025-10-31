import { supabase, handleSupabaseError } from '@/lib/supabase';

/**
 * Room Service
 * Handles all room-related operations with Supabase
 */

export const roomService = {
  /**
   * Get all rooms
   */
  async getRooms(includeHidden = false) {
    try {
      let query = supabase
        .from('rooms')
        .select('*')
        .order('id', { ascending: true });

      if (!includeHidden) {
        query = query.eq('hidden', false);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { success: true, rooms: data };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Get room by ID
   */
  async getRoomById(roomId) {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (error) throw error;
      return { success: true, room: data };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Create room (admin only)
   */
  async createRoom(roomData) {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .insert({
          name: roomData.name,
          capacity: roomData.capacity,
          size: roomData.size,
          description: roomData.description,
          features: roomData.features,
          booking_options: roomData.bookingOptions,
          prices: roomData.prices,
          image_url: roomData.imageUrl,
          hidden: roomData.hidden || false,
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, room: data };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Update room (admin only)
   */
  async updateRoom(roomId, updates) {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .update(updates)
        .eq('id', roomId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, room: data };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Delete room (admin only)
   */
  async deleteRoom(roomId) {
    try {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', roomId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Subscribe to room changes
   */
  subscribeToRooms(callback) {
    return supabase
      .channel('rooms-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
        },
        callback
      )
      .subscribe();
  },

  /**
   * Toggle room visibility (admin only)
   */
  async toggleRoomVisibility(roomId, hidden) {
    try {
      console.log('🔧 toggleRoomVisibility called:', { roomId, hidden });

      const { data, error } = await supabase
        .from('rooms')
        .update({ hidden })
        .eq('id', roomId)
        .select()
        .single();

      console.log('📝 Supabase update result:', { data, error });

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }

      if (!data) {
        console.error('⚠️ No data returned - possible RLS issue');
        throw new Error('Update failed - no data returned. Check RLS policies.');
      }

      console.log('✅ Room updated successfully:', data);
      return { success: true, room: data };
    } catch (error) {
      console.error('❌ toggleRoomVisibility error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Upload room image to Supabase Storage (admin only)
   */
  async uploadRoomImage(file, roomId) {
    try {
      console.log('📤 Uploading room image:', { roomId, fileName: file.name, fileSize: file.size });

      // Validate file
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('File size exceeds 5MB limit');
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Only JPG, PNG, and WebP are allowed');
      }

      // Create unique filename: room-{roomId}-{timestamp}.{ext}
      const fileExt = file.name.split('.').pop();
      const fileName = `room-${roomId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('room-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('room-images')
        .getPublicUrl(filePath);

      console.log('✅ Image uploaded successfully:', publicUrl);
      return { success: true, imageUrl: publicUrl, filePath };
    } catch (error) {
      console.error('❌ uploadRoomImage error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Delete room image from Supabase Storage (admin only)
   */
  async deleteRoomImage(imageUrl) {
    try {
      if (!imageUrl || !imageUrl.includes('room-images')) {
        console.log('⚠️ Not a Supabase Storage URL, skipping deletion');
        return { success: true };
      }

      // Extract file path from URL
      const urlParts = imageUrl.split('/room-images/');
      if (urlParts.length < 2) {
        throw new Error('Invalid image URL format');
      }
      const filePath = urlParts[1];

      console.log('🗑️ Deleting room image:', filePath);

      const { error } = await supabase.storage
        .from('room-images')
        .remove([filePath]);

      if (error) throw error;

      console.log('✅ Image deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ deleteRoomImage error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Update room with new image (admin only)
   * Uploads new image and deletes old one
   */
  async updateRoomImage(roomId, file, oldImageUrl) {
    try {
      // Upload new image
      const uploadResult = await this.uploadRoomImage(file, roomId);
      if (!uploadResult.success) {
        return uploadResult;
      }

      // Update room record
      const updateResult = await this.updateRoom(roomId, {
        image_url: uploadResult.imageUrl,
      });

      if (!updateResult.success) {
        // Rollback: delete uploaded image
        await this.deleteRoomImage(uploadResult.imageUrl);
        return updateResult;
      }

      // Delete old image if exists
      if (oldImageUrl) {
        await this.deleteRoomImage(oldImageUrl);
      }

      return { success: true, room: updateResult.room, imageUrl: uploadResult.imageUrl };
    } catch (error) {
      console.error('❌ updateRoomImage error:', error);
      return { success: false, error: handleSupabaseError(error) };
    }
  },
};
