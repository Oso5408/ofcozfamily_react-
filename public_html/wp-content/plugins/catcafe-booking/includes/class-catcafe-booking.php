<?php
/**
 * Cat Cafe Booking System Class
 */

if (!defined('ABSPATH')) {
    exit;
}

class CatCafe_Booking {
    
    public function __construct() {
        add_action('wp_ajax_catcafe_create_booking', array($this, 'create_booking'));
        add_action('wp_ajax_catcafe_get_bookings', array($this, 'get_user_bookings'));
        add_action('wp_ajax_catcafe_cancel_booking', array($this, 'cancel_booking'));
        add_action('wp_ajax_catcafe_get_room_availability', array($this, 'check_room_availability'));
        add_action('wp_ajax_nopriv_catcafe_get_rooms', array($this, 'get_rooms'));
        add_action('wp_ajax_catcafe_get_rooms', array($this, 'get_rooms'));
    }
    
    /**
     * Create a new booking
     */
    public function create_booking() {
        check_ajax_referer('catcafe_nonce', 'nonce');
        
        if (!is_user_logged_in()) {
            wp_send_json_error(array('message' => __('Please login to make a booking', 'catcafe-booking')));
        }
        
        $user_id = get_current_user_id();
        $room_id = intval($_POST['room_id']);
        $check_in = sanitize_text_field($_POST['check_in']);
        $check_out = sanitize_text_field($_POST['check_out']);
        $guests = intval($_POST['guests']);
        $payment_method = sanitize_text_field($_POST['payment_method']);
        $special_requests = sanitize_textarea_field($_POST['special_requests']);
        
        // Validate input
        if (!$room_id || !$check_in || !$check_out) {
            wp_send_json_error(array('message' => __('Missing required booking information', 'catcafe-booking')));
        }
        
        // Check room availability
        if (!$this->is_room_available($room_id, $check_in, $check_out)) {
            wp_send_json_error(array('message' => __('Room is not available for selected dates', 'catcafe-booking')));
        }
        
        // Get room details
        $room = $this->get_room_by_id($room_id);
        if (!$room) {
            wp_send_json_error(array('message' => __('Room not found', 'catcafe-booking')));
        }
        
        // Calculate total cost
        $total_cost = $this->calculate_booking_cost($room, $check_in, $check_out, $payment_method);
        
        // Check if user has enough tokens (if paying with tokens)
        if ($payment_method === 'token') {
            $user_tokens = $this->get_user_tokens($user_id);
            if ($user_tokens < $total_cost) {
                wp_send_json_error(array('message' => __('Insufficient tokens', 'catcafe-booking')));
            }
        }
        
        global $wpdb;
        $table_bookings = $wpdb->prefix . 'catcafe_bookings';
        
        // Create booking
        $booking_data = array(
            'user_id' => $user_id,
            'room_id' => $room_id,
            'check_in' => $check_in,
            'check_out' => $check_out,
            'guests' => $guests,
            'payment_method' => $payment_method,
            'total_cost' => $total_cost,
            'status' => 'confirmed',
            'special_requests' => $special_requests
        );
        
        $result = $wpdb->insert($table_bookings, $booking_data);
        
        if ($result === false) {
            wp_send_json_error(array('message' => __('Failed to create booking', 'catcafe-booking')));
        }
        
        $booking_id = $wpdb->insert_id;
        
        // Deduct tokens if payment method is token
        if ($payment_method === 'token') {
            $this->deduct_user_tokens($user_id, $total_cost, "Booking #$booking_id");
        }
        
        // Send confirmation email
        $this->send_booking_confirmation_email($booking_id);
        
        wp_send_json_success(array(
            'message' => __('Booking created successfully', 'catcafe-booking'),
            'booking_id' => $booking_id,
            'total_cost' => $total_cost
        ));
    }
    
