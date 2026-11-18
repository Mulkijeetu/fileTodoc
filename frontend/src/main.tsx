import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import Speak from './Speak';
import './index.css';

const path = window.location.pathname.replace(/\/$/, '') || '/';
const page = path === '/speak' ? <Speak /> : <App />;

createRoot(document.getElementById('root')!).render(<StrictMode>{page}</StrictMode>);
