import React, { useState } from "react";
import "./Reminders.css";

const dummyReminders = [
  {
    id: 1,
    title: "Bayar Listrik PLN",
    date: "2025-06-28",
    status: "active",
    icon: "⚡",
  },
  {
    id: 2,
    title: "Bayar Kartu Kredit",
    date: "2025-06-30",
    status: "pending",
    icon: "💳",
  },
  {
    id: 3,
    title: "Internet Indihome",
    date: "2025-07-03",
    status: "active",
    icon: "🌐",
  },
];

const Reminders = () => {
  const [reminders, setReminders] = useState(dummyReminders);

  return (
    <div className="reminders-page">
      <div className="reminders-header">
        <h1>Reminders</h1>
        <button className="add-reminder-btn" disabled>
          + Tambah Reminder
        </button>
      </div>
      {reminders.length === 0 ? (
        <div className="reminders-empty">
          <img src="https://assets10.lottiefiles.com/packages/lf20_2glqweqs.json" alt="No Reminders" style={{width:120, marginBottom:16}} />
          <p>Belum ada pengingat. Yuk, tambah pengingat agar tidak lupa bayar tagihan!</p>
        </div>
      ) : (
        <div className="reminders-list">
          {reminders.map((reminder) => (
            <div className="reminder-item" key={reminder.id}>
              <div className="reminder-icon">{reminder.icon}</div>
              <div className="reminder-info">
                <div className="reminder-title">{reminder.title}</div>
                <div className="reminder-date">
                  Jatuh tempo: {new Date(reminder.date).toLocaleDateString("id-ID")}
                </div>
              </div>
              <div className={`reminder-status ${reminder.status}`}>{reminder.status === "active" ? "Aktif" : "Belum"}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reminders; 