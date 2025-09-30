<?php
/**
 * Template Name: Dashboard Page
 */

// Redirect if not logged in
if (!is_user_logged_in()) {
    wp_redirect(home_url('/login'));
    exit;
}

get_header(); 

$current_user = wp_get_current_user();
?>

<div class="dashboard-page">
    <div class="container">
        <div class="dashboard-header">
            <h1><?php echo catcafe_get_translation('my_dashboard'); ?></h1>
            <p><?php printf(catcafe_get_translation('welcome_user'), $current_user->display_name); ?></p>
        </div>
        
        <div class="dashboard-nav">
            <button class="dashboard-tab active" data-tab="overview"><?php echo catcafe_get_translation('overview'); ?></button>
            <button class="dashboard-tab" data-tab="bookings"><?php echo catcafe_get_translation('my_bookings'); ?></button>
            <button class="dashboard-tab" data-tab="profile"><?php echo catcafe_get_translation('profile'); ?></button>
            <button class="dashboard-tab" data-tab="tokens"><?php echo catcafe_get_translation('tokens'); ?></button>
        </div>
        
        <!-- Overview Tab -->
        <div class="dashboard-content" id="overview-tab">
            <div class="dashboard-stats">
                <div class="stat-card">
                    <div class="stat-icon">📅</div>
                    <div class="stat-content">
                        <h3 id="total-bookings">-</h3>
                        <p><?php echo catcafe_get_translation('total_bookings'); ?></p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">🪙</div>
                    <div class="stat-content">
                        <h3 id="token-balance">-</h3>
                        <p><?php echo catcafe_get_translation('token_balance'); ?></p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">⭐</div>
                    <div class="stat-content">
                        <h3 id="reviews-count">-</h3>
                        <p><?php echo catcafe_get_translation('reviews_given'); ?></p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">❤️</div>
                    <div class="stat-content">
                        <h3 id="favorites-count">-</h3>
                        <p><?php echo catcafe_get_translation('favorite_rooms'); ?></p>
                    </div>
                </div>
            </div>
            
            <div class="quick-actions">
                <h3><?php echo catcafe_get_translation('quick_actions'); ?></h3>
                <div class="action-buttons">
                    <a href="<?php echo esc_url(home_url('/rooms')); ?>" class="btn btn-primary">
                        <?php echo catcafe_get_translation('book_room'); ?>
                    </a>
                    <button id="top-up-tokens-btn" class="btn btn-secondary">
                        <?php echo catcafe_get_translation('top_up_tokens'); ?>
                    </button>
                    <a href="<?php echo esc_url(home_url('/contact')); ?>" class="btn btn-outline">
                        <?php echo catcafe_get_translation('contact_support'); ?>
                    </a>
                </div>
            </div>
            
            <div class="recent-bookings">
                <h3><?php echo catcafe_get_translation('recent_bookings'); ?></h3>
                <div id="recent-bookings-list">
                    <!-- Recent bookings will be loaded here -->
                </div>
            </div>
        </div>
        
        <!-- Bookings Tab -->
        <div class="dashboard-content" id="bookings-tab" style="display: none;">
            <div class="bookings-header">
                <h3><?php echo catcafe_get_translation('my_bookings'); ?></h3>
                <div class="booking-filters">
                    <select id="booking-status-filter">
                        <option value=""><?php echo catcafe_get_translation('all_statuses'); ?></option>
                        <option value="confirmed"><?php echo catcafe_get_translation('confirmed'); ?></option>
                        <option value="pending"><?php echo catcafe_get_translation('pending'); ?></option>
                        <option value="cancelled"><?php echo catcafe_get_translation('cancelled'); ?></option>
                        <option value="completed"><?php echo catcafe_get_translation('completed'); ?></option>
                    </select>
                </div>
            </div>
            
            <div id="all-bookings-list">
                <!-- All bookings will be loaded here -->
            </div>
        </div>
        
        <!-- Profile Tab -->
        <div class="dashboard-content" id="profile-tab" style="display: none;">
            <div class="profile-section">
                <h3><?php echo catcafe_get_translation('personal_information'); ?></h3>
                
                <form id="profile-form" class="profile-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="profile_name"><?php echo catcafe_get_translation('full_name'); ?></label>
                            <input type="text" id="profile_name" name="profile_name" value="<?php echo esc_attr($current_user->display_name); ?>">
                        </div>
                        
                        <div class="form-group">
                            <label for="profile_email"><?php echo catcafe_get_translation('email'); ?></label>
                            <input type="email" id="profile_email" name="profile_email" value="<?php echo esc_attr($current_user->user_email); ?>" readonly>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="profile_phone"><?php echo catcafe_get_translation('phone'); ?></label>
                            <input type="tel" id="profile_phone" name="profile_phone">
                        </div>
                    </div>
                    
                    <button type="submit" class="btn btn-primary">
                        <?php echo catcafe_get_translation('update_profile'); ?>
                    </button>
                </form>
            </div>
            
            <div class="password-section">
                <h3><?php echo catcafe_get_translation('change_password'); ?></h3>
                
                <form id="password-form" class="password-form">
                    <div class="form-group">
                        <label for="current_password"><?php echo catcafe_get_translation('current_password'); ?></label>
                        <input type="password" id="current_password" name="current_password" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="new_password"><?php echo catcafe_get_translation('new_password'); ?></label>
                        <input type="password" id="new_password" name="new_password" required minlength="6">
                    </div>
                    
                    <div class="form-group">
                        <label for="confirm_new_password"><?php echo catcafe_get_translation('confirm_new_password'); ?></label>
                        <input type="password" id="confirm_new_password" name="confirm_new_password" required>
                    </div>
                    
                    <button type="submit" class="btn btn-secondary">
                        <?php echo catcafe_get_translation('change_password'); ?>
                    </button>
                </form>
            </div>
        </div>
        
        <!-- Tokens Tab -->
        <div class="dashboard-content" id="tokens-tab" style="display: none;">
            <div class="token-overview">
                <h3><?php echo catcafe_get_translation('token_management'); ?></h3>
                
                <div class="token-balance-card">
                    <div class="balance-info">
                        <h2 id="current-token-balance">-</h2>
                        <p><?php echo catcafe_get_translation('current_balance'); ?></p>
                        <small id="token-valid-until">-</small>
                    </div>
                    
                    <div class="balance-actions">
                        <button id="buy-tokens-btn" class="btn btn-primary">
                            <?php echo catcafe_get_translation('buy_tokens'); ?>
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="token-history">
                <h3><?php echo catcafe_get_translation('token_history'); ?></h3>
                <div id="token-history-list">
                    <!-- Token history will be loaded here -->
                </div>
            </div>
        </div>
    </div>
