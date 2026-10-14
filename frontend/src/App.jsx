import React, { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import BookingManager from './components/booking/BookingManager';
import Hero from './components/layout/Hero';
import InfoCarousel from './components/info/InfoCarousel';
import Footer from './components/layout/Footer.jsx';
import AdminPage from "./components/admin/AdminPage";

function App() {
  const [isAdminPath, setIsAdminPath] = useState(false);

  useEffect(() => {
    // Перевіряємо, чи в URL є /admin
    if (window.location.pathname === '/admin') {
      setIsAdminPath(true);
    }
  }, []);

  // Якщо шлях /admin — рендеримо тільки адмінку
  if (isAdminPath) {
    return <AdminPage />;
  }

  // Інакше рендеримо звичайний сайт
  return (
    <div>
      <Header />
      <main>
        <Hero />
        <BookingManager />
        <InfoCarousel />
        <Footer />
      </main>
    </div>
  );
}

export default App;