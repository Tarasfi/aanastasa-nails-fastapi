import React, { useState, useEffect } from 'react';
import { getServices } from '../../api/servicesApi'; 
import ServiceCard from './ServiceCard';

function ServiceList() {
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
      <h2>Послуги секс</h2>
      <ul>
        {services.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </ul>
    </div>
  );
}

export default ServiceList;