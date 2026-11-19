import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App, preloadRoute } from './App';
import './styles/base.css';

const start = () =>
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );

// Chờ chunk của route đang mở rồi mới vẽ. Tải lỗi thì vẫn vẽ, trang sẽ tự báo.
preloadRoute(window.location.pathname).then(start, start);
