import React, { useState, useEffect, useRef } from 'react';
import './Admin.css';

const API_URL = 'http://localhost:8000';

export default function AdminDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [servicesMap, setServicesMap] = useState({}); // Словник id -> {name, price}
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [newBookingAlert, setNewBookingAlert] = useState(null);

  const [newService, setNewService] = useState({
    name: '',
    price: '',
    duration_minutes: '',
    description: '',
  });

  const token = localStorage.getItem('admin_token');
  const prevBookingsCountRef = useRef(0);
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const authFetch = async (url, options = {}) => {
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const res = await fetch(url, { ...options, headers });
    
    if (res.status === 401) {
      localStorage.removeItem('admin_token');
      onLogout();
      throw new Error('Сесія закінчилася. Будь ласка, увійдіть знову');
    }
    
    return res;
  };

  // Спочатку завантажуємо послуги, щоб створити картотеку для зпоставлення ID
  useEffect(() => {
    fetchServicesMap();
  }, []);

  useEffect(() => {
    let intervalId;

    if (activeTab === 'bookings') {
      isFirstLoadRef.current = true;
      fetchBookings(true);

      intervalId = setInterval(() => {
        fetchBookings(false);
      }, 7000);
    } else if (activeTab === 'services') {
      fetchServices();
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeTab]);

  // Завантаження послуг для створення словника { id: { name, price } }
  const fetchServicesMap = async () => {
    try {
      const res = await fetch(`${API_URL}/services`);
      if (res.ok) {
        const data = await res.json();
        setServices(data);
        
        // Створюємо карту id -> об'єкт послуги
        const map = {};
        data.forEach((s) => {
          map[s.id] = s;
        });
        setServicesMap(map);
      }
    } catch (e) {
      console.error("Не вдалося завантажити карту послуг", e);
    }
  };

  const triggerNewBookingNotification = (clientName) => {
    setNewBookingAlert(`🔔 Новий запис від ${clientName || 'клієнта'}!`);
    setTimeout(() => setNewBookingAlert(null), 5000);

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Aanastasa Nails', {
        body: `Нове бронювання від ${clientName || 'клієнта'}!`,
        icon: '/favicon.ico',
      });
    }
  };

  // 1. Обчислення загальної ціни на фронтенді
  const calculateTotalPrice = (b) => {
    if (b.total_price !== undefined && b.total_price !== null && b.total_price > 0) {
      return b.total_price;
    }
    // Якщо прийшов масив ID (service_ids)
    if (Array.isArray(b.service_ids) && b.service_ids.length > 0) {
      return b.service_ids.reduce((sum, id) => {
        const service = servicesMap[id];
        return sum + (service ? Number(service.price) || 0 : 0);
      }, 0);
    }
    // Якщо прийшов масив об'єктів services
    if (Array.isArray(b.services) && b.services.length > 0) {
      return b.services.reduce((sum, s) => {
        const price = typeof s === 'object' ? s.price : (servicesMap[s]?.price || 0);
        return sum + (Number(price) || 0);
      }, 0);
    }
    return 0;
  };

  // 2. Форматування списку послуг на фронтенді
  const renderServicesList = (b) => {
    // Якщо масив service_ids [1, 2]
    if (Array.isArray(b.service_ids) && b.service_ids.length > 0) {
      const names = b.service_ids
        .map((id) => servicesMap[id]?.name)
        .filter(Boolean);
      return names.length > 0 ? names.join(', ') : 'Завантаження послуг...';
    }
    // Якщо масив об'єктів services [{name: '...'}, ...]
    if (Array.isArray(b.services) && b.services.length > 0) {
      return b.services
        .map((s) => (typeof s === 'object' ? s.name : servicesMap[s]?.name || s))
        .filter(Boolean)
        .join(', ');
    }
    return 'Не вказано';
  };

  // --- 1. ЛОГІКА ДЛЯ БРОНЮВАНЬ ---

  const fetchBookings = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    setError('');
    try {
      const res = await authFetch(`${API_URL}/bookings`);
      if (!res.ok) throw new Error('Не вдалося завантажити записи');
      const data = await res.json();

      // Сортування по даті та часу (від найновіших)
      const sortedData = [...data].sort((a, b) => {
        const dateA = new Date(`${a.booking_date}T${a.booking_time || '00:00'}`);
        const dateB = new Date(`${b.booking_date}T${b.booking_time || '00:00'}`);
        return dateB - dateA;
      });

      if (!isFirstLoadRef.current && sortedData.length > prevBookingsCountRef.current) {
        const latestBooking = sortedData[0];
        triggerNewBookingNotification(latestBooking?.client_name);
      }

      prevBookingsCountRef.current = sortedData.length;
      isFirstLoadRef.current = false;
      setBookings(sortedData);
    } catch (err) {
      setError(err.message);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const handleUpdateStatus = async (bookingId, newStatus) => {
    try {
      const res = await authFetch(`${API_URL}/bookings/${bookingId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Не вдалося оновити статус');
      
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      );
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Ви впевнені, що хочете скасувати цей запис?')) return;

    try {
      const res = await authFetch(`${API_URL}/bookings/${bookingId}`, {
        method: 'DELETE',
      });
      if (!res.ok && res.status !== 204) throw new Error('Не вдалося скасувати запис');

      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
      prevBookingsCountRef.current -= 1;
    } catch (err) {
      alert(err.message);
    }
  };

  // --- 2. ЛОГІКА ДЛЯ ПОСЛУГ ---

  const fetchServices = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/services`);
      if (!res.ok) throw new Error('Не вдалося завантажити послуги');
      const data = await res.json();
      setServices(data);
      
      const map = {};
      data.forEach((s) => {
        map[s.id] = s;
      });
      setServicesMap(map);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateService = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: newService.name,
        price: Number(newService.price),
        duration_minutes: Number(newService.duration_minutes),
        description: newService.description || null,
      };

      const res = await authFetch(`${API_URL}/services`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Не вдалося створити послугу');
      const createdService = await res.json();

      setServices((prev) => [...prev, createdService]);
      setServicesMap((prev) => ({ ...prev, [createdService.id]: createdService }));
      setNewService({ name: '', price: '', duration_minutes: '', description: '' });
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Ви впевнені, що хочете видалити цю послугу?')) return;

    try {
      const res = await authFetch(`${API_URL}/services/${serviceId}`, {
        method: 'DELETE',
      });
      if (!res.ok && res.status !== 204) throw new Error('Не вдалося видалити послугу');

      setServices((prev) => prev.filter((s) => s.id !== serviceId));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="admin-dashboard">
      {newBookingAlert && (
        <div className="booking-toast-alert">
          {newBookingAlert}
        </div>
      )}

      <header className="admin-header">
        <h3>Панель керування</h3>
        <button className="btn-logout" onClick={onLogout}>Вийти</button>
      </header>

      <nav className="admin-nav">
        <button 
          className={activeTab === 'bookings' ? 'active' : ''} 
          onClick={() => setActiveTab('bookings')}
        >
          📅 Записи ({bookings.length})
        </button>
        <button 
          className={activeTab === 'services' ? 'active' : ''} 
          onClick={() => setActiveTab('services')}
        >
          💅 Послуги
        </button>
      </nav>

      <main className="admin-content">
        {error && <div className="admin-error">{error}</div>}

        {/* --- ВКЛАДКА "ЗАПИСИ" --- */}
        {activeTab === 'bookings' && (
          <div>
            <h4>Список всіх записів</h4>
            {loading ? (
              <div>Завантаження записів...</div>
            ) : (
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Дата / Час</th>
                      <th>Клієнт</th>
                      <th>Телефон</th>
                      <th>Обрані послуги</th>
                      <th>Сума</th>
                      <th>Статус</th>
                      <th>Дії</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr key={b.id}>
                        <td className="bold-cell">{b.booking_date} {b.booking_time}</td>
                        <td>{b.client_name}</td>
                        <td>
                          <a href={`tel:${b.client_phone}`} className="phone-link">
                            {b.client_phone}
                          </a>
                        </td>
                        <td className="services-cell">
                          {renderServicesList(b)}
                        </td>
                        <td className="price-cell">
                          ₴{calculateTotalPrice(b)}
                        </td>
                        <td>
                          <span className={`status-badge ${b.status || 'pending'}`}>
                            {b.status === 'confirmed' ? 'Підтверджено' : 'Очікує'}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            {b.status !== 'confirmed' && (
                              <button 
                                className="btn-action confirm"
                                onClick={() => handleUpdateStatus(b.id, 'confirmed')}
                              >
                                Підтвердити
                              </button>
                            )}
                            <button 
                              className="btn-action delete"
                              onClick={() => handleCancelBooking(b.id)}
                            >
                              Скасувати
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {bookings.length === 0 && (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center' }}>Записів поки немає</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* --- ВКЛАДКА "ПОСЛУГИ" --- */}
        {activeTab === 'services' && (
          <div>
            <h4>Додати нову послугу</h4>
            <form className="service-form" onSubmit={handleCreateService}>
              <input
                type="text"
                placeholder="Назва послуги"
                required
                value={newService.name}
                onChange={(e) => setNewService({ ...newService, name: e.target.value })}
              />
              <input
                type="number"
                placeholder="Ціна (грн)"
                required
                value={newService.price}
                onChange={(e) => setNewService({ ...newService, price: e.target.value })}
              />
              <input
                type="number"
                placeholder="Тривалість (хв)"
                required
                value={newService.duration_minutes}
                onChange={(e) => setNewService({ ...newService, duration_minutes: e.target.value })}
              />
              <input
                type="text"
                placeholder="Опис (необов'язково)"
                value={newService.description}
                onChange={(e) => setNewService({ ...newService, description: e.target.value })}
              />
              <button type="submit" className="btn-add-service">+ Додати</button>
            </form>

            <h4>Існуючі послуги</h4>
            {loading ? (
              <div>Завантаження послуг...</div>
            ) : (
              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Назва</th>
                      <th>Ціна</th>
                      <th>Тривалість</th>
                      <th>Опис</th>
                      <th>Дії</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((s) => (
                      <tr key={s.id}>
                        <td className="bold-cell">{s.name}</td>
                        <td className="price-cell">₴{s.price}</td>
                        <td>{s.duration_minutes} хв.</td>
                        <td>{s.description || '-'}</td>
                        <td>
                          <button 
                            className="btn-action delete"
                            onClick={() => handleDeleteService(s.id)}
                          >
                            Видалити
                          </button>
                        </td>
                      </tr>
                    ))}
                    {services.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center' }}>Послуг поки немає</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}