"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Installability is a nice-to-have; a failed registration
        // (e.g. unsupported browser) shouldn't affect the app itself.
      });
    }
  }, []);

  return null;
}