    /**
     * Get user bookings
     */
    public function get_user_bookings() {
        check_ajax_referer('catcafe_nonce', 'nonce');
        
        if (!is_user_logged_in()) {
            wp_send_json_error(array('message' => __('Please login to view bookings', 'catcafe-booking')));
        }
        
        $user_id = get_current_user_id();
        
        global $wpdb;
        $table_bookings = $wpdb->prefix . 'catcafe_bookings';
        $table_rooms = $wpdb->prefix . 'catcafe_rooms';
        
        $bookings = $wpdb->get_results($wpdb->prepare("
            SELECT b.*, r.name as room_name, r.capacity, r.size
            FROM $table_bookings b
            LEFT JOIN $table_rooms r ON b.room_id = r.id
            WHERE b.user_id = %d
            ORDER BY b.created_at DESC
        ", $user_id), ARRAY_A);
        
        wp_send_json_success($bookings);
    }
    
    /**
     * Cancel booking
     */
    public function cancel_booking() {
        check_ajax_referer('catcafe_nonce', 'nonce');
        
        if (!is_user_logged_in()) {
            wp_send_json_error(array('message' => __('Please login to cancel booking', 'catcafe-booking')));
        }
        
        $booking_id = intval($_POST['booking_id']);
        $user_id = get_current_user_id();
        
        global $wpdb;
        $table_bookings = $wpdb->prefix . 'catcafe_bookings';
        
        // Get booking details
        $booking = $wpdb->get_row($wpdb->prepare("
            SELECT * FROM $table_bookings WHERE id = %d AND user_id = %d
        ", $booking_id, $user_id), ARRAY_A);
        
        if (!$booking) {
            wp_send_json_error(array('message' => __('Booking not found', 'catcafe-booking')));
        }
        
        if ($booking['status'] === 'cancelled') {
            wp_send_json_error(array('message' => __('Booking already cancelled', 'catcafe-booking')));
        }
        
        // Update booking status
        $result = $wpdb->update(
            $table_bookings,
            array('status' => 'cancelled'),
            array('id' => $booking_id)
        );
        
        if ($result === false) {
            wp_send_json_error(array('message' => __('Failed to cancel booking', 'catcafe-booking')));
        }
        
        // Refund tokens if paid with tokens
        if ($booking['payment_method'] === 'token') {
            $this->refund_user_tokens($user_id, $booking['total_cost'], "Refund for cancelled booking #$booking_id");
        }
        
        // Send cancellation email
        $this->send_booking_cancellation_email($booking_id);
        
        wp_send_json_success(array('message' => __('Booking cancelled successfully', 'catcafe-booking')));
    }
    
    /**
     * Check room availability
     */
    public function check_room_availability() {
        check_ajax_referer('catcafe_nonce', 'nonce');
        
        $room_id = intval($_POST['room_id']);
        $check_in = sanitize_text_field($_POST['check_in']);
        $check_out = sanitize_text_field($_POST['check_out']);
        
        $available = $this->is_room_available($room_id, $check_in, $check_out);
        
        wp_send_json_success(array('available' => $available));
    }
    
    /**
     * Get all rooms
     */
    public function get_rooms() {
        global $wpdb;
        $table_rooms = $wpdb->prefix . 'catcafe_rooms';
        
        $rooms = $wpdb->get_results("
            SELECT * FROM $table_rooms 
            WHERE is_hidden = 0 
            ORDER BY name ASC
        ", ARRAY_A);
        
        // Process room data
        foreach ($rooms as &$room) {
            $room['features'] = explode(', ', $room['features']);
            $room['booking_options'] = explode(',', $room['booking_options']);
            $room['prices'] = array(
                'token' => $room['price_token'],
                'cash' => array(
                    'hourly' => $room['price_hourly'],
                    'daily' => $room['price_daily'],
                    'monthly' => $room['price_monthly']
                )
            );
        }
        
        wp_send_json_success($rooms);
    }
    
    /**
     * Check if room is available for given dates
     */
    private function is_room_available($room_id, $check_in, $check_out) {
        global $wpdb;
        $table_bookings = $wpdb->prefix . 'catcafe_bookings';
        
        $conflicts = $wpdb->get_var($wpdb->prepare("
            SELECT COUNT(*) FROM $table_bookings 
            WHERE room_id = %d 
            AND status IN ('confirmed', 'pending')
            AND (
                (check_in <= %s AND check_out > %s) OR
                (check_in < %s AND check_out >= %s) OR
                (check_in >= %s AND check_out <= %s)
            )
        ", $room_id, $check_in, $check_in, $check_out, $check_out, $check_in, $check_out));
        
        return $conflicts == 0;
    }
    
    /**
     * Get room by ID
     */
    private function get_room_by_id($room_id) {
        global $wpdb;
        $table_rooms = $wpdb->prefix . 'catcafe_rooms';
        
        return $wpdb->get_row($wpdb->prepare("
            SELECT * FROM $table_rooms WHERE id = %d
        ", $room_id), ARRAY_A);
    }
    
    /**
     * Calculate booking cost
     */
    private function calculate_booking_cost($room, $check_in, $check_out, $payment_method) {
        $check_in_time = new DateTime($check_in);
        $check_out_time = new DateTime($check_out);
        $interval = $check_in_time->diff($check_out_time);
        
        if ($payment_method === 'token') {
            return $room['price_token'];
        }
        
        $hours = ($interval->days * 24) + $interval->h + ($interval->i / 60);
        
        // If more than 24 hours, use daily rate
        if ($hours >= 24) {
            $days = ceil($hours / 24);
            return $days * $room['price_daily'];
        }
        
        // Use hourly rate
        return ceil($hours) * $room['price_hourly'];
    }
    
    /**
     * Get user tokens
     */
    private function get_user_tokens($user_id) {
        global $wpdb;
        $table_users = $wpdb->prefix . 'catcafe_users';
        
        return $wpdb->get_var($wpdb->prepare("
            SELECT tokens FROM $table_users WHERE user_id = %d
        ", $user_id));
    }
    
    /**
     * Deduct user tokens
     */
    private function deduct_user_tokens($user_id, $amount, $description = '') {
        global $wpdb;
        $table_users = $wpdb->prefix . 'catcafe_users';
        $table_history = $wpdb->prefix . 'catcafe_token_history';
        
        $current_tokens = $this->get_user_tokens($user_id);
        $new_balance = $current_tokens - $amount;
        
        $wpdb->update(
            $table_users,
            array('tokens' => $new_balance),
            array('user_id' => $user_id)
        );
        
        $wpdb->insert(
            $table_history,
            array(
                'user_id' => $user_id,
                'change_amount' => -$amount,
                'new_balance' => $new_balance,
                'transaction_type' => 'usage',
                'description' => $description
            )
        );
    }
    
    /**
     * Refund user tokens
     */
    private function refund_user_tokens($user_id, $amount, $description = '') {
        global $wpdb;
        $table_users = $wpdb->prefix . 'catcafe_users';
        $table_history = $wpdb->prefix . 'catcafe_token_history';
        
        $current_tokens = $this->get_user_tokens($user_id);
        $new_balance = $current_tokens + $amount;
        
        $wpdb->update(
            $table_users,
            array('tokens' => $new_balance),
            array('user_id' => $user_id)
        );
        
        $wpdb->insert(
            $table_history,
            array(
                'user_id' => $user_id,
                'change_amount' => $amount,
                'new_balance' => $new_balance,
                'transaction_type' => 'refund',
                'description' => $description
            )
        );
    }
    
    /**
     * Send booking confirmation email
     */
    private function send_booking_confirmation_email($booking_id) {
        global $wpdb;
        $table_bookings = $wpdb->prefix . 'catcafe_bookings';
        $table_rooms = $wpdb->prefix . 'catcafe_rooms';
        
        $booking = $wpdb->get_row($wpdb->prepare("
            SELECT b.*, r.name as room_name, u.user_email, u.display_name
            FROM $table_bookings b
            LEFT JOIN $table_rooms r ON b.room_id = r.id
            LEFT JOIN {$wpdb->prefix}users u ON b.user_id = u.ID
            WHERE b.id = %d
        ", $booking_id), ARRAY_A);
        
        if (!$booking) return;
        
        $subject = sprintf(__('Booking Confirmation #%d - Ofcoz Family', 'catcafe-booking'), $booking_id);
        
        $message = sprintf(
            __("Hello %s,\n\nYour booking has been confirmed!\n\nBooking Details:\n- Room: %s\n- Check-in: %s\n- Check-out: %s\n- Guests: %d\n- Total Cost: %s\n- Payment Method: %s\n\nThank you for choosing Ofcoz Family!\n\nBest regards,\nThe Ofcoz Family Team", 'catcafe-booking'),
            $booking['display_name'],
            $booking['room_name'],
            $booking['check_in'],
            $booking['check_out'],
            $booking['guests'],
            $booking['payment_method'] === 'token' ? $booking['total_cost'] . ' tokens' : 'HKD ' . $booking['total_cost'],
            $booking['payment_method']
        );
        
        wp_mail($booking['user_email'], $subject, $message);
    }
    
    /**
     * Send booking cancellation email
     */
    private function send_booking_cancellation_email($booking_id) {
        global $wpdb;
        $table_bookings = $wpdb->prefix . 'catcafe_bookings';
        $table_rooms = $wpdb->prefix . 'catcafe_rooms';
        
        $booking = $wpdb->get_row($wpdb->prepare("
            SELECT b.*, r.name as room_name, u.user_email, u.display_name
            FROM $table_bookings b
            LEFT JOIN $table_rooms r ON b.room_id = r.id
            LEFT JOIN {$wpdb->prefix}users u ON b.user_id = u.ID
            WHERE b.id = %d
        ", $booking_id), ARRAY_A);
        
        if (!$booking) return;
        
        $subject = sprintf(__('Booking Cancellation #%d - Ofcoz Family', 'catcafe-booking'), $booking_id);
        
        $message = sprintf(
            __("Hello %s,\n\nYour booking #%d has been cancelled.\n\nBooking Details:\n- Room: %s\n- Check-in: %s\n- Check-out: %s\n\n%s\n\nIf you have any questions, please contact us.\n\nBest regards,\nThe Ofcoz Family Team", 'catcafe-booking'),
            $booking['display_name'],
            $booking_id,
            $booking['room_name'],
            $booking['check_in'],
            $booking['check_out'],
            $booking['payment_method'] === 'token' ? __('Your tokens have been refunded.', 'catcafe-booking') : __('Please contact us for refund processing.', 'catcafe-booking')
        );
        
        wp_mail($booking['user_email'], $subject, $message);
    }
    
    /**
     * Get all bookings for admin
     */
    public function get_all_bookings($status = null, $limit = 50, $offset = 0) {
        global $wpdb;
        $table_bookings = $wpdb->prefix . 'catcafe_bookings';
        $table_rooms = $wpdb->prefix . 'catcafe_rooms';
        
        $where_clause = '';
        if ($status) {
            $where_clause = $wpdb->prepare("WHERE b.status = %s", $status);
        }
        
        $bookings = $wpdb->get_results($wpdb->prepare("
            SELECT b.*, r.name as room_name, r.capacity, u.user_email, u.display_name
            FROM $table_bookings b
            LEFT JOIN $table_rooms r ON b.room_id = r.id
            LEFT JOIN {$wpdb->prefix}users u ON b.user_id = u.ID
            $where_clause
            ORDER BY b.created_at DESC
            LIMIT %d OFFSET %d
        ", $limit, $offset), ARRAY_A);
        
        return $bookings;
    }
}