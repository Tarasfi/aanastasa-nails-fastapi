import React from 'react';

function ServiceCard({ service }) {
  return (
    <li>
      {service.name} {service.description && `- ${service.description}`} - {service.price} грн - {service.duration_minutes} хв
    </li>
  );
}

export default ServiceCard;