"use client";

import { Toaster } from "sonner";

export function ToasterProvider() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        style: {
          background: "#1e293b",
          border: "1px solid #334155",
          color: "#fff",
        },
      }}
    />
  );
}

