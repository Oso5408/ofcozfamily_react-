<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="profile" href="https://gmpg.org/xfn/11">
    <?php wp_head(); ?>
</head>

<body <?php body_class(); ?>>
    <?php wp_body_open(); ?>
    
    <header class="site-header">
        <div class="container">
            <div class="header-content">
                <div class="logo">
                    <?php if (has_custom_logo()) : ?>
                        <?php the_custom_logo(); ?>
                    <?php else : ?>
                        <a href="<?php echo esc_url(home_url('/')); ?>">
                            <?php echo catcafe_get_translation('site_title'); ?>
                        </a>
                    <?php endif; ?>
                </div>
                
                <nav class="main-nav">
                    <?php
                    wp_nav_menu(array(
                        'theme_location' => 'primary',
                        'menu_id' => 'primary-menu',
                        'fallback_cb' => 'catcafe_default_menu',
                    ));
                    ?>
                </nav>
                
                <div class="header-actions">
                    <div class="language-toggle">
                        <button type="button" class="lang-btn <?php echo catcafe_get_current_language() === 'en' ? 'active' : ''; ?>" 
                                data-lang="en">EN</button>
                        <button type="button" class="lang-btn <?php echo catcafe_get_current_language() === 'zh' ? 'active' : ''; ?>" 
                                data-lang="zh">中文</button>
                    </div>
                    
                    <div class="user-actions">
                        <?php if (is_user_logged_in()) : ?>
                            <?php $current_user = wp_get_current_user(); ?>
                            <div class="user-menu">
                                <span><?php echo esc_html($current_user->display_name); ?></span>
                                <div class="user-dropdown">
                                    <a href="<?php echo esc_url(home_url('/dashboard')); ?>"><?php echo catcafe_get_translation('dashboard'); ?></a>
                                    <a href="<?php echo wp_logout_url(home_url()); ?>"><?php echo catcafe_get_translation('logout'); ?></a>
                                </div>
                            </div>
                        <?php else : ?>
                            <a href="<?php echo esc_url(home_url('/login')); ?>" class="btn btn-secondary">
                                <?php echo catcafe_get_translation('login'); ?>
                            </a>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </div>
    </header>
    
    <main id="main" class="site-main">

<?php
// Default menu fallback
function catcafe_default_menu() {
    echo '<ul id="primary-menu" class="menu">';
    echo '<li><a href="' . esc_url(home_url('/')) . '">' . catcafe_get_translation('home') . '</a></li>';
    echo '<li><a href="' . esc_url(home_url('/rooms')) . '">' . catcafe_get_translation('rooms') . '</a></li>';
    echo '<li><a href="' . esc_url(home_url('/pricing')) . '">' . catcafe_get_translation('pricing') . '</a></li>';
    echo '<li><a href="' . esc_url(home_url('/contact')) . '">' . catcafe_get_translation('contact') . '</a></li>';
    echo '</ul>';
}
?>