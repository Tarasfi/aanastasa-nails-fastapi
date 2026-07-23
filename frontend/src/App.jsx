import React from 'react';
import Header from './components/layout/Header';
import ServiceList from './components/services/ServiceList';
import Hero from './components/layout/Hero';

function App() {
  return (
    <div>
      <Header />
      <main>
        <Hero />
        <ServiceList />

      </main>
    </div>
  );
}

export default App;