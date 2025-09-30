<?php
/**
 * Cat Cafe Theme Functions
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Theme setup
function catcafe_theme_setup() {
    // Add theme support for various features
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('custom-logo');
    add_theme_support('html5', array('search-form', 'comment-form', 'comment-list'));
    
    // Register navigation menus
    register_nav_menus(array(
        'primary' => __('Primary Menu', 'catcafe'),
        'footer' => __('Footer Menu', 'catcafe'),
    ));
    
    // Add support for custom header
    add_theme_support('custom-header', array(
        'default-image' => '',
        'width' => 1200,
        'height' => 300,
        'flex-height' => true,
        'flex-width' => true,
    ));
}
add_action('after_setup_theme', 'catcafe_theme_setup');

// Enqueue scripts and styles
function catcafe_scripts() {
    // Enqueue theme stylesheet
    wp_enqueue_style('catcafe-style', get_stylesheet_uri(), array(), '1.0.0');
    
    // Enqueue JavaScript for AJAX functionality
    wp_enqueue_script('catcafe-scripts', get_template_directory_uri() . '/js/catcafe.js', array('jquery'), '1.0.0', true);
    
    // Localize script for AJAX
    wp_localize_script('catcafe-scripts', 'catcafe_ajax', array(
        'ajax_url' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('catcafe_nonce'),
        'current_language' => get_locale(),
    ));
}
add_action('wp_enqueue_scripts', 'catcafe_scripts');

// Register widget areas
function catcafe_widgets_init() {
    register_sidebar(array(
        'name' => __('Footer Widget Area', 'catcafe'),
        'id' => 'footer-widgets',
        'description' => __('Add widgets here to appear in your footer.', 'catcafe'),
        'before_widget' => '<div id="%1$s" class="widget %2$s">',
        'after_widget' => '</div>',
        'before_title' => '<h3 class="widget-title">',
        'after_title' => '</h3>',
    ));
}
add_action('widgets_init', 'catcafe_widgets_init');

// Custom post types
function catcafe_custom_post_types() {
    // Room post type
    register_post_type('room', array(
        'labels' => array(
            'name' => __('Rooms', 'catcafe'),
            'singular_name' => __('Room', 'catcafe'),
            'add_new' => __('Add New Room', 'catcafe'),
            'add_new_item' => __('Add New Room', 'catcafe'),
            'edit_item' => __('Edit Room', 'catcafe'),
            'new_item' => __('New Room', 'catcafe'),
            'view_item' => __('View Room', 'catcafe'),
            'search_items' => __('Search Rooms', 'catcafe'),
            'not_found' => __('No rooms found', 'catcafe'),
        ),
        'public' => true,
        'has_archive' => true,
        'rewrite' => array('slug' => 'rooms'),
        'supports' => array('title', 'editor', 'thumbnail', 'custom-fields'),
        'menu_icon' => 'dashicons-building',
    ));
    
    // Booking post type
    register_post_type('booking', array(
        'labels' => array(
            'name' => __('Bookings', 'catcafe'),
            'singular_name' => __('Booking', 'catcafe'),
        ),
        'public' => false,
        'show_ui' => true,
        'capability_type' => 'post',
        'supports' => array('title', 'custom-fields'),
        'menu_icon' => 'dashicons-calendar-alt',
    ));
}
add_action('init', 'catcafe_custom_post_types');

// Add custom fields support
function catcafe_add_meta_boxes() {
    // Room meta box
    add_meta_box(
        'room-details',
        __('Room Details', 'catcafe'),
        'catcafe_room_meta_box',
        'room',
        'normal',
        'default'
    );
    
    // Booking meta box
    add_meta_box(
        'booking-details',
        __('Booking Details', 'catcafe'),
        'catcafe_booking_meta_box',
        'booking',
        'normal',
        'default'
    );
}
add_action('add_meta_boxes', 'catcafe_add_meta_boxes');

// Room meta box callback
function catcafe_room_meta_box($post) {
    wp_nonce_field('catcafe_room_meta_nonce', 'catcafe_room_meta_nonce');
    
    $capacity = get_post_meta($post->ID, '_room_capacity', true);
    $size = get_post_meta($post->ID, '_room_size', true);
    $features = get_post_meta($post->ID, '_room_features', true);
    $price_token = get_post_meta($post->ID, '_room_price_token', true);
    $price_hourly = get_post_meta($post->ID, '_room_price_hourly', true);
    $price_daily = get_post_meta($post->ID, '_room_price_daily', true);
    $price_monthly = get_post_meta($post->ID, '_room_price_monthly', true);
    $booking_options = get_post_meta($post->ID, '_room_booking_options', true);
    
    ?>
    <table class="form-table">
        <tr>
            <th><label for="room_capacity"><?php _e('Capacity', 'catcafe'); ?></label></th>
            <td><input type="number" id="room_capacity" name="room_capacity" value="<?php echo esc_attr($capacity); ?>" /></td>
        </tr>
        <tr>
            <th><label for="room_size"><?php _e('Size', 'catcafe'); ?></label></th>
            <td><input type="text" id="room_size" name="room_size" value="<?php echo esc_attr($size); ?>" /></td>
        </tr>
        <tr>
            <th><label for="room_features"><?php _e('Features (one per line)', 'catcafe'); ?></label></th>
            <td><textarea id="room_features" name="room_features" rows="5" cols="50"><?php echo esc_textarea($features); ?></textarea></td>
        </tr>
        <tr>
            <th><label for="price_token"><?php _e('Token Price', 'catcafe'); ?></label></th>
            <td><input type="number" id="price_token" name="price_token" value="<?php echo esc_attr($price_token); ?>" /></td>
        </tr>
        <tr>
            <th><label for="price_hourly"><?php _e('Hourly Price (HKD)', 'catcafe'); ?></label></th>
            <td><input type="number" id="price_hourly" name="price_hourly" value="<?php echo esc_attr($price_hourly); ?>" /></td>
        </tr>
        <tr>
            <th><label for="price_daily"><?php _e('Daily Price (HKD)', 'catcafe'); ?></label></th>
            <td><input type="number" id="price_daily" name="price_daily" value="<?php echo esc_attr($price_daily); ?>" /></td>
        </tr>
        <tr>
            <th><label for="price_monthly"><?php _e('Monthly Price (HKD)', 'catcafe'); ?></label></th>
            <td><input type="number" id="price_monthly" name="price_monthly" value="<?php echo esc_attr($price_monthly); ?>" /></td>
        </tr>
        <tr>
            <th><label for="booking_options"><?php _e('Booking Options', 'catcafe'); ?></label></th>
            <td>
                <label><input type="checkbox" name="booking_options[]" value="token" <?php checked(in_array('token', (array)$booking_options)); ?> /> <?php _e('Token', 'catcafe'); ?></label><br>
                <label><input type="checkbox" name="booking_options[]" value="cash" <?php checked(in_array('cash', (array)$booking_options)); ?> /> <?php _e('Cash', 'catcafe'); ?></label>
            </td>
        </tr>
    </table>
    <?php
}

// Booking meta box callback
function catcafe_booking_meta_box($post) {
    wp_nonce_field('catcafe_booking_meta_nonce', 'catcafe_booking_meta_nonce');
    
    $user_id = get_post_meta($post->ID, '_booking_user_id', true);
    $room_id = get_post_meta($post->ID, '_booking_room_id', true);
    $check_in = get_post_meta($post->ID, '_booking_check_in', true);
    $check_out = get_post_meta($post->ID, '_booking_check_out', true);
    $guests = get_post_meta($post->ID, '_booking_guests', true);
    $payment_method = get_post_meta($post->ID, '_booking_payment_method', true);
    $total_cost = get_post_meta($post->ID, '_booking_total_cost', true);
    $status = get_post_meta($post->ID, '_booking_status', true);
    
    ?>
    <table class="form-table">
        <tr>
            <th><label for="booking_user_id"><?php _e('User ID', 'catcafe'); ?></label></th>
            <td><input type="number" id="booking_user_id" name="booking_user_id" value="<?php echo esc_attr($user_id); ?>" /></td>
        </tr>
        <tr>
            <th><label for="booking_room_id"><?php _e('Room ID', 'catcafe'); ?></label></th>
            <td><input type="number" id="booking_room_id" name="booking_room_id" value="<?php echo esc_attr($room_id); ?>" /></td>
        </tr>
        <tr>
            <th><label for="booking_check_in"><?php _e('Check In', 'catcafe'); ?></label></th>
            <td><input type="datetime-local" id="booking_check_in" name="booking_check_in" value="<?php echo esc_attr($check_in); ?>" /></td>
        </tr>
        <tr>
            <th><label for="booking_check_out"><?php _e('Check Out', 'catcafe'); ?></label></th>
            <td><input type="datetime-local" id="booking_check_out" name="booking_check_out" value="<?php echo esc_attr($check_out); ?>" /></td>
        </tr>
        <tr>
            <th><label for="booking_guests"><?php _e('Number of Guests', 'catcafe'); ?></label></th>
            <td><input type="number" id="booking_guests" name="booking_guests" value="<?php echo esc_attr($guests); ?>" /></td>
        </tr>
        <tr>
            <th><label for="booking_payment_method"><?php _e('Payment Method', 'catcafe'); ?></label></th>
            <td>
                <select id="booking_payment_method" name="booking_payment_method">
                    <option value="token" <?php selected($payment_method, 'token'); ?>><?php _e('Token', 'catcafe'); ?></option>
                    <option value="cash" <?php selected($payment_method, 'cash'); ?>><?php _e('Cash', 'catcafe'); ?></option>
                </select>
            </td>
        </tr>
        <tr>
            <th><label for="booking_total_cost"><?php _e('Total Cost', 'catcafe'); ?></label></th>
            <td><input type="number" step="0.01" id="booking_total_cost" name="booking_total_cost" value="<?php echo esc_attr($total_cost); ?>" /></td>
        </tr>
        <tr>
            <th><label for="booking_status"><?php _e('Status', 'catcafe'); ?></label></th>
            <td>
                <select id="booking_status" name="booking_status">
                    <option value="pending" <?php selected($status, 'pending'); ?>><?php _e('Pending', 'catcafe'); ?></option>
                    <option value="confirmed" <?php selected($status, 'confirmed'); ?>><?php _e('Confirmed', 'catcafe'); ?></option>
                    <option value="cancelled" <?php selected($status, 'cancelled'); ?>><?php _e('Cancelled', 'catcafe'); ?></option>
                    <option value="completed" <?php selected($status, 'completed'); ?>><?php _e('Completed', 'catcafe'); ?></option>
                </select>
            </td>
        </tr>
    </table>
    <?php
}

// Save meta box data
function catcafe_save_meta_boxes($post_id) {
    // Check if user has permission
    if (!current_user_can('edit_post', $post_id)) {
        return;
    }
    
    // Save room meta
    if (isset($_POST['catcafe_room_meta_nonce']) && wp_verify_nonce($_POST['catcafe_room_meta_nonce'], 'catcafe_room_meta_nonce')) {
        if (isset($_POST['room_capacity'])) {
            update_post_meta($post_id, '_room_capacity', sanitize_text_field($_POST['room_capacity']));
        }
        if (isset($_POST['room_size'])) {
            update_post_meta($post_id, '_room_size', sanitize_text_field($_POST['room_size']));
        }
        if (isset($_POST['room_features'])) {
            update_post_meta($post_id, '_room_features', sanitize_textarea_field($_POST['room_features']));
        }
        if (isset($_POST['price_token'])) {
            update_post_meta($post_id, '_room_price_token', sanitize_text_field($_POST['price_token']));
        }
        if (isset($_POST['price_hourly'])) {
            update_post_meta($post_id, '_room_price_hourly', sanitize_text_field($_POST['price_hourly']));
        }
        if (isset($_POST['price_daily'])) {
            update_post_meta($post_id, '_room_price_daily', sanitize_text_field($_POST['price_daily']));
        }
        if (isset($_POST['price_monthly'])) {
            update_post_meta($post_id, '_room_price_monthly', sanitize_text_field($_POST['price_monthly']));
        }
        if (isset($_POST['booking_options'])) {
            update_post_meta($post_id, '_room_booking_options', array_map('sanitize_text_field', $_POST['booking_options']));
        }
    }
    
    // Save booking meta
    if (isset($_POST['catcafe_booking_meta_nonce']) && wp_verify_nonce($_POST['catcafe_booking_meta_nonce'], 'catcafe_booking_meta_nonce')) {
        $booking_fields = array(
            'booking_user_id', 'booking_room_id', 'booking_check_in', 
            'booking_check_out', 'booking_guests', 'booking_payment_method',
            'booking_total_cost', 'booking_status'
        );
        
        foreach ($booking_fields as $field) {
            if (isset($_POST[$field])) {
                update_post_meta($post_id, '_' . $field, sanitize_text_field($_POST[$field]));
            }
        }
    }
}
add_action('save_post', 'catcafe_save_meta_boxes');

// Language support functions
function catcafe_get_current_language() {
    return isset($_COOKIE['catcafe_language']) ? $_COOKIE['catcafe_language'] : 'en';
}

function catcafe_get_translation($key, $language = null) {
    if (!$language) {
        $language = catcafe_get_current_language();
    }
    
    $translations = catcafe_get_translations();
    return isset($translations[$language][$key]) ? $translations[$language][$key] : $key;
}

function catcafe_get_translations() {
    return array(
        'en' => array(
            'site_title' => 'Ofcoz Family - Cat-Friendly Workspace Reservations',
            'tagline' => 'Book your perfect cat-friendly workspace',
            'home' => 'Home',
            'rooms' => 'Rooms',
            'booking' => 'Booking',
            'about' => 'About',
            'contact' => 'Contact',
            'book_now' => 'Book Now',
            'view_details' => 'View Details',
            'features' => 'Features',
            'capacity' => 'Capacity',
            'price' => 'Price',
        ),
        'zh' => array(
            'site_title' => 'Ofcoz Family - 貓咪友好工作間預約',
            'tagline' => '預約您完美的貓咪友好工作間',
            'home' => '首頁',
            'rooms' => '房間',
            'booking' => '預約',
            'about' => '關於我們',
            'contact' => '聯絡我們',
            'book_now' => '立即預約',
            'view_details' => '查看詳情',
            'features' => '設施',
            'capacity' => '容量',
            'price' => '價格',
        ),
    );
}

// AJAX handlers for language switching
function catcafe_switch_language() {
    check_ajax_referer('catcafe_nonce', 'nonce');
    
    $language = sanitize_text_field($_POST['language']);
    if (in_array($language, array('en', 'zh'))) {
        setcookie('catcafe_language', $language, time() + (86400 * 30), '/');
        wp_send_json_success(array('language' => $language));
    } else {
        wp_send_json_error('Invalid language');
    }
}
add_action('wp_ajax_catcafe_switch_language', 'catcafe_switch_language');
add_action('wp_ajax_nopriv_catcafe_switch_language', 'catcafe_switch_language');