import { ImageResponse } from "next/og";

export const alt = "Agenda GenZ — App gratuito para profissionais da beleza";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #7c3aed 0%, #c026d3 50%, #ec4899 100%)",
        fontFamily: "system-ui, sans-serif",
        padding: "64px",
        position: "relative",
      }}
    >
      {/* Background circles */}
      <div
        style={{
          position: "absolute",
          top: -100,
          left: -100,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.08)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -80,
          right: -80,
          width: 350,
          height: 350,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.06)",
        }}
      />

      {/* Badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          background: "rgba(255,255,255,0.15)",
          borderRadius: "100px",
          padding: "8px 20px",
          marginBottom: "32px",
          border: "1px solid rgba(255,255,255,0.25)",
        }}
      >
        <span style={{ color: "white", fontSize: 16, fontWeight: 600, opacity: 0.9 }}>
          100% Gratuito para Profissionais
        </span>
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: 72,
          fontWeight: 800,
          color: "white",
          textAlign: "center",
          lineHeight: 1.1,
          letterSpacing: "-0.03em",
          marginBottom: "24px",
          maxWidth: 900,
        }}
      >
        Agenda GenZ
      </div>

      {/* Subtitle */}
      <div
        style={{
          fontSize: 28,
          color: "rgba(255,255,255,0.85)",
          textAlign: "center",
          lineHeight: 1.4,
          maxWidth: 800,
          marginBottom: "48px",
        }}
      >
        App de agendamento para nail designers, lash artists e profissionais da beleza
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 48, alignItems: "center" }}>
        {[
          { value: "5.000+", label: "Profissionais" },
          { value: "50.000+", label: "Agendamentos" },
          { value: "4.9★", label: "Avaliação" },
        ].map((stat) => (
          <div key={stat.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: "white" }}>{stat.value}</span>
            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>{stat.label}</span>
          </div>
        ))}
      </div>
    </div>,
    { ...size },
  );
}
