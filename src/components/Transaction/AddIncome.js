import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import "./AddIncome.css";

const AddIncome = () => {
  const { makeAuthenticatedRequest, isLoggedIn } = useAuth();
  const [form, setForm] = useState({
    merchantName: "",
    date: new Date().toISOString().split("T")[0],
    total: "",
    category: "Income",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const AUTH_API_URL = process.env.REACT_APP_AUTH_URL || "http://localhost:5001";

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    try {
      if (!form.merchantName.trim() || !form.total || isNaN(form.total)) {
        setError("Nama sumber dan jumlah pemasukan wajib diisi.");
        setLoading(false);
        return;
      }
      const data = {
        merchantName: form.merchantName,
        date: form.date,
        total: parseFloat(form.total),
        category: form.category,
        description: form.description,
        type: "income",
        items: [
          {
            name: form.merchantName,
            quantity: 1,
            price: parseFloat(form.total),
          },
        ],
      };
      const response = await makeAuthenticatedRequest(
        `${AUTH_API_URL}/api/transactions`,
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      );
      const result = await response.json();
      if (result.success) {
        setMessage("Pemasukan berhasil ditambahkan!");
        setForm({
          merchantName: "",
          date: new Date().toISOString().split("T")[0],
          total: "",
          category: "Income",
          description: "",
        });
      } else {
        setError(result.error || "Gagal menambah pemasukan.");
      }
    } catch (err) {
      setError("Gagal terhubung ke server.");
    }
    setLoading(false);
  };

  if (!isLoggedIn) {
    return <div>Silakan login untuk menambah pemasukan.</div>;
  }

  return (
    <div className="add-income-page">
      <div className="add-income-card">
        <div className="add-income-title">
          <span className="income-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
          </span>
          Tambah Pemasukan
        </div>
        <form onSubmit={handleSubmit} className="add-income-form">
          <div className="form-group">
            <label>Nama Sumber</label>
            <input
              type="text"
              name="merchantName"
              value={form.merchantName}
              onChange={handleChange}
              placeholder="Contoh: Gaji, Bonus, Penjualan, dll"
              required
            />
          </div>
          <div className="form-group">
            <label>Tanggal</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Jumlah (Rp)</label>
            <input
              type="number"
              name="total"
              value={form.total}
              onChange={handleChange}
              min="1"
              placeholder="Masukkan nominal pemasukan"
              required
            />
          </div>
          <div className="form-group">
            <label>Kategori</label>
            <input
              type="text"
              name="category"
              value={form.category}
              onChange={handleChange}
              placeholder="Income"
              required
            />
          </div>
          <div className="form-group">
            <label>Deskripsi (opsional)</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={2}
              placeholder="Keterangan tambahan, misal: bulan Juni, bonus, dsb"
            />
          </div>
          {message && <div className="form-success">{message}</div>}
          {error && <div className="form-error">{error}</div>}
          <button type="submit" className="btn-income" disabled={loading}>
            {loading ? "Menyimpan..." : "Simpan Pemasukan"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddIncome; 