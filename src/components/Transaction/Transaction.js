import React, { useEffect, useState } from "react";
import "./Transaction.css";
import { useAuth } from "../../contexts/AuthContext";

const Transaction = () => {
  const { user, makeAuthenticatedRequest, isLoggedIn } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [error, setError] = useState("");
  const [editTransaction, setEditTransaction] = useState(null);

  const AUTH_API_URL = process.env.REACT_APP_AUTH_URL || "http://localhost:5001";

  useEffect(() => {
    if (!isLoggedIn) return;
    const fetchTransactions = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await makeAuthenticatedRequest(
          `${AUTH_API_URL}/api/transactions`,
          { method: "GET" }
        );
        const result = await response.json();
        if (result.success !== false && result.transactions) {
          setTransactions(result.transactions);
        } else {
          setError(result.error || "Gagal memuat data transaksi");
        }
      } catch (err) {
        setError("Gagal terhubung ke server.");
      }
      setLoading(false);
    };
    fetchTransactions();
  }, [isLoggedIn]);

  const handleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleEdit = (trx) => {
    setEditTransaction(trx);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) {
      try {
        await makeAuthenticatedRequest(
          `${AUTH_API_URL}/api/transactions/${id}`,
          { method: "DELETE" }
        );
        setTransactions(transactions.filter((trx) => trx.id !== id));
      } catch (err) {
        setError("Gagal menghapus transaksi.");
      }
    }
  };

  const handleSubmitEdit = async (updatedTrx) => {
    try {
      const response = await makeAuthenticatedRequest(
        `${AUTH_API_URL}/api/transactions/${updatedTrx.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(updatedTrx)
        }
      );
      const result = await response.json();
      if (result.success !== false && result.transaction) {
        setTransactions(transactions.map((trx) =>
          trx.id === updatedTrx.id ? result.transaction : trx
        ));
        setEditTransaction(null);
      } else {
        setError(result.error || "Gagal mengupdate transaksi");
      }
    } catch (err) {
      setError("Gagal terhubung ke server.");
    }
  };

  if (!isLoggedIn) {
    return <div className="transaction-page">Silakan login untuk melihat transaksi.</div>;
  }

  return (
    <div className="transaction-page">
      <h2>Daftar Transaksi</h2>
      {loading ? (
        <div>Memuat data...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : transactions.length === 0 ? (
        <div>Tidak ada transaksi.</div>
      ) : (
        <table className="transaction-table">
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Merchant</th>
              <th>Kategori</th>
              <th>Total</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((trx) => (
              <React.Fragment key={trx.id}>
                <tr className="transaction-row">
                  <td>{trx.date}</td>
                  <td>{trx.merchantName || "-"}</td>
                  <td>{trx.category || "-"}</td>
                  <td>Rp {trx.amount.toLocaleString("id-ID")}</td>
                  <td>
                    <button className="btn-expand" onClick={() => handleExpand(trx.id)}>
                      {expandedId === trx.id ? "Tutup" : "Detail"}
                    </button>
                    <button className="btn-edit" onClick={() => handleEdit(trx)}>Edit</button>
                    <button className="btn-delete" onClick={() => handleDelete(trx.id)}>Hapus</button>
                  </td>
                </tr>
                {expandedId === trx.id && (
                  <tr className="transaction-detail-row">
                    <td colSpan={5}>
                      <div className="transaction-detail">
                        <strong>Deskripsi:</strong> {trx.description || "-"}<br />
                        <strong>Metode Pembayaran:</strong> {trx.paymentMethod || "-"}<br />
                        <strong>Item:</strong>
                        <ul className="item-list">
                          {trx.items && trx.items.length > 0 ? (
                            trx.items.map((item, idx) => (
                              <li key={idx}>
                                {item.name} &times; {item.quantity} @ Rp {item.price.toLocaleString("id-ID")}
                              </li>
                            ))
                          ) : (
                            <li>Tidak ada item.</li>
                          )}
                        </ul>
                        <div className="action-buttons">
                          <button className="btn-edit" disabled>Edit</button>
                          <button className="btn-delete" disabled>Hapus</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      )}
      {editTransaction && (
        <div className="trx-modal-overlay" onClick={() => setEditTransaction(null)}>
          <div className="trx-modal-card" onClick={e => e.stopPropagation()}>
            <h3 className="trx-modal-title">Edit Transaksi</h3>
            <form className="trx-form" onSubmit={e => { e.preventDefault(); handleSubmitEdit(editTransaction); }}>
              <div className="trx-form-group">
                <label htmlFor="trx-date">Tanggal</label>
                <input id="trx-date" type="date" value={editTransaction.date} onChange={e => setEditTransaction({ ...editTransaction, date: e.target.value })} required />
              </div>
              <div className="trx-form-group">
                <label htmlFor="trx-merchant">Merchant</label>
                <input id="trx-merchant" type="text" value={editTransaction.merchantName} onChange={e => setEditTransaction({ ...editTransaction, merchantName: e.target.value })} required />
              </div>
              <div className="trx-form-group">
                <label htmlFor="trx-category">Kategori</label>
                <input id="trx-category" type="text" value={editTransaction.category || ""} onChange={e => setEditTransaction({ ...editTransaction, category: e.target.value })} required />
              </div>
              <div className="trx-form-group">
                <label htmlFor="trx-amount">Total</label>
                <input id="trx-amount" type="number" min="1" value={editTransaction.amount} onChange={e => setEditTransaction({ ...editTransaction, amount: e.target.value })} required />
              </div>
              <div className="trx-form-group">
                <label htmlFor="trx-desc">Deskripsi</label>
                <input id="trx-desc" type="text" value={editTransaction.description || ""} onChange={e => setEditTransaction({ ...editTransaction, description: e.target.value })} />
              </div>
              <div className="trx-form-group">
                <label htmlFor="trx-payment">Metode Pembayaran</label>
                <input id="trx-payment" type="text" value={editTransaction.paymentMethod || ""} onChange={e => setEditTransaction({ ...editTransaction, paymentMethod: e.target.value })} />
              </div>
              <div className="trx-form-actions">
                <button type="button" className="btn-cancel" onClick={() => setEditTransaction(null)}>Batal</button>
                <button type="submit" className="btn-save">Simpan</button>
              </div>
              {error && <div className="trx-form-error">{error}</div>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transaction;
