import React from 'react';
import Header from './components/layout/Header';
import ServiceList from './components/services/ServiceList';

function App() {
  return (
    <div>
      <Header />
      <main>
        <ServiceList/>
      </main>
    </div>
  );
}

export default App;