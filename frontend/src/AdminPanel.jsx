import { useState, useEffect, useCallback } from "react";

const API = "http://localhost:8000";

// ─── УТИЛІТИ ──────────────────────────────────────────────────────────────────
function getToken() { return localStorage.getItem("admin_token"); }
function setToken(t) { localStorage.setItem("admin_token", t); }
function removeToken() { localStorage.removeItem("admin_token"); }

function authHeaders() {
  return { "Authorization": `Bearer ${getToken()}`, "Content-Type": "application/json" };
}

const STATUS_COLORS = {
  pending:   { bg: "#fff8e8", color: "#b07800", label: "Очікує" },
  confirmed: { bg: "#e8fff0", color: "#008040", label: "Підтверджено" },
  cancelled: { bg: "#fff0f0", color: "#c04040", label: "Скасовано" },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] ?? { bg: "#f0f0f0", color: "#808080", label: status };
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 20, padding: "3px 10px",
      fontFamily: "'Jost',sans-serif", fontSize: 11, letterSpacing: 0.5, fontWeight: 500 }}>
      {s.label}
    </span>
  );
}

// ─── ГОЛОВНИЙ КОМПОНЕНТ ───────────────────────────────────────────────────────
export default function AdminPanel() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!getToken());

  if (!isLoggedIn) return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
  return <Dashboard onLogout={() => { removeToken(); setIsLoggedIn(false); }} />;
}

