import React, { useState } from "react";
import "./Header.css";

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  return (
    <header className="header">
      
      <div className="header-top">
        <div className="header-logo">
          
          <img src="/logo1.png" alt="Aanastasa nails Logo" /> 
        </div>

        <div className="header-actions">
          <a href="tel:0980378911" className="header-phone">
            📞 <span>098 037 89 11</span>
          </a>
          <button className="header-burger" aria-label="Menu" onClick={toggleMenu}>
            {isMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      
      {isMenuOpen && (
        <nav className="mobile-menu">
          <ul>
            <li><a href="#services" onClick={toggleMenu}>Послуги</a></li>
            <li><a href="#contacts" onClick={toggleMenu}>Контакти</a></li>
            <li><a href="#instagram" onClick={toggleMenu}>Instagram</a></li>
          </ul>
        </nav>
      )}
    </header>
  );
}

export default Header;