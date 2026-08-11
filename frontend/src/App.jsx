import React from 'react';
import Header from './components/layout/Header';
import ServicesSection from './components/services/ServicesSection.jsx';
import Hero from './components/layout/Hero';
import InfoCarousel from './components/info/InfoCarousel';


function App() {
  return (
    <div>
      <Header />
      <main>
        <Hero />
        <ServicesSection />
        <InfoCarousel />
      </main>
    </div>
  );
}

export default App;