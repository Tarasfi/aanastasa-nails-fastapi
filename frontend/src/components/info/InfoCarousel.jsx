import React, { useState, useEffect, useRef } from 'react';
import './InfoCarousel.css';

const images = [
  '/firstExample.jpg',
  '/secondExample.jpg',
  '/thirdExample.jpg',
  '/fourthExample.jpg',
  '/fifthExample.jpg',
];

const extendedImages = [...images, images[0]];

function InfoCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimated, setIsAnimated] = useState(true);
  
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const isInteracting = useRef(false);
  const isTransitioning = useRef(false); 

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isInteracting.current && !isTransitioning.current) {
        handleNext();
      }
    }, 3500);

    return () => clearInterval(timer);
  }, [currentIndex]);

  const handleNext = () => {
    if (isTransitioning.current || currentIndex >= images.length) return;
    
    isTransitioning.current = true;
    setIsAnimated(true);
    setCurrentIndex((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (isTransitioning.current) return;
    
    isTransitioning.current = true;
    setIsAnimated(true);
    
    if (currentIndex === 0) {
      setIsAnimated(false);
      setCurrentIndex(images.length);
      setTimeout(() => {
        setIsAnimated(true);
        setCurrentIndex(images.length - 1);
      }, 20);
    } else {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleTransitionEnd = () => {
    isTransitioning.current = false;
    
    if (currentIndex >= images.length) {
      setIsAnimated(false);
      setCurrentIndex(0);
    }
  };

  const handleTouchStart = (e) => {
    isInteracting.current = true;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;

    if (distance > 40) {
      handleNext();
    } else if (distance < -40) {
      handlePrev();
    }

    touchStartX.current = 0;
    touchEndX.current = 0;
    setTimeout(() => {
      isInteracting.current = false;
    }, 2000);
  };

  return (
    <section className="info-carousel-section">
      <div className="info-text">
        <h2 className="info-title">Приклади робіт</h2>
      </div>

      <div className="carousel-container">
        {/* Кнопки перемикання для ПК */}
        <button className="carousel-arrow prev" onClick={handlePrev} aria-label="Попередній слайд">
          ‹
        </button>
        <button className="carousel-arrow next" onClick={handleNext} aria-label="Наступний слайд">
          ›
        </button>

        <div
          className="carousel-track"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
            transition: isAnimated ? 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)' : 'none',
          }}
          onTransitionEnd={handleTransitionEnd}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {extendedImages.map((img, index) => (
            <div key={index} className="carousel-slide">
              <img src={img} alt={`Slide ${index + 1}`} className="carousel-image" />
            </div>
          ))}
        </div>

        {/* Крапки-індикатори */}
        <div className="carousel-dots">
          {images.map((_, index) => (
            <span
              key={index}
              className={`dot ${(currentIndex % images.length) === index ? 'active' : ''}`}
              onClick={() => {
                if (isTransitioning.current) return;
                setIsAnimated(true);
                setCurrentIndex(index);
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default InfoCarousel;