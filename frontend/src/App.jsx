import React, { useState, useEffect } from 'react';
import { getServices } from './api/servicesApi';

function App() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    
    getServices()
      .then((data) => {
        setServices(data); 
        setLoading(false);
      })
      .catch((error) => {
        console.error("Помилка завантаження сервісів:", error);
        setLoading(false);
      });
  }, []); 

  if (loading) return <h2>Завантаження сервісів...</h2>;
  
  return (
    <div>
      <h1>Послуги салонa</h1>
      
      {/* Services */}
      <ul>
        {services.map((service) => (
          <li key={service.id}>
            {service.name} {service.description && `- ${service.description}`} - {service.price} грн - {service.duration_minutes} хв
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App
