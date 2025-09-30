<?php
/**
 * Template Name: Login Page
 */

// Redirect if already logged in
if (is_user_logged_in()) {
    wp_redirect(home_url('/dashboard'));
    exit;
}

get_header(); ?>

<div class="auth-page">
    <div class="container">
        <div class="auth-container">
            <div class="auth-tabs">
                <button class="auth-tab active" data-tab="login"><?php echo catcafe_get_translation('login'); ?></button>
                <button class="auth-tab" data-tab="register"><?php echo catcafe_get_translation('register'); ?></button>
            </div>
            
            <!-- Login Form -->
            <div class="auth-form-container" id="login-tab">
                <h2><?php echo catcafe_get_translation('welcome_back'); ?></h2>
                <p><?php echo catcafe_get_translation('login_description'); ?></p>
                
                <form id="login-form" class="auth-form">
                    <div class="form-group">
                        <label for="login_email"><?php echo catcafe_get_translation('email'); ?></label>
                        <input type="email" id="login_email" name="login_email" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="login_password"><?php echo catcafe_get_translation('password'); ?></label>
                        <input type="password" id="login_password" name="login_password" required>
                    </div>
                    
                    <div class="form-group checkbox-group">
                        <label>
                            <input type="checkbox" name="remember_me">
                            <?php echo catcafe_get_translation('remember_me'); ?>
                        </label>
                    </div>
                    
                    <button type="submit" class="btn btn-primary btn-full">
                        <?php echo catcafe_get_translation('login'); ?>
                    </button>
                    
                    <div class="auth-links">
                        <a href="<?php echo esc_url(home_url('/forgot-password')); ?>">
                            <?php echo catcafe_get_translation('forgot_password'); ?>
                        </a>
                    </div>
                </form>
            </div>
            
            <!-- Register Form -->
            <div class="auth-form-container" id="register-tab" style="display: none;">
                <h2><?php echo catcafe_get_translation('create_account'); ?></h2>
                <p><?php echo catcafe_get_translation('register_description'); ?></p>
                
                <form id="register-form" class="auth-form">
                    <div class="form-group">
                        <label for="register_name"><?php echo catcafe_get_translation('full_name'); ?></label>
                        <input type="text" id="register_name" name="register_name" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="register_email"><?php echo catcafe_get_translation('email'); ?></label>
                        <input type="email" id="register_email" name="register_email" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="register_phone"><?php echo catcafe_get_translation('phone'); ?></label>
                        <input type="tel" id="register_phone" name="register_phone" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="register_password"><?php echo catcafe_get_translation('password'); ?></label>
                        <input type="password" id="register_password" name="register_password" required minlength="6">
                    </div>
                    
                    <div class="form-group">
                        <label for="confirm_password"><?php echo catcafe_get_translation('confirm_password'); ?></label>
                        <input type="password" id="confirm_password" name="confirm_password" required>
                    </div>
                    
                    <div class="form-group checkbox-group">
                        <label>
                            <input type="checkbox" name="agree_terms" required>
                            <?php echo catcafe_get_translation('agree_terms'); ?>
                        </label>
                    </div>
                    
                    <button type="submit" class="btn btn-primary btn-full">
                        <?php echo catcafe_get_translation('create_account'); ?>
                    </button>
                </form>
            </div>
        </div>
    </div>
</div>

<style>
.auth-page {
    min-height: 80vh;
    display: flex;
    align-items: center;
    background: linear-gradient(135deg, #f5f1eb 0%, #e8ddd4 100%);
    padding: 2rem 0;
}

.auth-container {
    max-width: 450px;
    margin: 0 auto;
    background: white;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.1);
    overflow: hidden;
}

.auth-tabs {
    display: flex;
    background: #f8f9fa;
}

.auth-tab {
    flex: 1;
    padding: 1rem;
    border: none;
    background: transparent;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.3s ease;
}

.auth-tab.active {
    background: white;
    color: #8B4513;
    border-bottom: 2px solid #8B4513;
}

.auth-form-container {
    padding: 2rem;
}

.auth-form h2 {
    margin-bottom: 0.5rem;
    color: #8B4513;
}

.auth-form p {
    margin-bottom: 2rem;
    color: #666;
}

.form-group {
    margin-bottom: 1.5rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #333;
}

.form-group input {
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 16px;
    transition: border-color 0.3s ease;
}

.form-group input:focus {
    outline: none;
    border-color: #8B4513;
    box-shadow: 0 0 0 3px rgba(139, 69, 19, 0.1);
}

.checkbox-group label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
}

.checkbox-group input[type="checkbox"] {
    width: auto;
    margin: 0;
}

.btn-full {
    width: 100%;
    padding: 14px;
    font-size: 16px;
    font-weight: 600;
}

.auth-links {
    text-align: center;
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid #eee;
}

.auth-links a {
    color: #8B4513;
    text-decoration: none;
}

.auth-links a:hover {
    text-decoration: underline;
}

.error-message {
    background: #fee;
    color: #c33;
    padding: 12px;
    border-radius: 6px;
    margin-bottom: 1rem;
    border: 1px solid #fcc;
}

.success-message {
    background: #efe;
    color: #3c3;
    padding: 12px;
    border-radius: 6px;
    margin-bottom: 1rem;
    border: 1px solid #cfc;
}
</style>

<script>
jQuery(document).ready(function($) {
    // Tab switching
    $('.auth-tab').on('click', function() {
        const tab = $(this).data('tab');
        
        $('.auth-tab').removeClass('active');
        $(this).addClass('active');
        
        $('.auth-form-container').hide();
        $('#' + tab + '-tab').show();
    });
    
    // Password confirmation validation
    $('#confirm_password').on('blur', function() {
        const password = $('#register_password').val();
        const confirmPassword = $(this).val();
        
        if (password && confirmPassword && password !== confirmPassword) {
            showError('Passwords do not match');
            $(this).focus();
        }
    });
    
    // Registration form validation
    $('#register-form').on('submit', function(e) {
        const password = $('#register_password').val();
        const confirmPassword = $('#confirm_password').val();
        
        if (password !== confirmPassword) {
            e.preventDefault();
            showError('Passwords do not match');
            return false;
        }
        
        if (password.length < 6) {
            e.preventDefault();
            showError('Password must be at least 6 characters long');
            return false;
        }
    });
    
    function showError(message) {
        const errorHtml = `<div class="error-message">${message}</div>`;
        $('.auth-form').prepend(errorHtml);
        
        setTimeout(function() {
            $('.error-message').fadeOut();
        }, 5000);
    }
    
    function showSuccess(message) {
        const successHtml = `<div class="success-message">${message}</div>`;
        $('.auth-form').prepend(successHtml);
        
        setTimeout(function() {
            $('.success-message').fadeOut();
        }, 5000);
    }
});
</script>

<?php get_footer(); ?>