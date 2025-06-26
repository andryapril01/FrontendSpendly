import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import "./Budget.css";

const statusColor = {
  normal: "#22c55e",
  caution: "#facc15",
  warning: "#f59e42",
  over: "#ef4444",
};

const Budget = () => {
  const { makeAuthenticatedRequest, isLoggedIn } = useAuth();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    category_id: "",
    amount: "",
    start_date: new Date().toISOString().split("T")[0],
    period: "monthly",
  });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editBudgetId, setEditBudgetId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const AUTH_API_URL = process.env.REACT_APP_AUTH_URL || "http://localhost:5001";

  const fetchBudgets = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await makeAuthenticatedRequest(
        `${AUTH_API_URL}/api/budgets`,
        { method: "GET" }
      );
      const result = await response.json();
      if (Array.isArray(result.budgets)) {
        setBudgets(result.budgets);
      } else {
        setError(result.error || "Gagal memuat data budget");
      }
    } catch (err) {
      setError("Gagal terhubung ke server.");
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    try {
      const response = await makeAuthenticatedRequest(
        `${AUTH_API_URL}/api/categories`,
        { method: "GET" }
      );
      const result = await response.json();
      if (result.categories) {
        setCategories(result.categories);
        if (!form.category_id && result.categories.length > 0) {
          setForm(f => ({ ...f, category_id: result.categories[0].id }));
        }
      }
    } catch (err) {}
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    fetchBudgets();
    fetchCategories();
    // eslint-disable-next-line
  }, [isLoggedIn]);

  const handleOpenModal = () => {
    setForm({
      category_id: categories.length > 0 ? categories[0].id : "",
      amount: "",
      start_date: new Date().toISOString().split("T")[0],
      period: "monthly",
    });
    setFormError("");
    setIsEdit(false);
    setEditBudgetId(null);
    setShowModal(true);
  };

  const handleEditModal = (budget) => {
    setForm({
      category_id: budget.category?.id || "",
      amount: budget.amount,
      start_date: budget.start_date,
      period: budget.period,
    });
    setFormError("");
    setIsEdit(true);
    setEditBudgetId(budget.id);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormError("");
    setIsEdit(false);
    setEditBudgetId(null);
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);
    if (!form.category_id || !form.amount || isNaN(form.amount) || form.amount <= 0) {
      setFormError("Kategori dan nominal budget wajib diisi dan valid.");
      setFormLoading(false);
      return;
    }
    try {
      const selectedCategory = categories.find(cat => String(cat.id) === String(form.category_id));
      const data = {
        category_id: form.category_id,
        name: selectedCategory ? selectedCategory.name : "Budget",
        amount: parseFloat(form.amount),
        period: form.period,
        start_date: form.start_date,
      };
      let response, result;
      if (isEdit && editBudgetId) {
        response = await makeAuthenticatedRequest(
          `${AUTH_API_URL}/api/budgets/${editBudgetId}`,
          {
            method: "PATCH",
            body: JSON.stringify(data),
          }
        );
        result = await response.json();
        if (result.success) {
          setShowModal(false);
          fetchBudgets();
        } else {
          setFormError(result.error || "Gagal mengedit budget.");
        }
      } else {
        response = await makeAuthenticatedRequest(
          `${AUTH_API_URL}/api/budgets`,
          {
            method: "POST",
            body: JSON.stringify(data),
          }
        );
        result = await response.json();
        if (result.success) {
          setShowModal(false);
          fetchBudgets();
        } else {
          setFormError(result.error || "Gagal menambah budget.");
        }
      }
    } catch (err) {
      setFormError("Gagal terhubung ke server.");
    }
    setFormLoading(false);
  };

  const handleDeleteBudget = async (budgetId) => {
    if (!window.confirm("Yakin ingin menghapus budget ini?")) return;
    setDeleteLoading(true);
    try {
      const response = await makeAuthenticatedRequest(
        `${AUTH_API_URL}/api/budgets/${budgetId}`,
        { method: "DELETE" }
      );
      const result = await response.json();
      if (result.success) {
        fetchBudgets();
      } else {
        alert(result.error || "Gagal menghapus budget.");
      }
    } catch (err) {
      alert("Gagal terhubung ke server.");
    }
    setDeleteLoading(false);
  };

  return (
    <div className="budget-page">
      <div className="budget-header">
        <h2>Daftar Budget</h2>
        <button className="btn-add-budget" onClick={handleOpenModal}>+ Tambah Budget</button>
      </div>
      {loading ? (
        <div>Memuat data budget...</div>
      ) : error ? (
        <div className="budget-error">{error}</div>
      ) : budgets.length === 0 ? (
        <div>Belum ada budget. Silakan tambah budget untuk kategori pengeluaran Anda.</div>
      ) : (
        <div className="budget-list">
          {budgets.map((b) => (
            <div className="budget-item" key={b.id}>
              <div className="budget-info">
                <div className="budget-category">
                  <span className="category-icon" style={{ background: b.category?.color || '#6366f1' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /></svg>
                  </span>
                  <span>{b.category?.name || b.name}</span>
                </div>
                <div className="budget-amount">
                  <span className="spent">Rp {(b.spent !== undefined && b.spent !== null ? b.spent : 0).toLocaleString("id-ID")}</span> / <span className="total">Rp {(b.amount !== undefined && b.amount !== null ? b.amount : 0).toLocaleString("id-ID")}</span>
                </div>
              </div>
              <div className="budget-progress">
                <div className="progress-bar">
                  <div
                    className={`progress ${b.status}`}
                    style={{ width: `${Math.min(b.percentage, 100)}%`, background: statusColor[b.status] || '#6366f1' }}
                  ></div>
                </div>
                <span className={`progress-text ${b.status}`}>{b.percentage}%</span>
              </div>
              <div className="budget-status-label" style={{ color: statusColor[b.status] }}>
                {b.status === 'over' && 'Melebihi Budget!'}
                {b.status === 'warning' && 'Hampir Habis!'}
                {b.status === 'caution' && 'Waspada!'}
                {b.status === 'normal' && 'Aman'}
              </div>
              <div className="budget-period">
                Periode: {b.period === 'monthly' ? 'Bulanan' : b.period === 'weekly' ? 'Mingguan' : 'Tahunan'}<br/>
                Mulai: {b.start_date}
                {b.end_date && (<span> s/d {b.end_date}</span>)}
              </div>
              <div className="budget-actions" style={{ marginTop: 10 }}>
                <button className="btn-edit" onClick={() => handleEditModal(b)} disabled={formLoading || deleteLoading}>Edit</button>
                <button className="btn-delete" onClick={() => handleDeleteBudget(b.id)} disabled={formLoading || deleteLoading}>Hapus</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tambah/Edit Budget */}
      {showModal && (
        <div className="budget-modal-overlay">
          <div className="budget-modal-card">
            <h3 className="budget-modal-title">Tambah Budget</h3>
            <form className="budget-form" onSubmit={handleFormSubmit}>
              <div className="budget-form-group">
                <label htmlFor="category_id">Kategori</label>
                <select
                  id="category_id"
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  required
                >
                  <option value="">Pilih kategori</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="budget-form-group">
                <label htmlFor="amount">Nominal Budget (Rp)</label>
                <input
                  id="amount"
                  type="number"
                  min="1"
                  placeholder="Masukkan nominal budget"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                />
              </div>
              <div className="budget-form-group">
                <label htmlFor="start_date">Tanggal Mulai</label>
                <input
                  id="start_date"
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  required
                />
              </div>
              <div className="budget-form-group">
                <label htmlFor="period">Periode</label>
                <select
                  id="period"
                  value={form.period}
                  onChange={(e) => setForm({ ...form, period: e.target.value })}
                  required
                >
                  <option value="monthly">Bulanan</option>
                  <option value="weekly">Mingguan</option>
                  <option value="yearly">Tahunan</option>
                </select>
              </div>
              <div className="budget-form-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Batal</button>
                <button type="submit" className="btn-save">Simpan</button>
              </div>
              {formError && <div className="budget-form-error">{formError}</div>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Budget; 