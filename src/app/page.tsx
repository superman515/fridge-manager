import Link from "next/link";

export default function LandingPage() {
  return (
    <main style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      background: "linear-gradient(180deg, #EEF3FC 0%, #F8FAFC 55%)",
      alignItems: "center",
      justifyContent: "center",
      padding: "32px 24px",
      textAlign: "center",
      minHeight: "100vh"
    }}>
      {/* Icon */}
      <div style={{
        position: "relative",
        width: 168,
        height: 168,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 32
      }}>
        <div style={{
          position: "absolute",
          inset: 0,
          borderRadius: 40,
          background: "#2563EB",
          boxShadow: "0 20px 44px rgba(37,99,235,.28)"
        }}></div>
        <svg width="76" height="76" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6" style={{ position: "relative" }}>
          <rect x="6" y="3" width="12" height="18" rx="2.4"></rect>
          <line x1="6" y1="10.5" x2="18" y2="10.5"></line>
          <line x1="9" y1="6" x2="9" y2="7.6"></line>
          <line x1="9" y1="13.4" x2="9" y2="15.4"></line>
        </svg>
        <span style={{
          position: "absolute",
          top: -6,
          right: -6,
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: "#16A34A",
          border: "3px solid #F8FAFC"
        }}></span>
      </div>

      {/* Status dots */}
      <div style={{ display: "flex", gap: 8, marginBottom: 18, justifyContent: "center" }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#16A34A" }}></span>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#F59E0B" }}></span>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#DC2626" }}></span>
      </div>

      {/* Title */}
      <h1 style={{ fontSize: 32, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.01em", marginBottom: 12, margin: 0 }}>
        냉장고 관리
      </h1>

      {/* Description */}
      <p style={{ fontSize: 15, color: "#64748B", marginTop: 12, lineHeight: 1.6, maxWidth: 300, marginBottom: 32 }}>
        가족과 함께 유통기한을 관리하세요.
      </p>

      {/* Buttons */}
      <div style={{ display: "flex", gap: 10, width: "100%", maxWidth: 320 }}>
        <Link href="/auth/login" style={{
          flex: 1,
          padding: 15,
          borderRadius: 8,
          border: "1px solid #E2E8F0",
          background: "#fff",
          color: "#0F172A",
          fontSize: 15,
          fontWeight: 700,
          boxShadow: "0 1px 2px rgba(15,23,42,.04)",
          textDecoration: "none",
          textAlign: "center",
          cursor: "pointer"
        }}>
          로그인
        </Link>
        <Link href="/auth/signup" style={{
          flex: 1,
          padding: 15,
          borderRadius: 8,
          border: "none",
          background: "#2563EB",
          color: "#fff",
          fontSize: 15,
          fontWeight: 700,
          boxShadow: "0 8px 20px rgba(37,99,235,.28)",
          textDecoration: "none",
          textAlign: "center",
          cursor: "pointer"
        }}>
          회원가입
        </Link>
      </div>
    </main>
  );
}
