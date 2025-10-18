import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';

// Load migration utilities for browser console
import '@/utils/migrate-to-supabase';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);