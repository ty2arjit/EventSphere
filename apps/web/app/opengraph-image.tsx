import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          backgroundColor: "#fbf9f4",
          backgroundImage:
            "radial-gradient(ellipse 60% 60% at 10% 0%, rgba(201,133,44,0.28), transparent 60%), radial-gradient(ellipse 55% 55% at 100% 30%, rgba(30,35,80,0.22), transparent 60%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "#1e2350",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fbf6e8",
              fontSize: 30,
              fontWeight: 700,
            }}
          >
            E
          </div>
          <div style={{ fontSize: 32, fontWeight: 600, color: "#221c10" }}>
            EventSphere
          </div>
        </div>
        <div
          style={{
            marginTop: 48,
            fontSize: 64,
            fontWeight: 600,
            color: "#221c10",
            lineHeight: 1.1,
            maxWidth: 900,
          }}
        >
          Run the whole event. Not just the poster.
        </div>
        <div style={{ marginTop: 28, fontSize: 28, color: "#7c7263", maxWidth: 780 }}>
          Communities, committees, registration, attendance, and certificates
          — one platform for campus events.
        </div>
      </div>
    ),
    { ...size },
  );
}
