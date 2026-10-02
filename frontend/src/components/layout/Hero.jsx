import React from "react";
import "./Hero.css";

function Hero() {
  return (
    <section className="profile-section">
      {/* Аватар */}
      <div className="profile-avatar">
        <img src="/logo1.png" alt="AanastasaNails Logo" />
      </div>

      {/* Права частина з інформацією */}
      <div className="profile-content">
        <h1 className="profile-title">AanastasaNails</h1>

        <div className="profile-info">
          <div className="info-item">
            <i className="fa-solid fa-location-dot"></i>
            <span>Ралівка, вул. Леські 2 кв 1</span>
          </div>

          <div className="info-item">
            <i className="fa-solid fa-phone"></i>
            <a href="tel:+380988761442"> +380 98 876 14 42</a>
          </div>

          <div className="info-item">
            <i className="fa-solid fa-clock"></i>
            <span>Пн - Сб: 09:00 - 21:00</span>
          </div>
        </div>

        <a
          href="https://instagram.com"
          target="_blank"
          rel="noopener noreferrer"
          className="instagram-btn"
        >
          <i className="fa-brands fa-instagram"></i> Instagram
        </a>
      </div>
    </section>
  );
}

export default Hero;