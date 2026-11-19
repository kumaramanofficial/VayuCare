import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import PresentationPage from './PresentationPage.tsx';
import './index.css';

const isPresentationRoute = window.location.pathname.startsWith('/presentation');

createRoot(document.getElementById('root')!).render(
  isPresentationRoute ? <PresentationPage /> : <App />
);
