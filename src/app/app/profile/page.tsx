"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/firebase/auth";
import { useAuth } from "@/hooks/useAuth";

export default function ProfilePage() {
  const router = useRouter();
  const { firebaseUser } = useAuth();

  async function handleLogout() {
    await signOut();
    router.push("/auth/login");
  }

  return (
    <main style={{ padding: "20px" }}>
      <h1>프로필</h1>
      {firebaseUser && <p style={{ color: "#64748B", fontSize: 14 }}>{firebaseUser.email}</p>}
      <div className="account-actions" style={{ marginTop: 16 }}>
        <button className="account-btn danger" onClick={handleLogout}>
          로그아웃
          <span className="account-btn-arrow">›</span>
        </button>
      </div>
    </main>
  );
}
