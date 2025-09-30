<?php
/**
 * Cat Cafe User Management Class
 */

if (!defined('ABSPATH')) {
    exit;
}

class CatCafe_User {
    
    public function __construct() {
        add_action('wp_ajax_catcafe_register_user', array($this, 'register_user'));
        add_action('wp_ajax_nopriv_catcafe_register_user', array($this, 'register_user'));
        add_action('wp_ajax_catcafe_login_user', array($this, 'login_user'));
        add_action('wp_ajax_nopriv_catcafe_login_user', array($this, 'login_user'));
        add_action('wp_ajax_catcafe_update_tokens', array($this, 'update_user_tokens'));
        add_action('wp_ajax_catcafe_get_user_profile', array($this, 'get_user_profile'));
        add_action('user_register', array($this, 'create_catcafe_user_profile'));
    }
    
    /**
     * Create cat cafe user profile when WordPress user is created
     */
    public function create_catcafe_user_profile($user_id) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'catcafe_users';
        
        $valid_until = new DateTime();
        $valid_until->add(new DateInterval('P180D')); // Add 180 days
        
        $wpdb->insert(
            $table_name,
            array(
                'user_id' => $user_id,
                'tokens' => 0,
                'token_valid_until' => $valid_until->format('Y-m-d H:i:s'),
                'is_admin' => 0
            )
        );
    }
    
    /**
     * Register new user via AJAX
     */
    public function register_user() {
        check_ajax_referer('catcafe_nonce', 'nonce');
        
        $name = sanitize_text_field($_POST['name']);
        $email = sanitize_email($_POST['email']);
        $password = sanitize_text_field($_POST['password']);
        $phone = sanitize_text_field($_POST['phone']);
        
        // Check if user already exists
        if (email_exists($email)) {
            wp_send_json_error(array('message' => __('Email already exists', 'catcafe-booking')));
        }
        
        // Create WordPress user
        $user_id = wp_create_user($email, $password, $email);
        
        if (is_wp_error($user_id)) {
            wp_send_json_error(array('message' => $user_id->get_error_message()));
        }
        
        // Update user meta
        wp_update_user(array(
            'ID' => $user_id,
            'display_name' => $name,
            'first_name' => $name
        ));
        
        // Create cat cafe profile
        global $wpdb;
        $table_name = $wpdb->prefix . 'catcafe_users';
        
        $valid_until = new DateTime();
        $valid_until->add(new DateInterval('P180D'));
        
        $wpdb->insert(
            $table_name,
            array(
                'user_id' => $user_id,
                'phone' => $phone,
                'tokens' => 0,
                'token_valid_until' => $valid_until->format('Y-m-d H:i:s'),
                'is_admin' => 0
            )
        );
        
        // Auto login the user
        wp_set_current_user($user_id);
        wp_set_auth_cookie($user_id);
        
        // Send activation email
        $this->send_activation_email($user_id, $email, $name);
        
        wp_send_json_success(array(
            'message' => __('Registration successful', 'catcafe-booking'),
            'user_id' => $user_id
        ));
    }
    
    /**
     * Login user via AJAX
     */
    public function login_user() {
        check_ajax_referer('catcafe_nonce', 'nonce');
        
        $email = sanitize_email($_POST['email']);
        $password = sanitize_text_field($_POST['password']);
        $remember = isset($_POST['remember']) ? true : false;
        
        // Check hardcoded admin accounts first
        if ($this->check_admin_login($email, $password)) {
            wp_send_json_success(array(
                'message' => __('Admin login successful', 'catcafe-booking'),
                'is_admin' => true
            ));
            return;
        }
        
        $user = wp_authenticate($email, $password);
        
        if (is_wp_error($user)) {
            wp_send_json_error(array('message' => __('Invalid email or password', 'catcafe-booking')));
        }
        
        wp_set_current_user($user->ID);
        wp_set_auth_cookie($user->ID, $remember);
        
        $catcafe_user = $this->get_catcafe_user($user->ID);
        
        wp_send_json_success(array(
            'message' => __('Login successful', 'catcafe-booking'),
            'user' => $catcafe_user,
            'is_admin' => $catcafe_user['is_admin']
        ));
    }
    
    /**
     * Check admin login for hardcoded accounts
     */
    private function check_admin_login($email, $password) {
        $admin_accounts = array(
            'admin@of-coz.com' => 'admin123',
            'manager@of-coz.com' => 'manager123'
        );
        
        if (isset($admin_accounts[$email]) && $admin_accounts[$email] === $password) {
            // Create session for admin
            $_SESSION['catcafe_admin'] = array(
                'email' => $email,
                'name' => ($email === 'admin@of-coz.com') ? 'Admin' : 'Manager',
                'is_admin' => true,
                'tokens' => 9999
            );
            return true;
        }
        
        return false;
    }
    
    /**
     * Get cat cafe user data
     */
    public function get_catcafe_user($user_id) {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'catcafe_users';
        $user_data = get_userdata($user_id);
        
        $catcafe_data = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM $table_name WHERE user_id = %d", $user_id),
            ARRAY_A
        );
        
        if (!$catcafe_data) {
            return null;
        }
        
        return array(
            'id' => $user_id,
            'name' => $user_data->display_name,
            'email' => $user_data->user_email,
            'phone' => $catcafe_data['phone'],
            'tokens' => $catcafe_data['tokens'],
            'token_valid_until' => $catcafe_data['token_valid_until'],
            'is_admin' => $catcafe_data['is_admin'],
            'created_at' => $catcafe_data['created_at']
        );
    }
    
    /**
     * Update user tokens
     */
    public function update_user_tokens() {
        check_ajax_referer('catcafe_nonce', 'nonce');
        
        if (!current_user_can('edit_users') && !current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('Insufficient permissions', 'catcafe-booking')));
        }
        
        $user_id = intval($_POST['user_id']);
        $new_token_count = intval($_POST['token_count']);
        $is_top_up = isset($_POST['is_top_up']) ? (bool)$_POST['is_top_up'] : false;
        
        global $wpdb;
        $table_users = $wpdb->prefix . 'catcafe_users';
        $table_history = $wpdb->prefix . 'catcafe_token_history';
        
        // Get current token count
        $current_data = $wpdb->get_row(
            $wpdb->prepare("SELECT tokens FROM $table_users WHERE user_id = %d", $user_id),
            ARRAY_A
        );
        
        if (!$current_data) {
            wp_send_json_error(array('message' => __('User not found', 'catcafe-booking')));
        }
        
        $old_tokens = $current_data['tokens'];
        $token_change = $new_token_count - $old_tokens;
        
        // Update tokens
        $update_data = array('tokens' => $new_token_count);
        
        if ($is_top_up && $token_change > 0) {
            $valid_until = new DateTime();
            $valid_until->add(new DateInterval('P180D'));
            $update_data['token_valid_until'] = $valid_until->format('Y-m-d H:i:s');
        }
        
        $wpdb->update(
            $table_users,
            $update_data,
            array('user_id' => $user_id)
        );
        
        // Add to token history
        if ($token_change != 0) {
            $wpdb->insert(
                $table_history,
                array(
                    'user_id' => $user_id,
                    'change_amount' => $token_change,
                    'new_balance' => $new_token_count,
                    'transaction_type' => $token_change > 0 ? 'top-up' : 'usage',
                    'description' => $is_top_up ? 'Token top-up' : 'Token usage/deduction'
                )
            );
        }
        
        wp_send_json_success(array(
            'message' => __('Tokens updated successfully', 'catcafe-booking'),
            'new_balance' => $new_token_count
        ));
    }
    
    /**
     * Get user profile data
     */
    public function get_user_profile() {
        check_ajax_referer('catcafe_nonce', 'nonce');
        
        if (!is_user_logged_in()) {
            wp_send_json_error(array('message' => __('User not logged in', 'catcafe-booking')));
        }
        
        $user_id = get_current_user_id();
        $user_data = $this->get_catcafe_user($user_id);
        
        if (!$user_data) {
            wp_send_json_error(array('message' => __('User profile not found', 'catcafe-booking')));
        }
        
        // Get token history
        global $wpdb;
        $table_history = $wpdb->prefix . 'catcafe_token_history';
        
        $token_history = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM $table_history WHERE user_id = %d ORDER BY created_at DESC LIMIT 20",
                $user_id
            ),
            ARRAY_A
        );
        
        $user_data['token_history'] = $token_history;
        
        wp_send_json_success($user_data);
    }
    
    /**
     * Send activation email
     */
    private function send_activation_email($user_id, $email, $name) {
        $subject = __('Welcome to Ofcoz Family!', 'catcafe-booking');
        
        $message = sprintf(
            __('Hello %s,\n\nWelcome to Ofcoz Family! Your account has been successfully created.\n\nEmail: %s\n\nYou can now start booking our cat-friendly workspaces.\n\nBest regards,\nThe Ofcoz Family Team', 'catcafe-booking'),
            $name,
            $email
        );
        
        wp_mail($email, $subject, $message);
    }
    
    /**
     * Get all users for admin
     */
    public function get_all_users() {
        global $wpdb;
        
        $table_name = $wpdb->prefix . 'catcafe_users';
        
        $users = $wpdb->get_results("
            SELECT u.ID, u.user_email, u.display_name, u.user_registered,
                   cu.phone, cu.tokens, cu.token_valid_until, cu.is_admin
            FROM {$wpdb->prefix}users u
            LEFT JOIN $table_name cu ON u.ID = cu.user_id
            ORDER BY u.user_registered DESC
        ", ARRAY_A);
        
        return $users;
    }
}