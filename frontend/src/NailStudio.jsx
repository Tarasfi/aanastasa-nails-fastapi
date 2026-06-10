import { useState, useEffect } from "react";

// ─── ЄДИНЕ МІСЦЕ ДЕ МІНЯТИ АДРЕСУ БЕКЕНДУ ───────────────────────────────────
const API = "http://localhost:8000";
// ─────────────────────────────────────────────────────────────────────────────

const PHOTOS = [
  { bg: "linear-gradient(135deg,#f8c8d4,#e8a0b0)", label: "Французький манікюр" },
  { bg: "linear-gradient(135deg,#c8d4f8,#a0b0e8)", label: "Омбре синє" },
  { bg: "linear-gradient(135deg,#d4f8c8,#b0e8a0)", label: "Весняний дизайн" },
  { bg: "linear-gradient(135deg,#f8d4c8,#e8b0a0)", label: "Персиковий градієнт" },
  { bg: "linear-gradient(135deg,#e8c8f8,#c8a0e8)", label: "Бузковий декор" },
  { bg: "linear-gradient(135deg,#f8f0c8,#e8d8a0)", label: "Золотий дизайн" },
];

function getDaysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDay(year, month) { return (new Date(year, month, 1).getDay() + 6) % 7; }
function pad(n) { return String(n).padStart(2, "0"); }
function dateStr(y, m, d) { return `${y}-${pad(m + 1)}-${pad(d)}`; }

