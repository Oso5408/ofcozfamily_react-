/**
 * Cat Cafe Theme JavaScript
 */

jQuery(document).ready(function($) {
    
    // Language switching
    $('.lang-btn').on('click', function() {
        const language = $(this).data('lang');
        
        $.post(catcafe_ajax.ajax_url, {
            action: 'catcafe_switch_language',
            language: language,
            nonce: catcafe_ajax.nonce
        }, function(response) {
            if (response.success) {
                location.reload();
            }
        });
    });
    
    // Load rooms on homepage
    if ($('#rooms-container').length) {
        loadFeaturedRooms();
    }
    
    // Contact form submission
    $('#contact-form').on('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            action: 'catcafe_send_contact_message',
            name: $('input[name="name"]').val(),
            email: $('input[name="email"]').val(),
            subject: $('input[name="subject"]').val(),
            message: $('textarea[name="message"]').val(),
            nonce: catcafe_ajax.nonce
        };
        
        $.post(catcafe_ajax.ajax_url, formData, function(response) {
            if (response.success) {
                alert('Message sent successfully!');
                $('#contact-form')[0].reset();
            } else {
                alert('Error sending message: ' + response.data.message);
            }
        });
    });
    
    // User menu dropdown
    $('.user-menu').on('click', function() {
        $(this).find('.user-dropdown').toggle();
    });
    
    // Close dropdown when clicking outside
    $(document).on('click', function(e) {
        if (!$(e.target).closest('.user-menu').length) {
            $('.user-dropdown').hide();
        }
    });
    
    // Booking modal functionality
    $(document).on('click', '.book-room-btn', function() {
        const roomId = $(this).data('room-id');
        openBookingModal(roomId);
    });
    
    // Room booking form
    $('#booking-form').on('submit', function(e) {
        e.preventDefault();
        submitBooking();
    });
    
    // Login form
    $('#login-form').on('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            action: 'catcafe_login_user',
            email: $('input[name="login_email"]').val(),
            password: $('input[name="login_password"]').val(),
            remember: $('input[name="remember_me"]').is(':checked'),
            nonce: catcafe_ajax.nonce
        };
        
        $.post(catcafe_ajax.ajax_url, formData, function(response) {
            if (response.success) {
                window.location.href = '/dashboard';
            } else {
                showError(response.data.message);
            }
        });
    });
    
    // Registration form
    $('#register-form').on('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            action: 'catcafe_register_user',
            name: $('input[name="register_name"]').val(),
            email: $('input[name="register_email"]').val(),
            password: $('input[name="register_password"]').val(),
            phone: $('input[name="register_phone"]').val(),
            nonce: catcafe_ajax.nonce
        };
        
        $.post(catcafe_ajax.ajax_url, formData, function(response) {
            if (response.success) {
                window.location.href = '/dashboard';
            } else {
                showError(response.data.message);
            }
        });
    });
    
    /**
     * Load featured rooms for homepage
     */
    function loadFeaturedRooms() {
        $.post(catcafe_ajax.ajax_url, {
            action: 'catcafe_get_rooms',
            nonce: catcafe_ajax.nonce
        }, function(response) {
            if (response.success) {
                const rooms = response.data.slice(0, 4); // Show only first 4 rooms
                let roomsHtml = '';
                
                rooms.forEach(function(room) {
                    roomsHtml += createRoomCard(room);
                });
                
                $('#rooms-container').html(roomsHtml);
            }
        });
    }
    
    /**
     * Create room card HTML
     */
    function createRoomCard(room) {
        const features = room.features.slice(0, 3).join(', ');
        const tokenPrice = room.prices.token ? room.prices.token + ' token' : '';
        const cashPrice = room.prices.cash.hourly ? 'HKD ' + room.prices.cash.hourly + '/hr' : '';
        
        return `
            <div class="room-card">
                <div class="room-image">
                    ${room.image_url ? `<img src="${room.image_url}" alt="${room.name}">` : `<div class="room-placeholder">${room.name}</div>`}
                </div>
                <div class="room-content">
                    <h3 class="room-title">${room.name}</h3>
                    <p class="room-size">Size: ${room.size}</p>
                    <p class="room-capacity">Capacity: ${room.capacity} people</p>
                    <ul class="room-features">
                        ${room.features.map(feature => `<li>${feature}</li>`).join('')}
                    </ul>
                    <div class="room-price">
                        ${tokenPrice && `<span class="token-price">${tokenPrice}</span>`}
                        ${cashPrice && `<span class="cash-price">${cashPrice}</span>`}
                    </div>
                    <div class="room-actions">
                        <button class="btn btn-primary book-room-btn" data-room-id="${room.id}">
                            Book Now
                        </button>
                        <a href="/rooms/${room.id}" class="btn btn-secondary">
                            View Details
                        </a>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Open booking modal
     */
    function openBookingModal(roomId) {
        // Check if user is logged in
        if (!isUserLoggedIn()) {
            alert('Please log in to make a booking');
            window.location.href = '/login';
            return;
        }
        
        // Load room details and show modal
        $.post(catcafe_ajax.ajax_url, {
            action: 'catcafe_get_room_details',
            room_id: roomId,
            nonce: catcafe_ajax.nonce
        }, function(response) {
            if (response.success) {
                showBookingModal(response.data);
            }
        });
    }
    
    /**
     * Show booking modal
     */
    function showBookingModal(room) {
        const modalHtml = `
            <div class="booking-modal" id="booking-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Book ${room.name}</h2>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="booking-form">
                            <input type="hidden" name="room_id" value="${room.id}">
                            
                            <div class="form-group">
                                <label>Check-in Date & Time</label>
                                <input type="datetime-local" name="check_in" required>
                            </div>
                            
                            <div class="form-group">
                                <label>Check-out Date & Time</label>
                                <input type="datetime-local" name="check_out" required>
                            </div>
                            
                            <div class="form-group">
                                <label>Number of Guests</label>
                                <input type="number" name="guests" min="1" max="${room.capacity}" value="1" required>
                            </div>
                            
                            <div class="form-group">
                                <label>Payment Method</label>
                                <select name="payment_method" required>
                                    ${room.booking_options.includes('token') ? '<option value="token">Token</option>' : ''}
                                    ${room.booking_options.includes('cash') ? '<option value="cash">Cash</option>' : ''}
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label>Special Requests (Optional)</label>
                                <textarea name="special_requests" rows="3"></textarea>
                            </div>
                            
                            <div class="form-actions">
                                <button type="button" class="btn btn-secondary modal-close">Cancel</button>
                                <button type="submit" class="btn btn-primary">Confirm Booking</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        
        $('body').append(modalHtml);
        $('#booking-modal').show();
        
        // Modal close handlers
        $('.modal-close').on('click', function() {
            $('#booking-modal').remove();
        });
    }
    
    /**
     * Submit booking
     */
    function submitBooking() {
        const formData = {
            action: 'catcafe_create_booking',
            room_id: $('input[name="room_id"]').val(),
            check_in: $('input[name="check_in"]').val(),
            check_out: $('input[name="check_out"]').val(),
            guests: $('input[name="guests"]').val(),
            payment_method: $('select[name="payment_method"]').val(),
            special_requests: $('textarea[name="special_requests"]').val(),
            nonce: catcafe_ajax.nonce
        };
        
        $.post(catcafe_ajax.ajax_url, formData, function(response) {
            if (response.success) {
                alert('Booking created successfully!');
                $('#booking-modal').remove();
                // Redirect to dashboard to view booking
                window.location.href = '/dashboard';
            } else {
                showError(response.data.message);
            }
        });
    }
    
    /**
     * Check if user is logged in
     */
    function isUserLoggedIn() {
        return $('body').hasClass('logged-in');
    }
    
    /**
     * Show error message
     */
    function showError(message) {
        alert('Error: ' + message);
    }
    
    /**
     * Show success message
     */
    function showSuccess(message) {
        alert('Success: ' + message);
    }
});