</div>

<style>
.dashboard-page {
    padding: 2rem 0;
    min-height: 80vh;
}

.dashboard-header {
    margin-bottom: 2rem;
    text-align: center;
}

.dashboard-header h1 {
    color: #8B4513;
    margin-bottom: 0.5rem;
}

.dashboard-nav {
    display: flex;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    margin-bottom: 2rem;
    overflow: hidden;
}

.dashboard-tab {
    flex: 1;
    padding: 1rem;
    border: none;
    background: transparent;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.3s ease;
}

.dashboard-tab.active {
    background: #8B4513;
    color: white;
}

.dashboard-content {
    background: white;
    border-radius: 8px;
    padding: 2rem;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.dashboard-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
}

.stat-card {
    background: linear-gradient(135deg, #f5f1eb 0%, #e8ddd4 100%);
    padding: 1.5rem;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 1rem;
}

.stat-icon {
    font-size: 2rem;
}

.stat-content h3 {
    font-size: 1.5rem;
    color: #8B4513;
    margin: 0;
}

.quick-actions, .recent-bookings, .token-overview, .token-history {
    margin-bottom: 2rem;
}

.action-buttons {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
}

.booking-card, .token-history-item {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 6px;
    margin-bottom: 1rem;
    border-left: 4px solid #8B4513;
}

.booking-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.5rem;
}

.booking-status {
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
}