export default function App() {
  // ─── ДАНІ З БЕКЕНДУ ────────────────────────────────────────────────────────
  const [services, setServices] = useState([]);          // GET /services
  const [slots, setSlots] = useState([]);                // GET /available-slots
  const [servicesLoading, setServicesLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // ─── UI СТАН ──────────────────────────────────────────────────────────────
  const [selected, setSelected] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState("services");
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [chosenDay, setChosenDay] = useState(null);
  const [chosenTime, setChosenTime] = useState(null);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [formData, setFormData] = useState({ name: "", surname: "", phone: "", telegram: "" });
  const [booked, setBooked] = useState(false);

  const monthNames = ["Січень","Лютий","Березень","Квітень","Травень","Червень","Липень","Серпень","Вересень","Жовтень","Листопад","Грудень"];

  // ─── 1. ЗАВАНТАЖЕННЯ ПОСЛУГ при відкритті сторінки ────────────────────────
  useEffect(() => {
    fetch(`${API}/services`)
      .then(res => {
        if (!res.ok) throw new Error("Не вдалося завантажити послуги");
        return res.json();
      })
      .then(data => {
        setServices(data);
        setServicesLoading(false);
      })
      .catch(err => {
        setApiError(err.message);
        setServicesLoading(false);
      });
  }, []);

  // ─── 2. ЗАВАНТАЖЕННЯ СЛОТІВ коли обрано день або послугу ──────────────────
  // Бекенд приймає один service_id, тому беремо першу послугу зі списку вибраних
  useEffect(() => {
    if (!chosenDay || selected.length === 0) { setSlots([]); return; }

    const date = dateStr(calYear, calMonth, chosenDay);
    const serviceId = selected[0].id;  // перша обрана послуга визначає тривалість

    setSlotsLoading(true);
    setChosenTime(null);
    fetch(`${API}/available-slots?booking_date=${date}&service_id=${serviceId}`)
      .then(res => {
        if (!res.ok) throw new Error("Не вдалося завантажити слоти");
        return res.json();
      })
      .then(data => { setSlots(data); setSlotsLoading(false); })
      .catch(err => { setApiError(err.message); setSlotsLoading(false); });
  }, [chosenDay, calYear, calMonth, selected]);

  // ─── 3. СТВОРЕННЯ БРОНЮВАННЯ ──────────────────────────────────────────────
  // Бекенд приймає один service_id — якщо вибрано кілька послуг, відправляємо
  // окремий запит для кожної (або можна змінити на першу — залежить від бізнес-логіки)
  async function submitBooking() {
    if (!formData.name || !formData.phone) return;
    setSubmitLoading(true);
    setApiError(null);

    const date = dateStr(calYear, calMonth, chosenDay);
    const [hours, minutes] = chosenTime.split(":");

    try {
      // Якщо вибрано кілька послуг — бронюємо кожну окремо
      for (const svc of selected) {
        const body = {
          client_name: formData.name,
          client_surname: formData.surname,
          client_phone: formData.phone,
          booking_date: date,                      // "2026-06-10"
          booking_time: `${hours}:${minutes}:00`,  // "10:00:00"
          service_id: svc.id,
        };

        const res = await fetch(`${API}/bookings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || "Помилка при записі");
        }
      }
      setBooked(true);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setSubmitLoading(false);
    }
  }

  // ─── ДОПОМІЖНІ ФУНКЦІЇ ────────────────────────────────────────────────────
  const totalPrice = selected.reduce((s, i) => s + (i.price ?? 0), 0);
  const totalDuration = selected.reduce((s, i) => s + (i.duration_minutes ?? i.duration ?? 0), 0);

  function toggleService(svc) {
    setSelected(prev =>
      prev.find(s => s.id === svc.id) ? prev.filter(s => s.id !== svc.id) : [...prev, svc]
    );
  }

  function openModal(svc) {
    setSelected([svc]);
    setShowModal(true);
    setStep("services");
    setBooked(false);
    setChosenDay(null);
    setChosenTime(null);
    setSlots([]);
    setApiError(null);
    setFormData({ name: "", surname: "", phone: "", telegram: "" });
  }

  function closeModal() {
    setShowModal(false);
    setBooked(false);
    setSelected([]);
    setChosenDay(null);
    setChosenTime(null);
    setSlots([]);
    setApiError(null);
    setFormData({ name: "", surname: "", phone: "", telegram: "" });
  }

  function isDayOff(y, m, d) { return new Date(y, m, d).getDay() === 0; }
  function isPast(y, m, d) {
    const t = new Date(); t.setHours(0, 0, 0, 0);
    return new Date(y, m, d) < t;
  }

  // Карусель
  useEffect(() => {
    const t = setInterval(() => setCarouselIdx(i => (i + 1) % PHOTOS.length), 3500);
    return () => clearInterval(t);
  }, []);
  const visiblePhotos = [0, 1, 2].map(offset => PHOTOS[(carouselIdx + offset) % PHOTOS.length]);

  // ─── РЕНДЕР ───────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'Cormorant Garamond', 'Georgia', serif", background: "#fdf8f5", minHeight: "100vh", color: "#2a1f1a" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Jost:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #fdf8f5; }
        .jost { font-family: 'Jost', sans-serif; }
        .btn-primary { background: #c0717a; color: #fff; border: none; padding: 10px 24px; border-radius: 40px; cursor: pointer; font-family: 'Jost', sans-serif; font-size: 13px; letter-spacing: 1.5px; text-transform: uppercase; transition: background 0.2s, transform 0.15s; }
        .btn-primary:hover { background: #a85860; transform: translateY(-1px); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .btn-outline { background: transparent; color: #c0717a; border: 1.5px solid #c0717a; padding: 8px 20px; border-radius: 40px; cursor: pointer; font-family: 'Jost', sans-serif; font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; transition: all 0.2s; }
        .btn-outline:hover { background: #c0717a; color: #fff; }
        .service-card { background: #fff; border-radius: 16px; padding: 28px 24px 24px 28px; box-shadow: 0 2px 20px rgba(0,0,0,0.06); display: flex; flex-direction: column; gap: 10px; transition: transform 0.2s, box-shadow 0.2s; position: relative; border-left: 4px solid #e8b4bb; }
        .service-card:hover { transform: translateY(-4px); box-shadow: 0 8px 32px rgba(192,113,122,0.15); border-left-color: #c0717a; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(42,31,26,0.5); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 16px; }
        .modal { background: #fdf8f5; border-radius: 24px; width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto; padding: 40px 36px; position: relative; box-shadow: 0 24px 80px rgba(0,0,0,0.18); }
        .cal-day { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; font-family: 'Jost', sans-serif; font-size: 13px; transition: all 0.15s; }
        .cal-day:hover:not(.off):not(.past) { background: #f0d5d8; }
        .cal-day.chosen { background: #c0717a !important; color: #fff !important; }
        .cal-day.off { color: #ccc; cursor: default; }
        .cal-day.past { color: #ccc; cursor: default; }
        .time-chip { padding: 7px 14px; border-radius: 20px; border: 1.5px solid #e8d5d0; font-family: 'Jost', sans-serif; font-size: 12px; cursor: pointer; transition: all 0.15s; background: #fff; }
        .time-chip:hover:not(.booked) { border-color: #c0717a; color: #c0717a; }
        .time-chip.chosen { background: #c0717a; color: #fff; border-color: #c0717a; }
        .time-chip.booked { background: #f5f0ee; color: #bbb; cursor: not-allowed; text-decoration: line-through; }
        .divider { height: 1px; background: linear-gradient(to right, transparent, #e8d5d0, transparent); margin: 24px 0; }
        .tag { display: inline-flex; align-items: center; gap: 6px; background: #f5eded; color: #c0717a; border-radius: 20px; padding: 4px 12px; font-family: 'Jost', sans-serif; font-size: 12px; }
        input[type=text], input[type=tel] { width: 100%; padding: 12px 16px; border: 1.5px solid #e8d5d0; border-radius: 12px; font-family: 'Jost', sans-serif; font-size: 14px; background: #fff; outline: none; transition: border-color 0.2s; }
        input[type=text]:focus, input[type=tel]:focus { border-color: #c0717a; }
        .section-title { font-size: clamp(28px,5vw,42px); font-weight: 300; letter-spacing: 2px; color: #2a1f1a; text-align: center; margin-bottom: 8px; }
        .section-sub { font-family: 'Jost', sans-serif; font-size: 13px; letter-spacing: 3px; text-transform: uppercase; color: #c0717a; text-align: center; margin-bottom: 40px; }
        .spinner { width: 20px; height: 20px; border: 2px solid #e8d5d0; border-top-color: #c0717a; border-radius: 50%; animation: spin 0.7s linear infinite; margin: 0 auto; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .error-box { background: #fff0f0; border: 1.5px solid #f0b0b0; border-radius: 12px; padding: 12px 16px; font-family: 'Jost', sans-serif; font-size: 13px; color: #c04040; margin-bottom: 16px; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #e8b4bb; border-radius: 10px; }
      `}</style>

      {/* HEADER */}
      <header style={{ background: "#fff", borderBottom: "1px solid #f0e8e4", padding: "0 32px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 72 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg,#e8b4bb,#c0717a)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 20 }}>💅</span>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 500, letterSpacing: 1, lineHeight: 1 }}>Nail Studio</div>
              <div className="jost" style={{ fontSize: 11, color: "#b09090", letterSpacing: 2, textTransform: "uppercase" }}>by Anastasia</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="jost" style={{ fontSize: 12, color: "#b09090", letterSpacing: 1 }}>📍 вул. Хрещатик 12, Київ</div>
            <div className="jost" style={{ fontSize: 11, color: "#c0a0a0" }}>Пн–Пт 9:00–18:00 · Сб 10:00–16:00</div>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section style={{ background: "linear-gradient(160deg,#fff5f6 0%,#fdf8f5 60%,#f5f0fe 100%)", padding: "80px 32px 60px", textAlign: "center" }}>
        <div className="jost" style={{ fontSize: 12, letterSpacing: 4, textTransform: "uppercase", color: "#c0717a", marginBottom: 16 }}>Nail Studio · Київ</div>
        <h1 style={{ fontSize: "clamp(40px,8vw,80px)", fontWeight: 300, lineHeight: 1.1, letterSpacing: 2, marginBottom: 16 }}>
          Краса<br /><em style={{ fontStyle: "italic", color: "#c0717a" }}>в деталях</em>
        </h1>
        <p className="jost" style={{ color: "#8a7070", fontSize: 15, maxWidth: 400, margin: "0 auto 32px", lineHeight: 1.7 }}>
          Професійний манікюр та педикюр у затишній атмосфері. Запишіться онлайн за 1 хвилину.
        </p>
        <button className="btn-primary" onClick={() => document.getElementById("services").scrollIntoView({ behavior: "smooth" })}>
          Записатися
        </button>
      </section>

      {/* SCHEDULE */}
      <section style={{ background: "#fff", padding: "32px", borderBottom: "1px solid #f0e8e4" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", justifyContent: "center", gap: "clamp(24px,6vw,80px)", flexWrap: "wrap" }}>
          {[
            { day: "Понеділок – П'ятниця", hours: "09:00 – 18:00", icon: "📅" },
            { day: "Субота", hours: "10:00 – 16:00", icon: "🌸" },
            { day: "Неділя", hours: "Вихідний", icon: "😌" },
          ].map(item => (
            <div key={item.day} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{item.icon}</div>
              <div className="jost" style={{ fontSize: 12, color: "#b09090", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>{item.day}</div>
              <div style={{ fontSize: 22, fontWeight: 400, color: item.hours === "Вихідний" ? "#ccc" : "#2a1f1a" }}>{item.hours}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SERVICES */}
      <section id="services" style={{ padding: "80px 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div className="section-sub">Послуги</div>
          <h2 className="section-title">Що ми пропонуємо</h2>

          {/* Стан завантаження */}
          {servicesLoading && <div style={{ textAlign: "center", padding: 40 }}><div className="spinner" /></div>}
          {apiError && !showModal && <div className="error-box" style={{ maxWidth: 400, margin: "0 auto" }}>⚠️ {apiError}</div>}

          {/* Картки послуг — дані приходять з бекенду */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 24 }}>
            {services.map(svc => (
              <div key={svc.id} className="service-card">
                <h3 style={{ fontSize: 22, fontWeight: 500, letterSpacing: 0.5 }}>{svc.name}</h3>
                <p className="jost" style={{ color: "#8a7070", fontSize: 14, lineHeight: 1.6 }}>{svc.description}</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
                  <span className="tag">⏱ {svc.duration_minutes} хв</span>
                  <span className="tag" style={{ background: "#fdf0f5" }}>₴ {svc.price}</span>
                </div>
                <button
                  className="btn-primary"
                  style={{ marginTop: 12, alignSelf: "stretch", padding: "13px 24px", fontSize: 13, letterSpacing: 2 }}
                  onClick={() => openModal(svc)}
                >
                  Записатися →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CAROUSEL */}
      <section style={{ padding: "0 0 80px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 32px" }}>
          <div className="section-sub">Портфоліо</div>
          <h2 className="section-title">Приклади робіт</h2>
          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 16 }}>
            <button onClick={() => setCarouselIdx(i => (i - 1 + PHOTOS.length) % PHOTOS.length)}
              style={{ background: "#fff", border: "1.5px solid #e8d5d0", borderRadius: "50%", width: 44, height: 44, cursor: "pointer", fontSize: 18, flexShrink: 0 }}>‹</button>
            <div style={{ display: "flex", gap: 16, flex: 1, overflow: "hidden" }}>
              {visiblePhotos.map((photo, i) => (
                <div key={i} style={{ flex: "1 0 0", minWidth: 0, aspectRatio: "3/4", borderRadius: 20, background: photo.bg, display: "flex", alignItems: "flex-end", padding: 16, transform: i === 1 ? "scale(1.03)" : "scale(1)", transition: "transform 0.3s" }}>
                  <span className="jost" style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", borderRadius: 20, padding: "6px 14px", fontSize: 12 }}>{photo.label}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setCarouselIdx(i => (i + 1) % PHOTOS.length)}
              style={{ background: "#fff", border: "1.5px solid #e8d5d0", borderRadius: "50%", width: 44, height: 44, cursor: "pointer", fontSize: 18, flexShrink: 0 }}>›</button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#2a1f1a", color: "#f0e8e4", padding: "48px 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 24 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 400, marginBottom: 6 }}>Nail Studio <em style={{ color: "#e8b4bb" }}>by Anastasia</em></div>
            <div className="jost" style={{ fontSize: 13, color: "#a09090", lineHeight: 1.8 }}>📍 вул. Лесі Українки 2<br />📞 +38 (099) 123-45-67</div>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            {[{ label: "Instagram", icon: "📸", href: "https://instagram.com" }, { label: "Telegram", icon: "✈️", href: "https://t.me" }].map(link => (
              <a key={link.label} href={link.href} target="_blank" rel="noreferrer"
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.07)", borderRadius: 16, padding: "16px 24px", textDecoration: "none", color: "#f0e8e4", fontFamily: "'Jost',sans-serif", fontSize: 12, letterSpacing: 1 }}>
                <span style={{ fontSize: 24 }}>{link.icon}</span>{link.label}
              </a>
            ))}
          </div>
        </div>
        <div style={{ maxWidth: 1100, margin: "32px auto 0", borderTop: "1px solid #3a2f2a", paddingTop: 24, textAlign: "center" }}>
          <span className="jost" style={{ fontSize: 12, color: "#6a5a5a" }}>© 2026 Aanastasa Nails</span>
        </div>
      </footer>

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <button onClick={closeModal} style={{ position: "absolute", top: 16, right: 20, background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#a09090" }}>×</button>

            {/* Steps nav */}
            <div className="jost" style={{ display: "flex", marginBottom: 32, borderRadius: 40, overflow: "hidden", border: "1.5px solid #e8d5d0" }}>
              {[["services","1. Послуги"],["datetime","2. Дата і час"],["confirm","3. Підтвердження"]].map(([s, label]) => (
                <button key={s} onClick={() => s !== "confirm" && setStep(s)}
                  style={{ flex: 1, padding: "10px 4px", border: "none", background: step === s ? "#c0717a" : "transparent", color: step === s ? "#fff" : "#a09090", fontSize: 11, cursor: "pointer", transition: "all 0.2s" }}>
                  {label}
                </button>
              ))}
            </div>

            {/* ── КРОК 1: ВИБІР ПОСЛУГ ────────────────────────────────────── */}
            {step === "services" && (
              <>
                <h3 style={{ fontSize: 26, fontWeight: 400, marginBottom: 4 }}>Оберіть послуги</h3>
                <p className="jost" style={{ color: "#a09090", fontSize: 13, marginBottom: 24 }}>Можна вибрати кілька</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {services.map(svc => {
                    const isChosen = selected.find(s => s.id === svc.id);
                    return (
                      <div key={svc.id} onClick={() => toggleService(svc)}
                        style={{ padding: "14px 18px", borderRadius: 14, border: `1.5px solid ${isChosen ? "#c0717a" : "#e8d5d0"}`, background: isChosen ? "#fff5f6" : "#fff", cursor: "pointer", transition: "all 0.15s", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 500 }}>{svc.name}</div>
                          <div className="jost" style={{ fontSize: 12, color: "#a09090", marginTop: 2 }}>{svc.duration_minutes} хв · ₴{svc.price}</div>
                        </div>
                        <div style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${isChosen ? "#c0717a" : "#e8d5d0"}`, background: isChosen ? "#c0717a" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {isChosen && <span style={{ color: "#fff", fontSize: 13 }}>✓</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {selected.length > 0 && (
                  <>
                    <div className="divider" />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div className="jost" style={{ fontSize: 12, color: "#a09090", textTransform: "uppercase", letterSpacing: 1 }}>Разом</div>
                        <div style={{ fontSize: 28, fontWeight: 500 }}>₴{totalPrice}</div>
                        <div className="jost" style={{ fontSize: 12, color: "#a09090" }}>⏱ {totalDuration} хв</div>
                      </div>
                      <button className="btn-primary" onClick={() => setStep("datetime")}>Далі →</button>
                    </div>
                  </>
                )}
              </>
            )}

            {/* ── КРОК 2: ДАТА І ЧАС ──────────────────────────────────────── */}
            {step === "datetime" && (
              <>
                <h3 style={{ fontSize: 26, fontWeight: 400, marginBottom: 24 }}>Оберіть дату</h3>
                <div style={{ background: "#fff", borderRadius: 16, padding: 20, border: "1px solid #f0e8e4", marginBottom: 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#c0717a" }}>‹</button>
                    <span style={{ fontSize: 18, fontWeight: 500 }}>{monthNames[calMonth]} {calYear}</span>
                    <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }}
                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#c0717a" }}>›</button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", textAlign: "center", marginBottom: 8 }}>
                    {["Пн","Вт","Ср","Чт","Пт","Сб","Нд"].map(d => (
                      <div key={d} className="jost" style={{ fontSize: 11, color: "#b09090", paddingBottom: 8 }}>{d}</div>
                    ))}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, textAlign: "center" }}>
                    {Array(getFirstDay(calYear, calMonth)).fill(null).map((_, i) => <div key={"e" + i} />)}
                    {Array(getDaysInMonth(calYear, calMonth)).fill(null).map((_, i) => {
                      const d = i + 1;
                      const off = isDayOff(calYear, calMonth, d);
                      const past = isPast(calYear, calMonth, d);
                      const chosen = chosenDay === d;
                      return (
                        <div key={d}
                          className={"cal-day" + (off ? " off" : "") + (past && !off ? " past" : "") + (chosen ? " chosen" : "")}
                          style={{ justifySelf: "center" }}
                          onClick={() => { if (!off && !past) { setChosenDay(d); setChosenTime(null); } }}>
                          {d}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Слоти часу — приходять з GET /available-slots */}
                {chosenDay && (
                  <>
                    <h4 className="jost" style={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase", color: "#c0717a", marginBottom: 12 }}>
                      Вільний час — {chosenDay} {monthNames[calMonth].toLowerCase()}
                    </h4>
                    {slotsLoading && <div className="spinner" style={{ marginBottom: 16 }} />}
                    {!slotsLoading && apiError && <div className="error-box">⚠️ {apiError}</div>}
                    {!slotsLoading && slots.length > 0 && (() => {
                      const freeSlots = slots.filter(s => !s.occupied);
                      return freeSlots.length === 0
                        ? <p className="jost" style={{ color: "#b09090", fontSize: 13, marginBottom: 24 }}>😔 На цей день вільних слотів немає. Оберіть інший день.</p>
                        : (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
                            {freeSlots.map(slot => (
                              <div key={slot.time}
                                className={"time-chip" + (chosenTime === slot.time ? " chosen" : "")}
                                onClick={() => setChosenTime(slot.time)}>
                                {slot.time}
                              </div>
                            ))}
                          </div>
                        );
                    })()}
                  </>
                )}

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <button className="btn-outline" onClick={() => setStep("services")}>← Назад</button>
                  {chosenDay && chosenTime && (
                    <button className="btn-primary" onClick={() => setStep("confirm")}>Далі →</button>
                  )}
                </div>
              </>
            )}

            {/* ── КРОК 3: ПІДТВЕРДЖЕННЯ ────────────────────────────────────── */}
            {step === "confirm" && !booked && (
              <>
                <h3 style={{ fontSize: 26, fontWeight: 400, marginBottom: 4 }}>Підтвердження</h3>
                <p className="jost" style={{ color: "#a09090", fontSize: 13, marginBottom: 24 }}>Перевірте деталі та залиште контакти</p>

                {apiError && <div className="error-box">⚠️ {apiError}</div>}

                <div style={{ background: "#fff5f6", borderRadius: 14, padding: "18px 20px", marginBottom: 24 }}>
                  {selected.map(s => (
                    <div key={s.id} className="jost" style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0", borderBottom: "1px solid #f0e0e4" }}>
                      <span>{s.name}</span><span>₴{s.price}</span>
                    </div>
                  ))}
                  <div className="jost" style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 500, marginTop: 10 }}>
                    <span>Разом</span><span>₴{totalPrice}</span>
                  </div>
                  <div className="jost" style={{ marginTop: 8, fontSize: 12, color: "#a09090" }}>
                    📅 {chosenDay} {monthNames[calMonth]} {calYear} о {chosenTime} · ⏱ {totalDuration} хв
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
                  <input type="text" placeholder="Ім'я *" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
                  <input type="tel" placeholder="Номер телефону *" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <button className="btn-outline" onClick={() => setStep("datetime")}>← Назад</button>
                  <button className="btn-primary"
                    disabled={!formData.name || !formData.phone || submitLoading}
                    onClick={submitBooking}>
                    {submitLoading ? "Відправляємо..." : "Записатися ✓"}
                  </button>
                </div>
              </>
            )}

            {/* ── УСПІХ ────────────────────────────────────────────────────── */}
            {step === "confirm" && booked && (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>🌸</div>
                <h3 style={{ fontSize: 28, fontWeight: 400, marginBottom: 8 }}>Запис підтверджено!</h3>
                <p className="jost" style={{ color: "#8a7070", fontSize: 14, lineHeight: 1.7, marginBottom: 8 }}>
                  Дякуємо за запис, {formData.name}!<br />
  
                </p>
                <p className="jost" style={{ color: "#c0717a", fontSize: 13, marginBottom: 24 }}>
                  📅 {chosenDay} {monthNames[calMonth]} {calYear} о {chosenTime}
                </p>
                <button className="btn-primary" onClick={closeModal}>Чудово!</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}