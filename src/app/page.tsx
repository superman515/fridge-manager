import Link from "next/link";

export default function LandingPage() {
  return (
    <main style={{ padding: "20px", textAlign: "center" }}>
      <h1>냉장고 관리</h1>
      <p>가족과 함께 유통기한을 관리하세요.</p>
      <div style={{ marginTop: "20px", display: "flex", gap: "10px", justifyContent: "center" }}>
        <Link href="/auth/login" style={{ padding: "10px 20px", backgroundColor: "#2563EB", color: "#fff", borderRadius: "8px" }}>
          로그인
        </Link>
        <Link href="/auth/signup" style={{ padding: "10px 20px", backgroundColor: "#E2E8F0", color: "#0F172A", borderRadius: "8px" }}>
          회원가입
        </Link>
      </div>
    </main>
  );
}