.booking-status.confirmed { background: #d4edda; color: #155724; }
.booking-status.pending { background: #fff3cd; color: #856404; }
.booking-status.cancelled { background: #f8d7da; color: #721c24; }
.booking-status.completed { background: #d1ecf1; color: #0c5460; }

.profile-form, .password-form {
    max-width: 600px;
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
}

.form-group {
    margin-bottom: 1rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
}

.form-group input, .form-group select, .form-group textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.token-balance-card {
    background: linear-gradient(135deg, #8B4513 0%, #A0522D 100%);
    color: white;
    padding: 2rem;
    border-radius: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}

.balance-info h2 {
    font-size: 2.5rem;
    margin: 0;
}

.profile-section, .password-section {
    background: #f8f9fa;
    padding: 1.5rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
}

@media (max-width: 768px) {
    .dashboard-nav {
        flex-direction: column;
    }
    
    .form-row {
        grid-template-columns: 1fr;
    }
    
    .token-balance-card {
        flex-direction: column;
        text-align: center;
        gap: 1rem;
    }
    
    .action-buttons {
        justify-content: center;
    }
}
</style>

<script>
jQuery(document).ready(function($) {
    // Tab switching
    $('.dashboard-tab').on('click', function() {
        const tab = $(this).data('tab');
        
        $('.dashboard-tab').removeClass('active');
        $(this).addClass('active');
        
        $('.dashboard-content').hide();
        $('#' + tab + '-tab').show();
        
        // Load tab-specific data
        if (tab === 'bookings') {
            loadAllBookings();
        } else if (tab === 'tokens') {
            loadTokenHistory();
        }
    });
    
    // Load initial data
    loadUserProfile();
    loadDashboardStats();
    loadRecentBookings();
    
    function loadUserProfile() {
        $.post(catcafe_ajax.ajax_url, {
            action: 'catcafe_get_user_profile',
            nonce: catcafe_ajax.nonce
        }, function(response) {
            if (response.success) {
                const user = response.data;
                $('#profile_phone').val(user.phone || '');
                $('#token-balance').text(user.tokens || '0');
                $('#current-token-balance').text(user.tokens || '0');
                
                if (user.token_valid_until) {
                    const validDate = new Date(user.token_valid_until);
                    $('#token-valid-until').text('Valid until: ' + validDate.toLocaleDateString());
                }
            }
        });
    }
    
    function loadDashboardStats() {
        // This would typically load from the server
        $('#total-bookings').text('5');
        $('#reviews-count').text('3');
        $('#favorites-count').text('2');
    }
    
    function loadRecentBookings() {
        $.post(catcafe_ajax.ajax_url, {
            action: 'catcafe_get_bookings',
            nonce: catcafe_ajax.nonce
        }, function(response) {
            if (response.success) {
                const bookings = response.data.slice(0, 3); // Show only recent 3
                let bookingsHtml = '';
                
                bookings.forEach(function(booking) {
                    bookingsHtml += createBookingCard(booking);
                });
                
                $('#recent-bookings-list').html(bookingsHtml || '<p>No recent bookings found.</p>');
            }
        });
    }
    
    function loadAllBookings() {
        $.post(catcafe_ajax.ajax_url, {
            action: 'catcafe_get_bookings',
            nonce: catcafe_ajax.nonce
        }, function(response) {
            if (response.success) {
                let bookingsHtml = '';
                
                response.data.forEach(function(booking) {
                    bookingsHtml += createBookingCard(booking, true);
                });
                
                $('#all-bookings-list').html(bookingsHtml || '<p>No bookings found.</p>');
            }
        });
    }
    
    function loadTokenHistory() {
        // Token history is included in user profile response
        // This function would load detailed token history
    }
    
    function createBookingCard(booking, showActions = false) {
        const checkIn = new Date(booking.check_in).toLocaleString();
        const checkOut = new Date(booking.check_out).toLocaleString();
        
        return `
            <div class="booking-card">
                <div class="booking-header">
                    <div>
                        <h4>${booking.room_name}</h4>
                        <span class="booking-status ${booking.status}">${booking.status}</span>
                    </div>
                    <div class="booking-id">#${booking.id}</div>
                </div>
                <div class="booking-details">
                    <p><strong>Check-in:</strong> ${checkIn}</p>
                    <p><strong>Check-out:</strong> ${checkOut}</p>
                    <p><strong>Guests:</strong> ${booking.guests}</p>
                    <p><strong>Total Cost:</strong> ${booking.payment_method === 'token' ? booking.total_cost + ' tokens' : 'HKD ' + booking.total_cost}</p>
                </div>
                ${showActions && booking.status === 'confirmed' ? `
                    <div class="booking-actions">
                        <button class="btn btn-outline cancel-booking-btn" data-booking-id="${booking.id}">
                            Cancel Booking
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    // Profile update
    $('#profile-form').on('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            action: 'catcafe_update_profile',
            name: $('#profile_name').val(),
            phone: $('#profile_phone').val(),
            nonce: catcafe_ajax.nonce
        };
        
        $.post(catcafe_ajax.ajax_url, formData, function(response) {
            if (response.success) {
                alert('Profile updated successfully!');
            } else {
                alert('Error updating profile: ' + response.data.message);
            }
        });
    });
    
    // Password change
    $('#password-form').on('submit', function(e) {
        e.preventDefault();
        
        const newPassword = $('#new_password').val();
        const confirmPassword = $('#confirm_new_password').val();
        
        if (newPassword !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        
        const formData = {
            action: 'catcafe_change_password',
            current_password: $('#current_password').val(),
            new_password: newPassword,
            nonce: catcafe_ajax.nonce
        };
        
        $.post(catcafe_ajax.ajax_url, formData, function(response) {
            if (response.success) {
                alert('Password changed successfully!');
                $('#password-form')[0].reset();
            } else {
                alert('Error changing password: ' + response.data.message);
            }
        });
    });
    
    // Cancel booking
    $(document).on('click', '.cancel-booking-btn', function() {
        const bookingId = $(this).data('booking-id');
        
        if (confirm('Are you sure you want to cancel this booking?')) {
            $.post(catcafe_ajax.ajax_url, {
                action: 'catcafe_cancel_booking',
                booking_id: bookingId,
                nonce: catcafe_ajax.nonce
            }, function(response) {
                if (response.success) {
                    alert('Booking cancelled successfully!');
                    loadAllBookings();
                    loadRecentBookings();
                } else {
                    alert('Error cancelling booking: ' + response.data.message);
                }
            });
        }
    });
});
</script>

<?php get_footer(); ?>