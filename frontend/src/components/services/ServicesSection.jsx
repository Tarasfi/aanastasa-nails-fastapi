import React, { useState, useEffect } from 'react';
import './ServicesSection.css';

const API = "http://localhost:8000";

function formatDuration(minutes) {
  if (!minutes) return '';
  if (minutes < 60) return `${minutes} хв.`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours} год. ${mins} хв.` : `${hours} год.`;
}

export default function ServicesSection({ onBookClick }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAccordionOpen, setIsAccordionOpen] = useState(true);

  useEffect(() => {
    fetch(`${API}/services`)
      .then((r) => {
        if (!r.ok) throw new Error("Не вдалося завантажити послуги");
        return r.json();
      })
      .then((d) => {
        setServices(d);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  return (
    <section className="services-container">
      <h2 className="services-main-title">Послуги</h2>

      {/* Акордеон категорій */}
      <div
        className="accordion-header"
        onClick={() => setIsAccordionOpen(!isAccordionOpen)}
      >
        <span className="accordion-title">Манікюр</span>
        <span className={`accordion-arrow ${isAccordionOpen ? 'open' : ''}`}>
          ‹
        </span>
      </div>

      {loading && <div className="services-loader">Завантаження послуг...</div>}
      {error && <div className="services-error">⚠️ {error}</div>}

      {/* Обгортка для плавної анімації відкриття/закриття */}
      <div className={`accordion-collapse ${isAccordionOpen ? 'open' : ''}`}>
        <div className="accordion-body">
          {!loading && (
            <div className="services-list">
              {services.map((svc) => (
                <div key={svc.id} className="service-item">
                  <div className="service-info">
                    <h3 className="service-title">{svc.name}</h3>
                    <div className="service-meta">
                      <span className="service-price">{svc.price} грн</span>
                      <span className="meta-dot">•</span>
                      <span className="service-duration">
                        {formatDuration(svc.duration_minutes)}
                      </span>
                    </div>

                    {/* Опис без кнопки "Показати більше" */}
                    {svc.description && (
                      <div className="service-description-block">
                        <p className="service-description-text">{svc.description}</p>
                      </div>
                    )}
                  </div>

                  <button
                    className="btn-service-book"
                    onClick={() => onBookClick && onBookClick(svc)}
                  >
                    Обрати
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}