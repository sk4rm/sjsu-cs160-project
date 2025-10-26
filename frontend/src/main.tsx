import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./Context/AuthContext"; // ✅ here

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>            {/* ✅ global auth wrapper */}
      <BrowserRouter>         {/* ✅ routing wrapper */}
        <App />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
