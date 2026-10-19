import React, { useState, useEffect, useMemo } from "react";
import "./BookingModal.css";
import { IMaskInput } from "react-imask";

const API = "http://localhost:8000";

const MONTH_NAMES = [
  "Січень",
  "Лютий",
  "Березень",
  "Квітень",
  "Травень",
  "Червень",
  "Липень",
  "Серпень",
  "Вересень",
  "Жовтень",
  "Листопад",
  "Грудень",
];

function formatDuration(minutes) {
  if (!minutes) return "0 хв";
  if (minutes < 60) return `${minutes} хв`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours} год ${mins} хв` : `${hours} год`;
}

// Форматування часу з "13:00:00" у "13:00"
function formatTime(timeStr) {
  if (!timeStr) return "";
  const val = typeof timeStr === "object" ? timeStr.time : timeStr;
  if (typeof val !== "string") return "";
  const parts = val.split(":");
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`;
  }
  return val;
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function dateStr(y, m, d) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

export default function BookingModal({ service, onClose }) {
  const [step, setStep] = useState("services"); // services | datetime | confirm

  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [selected, setSelected] = useState(service ? [service] : []);

  // Вкладка категорії послуг у модалці ('manicure' | 'pedicure')
  const [activeCategory, setActiveCategory] = useState(
    service && service.category === "pedicure" ? "pedicure" : "manicure",
  );

  // Календар
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [chosenDay, setChosenDay] = useState(null);

  // Обмеження на 2 місяці вперед
  const maxDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);

  // Слоти
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [chosenTime, setChosenTime] = useState(null);

  // Контакти
  const [formData, setFormData] = useState({ name: "", phone: "" });
  const [booked, setBooked] = useState(false);
  const [error, setError] = useState(null);

  // Перевірка: чи вибрано дату і час
  const canGoToConfirm = Boolean(chosenDay && chosenTime);

  // Завантаження послуг
  useEffect(() => {
    fetch(`${API}/services`)
      .then((r) => {
        if (!r.ok) throw new Error("Не вдалося завантажити послуги");
        return r.json();
      })
      .then((data) => {
        setServices(data);
        if (service) {
          const current = data.find((s) => s.id === service.id);
          if (current) {
            setSelected([current]);
            if (current.category === "pedicure") {
              setActiveCategory("pedicure");
            }
          }
        }
        setLoadingServices(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoadingServices(false);
      });
  }, [service]);

  // Блокування скролу сторінки
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Розподіл послуг за категоріями
  const manicureServices = useMemo(
    () => services.filter((s) => !s.category || s.category === "manicure"),
    [services],
  );

  const pedicureServices = useMemo(
    () => services.filter((s) => s.category === "pedicure"),
    [services],
  );

  const totalPrice = useMemo(
    () => selected.reduce((sum, item) => sum + Number(item.price || 0), 0),
    [selected],
  );

  const totalDuration = useMemo(
    () =>
      selected.reduce(
        (sum, item) => sum + Number(item.duration_minutes || 0),
        0,
      ),
    [selected],
  );

  const selectedServiceIds = useMemo(
    () => selected.map((item) => item.id),
    [selected],
  );

  // Отримання вільних слотів
  useEffect(() => {
    if (!chosenDay || selectedServiceIds.length === 0) {
      setSlots([]);
      return;
    }

    setChosenTime(null);
    setError(null);
    setLoadingSlots(true);

    const formattedDate = dateStr(calYear, calMonth, chosenDay);
    const params = new URLSearchParams();
    params.append("booking_date", formattedDate);
    selectedServiceIds.forEach((id) =>
      params.append("service_ids", String(id)),
    );

    fetch(`${API}/available-slots?${params.toString()}`)
      .then((r) => {
        if (!r.ok) throw new Error("Не вдалося завантажити вільний час");
        return r.json();
      })
      .then((data) => {
        setSlots(data);
        setLoadingSlots(false);
      })
      .catch((err) => {
        setError(err.message);
        setSlots([]);
        setLoadingSlots(false);
      });
  }, [chosenDay, calMonth, calYear, selectedServiceIds]);

  function toggleService(svc) {
    setSelected((prev) =>
      prev.some((s) => s.id === svc.id)
        ? prev.filter((s) => s.id !== svc.id)
        : [...prev, svc],
    );
    setChosenDay(null);
    setChosenTime(null);
  }

  function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  function getFirstDay(year, month) {
    return (new Date(year, month, 1).getDay() + 6) % 7;
  }

  function isSunday(year, month, day) {
    return new Date(year, month, day).getDay() === 0;
  }

  function isPast(year, month, day) {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return new Date(year, month, day) < t;
  }

  function isBeyondMaxDate(year, month, day) {
    const target = new Date(year, month, day);
    return target > maxDate;
  }

  const canGoNextMonth = useMemo(() => {
    const nextMonthDate = new Date(calYear, calMonth + 1, 1);
    return nextMonthDate <= maxDate;
  }, [calYear, calMonth, maxDate]);

  const canGoPrevMonth = useMemo(() => {
    return calYear > today.getFullYear() || calMonth > today.getMonth();
  }, [calYear, calMonth, today]);

  const handleSubmitBooking = async () => {
    setError(null);

    if (!formData.name.trim() || !formData.phone.trim()) {
      setError("Введіть ім'я та телефон");
      return;
    }

    const payload = {
      service_ids: selectedServiceIds,
      booking_date: dateStr(calYear, calMonth, chosenDay),
      booking_time: formatTime(chosenTime),
      client_name: formData.name.trim(),
      client_phone: formData.phone.trim(),
    };

    try {
      const res = await fetch(`${API}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let msg = "Не вдалося створити бронювання";
        try {
          const errData = await res.json();
          if (errData.detail) {
            msg =
              typeof errData.detail === "string"
                ? errData.detail
                : JSON.stringify(errData.detail);
          }
        } catch {}
        throw new Error(msg);
      }

      setBooked(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const currentCategoryServices =
    activeCategory === "manicure" ? manicureServices : pedicureServices;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        {/* Кнопка закриття */}
        <button className="modal-close-btn" onClick={onClose}>
          ×
        </button>

        {/* Навігація по кроках */}
        {!booked && (
          <div className="modal-steps-tabs jost">
            {[
              ["services", "1. Послуги"],
              ["datetime", "2. Дата і час"],
              ["confirm", "3. Підтвердження"],
            ].map(([sKey, label]) => {
              const isClickable =
                (sKey === "services" ||
                  (sKey === "datetime" && selected.length > 0)) &&
                sKey !== step;

              return (
                <button
                  key={sKey}
                  disabled={!isClickable}
                  onClick={() => {
                    if (isClickable) setStep(sKey);
                  }}
                  className={`modal-step-tab ${step === sKey ? "active" : ""}`}
                  style={{
                    opacity: step === sKey ? 1 : isClickable ? 0.8 : 0.4,
                    cursor: isClickable ? "pointer" : "default",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {error && <div className="modal-error-msg jost">{error}</div>}

        {/* КРОК 1: ПОСЛУГИ */}
        {step === "services" && !booked && (
          <>
            <h3 style={{ fontSize: 26, fontWeight: 400, marginBottom: 4 }}>
              Оберіть послуги
            </h3>
            <p
              className="jost"
              style={{ color: "#a09090", fontSize: 13, marginBottom: 16 }}
            >
              Можна вибрати кілька
            </p>

            {/* Вкладки перемикання Манікюр / Педикюр */}
            <div className="category-toggle-tabs">
              <button
                className={`category-tab-btn ${
                  activeCategory === "manicure" ? "active" : ""
                }`}
                onClick={() => setActiveCategory("manicure")}
              >
                Манікюр ({manicureServices.length})
              </button>
              <button
                className={`category-tab-btn ${
                  activeCategory === "pedicure" ? "active" : ""
                }`}
                onClick={() => setActiveCategory("pedicure")}
              >
                Педикюр ({pedicureServices.length})
              </button>
            </div>

            {loadingServices ? (
              <div
                className="jost"
                style={{ textAlign: "center", padding: "20px" }}
              >
                Завантаження послуг...
              </div>
            ) : (
              <div className="modal-services-list">
                {currentCategoryServices.map((svc) => {
                  const isChosen = selected.some((s) => s.id === svc.id);
                  return (
                    <div
                      key={svc.id}
                      onClick={() => toggleService(svc)}
                      className={`modal-service-card ${
                        isChosen ? "selected" : ""
                      }`}
                    >
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 500 }}>
                          {svc.name}
                        </div>
                        <div
                          className="jost"
                          style={{
                            fontSize: 12,
                            color: "#a09090",
                            marginTop: 2,
                          }}
                        >
                          {formatDuration(svc.duration_minutes)} · ₴{svc.price}
                        </div>
                      </div>
                      <div className="modal-service-checkbox">
                        {isChosen && <div className="checkbox-dot" />}
                      </div>
                    </div>
                  );
                })}

                {currentCategoryServices.length === 0 && (
                  <div
                    className="jost"
                    style={{
                      textAlign: "center",
                      color: "#a09090",
                      padding: "20px 0",
                    }}
                  >
                    Послуг у цій категорії поки немає
                  </div>
                )}
              </div>
            )}

            {selected.length > 0 && (
              <>
                <div className="divider" />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 16,
                  }}
                >
                  <div>
                    <div
                      className="jost"
                      style={{
                        fontSize: 12,
                        color: "#a09090",
                        letterSpacing: 1,
                        textTransform: "uppercase",
                      }}
                    >
                      Обрано послуг: {selected.length}
                    </div>
                    <div style={{ fontSize: 28, fontWeight: 500 }}>
                      ₴{totalPrice}
                    </div>
                    <div
                      className="jost"
                      style={{ fontSize: 12, color: "#a09090" }}
                    >
                      {formatDuration(totalDuration)}
                    </div>
                  </div>
                  <button
                    className="btn-primary"
                    onClick={() => setStep("datetime")}
                  >
                    Далі
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* КРОК 2: ДАТА І ЧАС */}
        {step === "datetime" && !booked && (
          <>
            <h3 style={{ fontSize: 26, fontWeight: 400, marginBottom: 24 }}>
              Оберіть дату та час
            </h3>

            {/* Календар */}
            <div className="calendar-box">
              <div className="calendar-header-nav">
                <button
                  disabled={!canGoPrevMonth}
                  style={{
                    opacity: canGoPrevMonth ? 1 : 0.3,
                    cursor: canGoPrevMonth ? "pointer" : "default",
                  }}
                  onClick={() => {
                    if (!canGoPrevMonth) return;
                    if (calMonth === 0) {
                      setCalMonth(11);
                      setCalYear((y) => y - 1);
                    } else setCalMonth((m) => m - 1);
                  }}
                >
                  ‹
                </button>
                <span style={{ fontSize: 18, fontWeight: 500 }}>
                  {MONTH_NAMES[calMonth]} {calYear}
                </span>
                <button
                  disabled={!canGoNextMonth}
                  style={{
                    opacity: canGoNextMonth ? 1 : 0.3,
                    cursor: canGoNextMonth ? "pointer" : "default",
                  }}
                  onClick={() => {
                    if (!canGoNextMonth) return;
                    if (calMonth === 11) {
                      setCalMonth(0);
                      setCalYear((y) => y + 1);
                    } else setCalMonth((m) => m + 1);
                  }}
                >
                  ›
                </button>
              </div>

              <div className="calendar-weekdays-grid">
                {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"].map((d) => (
                  <div
                    key={d}
                    className="jost"
                    style={{
                      fontSize: 11,
                      color: "#b09090",
                      letterSpacing: 0.5,
                      paddingBottom: 8,
                    }}
                  >
                    {d}
                  </div>
                ))}
              </div>

              <div className="calendar-days-grid">
                {Array(getFirstDay(calYear, calMonth))
                  .fill(null)
                  .map((_, i) => (
                    <div key={"empty-" + i} />
                  ))}

                {Array(getDaysInMonth(calYear, calMonth))
                  .fill(null)
                  .map((_, i) => {
                    const dayNum = i + 1;
                    const sunday = isSunday(calYear, calMonth, dayNum);
                    const pastDay = isPast(calYear, calMonth, dayNum);
                    const tooFar = isBeyondMaxDate(calYear, calMonth, dayNum);
                    const isDisabledDay = sunday || pastDay || tooFar;
                    const isChosen = chosenDay === dayNum;

                    return (
                      <div
                        key={dayNum}
                        className={
                          "cal-day" +
                          (isDisabledDay ? " off" : "") +
                          (isChosen ? " chosen" : "")
                        }
                        onClick={() => {
                          if (!isDisabledDay) {
                            setChosenDay(dayNum);
                          }
                        }}
                      >
                        {dayNum}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Слоти часу */}
            {chosenDay && (
              <>
                <h4
                  className="jost"
                  style={{
                    fontSize: 12,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    color: "#a09090",
                    marginBottom: 12,
                  }}
                >
                  Вільний час — {chosenDay}{" "}
                  {MONTH_NAMES[calMonth].toLowerCase()}
                </h4>

                {loadingSlots ? (
                  <div
                    className="jost"
                    style={{ fontSize: 13, color: "#a09090", marginBottom: 24 }}
                  >
                    Завантаження вільного часу...
                  </div>
                ) : slots.filter((slot) => !slot.occupied).length === 0 ? (
                  <div
                    className="jost"
                    style={{ fontSize: 13, color: "#a09090", marginBottom: 24 }}
                  >
                    На цей день немає вільних слотів.
                  </div>
                ) : (
                  <div className="time-chips-grid">
                    {slots
                      .filter((slot) => !slot.occupied)
                      .map((slot) => {
                        const slotTimeVal =
                          typeof slot === "object" ? slot.time : slot;
                        const isChosen = chosenTime === slotTimeVal;
                        return (
                          <div
                            key={slotTimeVal}
                            className={
                              "time-chip" + (isChosen ? " chosen" : "")
                            }
                            onClick={() => setChosenTime(slotTimeVal)}
                          >
                            {formatTime(slotTimeVal)}
                          </div>
                        );
                      })}
                  </div>
                )}
              </>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 24,
              }}
            >
              <button
                className="btn-outline"
                onClick={() => setStep("services")}
              >
                Назад
              </button>
              <button
                className="btn-primary"
                disabled={!canGoToConfirm}
                onClick={() => canGoToConfirm && setStep("confirm")}
              >
                Далі
              </button>
            </div>
          </>
        )}

        {/* КРОК 3: ПІДТВЕРДЖЕННЯ */}
        {step === "confirm" && !booked && (
          <>
            <h3 style={{ fontSize: 26, fontWeight: 400, marginBottom: 4 }}>
              Підтвердження
            </h3>
            <p
              className="jost"
              style={{ color: "#a09090", fontSize: 13, marginBottom: 24 }}
            >
              Перевірте деталі та залиште контакти
            </p>

            <div className="summary-card">
              {selected.map((s) => (
                <div key={s.id} className="summary-row jost">
                  <span>{s.name}</span>
                  <span>₴{s.price}</span>
                </div>
              ))}
              <div
                className="jost"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 15,
                  fontWeight: 500,
                  marginTop: 10,
                }}
              >
                <span>Разом</span>
                <span>₴{totalPrice}</span>
              </div>
              <div
                className="jost"
                style={{ marginTop: 8, fontSize: 12, color: "#a09090" }}
              >
                {chosenDay} {MONTH_NAMES[calMonth]} {calYear}{" "}
                {chosenTime ? `о ${formatTime(chosenTime)}` : ""} ·{" "}
                {formatDuration(totalDuration)}
              </div>
            </div>

            <div className="form-inputs-group">
              <input
                type="text"
                placeholder="Ваше ім'я *"
                value={formData.name}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, name: e.target.value }))
                }
              />
              <IMaskInput
                mask="+380 (00) 000-00-00"
                value={formData.phone}
                unmask={false} // залишає маску красиво у форматиці
                onAccept={(value) =>
                  setFormData((p) => ({ ...p, phone: value }))
                }
                placeholder="Номер телефону (+380...) *"
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button
                className="btn-outline"
                onClick={() => setStep("datetime")}
              >
                Назад
              </button>
              <button
                className="btn-primary"
                disabled={
                  !formData.name.trim() ||
                  formData.phone.replace(/\D/g, "").length < 12 // перевіряє, що є повні 12 цифр (380XXXXXXXXX)
                }
                onClick={handleSubmitBooking}
              >
                Записатися
              </button>
            </div>
          </>
        )}

        {/* ЕКРАН УСПІХУ */}
        {booked && (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🌸</div>
            <h3 style={{ fontSize: 28, fontWeight: 400, marginBottom: 8 }}>
              Дьоді!
            </h3>
            <p
              className="jost"
              style={{
                color: "#8a7070",
                fontSize: 14,
                lineHeight: 1.7,
                marginBottom: 8,
              }}
            >
              Дякую за запис, {formData.name}!<br />
              Анастасія зв'яжеться з Вами за номером {formData.phone}.
            </p>
            <p
              className="jost"
              style={{ color: "#8a7070", fontSize: 13, marginBottom: 24 }}
            >
              {chosenDay} {MONTH_NAMES[calMonth]} {calYear}{" "}
              {chosenTime ? `о ${formatTime(chosenTime)}` : ""}
            </p>
            <button className="btn-primary" onClick={onClose}>
              Чудово!
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
