import React from "react";
import "./Hero.css";

function Hero() {
  return (
    <section className="profile-section">
      {/* Велике фото профілю */}
      <div className="profile-avatar">
        <img src="/logo1.png" alt="Nail Studio Logo" />
      </div>

      {/* Назва та інформація */}
      <h1 className="profile-title">AanastasaNails</h1>

      <div className="profile-info">
        <div className="info-item">
          <i className="fa-solid fa-location-dot"></i>
          <span>Ралівка, вул. Леські 2 кв 1</span>
        </div>

        <div className="info-item">
          <i className="fa-solid fa-phone"></i>
          <a href="tel:0980378911"> 098 876 14 42</a>
        </div>

        <div className="info-item">
          <i className="fa-solid fa-clock"></i>
          <span>Пн - Сб: 09:00 - 21:00</span>
        </div>
      </div>

      {/* Кнопка Instagram */}
      <a
        href="https://instagram.com"
        target="_blank"
        rel="noopener noreferrer"
        className="instagram-btn"
      >
        <i className="fa-brands fa-instagram"></i>Instagram
      </a>
    </section>
  );
}

export default Hero;
