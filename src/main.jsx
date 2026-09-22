import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import './styles/components.css';
import './styles/layout.css';
import './styles/landing.css';
import './styles/auth.css';
import './styles/onboarding.css';
import './styles/dashboard.css';
import './styles/create.css';
import './styles/premium-reference.css';
import './styles/premium-phase2.css';
import App from './App';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
