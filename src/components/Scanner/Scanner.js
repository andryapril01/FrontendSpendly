// src/components/Scanner/Scanner.js (Complete Fixed Version)

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import "./Scanner.css";

const Scanner = () => {
  const { user, makeAuthenticatedRequest, isLoggedIn } = useAuth();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isExtracted, setIsExtracted] = useState(false);
  const [extractedData, setExtractedData] = useState({
    merchantName: "",
    date: new Date().toISOString().split("T")[0],
    items: [],
    total: 0,
    paymentMethod: "Cash",
    category: "Groceries",
  });
  const [isManualInput, setIsManualInput] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [rawOcrText, setRawOcrText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  // API endpoints
  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
  const AUTH_API_URL =
    process.env.REACT_APP_AUTH_URL || "http://localhost:5001";

  // Check if user is logged in
  useEffect(() => {
    if (!isLoggedIn) {
      console.log("⚠️ User not logged in, redirecting...");
      alert("Please login to access the scanner");
      window.location.href = "/login";
    }
  }, [isLoggedIn]);

  // ========== FILE HANDLING ==========
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    if (selectedFile) {
      if (!selectedFile.type.startsWith("image/")) {
        alert("Please select a valid image file (JPG, PNG, etc.)");
        return;
      }

      if (selectedFile.size > 10 * 1024 * 1024) {
        alert("File size too large. Please select an image smaller than 10MB.");
        return;
      }

      setFile(selectedFile);

      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result);
        resetExtractedData();
      };
      reader.onerror = () => {
        alert("Error reading file. Please try again.");
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];

      if (!droppedFile.type.startsWith("image/")) {
        alert("Please drop a valid image file (JPG, PNG, etc.)");
        return;
      }

      if (droppedFile.size > 10 * 1024 * 1024) {
        alert("File size too large. Please select an image smaller than 10MB.");
        return;
      }

      setFile(droppedFile);

      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result);
        resetExtractedData();
      };
      reader.onerror = () => {
        alert("Error reading file. Please try again.");
      };
      reader.readAsDataURL(droppedFile);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const resetExtractedData = () => {
    setIsExtracted(false);
    setIsManualInput(false);
    setRawOcrText("");
    setExtractedData({
      merchantName: "",
      date: new Date().toISOString().split("T")[0],
      items: [],
      total: 0,
      paymentMethod: "Cash",
      category: "Groceries",
    });
  };

  // ========== OCR SCANNING ==========
  const handleScan = async () => {
    if (!file) {
      alert("Please select an image file first.");
      return;
    }

    setIsScanning(true);
    setScanProgress(0);

    try {
      console.log("🔍 Starting OCR process...");

      const formData = new FormData();
      formData.append("image", file);

      // Show progress updates
      const progressInterval = setInterval(() => {
        setScanProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      // Send request to Python backend
      const response = await fetch(`${API_BASE_URL}/api/scan-receipt`, {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setScanProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();
      console.log("📄 OCR Backend response:", result);

      if (result.success && result.data) {
        if (result.data.raw_text) {
          setRawOcrText(result.data.raw_text);
        }

        setExtractedData({
          merchantName: result.data.merchantName || "",
          date: result.data.date || new Date().toISOString().split("T")[0],
          items: result.data.items || [],
          total: result.data.total || 0,
          paymentMethod: result.data.paymentMethod || "Cash",
          category: result.data.category || "Groceries",
          confidence: result.data.confidence || 0,
        });

        setIsScanning(false);
        setIsExtracted(true);

        console.log("✅ OCR completed successfully:", result.data);

        if (result.data.confidence) {
          const confidencePercent = Math.round(result.data.confidence * 100);
          console.log(`📊 OCR Confidence: ${confidencePercent}%`);
        }
      } else {
        throw new Error("Invalid response from OCR server");
      }
    } catch (error) {
      console.error("❌ Error scanning receipt:", error);
      setIsScanning(false);
      setScanProgress(0);

      let errorMessage = "Error scanning receipt. ";

      if (
        error.message.includes("fetch") ||
        error.message.includes("Failed to fetch")
      ) {
        errorMessage += `Cannot connect to OCR server at ${API_BASE_URL}. Please ensure the backend is running.`;
      } else if (error.message.includes("NetworkError")) {
        errorMessage +=
          "Network error. Please check your connection and ensure the backend is running.";
      } else if (error.message.includes("CORS")) {
        errorMessage += "CORS error. Please check backend CORS configuration.";
      } else {
        errorMessage +=
          error.message || "Please try again or use manual input.";
      }

      alert(errorMessage);
    }
  };

  // ========== BACKEND CONNECTION TEST ==========
  const testBackendConnection = async () => {
    try {
      console.log("🧪 Testing OCR backend connection...");
      const response = await fetch(`${API_BASE_URL}/api/health`);
      if (response.ok) {
        const data = await response.json();
        console.log("✅ OCR Backend connection OK:", data);
      } else {
        console.error("❌ OCR Backend not responding");
      }
    } catch (error) {
      console.error("❌ Cannot connect to OCR backend:", error);
    }
  };

  useEffect(() => {
    testBackendConnection();
  }, []);

  // ========== MANUAL INPUT ==========
  const handleManualInput = () => {
    setIsManualInput(true);
    setIsExtracted(true);
    setExtractedData({
      merchantName: "",
      date: new Date().toISOString().split("T")[0],
      items: [{ name: "", quantity: 1, price: 0 }],
      total: 0,
      paymentMethod: "Cash",
      category: "Groceries",
    });
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setIsExtracted(false);
    setIsManualInput(false);
    setScanProgress(0);
    setRawOcrText("");
    setIsSaving(false);
    setExtractedData({
      merchantName: "",
      date: new Date().toISOString().split("T")[0],
      items: [],
      total: 0,
      paymentMethod: "Cash",
      category: "Groceries",
    });
  };

  // ========== SAVE TRANSACTION (Enhanced with Auth Context) ==========
  const handleSave = async () => {
    if (!validateData()) {
      return;
    }

    if (!isLoggedIn) {
      alert("Please login to save transactions");
      window.location.href = "/login";
      return;
    }

    setIsSaving(true);

    try {
      console.log("💾 === SAVING TRANSACTION ===");
      console.log("📋 User:", user?.email);
      console.log("📋 Extracted data:", extractedData);

      // Prepare data for API with strict validation
      const transactionData = {
        merchantName: String(
          extractedData.merchantName || "Unknown Merchant"
        ).trim(),
        date: String(
          extractedData.date || new Date().toISOString().split("T")[0]
        ),
        total: Number(extractedData.total) || 0,
        category: String(extractedData.category || "Lain-lain").trim(),
        description: String(
          `Payment via ${extractedData.paymentMethod || "Cash"}`
        ).trim(),
        items:
          extractedData.items && extractedData.items.length > 0
            ? extractedData.items
                .filter((item) => item.name && String(item.name).trim())
                .map((item) => ({
                  name: String(item.name || "Unknown Item").trim(),
                  quantity: parseInt(item.quantity) || 1,
                  price: parseFloat(item.price) || 0,
                }))
            : [
                {
                  name: String(
                    `Purchase at ${
                      extractedData.merchantName || "Unknown Merchant"
                    }`
                  ).trim(),
                  quantity: 1,
                  price: parseFloat(extractedData.total) || 0,
                },
              ],
        isScanned: Boolean(!isManualInput),
      };

      console.log("📤 Sending transaction data:", transactionData);

      // Final validation before sending
      if (
        !transactionData.merchantName ||
        transactionData.merchantName.length < 1
      ) {
        alert("Merchant name is required and cannot be empty");
        return;
      }

      if (transactionData.total <= 0) {
        alert("Transaction amount must be greater than 0");
        return;
      }

      if (!transactionData.items || transactionData.items.length === 0) {
        alert("At least one item is required");
        return;
      }

      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(transactionData.date)) {
        alert("Invalid date format. Please use a valid date.");
        return;
      }

      // Validate items
      for (const item of transactionData.items) {
        if (!item.name || item.name.trim().length === 0) {
          alert("All items must have a name");
          return;
        }
        if (item.quantity <= 0) {
          alert("Item quantity must be greater than 0");
          return;
        }
        if (item.price < 0) {
          alert("Item price cannot be negative");
          return;
        }
      }

      console.log("✅ All validation passed, sending to server...");

      // Use authenticated request from AuthContext
      const response = await makeAuthenticatedRequest(
        `${AUTH_API_URL}/api/transactions`,
        {
          method: "POST",
          body: JSON.stringify(transactionData),
        }
      );

      const result = await response.json();
      console.log("📋 Server response:", result);

      if (result.success) {
        console.log("✅ Transaction saved successfully:", result);
        alert(
          `🎉 Transaction saved successfully!\n\nTransaction ID: ${result.transaction_id}\n\nRedirecting to dashboard...`
        );

        handleReset();

        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 2000);
      } else {
        throw new Error(
          result.message || result.error || "Failed to save transaction"
        );
      }
    } catch (error) {
      console.error("❌ Error saving transaction:", error);

      if (
        error.message.includes("Token refresh failed") ||
        error.message.includes("Authentication failed")
      ) {
        alert("Session expired. Please login again.");
        window.location.href = "/login";
      } else if (
        error.message.includes("fetch") ||
        error.name === "TypeError"
      ) {
        alert(
          "Cannot connect to server. Please ensure the backend is running and try again."
        );
      } else {
        alert(`Error saving transaction: ${error.message}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // ========== DATA VALIDATION ==========
  const validateData = () => {
    // Jika merchantName kosong, isi otomatis
    if (!extractedData.merchantName.trim()) {
      setExtractedData((prev) => ({
        ...prev,
        merchantName: "Unknown Merchant",
      }));
      // Tidak return false, lanjutkan validasi
    }

    if (extractedData.items.length === 0) {
      alert("Please add at least one item");
      return false;
    }

    for (const item of extractedData.items) {
      if (!item.name.trim()) {
        alert("Please enter a name for all items");
        return false;
      }
      if (item.quantity <= 0) {
        alert("Quantity must be greater than 0");
        return false;
      }
      if (item.price <= 0) {
        alert("Price must be greater than 0");
        return false;
      }
    }

    return true;
  };

  // ========== FORM HANDLERS ==========
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setExtractedData({
      ...extractedData,
      [name]: value,
    });
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...extractedData.items];

    if (field === "quantity") {
      updatedItems[index][field] = parseInt(value) || 1;
    } else if (field === "price") {
      updatedItems[index][field] = parseFloat(value) || 0;
    } else {
      updatedItems[index][field] = value;
    }

    setExtractedData({
      ...extractedData,
      items: updatedItems,
    });
  };

  const calculateSubtotal = (item) => {
    return item.quantity * item.price;
  };

  const calculateTotal = () => {
    return extractedData.items.reduce(
      (sum, item) => sum + calculateSubtotal(item),
      0
    );
  };

  // Update total when items change
  useEffect(() => {
    const newTotal = calculateTotal();
    setExtractedData((prev) => ({
      ...prev,
      total: newTotal,
    }));
  }, [extractedData.items]);

  const addItem = () => {
    setExtractedData({
      ...extractedData,
      items: [...extractedData.items, { name: "", quantity: 1, price: 0 }],
    });
  };

  const removeItem = (index) => {
    if (extractedData.items.length > 1) {
      const updatedItems = [...extractedData.items];
      updatedItems.splice(index, 1);
      setExtractedData({
        ...extractedData,
        items: updatedItems,
      });
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount);
  };

  // ========== RENDER EXTRACTED DATA ==========
  const renderExtractedData = () => {
    return (
      <div className="extracted-data">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3>{isManualInput ? "Manual Input" : "Extracted Receipt Data"}</h3>
          {extractedData.confidence && (
            <div
              style={{
                fontSize: "0.9rem",
                color:
                  extractedData.confidence > 0.7
                    ? "#28a745"
                    : extractedData.confidence > 0.4
                    ? "#ffc107"
                    : "#dc3545",
                fontWeight: "bold",
              }}
            >
              Confidence: {Math.round(extractedData.confidence * 100)}%
            </div>
          )}
        </div>

        <div className="data-section">
          <div className="data-group">
            <label>Merchant</label>
            <input
              type="text"
              name="merchantName"
              value={extractedData.merchantName}
              onChange={handleInputChange}
              placeholder="Enter merchant name"
              disabled={isSaving}
            />
          </div>

          <div className="data-group">
            <label>Date</label>
            <input
              type="date"
              name="date"
              value={extractedData.date}
              onChange={handleInputChange}
              disabled={isSaving}
            />
          </div>

          <div className="data-group">
            <label>Category</label>
            <select
              name="category"
              value={extractedData.category}
              onChange={handleInputChange}
              disabled={isSaving}
            >
              <option value="Makanan & Minuman">Makanan & Minuman</option>
              <option value="Transportasi">Transportasi</option>
              <option value="Belanja">Belanja</option>
              <option value="Hiburan">Hiburan</option>
              <option value="Tagihan">Tagihan</option>
              <option value="Kesehatan">Kesehatan</option>
              <option value="Pendidikan">Pendidikan</option>
              <option value="Lain-lain">Lain-lain</option>
            </select>
          </div>

          <div className="data-group">
            <label>Payment Method</label>
            <select
              name="paymentMethod"
              value={extractedData.paymentMethod}
              onChange={handleInputChange}
              disabled={isSaving}
            >
              <option value="Cash">Cash</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Credit Card">Credit Card</option>
              <option value="E-Wallet">E-Wallet</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>
        </div>

        <div className="items-section">
          <div className="items-header">
            <h4>Items</h4>
            <button
              className="btn btn-small btn-outline"
              onClick={addItem}
              disabled={isSaving}
            >
              + Add Item
            </button>
          </div>
          <table className="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Subtotal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {extractedData.items.map((item, index) => (
                <tr key={index}>
                  <td>
                    <input
                      type="text"
                      value={item.name || ""}
                      onChange={(e) =>
                        handleItemChange(index, "name", e.target.value)
                      }
                      placeholder="Item name"
                      disabled={isSaving}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.quantity || 1}
                      onChange={(e) =>
                        handleItemChange(index, "quantity", e.target.value)
                      }
                      min="1"
                      disabled={isSaving}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      value={item.price || 0}
                      onChange={(e) =>
                        handleItemChange(index, "price", e.target.value)
                      }
                      min="0"
                      step="1000"
                      placeholder="0"
                      disabled={isSaving}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={formatCurrency(calculateSubtotal(item))}
                      readOnly
                    />
                  </td>
                  <td>
                    {extractedData.items.length > 1 && (
                      <button
                        className="btn btn-icon btn-danger"
                        onClick={() => removeItem(index)}
                        disabled={isSaving}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="total-section">
          <div className="total-label">Total</div>
          <div className="total-value">
            {formatCurrency(extractedData.total)}
          </div>
        </div>

        {/* Debug section - remove in production */}
        {rawOcrText && process.env.NODE_ENV === "development" && (
          <details style={{ marginTop: "20px", fontSize: "0.8rem" }}>
            <summary>Debug: Raw OCR Text</summary>
            <pre
              style={{
                background: "#f5f5f5",
                padding: "10px",
                whiteSpace: "pre-wrap",
              }}
            >
              {rawOcrText}
            </pre>
          </details>
        )}

        <div className="action-buttons">
          <button
            className="btn btn-outline"
            onClick={handleReset}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Transaction"}
          </button>
        </div>
      </div>
    );
  };

  // Show login prompt if not logged in
  if (!isLoggedIn) {
    return (
      <div className="scanner-page">
        <div className="login-prompt">
          <h2>Authentication Required</h2>
          <p>Please login to access the receipt scanner.</p>
          <button
            className="btn btn-primary"
            onClick={() => (window.location.href = "/login")}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // ========== MAIN RENDER ==========
  return (
    <div className="scanner-page">
      <h1 className="page-title">
        Receipt Scanner - Welcome, {user?.firstName || "User"}! 👋
      </h1>

      <div className="scanner-container">
        <div className="uploader-section">
          {!isExtracted && (
            <div
              className="uploader"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {!preview ? (
                <div className="upload-placeholder">
                  <div className="upload-icon">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                  </div>
                  <div className="upload-text">
                    <h3>Upload Receipt</h3>
                    <p>Drag and drop your receipt here or</p>
                    <button
                      className="btn btn-primary"
                      onClick={triggerFileInput}
                      disabled={isScanning || isSaving}
                    >
                      Browse Files
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      style={{ display: "none" }}
                    />
                  </div>
                </div>
              ) : (
                <div className="preview-container">
                  <img
                    src={preview}
                    alt="Receipt Preview"
                    className="receipt-preview"
                  />
                  <div className="preview-overlay">
                    <button
                      className="btn btn-outline"
                      onClick={handleReset}
                      disabled={isScanning || isSaving}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {preview && !isExtracted && (
            <div className="scan-options">
              <div className="scan-button-container">
                <button
                  className={`btn btn-primary scan-btn ${
                    isScanning ? "scanning" : ""
                  }`}
                  onClick={handleScan}
                  disabled={isScanning || isSaving}
                >
                  {isScanning ? (
                    <>
                      <span className="scanning-spinner"></span>
                      Scanning... {scanProgress}%
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M15 8h.01"></path>
                        <rect
                          x="3"
                          y="3"
                          width="18"
                          height="18"
                          rx="2"
                          ry="2"
                        ></rect>
                        <path d="M21 15l-5-5L5 21"></path>
                      </svg>
                      Scan Receipt
                    </>
                  )}
                </button>
              </div>
              <div className="manual-input-option">
                <span>or</span>
                <button
                  className="btn btn-link"
                  onClick={handleManualInput}
                  disabled={isScanning || isSaving}
                >
                  Enter data manually
                </button>
              </div>
            </div>
          )}

          {!preview && !isExtracted && (
            <div className="manual-input-section">
              <div className="divider">
                <span>OR</span>
              </div>
              <button
                className="btn btn-outline"
                onClick={handleManualInput}
                disabled={isScanning || isSaving}
              >
                Enter Receipt Data Manually
              </button>
            </div>
          )}
        </div>

        <div className="extracted-section">
          {isExtracted ? (
            renderExtractedData()
          ) : (
            <div className="instructions-card">
              <h3>How to Scan Receipts</h3>

              <div className="instruction-steps">
                <div className="instruction-step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h4>Upload Receipt</h4>
                    <p>
                      Take a clear photo of your receipt or upload one from your
                      device
                    </p>
                  </div>
                </div>

                <div className="instruction-step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h4>Scan and Extract</h4>
                    <p>
                      Our system will automatically extract information from
                      your receipt
                    </p>
                  </div>
                </div>

                <div className="instruction-step">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h4>Review and Confirm</h4>
                    <p>
                      Review the extracted data and make any necessary
                      adjustments
                    </p>
                  </div>
                </div>

                <div className="instruction-step">
                  <div className="step-number">4</div>
                  <div className="step-content">
                    <h4>Save Transaction</h4>
                    <p>Save the transaction to your expense records</p>
                  </div>
                </div>
              </div>

              <div className="tips-section">
                <h4>Tips for Better Results</h4>
                <ul>
                  <li>Ensure the receipt is well-lit and not blurry</li>
                  <li>Make sure all text is clearly visible</li>
                  <li>Flatten wrinkled receipts before scanning</li>
                  <li>Include the entire receipt in the frame</li>
                  <li>OCR Backend: {API_BASE_URL}</li>
                  <li>Auth Backend: {AUTH_API_URL}</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Scanner;
