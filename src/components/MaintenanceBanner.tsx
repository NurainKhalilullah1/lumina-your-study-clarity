import { Wrench } from "lucide-react";

// ─────────────────────────────────────────────────────────────
// 🔧  TOGGLE THIS FLAG to enable / disable maintenance lockdown
//     true  → entire app is locked (no login, no access at all)
//     false → app works normally
export const MAINTENANCE_MODE = true;

// ✏️  EDIT these to match your upgrade window
const MAINTENANCE_START = "Tuesday 18 March 2026";
const MAINTENANCE_DATE = "Friday 20 March 2026 at 10:00 AM";
const MAINTENANCE_TIMEZONE = "WAT (West Africa Time)";
const ESTIMATED_DURATION = "~2 days";
// ─────────────────────────────────────────────────────────────

export const MaintenancePage = () => (
  <div
    style={{
      minHeight: "100dvh",
      background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      color: "#e2e8f0",
      textAlign: "center",
    }}
  >
    {/* Animated icon */}
    <div
      style={{
        background: "rgba(245, 158, 11, 0.15)",
        border: "2px solid rgba(245, 158, 11, 0.4)",
        borderRadius: "50%",
        padding: "28px",
        marginBottom: "32px",
        animation: "pulse 2s infinite",
      }}
    >
      <Wrench size={52} color="#f59e0b" strokeWidth={1.5} />
    </div>

    {/* Headline */}
    <h1
      style={{
        fontSize: "clamp(1.8rem, 5vw, 3rem)",
        fontWeight: 800,
        letterSpacing: "-0.03em",
        margin: "0 0 12px",
        background: "linear-gradient(90deg, #f59e0b, #fbbf24)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      }}
    >
      Under Maintenance
    </h1>

    {/* Sub-headline */}
    <p
      style={{
        fontSize: "1.125rem",
        color: "#94a3b8",
        maxWidth: "480px",
        lineHeight: 1.6,
        margin: "0 0 32px",
      }}
    >
      We're upgrading <strong style={{ color: "#e2e8f0" }}>StudyFlow</strong> to
      a faster, more powerful backend. We'll be back shortly!
    </p>

    {/* Info card */}
    <div
      style={{
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "16px",
        padding: "24px 32px",
        maxWidth: "420px",
        width: "100%",
        marginBottom: "32px",
      }}
    >
      <Row icon="📅" label="Started" value={MAINTENANCE_START} />
      <Row icon="🗓️" label="Ends" value={MAINTENANCE_DATE} />
      <Row icon="🕐" label="Timezone" value={MAINTENANCE_TIMEZONE} />
      <Row icon="⏱️" label="Duration" value={ESTIMATED_DURATION} />
    </div>

    {/* Notice for mobile users */}
    <p
      style={{
        fontSize: "0.875rem",
        color: "#64748b",
        maxWidth: "380px",
        lineHeight: 1.5,
      }}
    >
      📲 <strong style={{ color: "#94a3b8" }}>Mobile users:</strong> after
      maintenance, download the new version we'll share in your group.
      <br />
      💻 <strong style={{ color: "#94a3b8" }}>Web users:</strong> simply refresh
      your browser when we're done.
    </p>

    {/* Pulse keyframe (inline via style tag) */}
    <style>{`
      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.06); opacity: 0.85; }
      }
    `}</style>
  </div>
);

// Small helper row component
const Row = ({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "8px 0",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      gap: "12px",
    }}
  >
    <span style={{ color: "#64748b", fontSize: "0.875rem" }}>
      {icon} {label}
    </span>
    <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "#e2e8f0" }}>
      {value}
    </span>
  </div>
);
