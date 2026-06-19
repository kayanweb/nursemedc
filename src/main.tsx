import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { SettingsProvider } from './context/SettingsContext.tsx';
import { Toaster } from 'sonner';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <Toaster position="top-center" richColors />
      <App />
    </SettingsProvider>
  </StrictMode>,
);
