import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Global error listener for debugging white screens
window.onerror = (message, source, lineno, colno, error) => {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `<div style="padding: 20px; background: black; color: #ffb7c5; font-family: monospace;">
      <h1>Runtime Error</h1>
      <p>${message}</p>
      <pre>${error?.stack || ''}</pre>
    </div>`;
  }
};

try {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
} catch (e: any) {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `<div style="padding: 20px; background: black; color: #ffb7c5; font-family: monospace;">
      <h1>Initial Render Error</h1>
      <p>${e.message}</p>
    </div>`;
  }
}

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}