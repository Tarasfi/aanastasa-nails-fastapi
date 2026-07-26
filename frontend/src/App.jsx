import React from 'react';
import Header from './components/layout/Header';
import ServiceList from './components/services/ServiceList';
import Hero from './components/layout/Hero';
import InfoCarousel from './components/info/InfoCarousel';

function App() {
  return (
    <div>
      <Header />
      <main>
        <Hero />
        
        <InfoCarousel />
        <ServiceList />
      </main>
    </div>
  );
}

export default App;