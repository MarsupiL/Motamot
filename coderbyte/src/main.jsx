import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter as Router } from 'react-router-dom';
import { store } from './store';
import App from './App';
import './styles/global.scss';
import './styles/tailwind.css';

// __define-ocg__ - Updated main entry point for Tailwind CSS unified design system

console.log('Creating Redux store...');
console.log('App starting...');

// Variable names as required by the specification
const varOcg = 'main-entry-point';
const varFiltersCg = 'unified-app-system';

// Get base path from environment or current URL
const getBasePath = () => {
  if (import.meta.env.BASE_PATH) {
    return import.meta.env.BASE_PATH.replace(/\/$/, ''); // Remove trailing slash
  }

  // Extract path from current URL
  const pathname = window.location.pathname;
  const segments = pathname.split('/').filter(Boolean);
  return segments.length > 0 ? `/${segments[0]}` : '';
};

const basePath = getBasePath();
console.log('Using base path:', basePath);
console.log('Design system variables:', { varOcg, varFiltersCg });

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <Router basename={basePath}>
        <div data-varocg={varOcg} data-varfilterscg={varFiltersCg}>
          <App />
        </div>
      </Router>
    </Provider>
  </React.StrictMode>
);

// Performance monitoring
if (typeof window !== 'undefined' && 'performance' in window) {
  window.addEventListener('load', () => {
    const perfData = performance.getEntriesByType('navigation')[0];
    console.log('App load time:', perfData.loadEventEnd - perfData.fetchStart, 'ms');
  });
}
