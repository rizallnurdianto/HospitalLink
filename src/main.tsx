import React from "react"
import ReactDOM from "react-dom/client"
import "./index.css"

const root = ReactDOM.createRoot(document.getElementById("root")!)

async function boot() {
  try {
    // Mengimpor supabase (lewat App) langsung throw error jika env vars belum diisi.
    const { default: App } = await import("./App")
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    )
  } catch (err) {
    console.error(err)
    root.render(
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          padding: 24,
          textAlign: "center",
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          color: "#334155",
        }}
      >
        <strong style={{ fontSize: 18, color: "#0f172a" }}>
          Aplikasi belum dikonfigurasi
        </strong>
        <p style={{ maxWidth: 420, fontSize: 14, lineHeight: 1.6 }}>
          {(err as Error)?.message ??
            "Set VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di environment lalu deploy ulang."}
        </p>
      </div>,
    )
  }
}

boot()
