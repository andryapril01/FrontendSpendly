import React, { useEffect, useState } from "react";
import "./OnboardingModal.css";

const steps = [
  {
    title: "Selamat Datang di Spendly!",
    desc: "Aplikasi manajemen keuangan modern untuk kebutuhan harianmu.",
  },
  {
    title: "Dashboard",
    desc: "Lihat ringkasan keuangan, grafik, dan insight pengeluaranmu di satu tempat.",
  },
  {
    title: "Scanner",
    desc: "Scan struk belanja untuk input transaksi secara otomatis.",
  },
  {
    title: "Transactions & Budgets",
    desc: "Kelola pemasukan, pengeluaran, dan atur budget tiap kategori.",
  },
  {
    title: "Reminders",
    desc: "Buat pengingat tagihan agar tidak pernah telat bayar lagi!",
  },
];

const OnboardingModal = () => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem("spendly_onboarding_seen");
    if (!seen) setOpen(true);
  }, []);

  const handleClose = () => {
    setOpen(false);
    localStorage.setItem("spendly_onboarding_seen", "1");
  };

  if (!open) return null;

  return (
    <div className="onboarding-modal-backdrop">
      <div className="onboarding-modal">
        <h2>{steps[step].title}</h2>
        <p>{steps[step].desc}</p>
        <div className="onboarding-modal-actions">
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="onboarding-btn secondary">Kembali</button>
          )}
          {step < steps.length - 1 ? (
            <button onClick={() => setStep(step + 1)} className="onboarding-btn primary">Lanjut</button>
          ) : (
            <button onClick={handleClose} className="onboarding-btn primary">Mulai</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal; 