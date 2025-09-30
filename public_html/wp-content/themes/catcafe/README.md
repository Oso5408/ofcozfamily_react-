# Cat Cafe WordPress Theme & Plugin

A complete WordPress solution for cat cafe booking and e-commerce, converted from React to PHP for Hostinger deployment.

## Installation Instructions for Hostinger

### 1. Database Setup
1. Create a new MySQL database in your Hostinger control panel
2. Note down the database name, username, password, and host
3. Update `wp-config.php` with your database credentials

### 2. File Upload
1. Upload all files from the `public_html` folder to your Hostinger account's `public_html` directory
2. Ensure file permissions are correctly set (usually 644 for files, 755 for directories)

### 3. WordPress Installation
1. Visit your domain to run the WordPress installation
2. Follow the installation wizard
3. Create an admin account

### 4. Theme & Plugin Activation
1. Log into WordPress admin
2. Go to Appearance > Themes and activate "Cat Cafe Booking"
3. Go to Plugins and activate "Cat Cafe Booking System"
4. The plugin will automatically create necessary database tables

### 5. Initial Setup
1. Go to Cat Cafe > Settings in WordPress admin
2. Configure your basic settings
3. Add rooms through WordPress admin (Custom Post Type: Rooms)
4. Set up your menu in Appearance > Menus

## Features

### Frontend Features
- **Bilingual Support**: English and Chinese language switching
- **Room Booking System**: Interactive booking with calendar
- **User Dashboard**: Personal booking management and profile
- **Token System**: Virtual currency for bookings
- **Responsive Design**: Mobile-friendly interface
- **Shopping Cart**: E-commerce functionality (ready for expansion)

### Admin Features
- **Booking Management**: View, edit, and manage all bookings
- **User Management**: Manage users and their token balances
- **Room Management**: Add/edit rooms with custom fields
- **Dashboard Analytics**: Basic statistics and overview
- **Settings Panel**: Configure system parameters

### Technical Features
- **WordPress Integration**: Full WordPress theme and plugin
- **AJAX Functionality**: Dynamic loading without page refresh
- **Database Integration**: Proper MySQL database structure
- **Email Notifications**: Booking confirmations and updates
- **Security**: Nonces, sanitization, and proper permissions

## Database Schema

The plugin creates the following tables:
- `wp_catcafe_users` - Extended user profiles with tokens
- `wp_catcafe_rooms` - Room information and pricing
- `wp_catcafe_bookings` - Booking records
- `wp_catcafe_token_history` - Token transaction history
- `wp_catcafe_products` - E-commerce products
- `wp_catcafe_cart` - Shopping cart items
- `wp_catcafe_orders` - Order history
- `wp_catcafe_settings` - Bilingual content and settings

## Default Data

The plugin includes default room data based on the original React application:
- Room B (6 capacity, 約70尺)
- Room C (4 capacity, 約60-90尺, TV)
- Room D (7 capacity, 約60尺, Garden view)
- Room E (6 capacity, 約60尺, Themed decor, TV)
- Room H (6 capacity, 約60尺, Spacious living area)

## Page Templates

The theme includes specialized page templates:
- `page-login.php` - Login and registration
- `page-rooms.php` - Room listings with filters
- `page-dashboard.php` - User dashboard
- Standard WordPress pages (home, contact, etc.)

## Language Support

The theme supports English and Chinese languages through:
- Custom translation functions
- Cookie-based language storage
- AJAX language switching
- Bilingual content in database

## Customization

### Adding New Rooms
1. Go to WordPress admin > Cat Cafe > Rooms
2. Add new room with details, pricing, and features
3. Set featured image for room photo

### Modifying Translations
1. Edit the translation functions in `functions.php`
2. Update database settings through Cat Cafe > Settings
3. Modify JavaScript language objects in theme files

### Styling Changes
1. Edit `style.css` for main styling
2. Add custom CSS through WordPress Customizer
3. Modify individual page templates as needed

## Support Files

- `wp-config.php` - WordPress configuration (update database credentials)
- `functions.php` - Theme functions and custom post types
- `js/catcafe.js` - Frontend JavaScript functionality
- Plugin files in `wp-content/plugins/catcafe-booking/`

## Troubleshooting

### Common Issues
1. **Database Connection Error**: Check wp-config.php credentials
2. **Plugin Not Working**: Ensure plugin is activated and tables are created
3. **AJAX Errors**: Check WordPress nonces and user permissions
4. **Language Not Switching**: Clear browser cookies and cache

### Debug Mode
Add these lines to wp-config.php for debugging:
```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
```

## Security Notes

- Change WordPress default admin credentials
- Use strong database passwords
- Regular security updates
- Backup database regularly
- Monitor user permissions

## Performance Optimization

For Hostinger hosting:
- Enable caching plugins
- Optimize images
- Use CDN if needed
- Regular database cleanup
- Monitor resource usage

## Contact Information

This system replaces the original React application with a full WordPress solution suitable for shared hosting environments like Hostinger.