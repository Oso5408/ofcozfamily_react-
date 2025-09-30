<?php
/**
 * Plugin Name: Cat Cafe Booking System
 * Description: A comprehensive booking system for cat cafe with user management, room reservations, and token system
 * Version: 1.0.0
 * Author: Cat Cafe Team
 * Text Domain: catcafe-booking
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('CATCAFE_PLUGIN_URL', plugin_dir_url(__FILE__));
define('CATCAFE_PLUGIN_PATH', plugin_dir_path(__FILE__));

// Plugin activation hook
register_activation_hook(__FILE__, 'catcafe_create_tables');

function catcafe_create_tables() {
    global $wpdb;
    
    $charset_collate = $wpdb->get_charset_collate();
    
    // Users table (extending WordPress users)
    $table_users = $wpdb->prefix . 'catcafe_users';
    $sql_users = "CREATE TABLE $table_users (
        id mediumint(9) NOT NULL AUTO_INCREMENT,
        user_id bigint(20) UNSIGNED NOT NULL,
        phone varchar(20) DEFAULT '',
        tokens int(11) DEFAULT 0,
        token_valid_until datetime DEFAULT NULL,
        is_admin tinyint(1) DEFAULT 0,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        FOREIGN KEY (user_id) REFERENCES {$wpdb->prefix}users(ID) ON DELETE CASCADE
    ) $charset_collate;";
    
    // Rooms table
    $table_rooms = $wpdb->prefix . 'catcafe_rooms';
    $sql_rooms = "CREATE TABLE $table_rooms (
        id mediumint(9) NOT NULL AUTO_INCREMENT,
        name varchar(100) NOT NULL,
        capacity int(11) NOT NULL,
        size varchar(50) DEFAULT '',
        features text DEFAULT '',
        description text DEFAULT '',
        image_url varchar(255) DEFAULT '',
        price_token int(11) DEFAULT 0,
        price_hourly decimal(10,2) DEFAULT 0.00,
        price_daily decimal(10,2) DEFAULT 0.00,
        price_monthly decimal(10,2) DEFAULT 0.00,
        booking_options text DEFAULT '',
        is_hidden tinyint(1) DEFAULT 0,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
    ) $charset_collate;";
    
    // Bookings table
    $table_bookings = $wpdb->prefix . 'catcafe_bookings';
    $sql_bookings = "CREATE TABLE $table_bookings (
        id mediumint(9) NOT NULL AUTO_INCREMENT,
        user_id bigint(20) UNSIGNED NOT NULL,
        room_id mediumint(9) NOT NULL,
        check_in datetime NOT NULL,
        check_out datetime NOT NULL,
        guests int(11) DEFAULT 1,
        payment_method varchar(20) DEFAULT 'cash',
        total_cost decimal(10,2) DEFAULT 0.00,
        status varchar(20) DEFAULT 'pending',
        special_requests text DEFAULT '',
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        FOREIGN KEY (user_id) REFERENCES {$wpdb->prefix}users(ID) ON DELETE CASCADE,
        FOREIGN KEY (room_id) REFERENCES $table_rooms(id) ON DELETE CASCADE
    ) $charset_collate;";
    
    // Token history table
    $table_token_history = $wpdb->prefix . 'catcafe_token_history';
    $sql_token_history = "CREATE TABLE $table_token_history (
        id mediumint(9) NOT NULL AUTO_INCREMENT,
        user_id bigint(20) UNSIGNED NOT NULL,
        change_amount int(11) NOT NULL,
        new_balance int(11) NOT NULL,
        transaction_type varchar(50) DEFAULT 'usage',
        description text DEFAULT '',
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        FOREIGN KEY (user_id) REFERENCES {$wpdb->prefix}users(ID) ON DELETE CASCADE
    ) $charset_collate;";
    
    // Products table (for e-commerce)
    $table_products = $wpdb->prefix . 'catcafe_products';
    $sql_products = "CREATE TABLE $table_products (
        id mediumint(9) NOT NULL AUTO_INCREMENT,
        name varchar(200) NOT NULL,
        description text DEFAULT '',
        price decimal(10,2) NOT NULL,
        image_url varchar(255) DEFAULT '',
        category varchar(100) DEFAULT '',
        stock int(11) DEFAULT 0,
        is_active tinyint(1) DEFAULT 1,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
    ) $charset_collate;";
    
    // Cart items table
    $table_cart = $wpdb->prefix . 'catcafe_cart';
    $sql_cart = "CREATE TABLE $table_cart (
        id mediumint(9) NOT NULL AUTO_INCREMENT,
        user_id bigint(20) UNSIGNED NOT NULL,
        product_id mediumint(9) NOT NULL,
        quantity int(11) DEFAULT 1,
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        FOREIGN KEY (user_id) REFERENCES {$wpdb->prefix}users(ID) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES $table_products(id) ON DELETE CASCADE
    ) $charset_collate;";
    
    // Orders table
    $table_orders = $wpdb->prefix . 'catcafe_orders';
    $sql_orders = "CREATE TABLE $table_orders (
        id mediumint(9) NOT NULL AUTO_INCREMENT,
        user_id bigint(20) UNSIGNED NOT NULL,
        total_amount decimal(10,2) NOT NULL,
        status varchar(50) DEFAULT 'pending',
        payment_method varchar(50) DEFAULT 'cash',
        shipping_address text DEFAULT '',
        order_items text DEFAULT '',
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        FOREIGN KEY (user_id) REFERENCES {$wpdb->prefix}users(ID) ON DELETE CASCADE
    ) $charset_collate;";
    
    // Settings table for bilingual content
    $table_settings = $wpdb->prefix . 'catcafe_settings';
    $sql_settings = "CREATE TABLE $table_settings (
        id mediumint(9) NOT NULL AUTO_INCREMENT,
        setting_key varchar(100) NOT NULL,
        setting_value_en text DEFAULT '',
        setting_value_zh text DEFAULT '',
        setting_type varchar(50) DEFAULT 'text',
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY setting_key (setting_key)
    ) $charset_collate;";
    
    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    
    dbDelta($sql_users);
    dbDelta($sql_rooms);
    dbDelta($sql_bookings);
    dbDelta($sql_token_history);
    dbDelta($sql_products);
    dbDelta($sql_cart);
    dbDelta($sql_orders);
    dbDelta($sql_settings);
    
    // Insert default room data
    catcafe_insert_default_data();
}

function catcafe_insert_default_data() {
    global $wpdb;
    
    $table_rooms = $wpdb->prefix . 'catcafe_rooms';
    $table_settings = $wpdb->prefix . 'catcafe_settings';
    
    // Insert room data from the original React app
    $rooms_data = array(
        array(
            'name' => 'Room B',
            'capacity' => 6,
            'size' => '約70尺',
            'features' => 'Spacious living area, Cat climbing tree, Premium bedding',
            'description' => 'RoomBDescription',
            'price_token' => 1,
            'price_hourly' => 120.00,
            'price_daily' => 600.00,
            'price_monthly' => 5000.00,
            'booking_options' => 'token,cash',
            'is_hidden' => 0
        ),
        array(
            'name' => 'Room C',
            'capacity' => 4,
            'size' => '約60-90尺',
            'features' => 'Spacious living area, Cat climbing tree, Premium bedding, TV',
            'description' => 'RoomCDescription',
            'price_hourly' => 150.00,
            'price_daily' => 800.00,
            'price_monthly' => 6000.00,
            'booking_options' => 'cash',
            'is_hidden' => 0
        ),
        array(
            'name' => 'Room D',
            'capacity' => 7,
            'size' => '約60尺',
            'features' => 'Garden view, Cat balcony, Meditation corner',
            'description' => 'RoomDDescription',
            'price_token' => 1,
            'price_hourly' => 120.00,
            'price_daily' => 600.00,
            'price_monthly' => 5000.00,
            'booking_options' => 'token,cash',
            'is_hidden' => 0
        ),
        array(
            'name' => 'Room E',
            'capacity' => 6,
            'size' => '約60尺',
            'features' => 'Themed decor, Interactive cat toys, Cozy reading nook, TV',
            'description' => 'RoomEDescription',
            'price_token' => 1,
            'price_hourly' => 120.00,
            'price_daily' => 600.00,
            'price_monthly' => 5000.00,
            'booking_options' => 'token,cash',
            'is_hidden' => 0
        ),
        array(
            'name' => 'Room H',
            'capacity' => 6,
            'size' => '約60尺',
            'features' => 'Spacious living area, Themed decor, Cozy reading nook',
            'description' => 'RoomHDescription',
            'price_token' => 1,
            'price_hourly' => 120.00,
            'price_daily' => 600.00,
            'price_monthly' => 5000.00,
            'booking_options' => 'token,cash',
            'is_hidden' => 0
        )
    );
    
    foreach ($rooms_data as $room) {
        $wpdb->insert($table_rooms, $room);
    }
    
    // Insert default settings for bilingual content
    $default_settings = array(
        array(
            'setting_key' => 'site_title',
            'setting_value_en' => 'Ofcoz Family - Cat-Friendly Workspace Reservations',
            'setting_value_zh' => 'Ofcoz Family - 貓咪友好工作間預約'
        ),
        array(
            'setting_key' => 'site_tagline',
            'setting_value_en' => 'Book your perfect cat-friendly workspace at Ofcoz Family',
            'setting_value_zh' => '在Ofcoz Family預約您完美的貓咪友好工作間'
        ),
        array(
            'setting_key' => 'hero_title',
            'setting_value_en' => 'Welcome to Ofcoz Family',
            'setting_value_zh' => '歡迎來到Ofcoz Family'
        ),
        array(
            'setting_key' => 'hero_subtitle',
            'setting_value_en' => 'Your perfect cat-friendly workspace awaits',
            'setting_value_zh' => '您完美的貓咪友好工作間正在等待您'
        ),
        array(
            'setting_key' => 'contact_phone',
            'setting_value_en' => '66238788',
            'setting_value_zh' => '66238788'
        ),
        array(
            'setting_key' => 'contact_email',
            'setting_value_en' => 'info@of-coz.com',
            'setting_value_zh' => 'info@of-coz.com'
        )
    );
    
    foreach ($default_settings as $setting) {
        $wpdb->insert($table_settings, $setting);
    }
}

// Include the booking system class
require_once CATCAFE_PLUGIN_PATH . 'includes/class-catcafe-booking.php';
require_once CATCAFE_PLUGIN_PATH . 'includes/class-catcafe-user.php';
require_once CATCAFE_PLUGIN_PATH . 'includes/class-catcafe-admin.php';

// Initialize the plugin
function catcafe_init() {
    new CatCafe_Booking();
    new CatCafe_User();
    
    if (is_admin()) {
        new CatCafe_Admin();
    }
}
add_action('plugins_loaded', 'catcafe_init');