import React, { useState } from "react";
import {
  FaInstagram,
  FaTelegramPlane,
  FaViber,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaClock,
  FaCopy,
  FaCheck,
} from "react-icons/fa";
import "./Footer.css";

export default function Footer({ onBookClick }) {
  const [copied, setCopied] = useState(false);

  const mapAddress =
    "https://www.google.com/maps/place/Vul.+Ivana+Franka,+53,+Ralivka,+L'vivs'ka+oblast,+Ukraine,+81473/@49.4994114,23.2402015,1027m/data=!3m2!1e3!4b1!4m6!3m5!1s0x473baf8cfe293fef:0x14e0346c51d388f2!8m2!3d49.4994079!4d23.2427764!16s%2Fg%2F11ylfzlyyn?entry=ttu&g_ep=EgoyMDI2MDkwMi4wIKXMDSoASAFQAw%3D%3D";
  const phoneNumber = "+380988761442";

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(phoneNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <footer className="footer">
      <div className="location-section">
        <h3 className="location-title">Як мене знайти</h3>

        {/* Карта */}
<div className="map-card">
  <iframe
    title="Google Map Location"
    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d7000!2d23.2427764!3d49.4994079!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x473baf8cfe293fef%3A0x14e0346c51d388f2!2z0LLRg9C70LjRhtGPINCG0LLQsNC90LAg0KTRgNCw0L3OusCwLCA1Mywg0KDQsNC70ZbQstC60LAsINCb0YzQstGW0LLRgdGM0LrQsCDQvtCx0LvQsNGB0YLRjCwgODE0NzM!5e0!3m2!1suk!2sua!4v1710000000000!5m2!1suk!2sua"
    className="map-iframe"
    loading="lazy"
    allowFullScreen
  ></iframe>
</div>



        {/* Контактні дані */}
        <div className="contacts-block">
          {/* Телефон */}
          <div className="contact-item">
            <span className="contact-label">Телефон:</span>
            <div className="contact-value-row">
              <FaPhoneAlt className="contact-icon" />
              <a href={`tel:${phoneNumber}`} className="contact-phone">
                +38 098 876 14 42
              </a>
              <button
                className="btn-copy"
                onClick={handleCopyPhone}
                title="Скопіювати номер"
              >
                {copied ? <FaCheck className="copied-icon" /> : <FaCopy />}
              </button>
            </div>
          </div>

          {/* Адреса */}
          <div className="contact-item">
            <span className="contact-label">Адреса:</span>
            <div className="contact-value-row">
              <FaMapMarkerAlt className="contact-icon" />
              <a
                href={mapAddress}
                target="_blank"
                rel="noreferrer"
                className="contact-address"
              >
                с. Ралівка, вул. Леські 2, кв 1
              </a>
            </div>
          </div>

          {/* Графік роботи */}
          <div className="contact-item">
            <span className="contact-label">Графік роботи:</span>
            <div className="contact-value-row">
              <FaClock className="contact-icon" />
              <span className="contact-time">Пн – Сб: 09:00 - 21:00</span>
            </div>
          </div>
        </div>
      </div>

      {/* Іконки соцмереж / зв'язку */}
      <ul className="social-icons">
        <li className="icon-elem">
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
            className="social-link"
            aria-label="Instagram"
          >
            <FaInstagram />
          </a>
        </li>
        <li className="icon-elem">
          <a
            href="https://t.me"
            target="_blank"
            rel="noreferrer"
            className="social-link"
            aria-label="Telegram"
          >
            <FaTelegramPlane />
          </a>
        </li>

        <li className="icon-elem">
          <a
            href="tel:+380988761442"
            className="social-link"
            aria-label="Телефон"
          >
            <FaPhoneAlt />
          </a>
        </li>
      </ul>

      {/* Текст з роком та правами */}
      <p className="footer-copyright">
        © {new Date().getFullYear()} Aanastasa Nails | Всі права захищені
      </p>
    </footer>
  );
}
