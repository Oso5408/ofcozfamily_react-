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
      const { data, error } = await supabase
        .from('rooms')
        .update({ hidden })
        .eq('id', roomId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, room: data };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  },
};
