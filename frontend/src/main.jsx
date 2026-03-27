import React from "react";
import ReactDOM from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.jsx";
import { initConfigValidation } from "./utils/configValidator";
import "./index.css";

// Fallback: ensure Google tag config runs if inline script was blocked (e.g. CSP after CDN minify)
if (typeof window !== "undefined" && window.gtag) {
  window.gtag("config", "AW-17954318055");
}

// Validate configuration on app boot
initConfigValidation();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>,
);
