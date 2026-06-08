import React from "react";
import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

// Hide the native splash screen once the React app has mounted (Android app shell only —
// the splash is configured in capacitor.config.json / android/.../res/drawable/splash.png).
if (Capacitor.isNativePlatform()) {
  import("@capacitor/splash-screen")
    .then(({ SplashScreen }) => SplashScreen.hide())
    .catch(() => {});
}
