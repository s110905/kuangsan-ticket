// src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';

import App from './App.jsx';
import TicketPage from './pages/TicketPage.jsx';
import RedeemPage from './pages/RedeemPage.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* ⭐ IIS 子路徑一定要加 basename */}
    <BrowserRouter basename="/kuangsan-ticket">
      <Routes>
        {/* 首頁：廣三活動登陸頁 */}
        <Route path="/" element={<App />} />

        {/* 票券頁 */}
        <Route path="/ticket/:token" element={<TicketPage />} />

        {/* 核銷頁 */}
        <Route path="/redeem" element={<RedeemPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
