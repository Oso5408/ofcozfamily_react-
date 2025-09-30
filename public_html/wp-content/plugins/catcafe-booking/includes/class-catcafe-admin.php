<?php
/**
 * Cat Cafe Admin Management Class
 */

if (!defined('ABSPATH')) {
    exit;
}

class CatCafe_Admin {
    
    public function __construct() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('wp_ajax_catcafe_get_admin_stats', array($this, 'get_admin_stats'));
        add_action('wp_ajax_catcafe_get_admin_bookings', array($this, 'get_admin_bookings'));
        add_action('wp_ajax_catcafe_update_booking_status', array($this, 'update_booking_status'));
        add_action('wp_ajax_catcafe_get_admin_users', array($this, 'get_admin_users'));
        add_action('wp_ajax_catcafe_admin_update_tokens', array($this, 'admin_update_tokens'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
    }
    
    /**
     * Add admin menu pages
     */
    public function add_admin_menu() {
        add_menu_page(
            __('Cat Cafe', 'catcafe-booking'),
            __('Cat Cafe', 'catcafe-booking'),
            'manage_options',
            'catcafe-admin',
            array($this, 'admin_dashboard_page'),
            'dashicons-building',
            30
        );
        
        add_submenu_page(
            'catcafe-admin',
            __('Dashboard', 'catcafe-booking'),
            __('Dashboard', 'catcafe-booking'),
            'manage_options',
            'catcafe-admin',
            array($this, 'admin_dashboard_page')
        );
        
        add_submenu_page(
            'catcafe-admin',
            __('Bookings', 'catcafe-booking'),
            __('Bookings', 'catcafe-booking'),
            'manage_options',
            'catcafe-bookings',
            array($this, 'admin_bookings_page')
        );
        
        add_submenu_page(
            'catcafe-admin',
            __('Users', 'catcafe-booking'),
            __('Users', 'catcafe-booking'),
            'manage_options',
            'catcafe-users',
            array($this, 'admin_users_page')
        );
        
        add_submenu_page(
            'catcafe-admin',
            __('Rooms', 'catcafe-booking'),
            __('Rooms', 'catcafe-booking'),
            'manage_options',
            'catcafe-rooms',
            array($this, 'admin_rooms_page')
        );
        
        add_submenu_page(
            'catcafe-admin',
            __('Settings', 'catcafe-booking'),
            __('Settings', 'catcafe-booking'),
            'manage_options',
            'catcafe-settings',
            array($this, 'admin_settings_page')
        );
    }
    
    /**
     * Enqueue admin scripts
     */
    public function enqueue_admin_scripts() {
        if (isset($_GET['page']) && strpos($_GET['page'], 'catcafe-') === 0) {
            wp_enqueue_script('catcafe-admin-js', CATCAFE_PLUGIN_URL . 'assets/admin.js', array('jquery'), '1.0.0', true);
            wp_enqueue_style('catcafe-admin-css', CATCAFE_PLUGIN_URL . 'assets/admin.css', array(), '1.0.0');
            
            wp_localize_script('catcafe-admin-js', 'catcafe_admin_ajax', array(
                'ajax_url' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('catcafe_admin_nonce'),
            ));
        }
    }
    
    /**
     * Admin dashboard page
     */
    public function admin_dashboard_page() {
        ?>
        <div class="wrap catcafe-admin">
            <h1><?php _e('Cat Cafe Dashboard', 'catcafe-booking'); ?></h1>
            
            <div class="catcafe-dashboard-stats">
                <div class="stat-box">
                    <h3 id="total-bookings">-</h3>
                    <p><?php _e('Total Bookings', 'catcafe-booking'); ?></p>
                </div>
                <div class="stat-box">
                    <h3 id="today-bookings">-</h3>
                    <p><?php _e('Today\'s Bookings', 'catcafe-booking'); ?></p>
                </div>
                <div class="stat-box">
                    <h3 id="total-users">-</h3>
                    <p><?php _e('Total Users', 'catcafe-booking'); ?></p>
                </div>
                <div class="stat-box">
                    <h3 id="total-revenue">-</h3>
                    <p><?php _e('Total Revenue', 'catcafe-booking'); ?></p>
                </div>
            </div>
            
            <div class="catcafe-dashboard-content">
                <div class="dashboard-section">
                    <h2><?php _e('Recent Bookings', 'catcafe-booking'); ?></h2>
                    <div id="recent-bookings-admin">
                        <!-- Recent bookings will be loaded here -->
                    </div>
                    <a href="<?php echo admin_url('admin.php?page=catcafe-bookings'); ?>" class="button">
                        <?php _e('View All Bookings', 'catcafe-booking'); ?>
                    </a>
                </div>
                
                <div class="dashboard-section">
                    <h2><?php _e('Quick Actions', 'catcafe-booking'); ?></h2>
                    <div class="quick-actions">
                        <a href="<?php echo admin_url('admin.php?page=catcafe-bookings'); ?>" class="button button-primary">
                            <?php _e('Manage Bookings', 'catcafe-booking'); ?>
                        </a>
                        <a href="<?php echo admin_url('admin.php?page=catcafe-users'); ?>" class="button">
                            <?php _e('Manage Users', 'catcafe-booking'); ?>
                        </a>
                        <a href="<?php echo admin_url('admin.php?page=catcafe-rooms'); ?>" class="button">
                            <?php _e('Manage Rooms', 'catcafe-booking'); ?>
                        </a>
                    </div>
                </div>
            </div>
        </div>
        
        <script>
        jQuery(document).ready(function($) {
            // Load dashboard stats
            $.post(ajaxurl, {
                action: 'catcafe_get_admin_stats',
                nonce: catcafe_admin_ajax.nonce
            }, function(response) {
                if (response.success) {
                    const stats = response.data;
                    $('#total-bookings').text(stats.total_bookings);
                    $('#today-bookings').text(stats.today_bookings);
                    $('#total-users').text(stats.total_users);
                    $('#total-revenue').text('HKD ' + stats.total_revenue);
                }
            });
            
            // Load recent bookings
            $.post(ajaxurl, {
                action: 'catcafe_get_admin_bookings',
                limit: 5,
                nonce: catcafe_admin_ajax.nonce
            }, function(response) {
                if (response.success) {
                    let bookingsHtml = '';
                    response.data.forEach(function(booking) {
                        bookingsHtml += `
                            <div class="booking-item">
                                <strong>${booking.room_name}</strong> - ${booking.display_name}
                                <span class="booking-date">${new Date(booking.check_in).toLocaleDateString()}</span>
                                <span class="booking-status status-${booking.status}">${booking.status}</span>
                            </div>
                        `;
                    });
                    $('#recent-bookings-admin').html(bookingsHtml || '<p>No recent bookings.</p>');
                }
            });
        });
        </script>
        <?php
    }
    
    /**
     * Admin bookings page
     */
    public function admin_bookings_page() {
        ?>
        <div class="wrap catcafe-admin">
            <h1><?php _e('Manage Bookings', 'catcafe-booking'); ?></h1>
            
            <div class="booking-filters">
                <select id="admin-booking-status-filter">
                    <option value=""><?php _e('All Statuses', 'catcafe-booking'); ?></option>
                    <option value="pending"><?php _e('Pending', 'catcafe-booking'); ?></option>
                    <option value="confirmed"><?php _e('Confirmed', 'catcafe-booking'); ?></option>
                    <option value="cancelled"><?php _e('Cancelled', 'catcafe-booking'); ?></option>
                    <option value="completed"><?php _e('Completed', 'catcafe-booking'); ?></option>
                </select>
                
                <input type="date" id="admin-booking-date-filter" placeholder="<?php _e('Filter by date', 'catcafe-booking'); ?>">
                
                <button id="filter-bookings-btn" class="button"><?php _e('Filter', 'catcafe-booking'); ?></button>
                <button id="reset-filters-btn" class="button"><?php _e('Reset', 'catcafe-booking'); ?></button>
            </div>
            
            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th><?php _e('ID', 'catcafe-booking'); ?></th>
                        <th><?php _e('User', 'catcafe-booking'); ?></th>
                        <th><?php _e('Room', 'catcafe-booking'); ?></th>
                        <th><?php _e('Check-in', 'catcafe-booking'); ?></th>
                        <th><?php _e('Check-out', 'catcafe-booking'); ?></th>
                        <th><?php _e('Guests', 'catcafe-booking'); ?></th>
                        <th><?php _e('Status', 'catcafe-booking'); ?></th>
                        <th><?php _e('Total', 'catcafe-booking'); ?></th>
                        <th><?php _e('Actions', 'catcafe-booking'); ?></th>
                    </tr>
                </thead>
                <tbody id="admin-bookings-table">
                    <!-- Bookings will be loaded here -->
                </tbody>
            </table>
        </div>
        
        <script>
        jQuery(document).ready(function($) {
            loadAdminBookings();
            
            $('#filter-bookings-btn').on('click', function() {
                loadAdminBookings();
            });
            
            $('#reset-filters-btn').on('click', function() {
                $('#admin-booking-status-filter').val('');
                $('#admin-booking-date-filter').val('');
                loadAdminBookings();
            });
            
            $(document).on('change', '.booking-status-select', function() {
                const bookingId = $(this).data('booking-id');
                const newStatus = $(this).val();
                
                $.post(ajaxurl, {
                    action: 'catcafe_update_booking_status',
                    booking_id: bookingId,
                    status: newStatus,
                    nonce: catcafe_admin_ajax.nonce
                }, function(response) {
                    if (response.success) {
                        alert('Booking status updated successfully');
                    } else {
                        alert('Error updating booking status');
                    }
                });
            });
            
            function loadAdminBookings() {
                const status = $('#admin-booking-status-filter').val();
                const date = $('#admin-booking-date-filter').val();
                
                $.post(ajaxurl, {
                    action: 'catcafe_get_admin_bookings',
                    status: status,
                    date: date,
                    nonce: catcafe_admin_ajax.nonce
                }, function(response) {
                    if (response.success) {
                        let bookingsHtml = '';
                        response.data.forEach(function(booking) {
                            bookingsHtml += createAdminBookingRow(booking);
                        });
                        $('#admin-bookings-table').html(bookingsHtml || '<tr><td colspan="9">No bookings found.</td></tr>');
                    }
                });
            }
            
            function createAdminBookingRow(booking) {
                return `
                    <tr>
                        <td>${booking.id}</td>
                        <td>${booking.display_name}<br><small>${booking.user_email}</small></td>
                        <td>${booking.room_name}</td>
                        <td>${new Date(booking.check_in).toLocaleString()}</td>
                        <td>${new Date(booking.check_out).toLocaleString()}</td>
                        <td>${booking.guests}</td>
                        <td>
                            <select class="booking-status-select" data-booking-id="${booking.id}">
                                <option value="pending" ${booking.status === 'pending' ? 'selected' : ''}>Pending</option>
                                <option value="confirmed" ${booking.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                                <option value="cancelled" ${booking.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                                <option value="completed" ${booking.status === 'completed' ? 'selected' : ''}>Completed</option>
                            </select>
                        </td>
                        <td>${booking.payment_method === 'token' ? booking.total_cost + ' tokens' : 'HKD ' + booking.total_cost}</td>
                        <td>
                            <button class="button button-small view-booking-btn" data-booking-id="${booking.id}">View</button>
                        </td>
                    </tr>
                `;
            }
        });
        </script>
        <?php
    }
    
    /**
     * Admin users page
     */
    public function admin_users_page() {
        ?>
        <div class="wrap catcafe-admin">
            <h1><?php _e('Manage Users', 'catcafe-booking'); ?></h1>
            
            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th><?php _e('ID', 'catcafe-booking'); ?></th>
                        <th><?php _e('Name', 'catcafe-booking'); ?></th>
                        <th><?php _e('Email', 'catcafe-booking'); ?></th>
                        <th><?php _e('Phone', 'catcafe-booking'); ?></th>
                        <th><?php _e('Tokens', 'catcafe-booking'); ?></th>
                        <th><?php _e('Registered', 'catcafe-booking'); ?></th>
                        <th><?php _e('Actions', 'catcafe-booking'); ?></th>
                    </tr>
                </thead>
                <tbody id="admin-users-table">
                    <!-- Users will be loaded here -->
                </tbody>
            </table>
        </div>
        
        <!-- Token Update Modal -->
        <div id="token-update-modal" class="catcafe-modal" style="display: none;">
            <div class="modal-content">
                <h3><?php _e('Update User Tokens', 'catcafe-booking'); ?></h3>
                <form id="token-update-form">
                    <input type="hidden" id="update-user-id">
                    <p>
                        <label><?php _e('Current Tokens', 'catcafe-booking'); ?>:</label>
                        <span id="current-tokens-display"></span>
                    </p>
                    <p>
                        <label for="new-token-amount"><?php _e('New Token Amount', 'catcafe-booking'); ?>:</label>
                        <input type="number" id="new-token-amount" min="0" required>
                    </p>
                    <p>
                        <label>
                            <input type="checkbox" id="is-top-up">
                            <?php _e('This is a top-up (extends validity)', 'catcafe-booking'); ?>
                        </label>
                    </p>
                    <p>
                        <button type="submit" class="button button-primary"><?php _e('Update Tokens', 'catcafe-booking'); ?></button>
                        <button type="button" class="button close-modal"><?php _e('Cancel', 'catcafe-booking'); ?></button>
                    </p>
                </form>
            </div>
        </div>
        
        <script>
        jQuery(document).ready(function($) {
            loadAdminUsers();
            
            $(document).on('click', '.update-tokens-btn', function() {
                const userId = $(this).data('user-id');
                const currentTokens = $(this).data('current-tokens');
                
                $('#update-user-id').val(userId);
                $('#current-tokens-display').text(currentTokens);
                $('#new-token-amount').val(currentTokens);
                $('#token-update-modal').show();
            });
            
            $('.close-modal').on('click', function() {
                $('#token-update-modal').hide();
            });
            
            $('#token-update-form').on('submit', function(e) {
                e.preventDefault();
                
                $.post(ajaxurl, {
                    action: 'catcafe_admin_update_tokens',
                    user_id: $('#update-user-id').val(),
                    token_count: $('#new-token-amount').val(),
                    is_top_up: $('#is-top-up').is(':checked'),
                    nonce: catcafe_admin_ajax.nonce
                }, function(response) {
                    if (response.success) {
                        alert('Tokens updated successfully');
                        $('#token-update-modal').hide();
                        loadAdminUsers();
                    } else {
                        alert('Error updating tokens: ' + response.data.message);
                    }
                });
            });
            
            function loadAdminUsers() {
                $.post(ajaxurl, {
                    action: 'catcafe_get_admin_users',
                    nonce: catcafe_admin_ajax.nonce
                }, function(response) {
                    if (response.success) {
                        let usersHtml = '';
                        response.data.forEach(function(user) {
                            usersHtml += createAdminUserRow(user);
                        });
                        $('#admin-users-table').html(usersHtml || '<tr><td colspan="7">No users found.</td></tr>');
                    }
                });
            }
            
            function createAdminUserRow(user) {
                return `
                    <tr>
                        <td>${user.ID}</td>
                        <td>${user.display_name}</td>
                        <td>${user.user_email}</td>
                        <td>${user.phone || '-'}</td>
                        <td>${user.tokens || 0}</td>
                        <td>${new Date(user.user_registered).toLocaleDateString()}</td>
                        <td>
                            <button class="button button-small update-tokens-btn" 
                                    data-user-id="${user.ID}" 
                                    data-current-tokens="${user.tokens || 0}">
                                Update Tokens
                            </button>
                        </td>
                    </tr>
                `;
            }
        });
        </script>
        <?php
    }
    
    /**
     * Admin rooms page
     */
    public function admin_rooms_page() {
        ?>
        <div class="wrap catcafe-admin">
            <h1><?php _e('Manage Rooms', 'catcafe-booking'); ?></h1>
            <p><?php _e('Rooms are managed through the WordPress admin. Go to Cat Cafe > Rooms in the main menu.', 'catcafe-booking'); ?></p>
            <a href="<?php echo admin_url('edit.php?post_type=room'); ?>" class="button button-primary">
                <?php _e('Manage Rooms', 'catcafe-booking'); ?>
            </a>
        </div>
        <?php
    }
    
    /**
     * Admin settings page
     */
    public function admin_settings_page() {
        ?>
        <div class="wrap catcafe-admin">
            <h1><?php _e('Cat Cafe Settings', 'catcafe-booking'); ?></h1>
            
            <form method="post" action="options.php">
                <?php
                settings_fields('catcafe_settings');
                do_settings_sections('catcafe_settings');
                ?>
                
                <table class="form-table">
                    <tr>
                        <th scope="row"><?php _e('Default Token Value', 'catcafe-booking'); ?></th>
                        <td>
                            <input type="number" name="catcafe_default_tokens" value="<?php echo esc_attr(get_option('catcafe_default_tokens', 0)); ?>" />
                            <p class="description"><?php _e('Default number of tokens for new users', 'catcafe-booking'); ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><?php _e('Token Validity Period (days)', 'catcafe-booking'); ?></th>
                        <td>
                            <input type="number" name="catcafe_token_validity" value="<?php echo esc_attr(get_option('catcafe_token_validity', 180)); ?>" />
                            <p class="description"><?php _e('How long tokens remain valid after purchase', 'catcafe-booking'); ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><?php _e('Booking Advance Notice (hours)', 'catcafe-booking'); ?></th>
                        <td>
                            <input type="number" name="catcafe_booking_advance" value="<?php echo esc_attr(get_option('catcafe_booking_advance', 24)); ?>" />
                            <p class="description"><?php _e('Minimum advance notice required for bookings', 'catcafe-booking'); ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><?php _e('Contact Email', 'catcafe-booking'); ?></th>
                        <td>
                            <input type="email" name="catcafe_contact_email" value="<?php echo esc_attr(get_option('catcafe_contact_email', get_option('admin_email'))); ?>" />
                            <p class="description"><?php _e('Email address for booking notifications', 'catcafe-booking'); ?></p>
                        </td>
                    </tr>
                </table>
                
                <?php submit_button(); ?>
            </form>
        </div>
        <?php
    }
    
    /**
     * Get admin statistics
     */
    public function get_admin_stats() {
        check_ajax_referer('catcafe_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => 'Insufficient permissions'));
        }
        
        global $wpdb;
        
        $table_bookings = $wpdb->prefix . 'catcafe_bookings';
        $table_users = $wpdb->prefix . 'catcafe_users';
        
        // Get total bookings
        $total_bookings = $wpdb->get_var("SELECT COUNT(*) FROM $table_bookings");
        
        // Get today's bookings
        $today = date('Y-m-d');
        $today_bookings = $wpdb->get_var($wpdb->prepare("
            SELECT COUNT(*) FROM $table_bookings 
            WHERE DATE(created_at) = %s
        ", $today));
        
        // Get total users
        $total_users = $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}users");
        
        // Get total revenue (cash payments only)
        $total_revenue = $wpdb->get_var("
            SELECT SUM(total_cost) FROM $table_bookings 
            WHERE payment_method = 'cash' AND status IN ('confirmed', 'completed')
        ");
        
        wp_send_json_success(array(
            'total_bookings' => $total_bookings ?: 0,
            'today_bookings' => $today_bookings ?: 0,
            'total_users' => $total_users ?: 0,
            'total_revenue' => $total_revenue ?: 0
        ));
    }
    
    /**
     * Get admin bookings
     */
    public function get_admin_bookings() {
        check_ajax_referer('catcafe_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => 'Insufficient permissions'));
        }
        
        $status = sanitize_text_field($_POST['status'] ?? '');
        $date = sanitize_text_field($_POST['date'] ?? '');
        $limit = intval($_POST['limit'] ?? 50);
        
        $booking_system = new CatCafe_Booking();
        $bookings = $booking_system->get_all_bookings($status, $limit);
        
        wp_send_json_success($bookings);
    }
    
    /**
     * Update booking status
     */
    public function update_booking_status() {
        check_ajax_referer('catcafe_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => 'Insufficient permissions'));
        }
        
        $booking_id = intval($_POST['booking_id']);
        $status = sanitize_text_field($_POST['status']);
        
        global $wpdb;
        $table_bookings = $wpdb->prefix . 'catcafe_bookings';
        
        $result = $wpdb->update(
            $table_bookings,
            array('status' => $status),
            array('id' => $booking_id)
        );
        
        if ($result !== false) {
            wp_send_json_success(array('message' => 'Booking status updated'));
        } else {
            wp_send_json_error(array('message' => 'Failed to update booking status'));
        }
    }
    
    /**
     * Get admin users
     */
    public function get_admin_users() {
        check_ajax_referer('catcafe_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => 'Insufficient permissions'));
        }
        
        $user_system = new CatCafe_User();
        $users = $user_system->get_all_users();
        
        wp_send_json_success($users);
    }
    
    /**
     * Admin update user tokens
     */
    public function admin_update_tokens() {
        check_ajax_referer('catcafe_admin_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => 'Insufficient permissions'));
        }
        
        $user_id = intval($_POST['user_id']);
        $token_count = intval($_POST['token_count']);
        $is_top_up = isset($_POST['is_top_up']) ? (bool)$_POST['is_top_up'] : false;
        
        $user_system = new CatCafe_User();
        // Use the existing update_user_tokens method from CatCafe_User
        // This would need to be made public or accessible
        
        global $wpdb;
        $table_users = $wpdb->prefix . 'catcafe_users';
        $table_history = $wpdb->prefix . 'catcafe_token_history';
        
        // Get current token count
        $current_data = $wpdb->get_row(
            $wpdb->prepare("SELECT tokens FROM $table_users WHERE user_id = %d", $user_id),
            ARRAY_A
        );
        
        if (!$current_data) {
            wp_send_json_error(array('message' => 'User not found'));
        }
        
        $old_tokens = $current_data['tokens'];
        $token_change = $token_count - $old_tokens;
        
        // Update tokens
        $update_data = array('tokens' => $token_count);
        
        if ($is_top_up && $token_change > 0) {
            $valid_until = new DateTime();
            $valid_until->add(new DateInterval('P180D'));
            $update_data['token_valid_until'] = $valid_until->format('Y-m-d H:i:s');
        }
        
        $result = $wpdb->update(
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
                    'new_balance' => $token_count,
                    'transaction_type' => $token_change > 0 ? 'admin-topup' : 'admin-deduction',
                    'description' => 'Admin adjustment'
                )
            );
        }
        
        wp_send_json_success(array('message' => 'Tokens updated successfully'));
    }
}