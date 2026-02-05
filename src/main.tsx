import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Global error listener for debugging white screens
window.onerror = (message, source, lineno, colno, error) => {
  const root = document.getElementById('root');
  if (root) {
    // Check if error overlay already exists to avoid stacking
    if (!document.getElementById('crash-overlay')) {
      const overlay = document.createElement('div');
      overlay.id = 'crash-overlay';
      overlay.style.cssText = 'position:fixed; inset:0; z-index:9999; padding:20px; background:black; color:#ffb7c5; font-family:monospace; overflow:auto;';
      overlay.innerHTML = `
        <h1 style="color:red; font-size: 24px;">Runtime Crash</h1>
        <p style="font-size: 16px;">${message}</p>
        <p style="color:#666; font-size: 12px;">${source}:${lineno}:${colno}</p>
        <pre style="margin-top:20px; white-space:pre-wrap; font-size: 12px; color:#aaa;">${error?.stack || 'No stack trace'}</pre>
        <button onclick="window.location.reload()" style="margin-top:20px; padding:10px 20px; background:#333; color:white; border:1px solid #555; border-radius:4px;">RELOAD APP</button>
      `;
      document.body.appendChild(overlay);
    }
  }
};

// Catch Unhandled Promise Rejections (common in async code)
window.addEventListener('unhandledrejection', (event) => {
  const root = document.getElementById('root');
  if (root && !document.getElementById('crash-overlay')) {
    const overlay = document.createElement('div');
    overlay.id = 'crash-overlay';
    overlay.style.cssText = 'position:fixed; inset:0; z-index:9999; padding:20px; background:black; color:#ffb7c5; font-family:monospace; overflow:auto;';
    overlay.innerHTML = `
        <h1 style="color:orange; font-size: 24px;">Promise Rejection</h1>
        <p style="font-size: 16px;">${event.reason?.message || event.reason}</p>
        <pre style="margin-top:20px; white-space:pre-wrap; font-size: 12px; color:#aaa;">${event.reason?.stack || 'No stack trace'}</pre>
        <button onclick="window.location.reload()" style="margin-top:20px; padding:10px 20px; background:#333; color:white; border:1px solid #555; border-radius:4px;">RELOAD APP</button>
      `;
    document.body.appendChild(overlay);
  }
});

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

/*
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
*/