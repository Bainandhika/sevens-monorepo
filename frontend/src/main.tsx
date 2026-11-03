import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

/**
 * Main application entry point for 7-an (Tujuhan Tactical)
 * Strictly adheres to Step 25 specification, mounting root App into DOM #root
 */
const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error('[Root Entry] Failed to locate #root DOM container element.');
}
