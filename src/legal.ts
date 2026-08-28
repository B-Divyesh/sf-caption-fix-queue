import './legal.css';

const theme = localStorage.getItem('caption-theme');
if (theme === 'dark' || theme === 'light') document.documentElement.dataset.theme = theme;

if ('serviceWorker' in navigator) void navigator.serviceWorker.register('/sw.js');
