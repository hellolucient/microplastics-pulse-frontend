import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx'; // Restore App
// import NewsGlobe from './components/NewsGlobe.tsx'; // Remove NewsGlobe import for now
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App /> {/* Restore App */}
    {/* <NewsGlobe /> */} {/* Remove NewsGlobe render */}
  </StrictMode>
);
