import { en } from './translations/en';
import { zh } from './translations/zh';

export const translations = {
  en: {
    ...en,
    homePage: {
      title: 'Ofcoz Family - Cat-Friendly Workspace Reservations',
      description: 'Book your perfect cat-friendly workspace at Ofcoz Family. Enjoy comfortable rooms with our adorable resident cats in a cozy, welcoming environment.'
    },
    roomsPage: {
      title: 'Our Rooms & Workspaces',
      description: 'Explore our variety of rooms and workspaces, each designed for comfort and productivity, with our friendly cats to keep you company.'
    },
    pricingPage: {
      ...en.pricing,
      title: 'Pricing & Packages',
      subtitle: 'Find the perfect plan for your needs, from hourly rentals to value packages.'
    },
    loginPage: {
      title: 'Login',
      description: 'Login to your Ofcoz Family account to manage your bookings and view your token balance.'
    },
    registerPage: {
      title: 'Register',
      description: 'Create an account with Ofcoz Family to start booking our cat-friendly workspaces.'
    },
    forgotPasswordPage: {
      title: 'Forgot Password',
      description: 'Reset your password for your Ofcoz Family account.'
    },
    resetPasswordPage: {
      title: 'Reset Password',
      description: 'Set a new password for your Ofcoz Family account.'
    },
    dashboardPage: {
      title: 'My Account',
      description: 'Manage your bookings, reviews, favorites, and personal information in your Ofcoz Family dashboard.'
    },
    adminPage: {
      title: 'Admin Panel',
      description: 'Manage bookings, users, and site settings from the Ofcoz Family admin panel.'
    },
    bookingPage: {
      title: 'Book a Room',
      description: 'Complete your booking for'
    },
    dailyBookingsPage: {
      title: 'Daily Bookings',
      description: 'View all bookings for'
    }
  },
  zh: {
    ...zh,
    homePage: {
      title: 'Ofcoz Family - 貓咪友好工作間預約',
      description: '在Ofcoz Family預約您完美的貓咪友好工作間。與我們可愛的常駐貓咪一起享受舒適的空間，體驗溫馨友好的環境。'
    },
    roomsPage: {
      title: '我們的房間與工作空間',
      description: '探索我們多樣化的房間和工作空間，每個空間都為舒適和高效而設計，還有我們友善的貓咪陪伴您。'
    },
    pricingPage: {
      ...zh.pricing,
      title: '價格與方案',
      subtitle: '從時租到優惠套餐，找到最適合您需求的方案。'
    },
    loginPage: {
      title: '登入',
      description: '登入您的Ofcoz Family帳戶以管理您的預約並查看您的代幣餘額。'
    },
    registerPage: {
      title: '註冊',
      description: '創建一個Ofcoz Family帳戶，開始預約我們的貓咪友好工作空間。'
    },
    forgotPasswordPage: {
      title: '忘記密碼',
      description: '為您的Ofcoz Family帳戶重設密碼。'
    },
    resetPasswordPage: {
      title: '重設密碼',
      description: '為您的Ofcoz Family帳戶設定新密碼。'
    },
    dashboardPage: {
      title: '我的帳戶',
      description: '在您的Ofcoz Family儀表板中管理您的預約、評價、收藏和個人資訊。'
    },
    adminPage: {
      title: '管理後台',
      description: '從Ofcoz Family管理後台管理預約、用戶和網站設定。'
    },
    bookingPage: {
      title: '預約房間',
      description: '完成您的預約：'
    },
    dailyBookingsPage: {
      title: '每日預約',
      description: '查看所有預約於'
    }
  }
};