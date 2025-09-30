<?php
/**
 * The main template file
 */

get_header(); ?>

<div class="hero-section">
    <div class="container">
        <h1 class="hero-title"><?php echo catcafe_get_translation('hero_title'); ?></h1>
        <p class="hero-subtitle"><?php echo catcafe_get_translation('hero_subtitle'); ?></p>
        <div class="hero-actions">
            <a href="<?php echo esc_url(home_url('/rooms')); ?>" class="btn btn-primary">
                <?php echo catcafe_get_translation('view_rooms'); ?>
            </a>
            <a href="<?php echo esc_url(home_url('/contact')); ?>" class="btn btn-secondary">
                <?php echo catcafe_get_translation('contact_us'); ?>
            </a>
        </div>
    </div>
</div>

<section class="rooms-section">
    <div class="container">
        <h2 class="section-title"><?php echo catcafe_get_translation('our_rooms'); ?></h2>
        <div class="rooms-grid" id="rooms-container">
            <!-- Rooms will be loaded via AJAX -->
        </div>
        <div class="text-center">
            <a href="<?php echo esc_url(home_url('/rooms')); ?>" class="btn btn-primary">
                <?php echo catcafe_get_translation('view_all_rooms'); ?>
            </a>
        </div>
    </div>
</section>

<section class="features-section">
    <div class="container">
        <h2 class="section-title"><?php echo catcafe_get_translation('why_choose_us'); ?></h2>
        <div class="features-grid">
            <div class="feature-card">
                <div class="feature-icon">🐱</div>
                <h3><?php echo catcafe_get_translation('cat_friendly'); ?></h3>
                <p><?php echo catcafe_get_translation('cat_friendly_desc'); ?></p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">💻</div>
                <h3><?php echo catcafe_get_translation('workspace'); ?></h3>
                <p><?php echo catcafe_get_translation('workspace_desc'); ?></p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">☕</div>
                <h3><?php echo catcafe_get_translation('comfort'); ?></h3>
                <p><?php echo catcafe_get_translation('comfort_desc'); ?></p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">📱</div>
                <h3><?php echo catcafe_get_translation('easy_booking'); ?></h3>
                <p><?php echo catcafe_get_translation('easy_booking_desc'); ?></p>
            </div>
        </div>
    </div>
</section>

<section class="contact-section">
    <div class="container">
        <h2 class="section-title"><?php echo catcafe_get_translation('get_in_touch'); ?></h2>
        <div class="contact-content">
            <div class="contact-info">
                <h3><?php echo catcafe_get_translation('contact_information'); ?></h3>
                <div class="contact-item">
                    <strong><?php echo catcafe_get_translation('phone'); ?>:</strong>
                    <span><?php echo catcafe_get_translation('contact_phone'); ?></span>
                </div>
                <div class="contact-item">
                    <strong><?php echo catcafe_get_translation('email'); ?>:</strong>
                    <span><?php echo catcafe_get_translation('contact_email'); ?></span>
                </div>
                <div class="contact-item">
                    <strong><?php echo catcafe_get_translation('hours'); ?>:</strong>
                    <span><?php echo catcafe_get_translation('operating_hours'); ?></span>
                </div>
            </div>
            
            <div class="contact-form">
                <h3><?php echo catcafe_get_translation('send_message'); ?></h3>
                <form id="contact-form">
                    <div class="form-group">
                        <input type="text" name="name" placeholder="<?php echo catcafe_get_translation('your_name'); ?>" required>
                    </div>
                    <div class="form-group">
                        <input type="email" name="email" placeholder="<?php echo catcafe_get_translation('your_email'); ?>" required>
                    </div>
                    <div class="form-group">
                        <input type="text" name="subject" placeholder="<?php echo catcafe_get_translation('subject'); ?>" required>
                    </div>
                    <div class="form-group">
                        <textarea name="message" placeholder="<?php echo catcafe_get_translation('your_message'); ?>" rows="5" required></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary">
                        <?php echo catcafe_get_translation('send_message'); ?>
                    </button>
                </form>
            </div>
        </div>
    </div>
</section>

<?php get_footer(); ?>