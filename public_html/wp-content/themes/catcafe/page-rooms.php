<?php
/**
 * Template Name: Rooms Page
 */

get_header(); ?>

<div class="page-header">
    <div class="container">
        <h1><?php echo catcafe_get_translation('our_rooms'); ?></h1>
        <p><?php echo catcafe_get_translation('rooms_description'); ?></p>
    </div>
</div>

<section class="rooms-listing">
    <div class="container">
        <div class="rooms-filters">
            <div class="filter-group">
                <label><?php echo catcafe_get_translation('filter_by_capacity'); ?>:</label>
                <select id="capacity-filter">
                    <option value=""><?php echo catcafe_get_translation('all_capacities'); ?></option>
                    <option value="1-4">1-4 <?php echo catcafe_get_translation('people'); ?></option>
                    <option value="5-6">5-6 <?php echo catcafe_get_translation('people'); ?></option>
                    <option value="7+">7+ <?php echo catcafe_get_translation('people'); ?></option>
                </select>
            </div>
            
            <div class="filter-group">
                <label><?php echo catcafe_get_translation('payment_method'); ?>:</label>
                <select id="payment-filter">
                    <option value=""><?php echo catcafe_get_translation('all_methods'); ?></option>
                    <option value="token"><?php echo catcafe_get_translation('token'); ?></option>
                    <option value="cash"><?php echo catcafe_get_translation('cash'); ?></option>
                </select>
            </div>
            
            <div class="filter-group">
                <label><?php echo catcafe_get_translation('features'); ?>:</label>
                <select id="features-filter">
                    <option value=""><?php echo catcafe_get_translation('all_features'); ?></option>
                    <option value="TV">TV</option>
                    <option value="Garden view"><?php echo catcafe_get_translation('garden_view'); ?></option>
                    <option value="Cat balcony"><?php echo catcafe_get_translation('cat_balcony'); ?></option>
                </select>
            </div>
        </div>
        
        <div class="rooms-grid" id="all-rooms-container">
            <!-- Rooms will be loaded via AJAX -->
        </div>
        
        <div class="loading" id="rooms-loading" style="display: none;">
            <p><?php echo catcafe_get_translation('loading_rooms'); ?>...</p>
        </div>
    </div>
</section>

<script>
jQuery(document).ready(function($) {
    let allRooms = [];
    
    // Load all rooms
    loadAllRooms();
    
    // Filter handlers
    $('#capacity-filter, #payment-filter, #features-filter').on('change', function() {
        filterRooms();
    });
    
    function loadAllRooms() {
        $('#rooms-loading').show();
        
        $.post(catcafe_ajax.ajax_url, {
            action: 'catcafe_get_rooms',
            nonce: catcafe_ajax.nonce
        }, function(response) {
            $('#rooms-loading').hide();
            
            if (response.success) {
                allRooms = response.data;
                displayRooms(allRooms);
            } else {
                $('#all-rooms-container').html('<p>Failed to load rooms.</p>');
            }
        });
    }
    
    function displayRooms(rooms) {
        let roomsHtml = '';
        
        rooms.forEach(function(room) {
            roomsHtml += createDetailedRoomCard(room);
        });
        
        $('#all-rooms-container').html(roomsHtml);
    }
    
    function createDetailedRoomCard(room) {
        const features = room.features.join(', ');
        const tokenPrice = room.prices.token ? room.prices.token + ' token' : '';
        const cashPrices = [];
        if (room.prices.cash.hourly) cashPrices.push('HKD ' + room.prices.cash.hourly + '/hr');
        if (room.prices.cash.daily) cashPrices.push('HKD ' + room.prices.cash.daily + '/day');
        if (room.prices.cash.monthly) cashPrices.push('HKD ' + room.prices.cash.monthly + '/month');
        
        return `
            <div class="room-card detailed">
                <div class="room-image">
                    ${room.image_url ? `<img src="${room.image_url}" alt="${room.name}">` : `<div class="room-placeholder">${room.name}</div>`}
                </div>
                <div class="room-content">
                    <h3 class="room-title">${room.name}</h3>
                    <div class="room-details">
                        <p><strong>Size:</strong> ${room.size}</p>
                        <p><strong>Capacity:</strong> ${room.capacity} people</p>
                        <div class="room-features">
                            <strong>Features:</strong>
                            <ul>
                                ${room.features.map(feature => `<li>${feature}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                    <div class="room-pricing">
                        <strong>Pricing:</strong>
                        ${tokenPrice && `<div class="token-price">${tokenPrice}</div>`}
                        ${cashPrices.length > 0 ? `<div class="cash-prices">${cashPrices.join(', ')}</div>` : ''}
                    </div>
                    <div class="room-actions">
                        <button class="btn btn-primary book-room-btn" data-room-id="${room.id}">
                            <?php echo catcafe_get_translation('book_now'); ?>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    function filterRooms() {
        const capacityFilter = $('#capacity-filter').val();
        const paymentFilter = $('#payment-filter').val();
        const featuresFilter = $('#features-filter').val();
        
        let filteredRooms = allRooms.filter(function(room) {
            // Capacity filter
            if (capacityFilter) {
                if (capacityFilter === '1-4' && room.capacity > 4) return false;
                if (capacityFilter === '5-6' && (room.capacity < 5 || room.capacity > 6)) return false;
                if (capacityFilter === '7+' && room.capacity < 7) return false;
            }
            
            // Payment method filter
            if (paymentFilter && !room.booking_options.includes(paymentFilter)) {
                return false;
            }
            
            // Features filter
            if (featuresFilter && !room.features.some(feature => feature.includes(featuresFilter))) {
                return false;
            }
            
            return true;
        });
        
        displayRooms(filteredRooms);
    }
});
</script>

<?php get_footer(); ?>