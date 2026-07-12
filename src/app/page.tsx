import Link from "next/link";

export default function LandingPage() {
  return (
    <main style={{ padding: "20px", textAlign: "center" }}>
      <h1>냉장고 관리</h1>
      <p>가족과 함께 유통기한을 관리하세요.</p>
      <div style={{ marginTop: "20px", display: "flex", gap: "10px", justifyContent: "center", maxWidth: 320, marginInline: "auto" }}>
        <Link href="/auth/login" className="btn-secondary" style={{ textDecoration: "none", textAlign: "center", flex: 1, padding: "13px" }}>
          로그인
        </Link>
        <Link href="/auth/signup" className="btn-primary" style={{ textDecoration: "none", textAlign: "center", flex: 1, padding: "13px" }}>
          회원가입
        </Link>
      </div>
    </main>
  );
}
