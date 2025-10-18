import { supabase, handleSupabaseError } from '@/lib/supabase';

/**
 * Product Service
 * Handles all product and order-related operations with Supabase
 */

export const productService = {
  /**
   * Get all products
   */
  async getProducts(activeOnly = true) {
    try {
      let query = supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { success: true, products: data };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Get product by ID
   */
  async getProductById(productId) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) throw error;
      return { success: true, product: data };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Create product (admin only)
   */
  async createProduct(productData) {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single();

      if (error) throw error;
      return { success: true, product: data };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Update product (admin only)
   */
  async updateProduct(productId, updates) {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', productId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, product: data };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Delete product (admin only)
   */
  async deleteProduct(productId) {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Create order
   */
  async createOrder(orderData) {
    try {
      // Start a transaction-like operation
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: orderData.userId,
          total_amount: orderData.totalAmount,
          status: orderData.status || 'pending',
          payment_method: orderData.paymentMethod,
          payment_status: orderData.paymentStatus || 'pending',
          shipping_address: orderData.shippingAddress,
          notes: orderData.notes,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Insert order items
      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return { success: true, order };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Get user orders
   */
  async getUserOrders(userId) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (*)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, orders: data };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Get all orders (admin only)
   */
  async getAllOrders() {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          users (id, email, full_name),
          order_items (
            *,
            products (*)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, orders: data };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  },

  /**
   * Update order status
   */
  async updateOrderStatus(orderId, status, paymentStatus) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ status, payment_status: paymentStatus })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, order: data };
    } catch (error) {
      return { success: false, error: handleSupabaseError(error) };
    }
  },
};
