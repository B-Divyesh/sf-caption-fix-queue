import './legal.css';

const theme = localStorage.getItem('caption-theme');
if (theme === 'dark' || theme === 'light') document.documentElement.dataset.theme = theme;

const themeButton = document.querySelector<HTMLButtonElement>('#theme-button');
themeButton?.addEventListener('click', () => {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  localStorage.setItem('caption-theme', next);
  themeButton.setAttribute('aria-label', next === 'dark' ? 'Use light theme' : 'Use dark theme');
});

function focusRoute(): void {
  const heading = document.querySelector<HTMLElement>('h1');
  heading?.focus({ preventScroll: true });
  const status = document.querySelector<HTMLElement>('#route-status');
  if (heading && status) status.textContent = heading.textContent ?? '';
}

requestAnimationFrame(focusRoute);
window.addEventListener('pageshow', focusRoute);

if ('serviceWorker' in navigator) void navigator.serviceWorker.register('/sw.js');
