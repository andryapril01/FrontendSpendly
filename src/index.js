import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom"; // Impor BrowserRouter
import App from "./App"; // Impor komponen App

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      {" "}
      {/* Bungkus aplikasi dengan BrowserRouter */}
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
