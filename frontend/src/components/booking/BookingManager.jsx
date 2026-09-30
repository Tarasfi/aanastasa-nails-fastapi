import React, { useState } from 'react';
import ServicesSection from '../services/ServicesSection.jsx';
import BookingModal from './BookingModal';

export default function BookingManager() {
  const [selectedService, setSelectedService] = useState(null);

  return (
    <>
      <ServicesSection
        onBookClick={(service) => setSelectedService(service)}
      />

      {selectedService && (
        <BookingModal
          service={selectedService}
          onClose={() => setSelectedService(null)}
        />
      )}
    </>
  );
}