// ─── СТОРІНКА ВХОДУ ───────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState(null);
  const [loading, setLoading]   = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // OAuth2PasswordRequestForm — треба надсилати як application/x-www-form-urlencoded
    const body = new URLSearchParams();
    body.append("username", username);
    body.append("password", password);

    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Невірний логін або пароль");
      }

      const data = await res.json();
      setToken(data.access_token);
      onLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <Styles />
      <div style={styles.loginCard}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={styles.logo}>💅</div>
          <h1 style={styles.loginTitle}>Nail Studio</h1>
          <p className="jost" style={{ color: "#b09090", fontSize: 13, letterSpacing: 2, textTransform: "uppercase" }}>
            Адмін панель
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {error && <div className="error-box">⚠️ {error}</div>}

          <div>
            <label className="jost" style={styles.label}>Логін</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="admin"
              style={styles.input}
              required
            />
          </div>

          <div>
            <label className="jost" style={styles.label}>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={styles.input}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}
            style={{ marginTop: 8, padding: "14px", fontSize: 13, letterSpacing: 2 }}>
            {loading ? "Входимо..." : "Увійти"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── ПАНЕЛЬ КЕРУВАННЯ ─────────────────────────────────────────────────────────
function Dashboard({ onLogout }) {
  const [bookings, setBookings]     = useState([]);
  const [services, setServices]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [activeTab, setActiveTab]   = useState("bookings"); // bookings | services
  const [filter, setFilter]         = useState("all");      // all | pending | confirmed | cancelled
  const [dateFilter, setDateFilter] = useState("");
  const [updating, setUpdating]     = useState(null);       // booking id що оновлюється

  // ── Нова послуга ──
  const [newService, setNewService] = useState({ name: "", description: "", duration_minutes: "", price: "" });
  const [serviceLoading, setServiceLoading] = useState(false);
  const [serviceError, setServiceError]     = useState(null);

  // ── Завантаження даних ──
  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/bookings`, { headers: authHeaders() });
      if (res.status === 401) { removeToken(); window.location.reload(); return; }
      if (!res.ok) throw new Error("Не вдалося завантажити записи");
      setBookings(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadServices = useCallback(async () => {
    try {
      const res = await fetch(`${API}/services`);
      if (!res.ok) throw new Error("Не вдалося завантажити послуги");
      setServices(await res.json());
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => { loadBookings(); loadServices(); }, [loadBookings, loadServices]);

  // ── Зміна статусу ──
  async function updateStatus(bookingId, newStatus) {
    setUpdating(bookingId);
    try {
      const res = await fetch(`${API}/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Помилка при оновленні статусу");
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdating(null);
    }
  }

  // ── Видалення запису ──
  async function deleteBooking(bookingId) {
    if (!window.confirm("Видалити цей запис?")) return;
    try {
      const res = await fetch(`${API}/bookings/${bookingId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Помилка при видаленні");
      setBookings(prev => prev.filter(b => b.id !== bookingId));
    } catch (err) {
      alert(err.message);
    }
  }

  // ── Видалення послуги ──
  async function deleteService(serviceId) {
    if (!window.confirm("Видалити цю послугу?")) return;
    try {
      const res = await fetch(`${API}/services/${serviceId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Помилка при видаленні послуги");
      setServices(prev => prev.filter(s => s.id !== serviceId));
    } catch (err) {
      alert(err.message);
    }
  }

  // ── Створення послуги ──
  async function createService(e) {
    e.preventDefault();
    setServiceLoading(true);
    setServiceError(null);
    try {
      const res = await fetch(`${API}/services`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          name: newService.name,
          description: newService.description,
          duration_minutes: parseInt(newService.duration_minutes),
          price: parseFloat(newService.price),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Помилка при створенні послуги");
      }
      const created = await res.json();
      setServices(prev => [...prev, created]);
      setNewService({ name: "", description: "", duration_minutes: "", price: "" });
    } catch (err) {
      setServiceError(err.message);
    } finally {
      setServiceLoading(false);
    }
  }

  // ── Фільтрація записів ──
  const filtered = bookings.filter(b => {
    const statusOk = filter === "all" || b.status === filter;
    const dateOk   = !dateFilter || b.booking_date === dateFilter;
    return statusOk && dateOk;
  });

  // ── Статистика ──
  const stats = {
    total:     bookings.length,
    pending:   bookings.filter(b => b.status === "pending").length,
    confirmed: bookings.filter(b => b.status === "confirmed").length,
    today:     bookings.filter(b => b.booking_date === new Date().toISOString().split("T")[0]).length,
  };

  // ── Назва послуги по id ──
  function serviceName(id) {
    return services.find(s => s.id === id)?.name ?? `#${id}`;
  }

  return (
    <div style={{ fontFamily: "'Cormorant Garamond','Georgia',serif", background: "#fdf8f5", minHeight: "100vh" }}>
      <Styles />

      {/* ── ХЕДЕР ── */}
      <header style={{ background: "#2a1f1a", color: "#f0e8e4", padding: "0 32px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 22 }}>💅</span>
            <div>
              <span style={{ fontSize: 18, fontWeight: 500 }}>Nail Studio</span>
              <span className="jost" style={{ fontSize: 11, color: "#a09090", marginLeft: 10, letterSpacing: 2, textTransform: "uppercase" }}>Admin</span>
            </div>
          </div>
          <button onClick={onLogout} className="btn-outline"
            style={{ color: "#e8b4bb", borderColor: "#5a3f3a", fontSize: 11, padding: "6px 16px" }}>
            Вийти
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>

        {/* ── СТАТИСТИКА ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 16, marginBottom: 32 }}>
          {[
            { label: "Всього записів", value: stats.total,     icon: "📋" },
            { label: "Очікують",       value: stats.pending,   icon: "⏳" },
            { label: "Підтверджено",   value: stats.confirmed, icon: "✅" },
            { label: "Сьогодні",       value: stats.today,     icon: "📅" },
          ].map(s => (
            <div key={s.label} style={{ background: "#fff", borderRadius: 16, padding: "20px 24px",
              boxShadow: "0 2px 16px rgba(0,0,0,0.06)", borderLeft: "4px solid #e8b4bb" }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
              <div style={{ fontSize: 32, fontWeight: 500, lineHeight: 1 }}>{s.value}</div>
              <div className="jost" style={{ fontSize: 12, color: "#b09090", marginTop: 4, letterSpacing: 0.5 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── ТАБИ ── */}
        <div className="jost" style={{ display: "flex", gap: 0, marginBottom: 24, borderRadius: 40, overflow: "hidden",
          border: "1.5px solid #e8d5d0", width: "fit-content" }}>
          {[["bookings","📋 Записи"], ["services","💅 Послуги"]].map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ padding: "10px 28px", border: "none", cursor: "pointer", fontSize: 12, letterSpacing: 1,
                background: activeTab === tab ? "#c0717a" : "transparent",
                color: activeTab === tab ? "#fff" : "#a09090", transition: "all 0.2s" }}>
              {label}
            </button>
          ))}
        </div>

        {/* ══════════════ ТАБ: ЗАПИСИ ══════════════ */}
        {activeTab === "bookings" && (
          <>
            {/* Фільтри */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20, alignItems: "center" }}>
              <div className="jost" style={{ display: "flex", gap: 0, borderRadius: 40, overflow: "hidden", border: "1.5px solid #e8d5d0" }}>
                {[["all","Всі"], ["pending","Очікують"], ["confirmed","Підтверджено"], ["cancelled","Скасовано"]].map(([val, label]) => (
                  <button key={val} onClick={() => setFilter(val)}
                    style={{ padding: "8px 16px", border: "none", cursor: "pointer", fontSize: 11, letterSpacing: 0.5,
                      background: filter === val ? "#c0717a" : "transparent",
                      color: filter === val ? "#fff" : "#a09090", transition: "all 0.2s" }}>
                    {label}
                  </button>
                ))}
              </div>
              <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
                style={{ ...styles.input, width: "auto", padding: "8px 14px", fontSize: 12 }} />
              {dateFilter && (
                <button onClick={() => setDateFilter("")} className="btn-outline" style={{ padding: "6px 14px", fontSize: 11 }}>
                  Скинути дату
                </button>
              )}
              <button onClick={loadBookings} className="btn-outline" style={{ padding: "6px 14px", fontSize: 11, marginLeft: "auto" }}>
                🔄 Оновити
              </button>
            </div>

            {loading && <div style={{ textAlign: "center", padding: 40 }}><div className="spinner" /></div>}
            {error && <div className="error-box">{error}</div>}

            {/* Таблиця */}
            {!loading && (
              <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 2px 20px rgba(0,0,0,0.06)", overflow: "hidden" }}>
                {filtered.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 20px", color: "#b09090" }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                    <p className="jost" style={{ fontSize: 14 }}>Записів не знайдено</p>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: "2px solid #f0e8e4" }}>
                          {["ID","Клієнт","Телефон","Послуга","Дата","Час","Статус","Дії"].map(h => (
                            <th key={h} className="jost" style={{ padding: "14px 16px", textAlign: "left",
                              fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "#b09090",
                              fontWeight: 500, whiteSpace: "nowrap" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((b, idx) => (
                          <tr key={b.id} style={{ borderBottom: "1px solid #f8f0ee",
                            background: idx % 2 === 0 ? "#fff" : "#fdfafa",
                            opacity: updating === b.id ? 0.6 : 1, transition: "opacity 0.2s" }}>
                            <td style={styles.td} className="jost">
                              <span style={{ color: "#c0717a", fontWeight: 500 }}>#{b.id}</span>
                            </td>
                            <td style={styles.td}>
                              <div style={{ fontWeight: 500, fontSize: 15 }}>{b.client_name} {b.client_surname}</div>
                            </td>
                            <td style={styles.td} className="jost">{b.client_phone}</td>
                            <td style={styles.td} className="jost">{serviceName(b.service_id)}</td>
                            <td style={styles.td} className="jost" >{b.booking_date}</td>
                            <td style={styles.td} className="jost">
                              {b.booking_time?.slice(0,5)}
                              {b.booking_end && <span style={{ color: "#b09090" }}> – {b.booking_end.slice(0,5)}</span>}
                            </td>
                            <td style={styles.td}><StatusBadge status={b.status} /></td>
                            <td style={{ ...styles.td, whiteSpace: "nowrap" }}>
                              {/* Кнопки зміни статусу */}
                              {b.status === "pending" && (
                                <button onClick={() => updateStatus(b.id, "confirmed")}
                                  style={styles.actionBtn("#008040", "#e8fff0")}>✓ Підтвердити</button>
                              )}
                              {b.status !== "cancelled" && (
                                <button onClick={() => updateStatus(b.id, "cancelled")}
                                  style={{ ...styles.actionBtn("#c04040", "#fff0f0"), marginLeft: 6 }}>✕ Скасувати</button>
                              )}
                              <button onClick={() => deleteBooking(b.id)}
                                style={{ ...styles.actionBtn("#808080", "#f0f0f0"), marginLeft: 6 }}>🗑</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ══════════════ ТАБ: ПОСЛУГИ ══════════════ */}
        {activeTab === "services" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24, alignItems: "start" }}>

            {/* Список послуг */}
            <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 2px 20px rgba(0,0,0,0.06)", overflow: "hidden" }}>
              {services.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#b09090" }}>
                  <p className="jost" style={{ fontSize: 14 }}>Послуг ще немає</p>
                </div>
              ) : services.map((svc, idx) => (
                <div key={svc.id} style={{ padding: "20px 24px", borderBottom: "1px solid #f8f0ee",
                  background: idx % 2 === 0 ? "#fff" : "#fdfafa",
                  display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 4 }}>{svc.name}</div>
                    <div className="jost" style={{ fontSize: 12, color: "#a09090", marginBottom: 6 }}>{svc.description}</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <span style={{ background: "#f5eded", color: "#c0717a", borderRadius: 20, padding: "3px 10px",
                        fontFamily: "'Jost',sans-serif", fontSize: 11 }}>⏱ {svc.duration_minutes} хв</span>
                      <span style={{ background: "#fdf0f5", color: "#c0717a", borderRadius: 20, padding: "3px 10px",
                        fontFamily: "'Jost',sans-serif", fontSize: 11 }}>₴ {svc.price}</span>
                    </div>
                  </div>
                  <button onClick={() => deleteService(svc.id)} style={styles.actionBtn("#c04040", "#fff0f0")}>
                    🗑 Видалити
                  </button>
                </div>
              ))}
            </div>

            {/* Форма нової послуги */}
            <div style={{ background: "#fff", borderRadius: 20, boxShadow: "0 2px 20px rgba(0,0,0,0.06)", padding: "28px 24px" }}>
              <h3 style={{ fontSize: 22, fontWeight: 400, marginBottom: 20 }}>Нова послуга</h3>
              {serviceError && <div className="error-box">{serviceError}</div>}
              <form onSubmit={createService} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label className="jost" style={styles.label}>Назва *</label>
                  <input type="text" value={newService.name} required
                    onChange={e => setNewService(p => ({ ...p, name: e.target.value }))}
                    placeholder="Класичний манікюр" style={styles.input} />
                </div>
                <div>
                  <label className="jost" style={styles.label}>Опис</label>
                  <input type="text" value={newService.description}
                    onChange={e => setNewService(p => ({ ...p, description: e.target.value }))}
                    placeholder="Короткий опис послуги" style={styles.input} />
                </div>
                <div>
                  <label className="jost" style={styles.label}>Тривалість (хв) *</label>
                  <input type="number" value={newService.duration_minutes} required min="15"
                    onChange={e => setNewService(p => ({ ...p, duration_minutes: e.target.value }))}
                    placeholder="60" style={styles.input} />
                </div>
                <div>
                  <label className="jost" style={styles.label}>Ціна (₴) *</label>
                  <input type="number" value={newService.price} required min="0"
                    onChange={e => setNewService(p => ({ ...p, price: e.target.value }))}
                    placeholder="350" style={styles.input} />
                </div>
                <button type="submit" className="btn-primary" disabled={serviceLoading}
                  style={{ marginTop: 8, padding: "13px", fontSize: 12, letterSpacing: 2 }}>
                  {serviceLoading ? "Зберігаємо..." : "+ Додати послугу"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ЗАГАЛЬНІ СТИЛІ ───────────────────────────────────────────────────────────
const styles = {
  page: {
    fontFamily: "'Cormorant Garamond','Georgia',serif",
    background: "linear-gradient(160deg,#fff5f6,#fdf8f5,#f5f0fe)",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  loginCard: {
    background: "#fff",
    borderRadius: 24,
    padding: "48px 40px",
    width: "100%",
    maxWidth: 380,
    boxShadow: "0 24px 80px rgba(0,0,0,0.1)",
  },
  logo: {
    width: 60, height: 60, borderRadius: "50%",
    background: "linear-gradient(135deg,#e8b4bb,#c0717a)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 28, margin: "0 auto 16px",
  },
  loginTitle: { fontSize: 32, fontWeight: 400, letterSpacing: 1, marginBottom: 4 },
  label: { display: "block", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: "#b09090", marginBottom: 6 },
  input: {
    width: "100%", padding: "11px 14px",
    border: "1.5px solid #e8d5d0", borderRadius: 12,
    fontFamily: "'Jost',sans-serif", fontSize: 13,
    background: "#fff", outline: "none",
    boxSizing: "border-box",
  },
  td: { padding: "12px 16px", fontSize: 14, verticalAlign: "middle" },
  actionBtn: (color, bg) => ({
    background: bg, color, border: `1px solid ${color}22`,
    borderRadius: 8, padding: "5px 10px",
    fontFamily: "'Jost',sans-serif", fontSize: 11,
    cursor: "pointer", whiteSpace: "nowrap",
    transition: "opacity 0.15s",
  }),
};

function Styles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500&family=Jost:wght@300;400;500&display=swap');
      * { box-sizing: border-box; margin: 0; padding: 0; }
      .jost { font-family: 'Jost', sans-serif; }
      .btn-primary { background: #c0717a; color: #fff; border: none; padding: 10px 24px; border-radius: 40px; cursor: pointer; font-family: 'Jost', sans-serif; font-size: 13px; letter-spacing: 1.5px; text-transform: uppercase; transition: background 0.2s; }
      .btn-primary:hover { background: #a85860; }
      .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
      .btn-outline { background: transparent; color: #c0717a; border: 1.5px solid #c0717a; padding: 8px 20px; border-radius: 40px; cursor: pointer; font-family: 'Jost', sans-serif; font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; transition: all 0.2s; }
      .btn-outline:hover { background: #c0717a; color: #fff; }
      .error-box { background: #fff0f0; border: 1.5px solid #f0b0b0; border-radius: 12px; padding: 12px 16px; font-family: 'Jost', sans-serif; font-size: 13px; color: #c04040; margin-bottom: 16px; }
      .spinner { width: 24px; height: 24px; border: 2px solid #e8d5d0; border-top-color: #c0717a; border-radius: 50%; animation: spin 0.7s linear infinite; margin: 0 auto; }
      @keyframes spin { to { transform: rotate(360deg); } }
      input[type=number]::-webkit-inner-spin-button { opacity: 0.5; }
      tr:hover td { background: #fff8f6 !important; }
    `}</style>
  );
}