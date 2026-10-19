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

  // Окремий стан акордеонів для кожної категорії
  const [isManicureOpen, setIsManicureOpen] = useState(true);
  const [isPedicureOpen, setIsPedicureOpen] = useState(false);

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

  // Фільтрація та сортування за ціною (від дорожчих до дешевших: b.price - a.price)
  const manicureServices = services
    .filter((s) => !s.category || s.category === 'manicure')
    .sort((a, b) => Number(b.price) - Number(a.price));

  const pedicureServices = services
    .filter((s) => s.category === 'pedicure')
    .sort((a, b) => Number(b.price) - Number(a.price));

  return (
    <section className="services-container">
      <h2 className="services-main-title">Послуги</h2>

      {loading && <div className="services-loader">Завантаження послуг...</div>}
      {error && <div className="services-error">{error}</div>}

      {!loading && !error && (
        <>
          {/* ================= 1. МАНІКЮР ================= */}
          <div
            className="accordion-header"
            onClick={() => setIsManicureOpen(!isManicureOpen)}
          >
            <span className="accordion-title">
              Манікюр ({manicureServices.length})
            </span>
            <span className={`accordion-arrow ${isManicureOpen ? 'open' : ''}`}>
              ‹
            </span>
          </div>

          <div className={`accordion-collapse ${isManicureOpen ? 'open' : ''}`}>
            <div className="accordion-body">
              <div className="services-list">
                {manicureServices.length > 0 ? (
                  manicureServices.map((svc) => (
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
                  ))
                ) : (
                  <div className="no-services">Послуг з манікюру поки немає</div>
                )}
              </div>
            </div>
          </div>

          {/* ================= 2. ПЕДИКЮР ================= */}
          <div
            className="accordion-header"
            onClick={() => setIsPedicureOpen(!isPedicureOpen)}
            style={{ marginTop: '16px' }}
          >
            <span className="accordion-title">
              Педикюр ({pedicureServices.length})
            </span>
            <span className={`accordion-arrow ${isPedicureOpen ? 'open' : ''}`}>
              ‹
            </span>
          </div>

          <div className={`accordion-collapse ${isPedicureOpen ? 'open' : ''}`}>
            <div className="accordion-body">
              <div className="services-list">
                {pedicureServices.length > 0 ? (
                  pedicureServices.map((svc) => (
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
                  ))
                ) : (
                  <div className="no-services" style={{ padding: '16px 0', color: '#888' }}>
                    Послуг з педикюру поки немає
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}