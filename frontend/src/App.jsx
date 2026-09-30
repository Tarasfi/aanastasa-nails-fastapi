import React from 'react';
import Header from './components/layout/Header';
import BookingManager from './components/booking/BookingManager'
import Hero from './components/layout/Hero';
import InfoCarousel from './components/info/InfoCarousel';
import Footer from './components/layout/Footer.jsx';

function App() {
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