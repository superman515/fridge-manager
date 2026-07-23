"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmail, signInWithGoogle, getAuthErrorMessage } from "@/lib/firebase/auth";
import { useRememberedEmail } from "@/hooks/useRememberedEmail";

export default function LoginPage() {
  const router = useRouter();
  const { email, setEmail, shouldRemember, setShouldRemember, saveEmail, deleteEmail } = useRememberedEmail();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function validate(): string | null {
    if (!email.trim()) return "이메일을 입력해주세요.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "올바른 이메일 형식이 아닙니다.";
    if (!password) return "비밀번호를 입력해주세요.";
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await signInWithEmail(email, password);
      if (shouldRemember) {
        saveEmail(email);
      } else {
        deleteEmail();
      }
      router.push("/app/dashboard");
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    setError(null);
    setSubmitting(true);
    try {
      await signInWithGoogle();
      router.push("/app/dashboard");
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      background: "#F8FAFC",
      padding: "64px 24px 40px",
      overflowY: "auto"
    }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0F172A", textAlign: "center", letterSpacing: "-0.01em", margin: 0 }}>
        로그인
      </h1>

      {error && (
        <div style={{
          marginTop: 28,
          padding: "12px 14px",
          background: "rgba(220,38,38,.08)",
          color: "#DC2626",
          fontSize: 13,
          borderRadius: 8,
          marginBottom: 14
        }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: 40, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>
            이메일
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            style={{
              width: "100%",
              padding: "13px 14px",
              border: "1px solid #E2E8F0",
              borderRadius: 8,
              background: "#fff",
              fontSize: 14,
              color: "#0F172A",
              outline: "none"
            }}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
          />
        </div>

        <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>
            비밀번호
          </label>
          <input
            type="password"
            placeholder="••••••••"
            style={{
              width: "100%",
              padding: "13px 14px",
              border: "1px solid #E2E8F0",
              borderRadius: 8,
              background: "#fff",
              fontSize: 14,
              color: "#0F172A",
              outline: "none"
            }}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
          />
        </div>

        <div style={{ width: "100%", marginTop: 16, position: "relative", height: 22 }}>
          <button
            onClick={() => setShouldRemember(!shouldRemember)}
            disabled={submitting}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "none",
              border: "none",
              padding: "2px 0",
              width: "fit-content",
              position: "absolute",
              left: "0%",
              transform: "translateX(-0%)",
              cursor: "pointer"
            }}
          >
            <span
              style={{
                width: 18,
                height: 18,
                borderRadius: 5,
                border: `1.5px solid ${shouldRemember ? "#2563EB" : "#CBD5E1"}`,
                background: shouldRemember ? "#2563EB" : "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: "none"
              }}
            >
              {shouldRemember && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                  <path d="M4 12l5 5L20 6"></path>
                </svg>
              )}
            </span>
            <span style={{ fontSize: 13, color: "#475569", fontWeight: 600, whiteSpace: "nowrap" }}>
              이메일 저장
            </span>
          </button>
        </div>

        <button
          onClick={handleSubmit}
          style={{
            width: "100%",
            marginTop: 20,
            padding: "15px",
            borderRadius: 8,
            border: "none",
            background: "#2563EB",
            color: "#fff",
            fontSize: 15,
            fontWeight: 700,
            boxShadow: "0 8px 20px rgba(37,99,235,.24)",
            cursor: "pointer"
          }}
          disabled={submitting}
        >
          {submitting ? "로그인 중..." : "로그인"}
        </button>
      </div>

      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        margin: "24px 0"
      }}>
        <div style={{ flex: 1, height: 1, background: "#E2E8F0" }}></div>
        <span style={{ fontSize: 12, color: "#94A3B8" }}>또는</span>
        <div style={{ flex: 1, height: 1, background: "#E2E8F0" }}></div>
      </div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={submitting}
        style={{
          width: "100%",
          padding: "14px",
          borderRadius: 8,
          border: "1px solid #E2E8F0",
          background: "#fff",
          color: "#0F172A",
          fontSize: 14,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          cursor: "pointer"
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8Z"/>
          <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.3v3.1C3.3 21.3 7.3 24 12 24Z"/>
          <path fill="#FBBC05" d="M5.4 14.4c-.2-.7-.4-1.4-.4-2.4s.1-1.6.4-2.4V6.5H1.3C.5 8.1 0 9.9 0 12s.5 3.9 1.3 5.5l4.1-3.1Z"/>
          <path fill="#EA4335" d="M12 4.8c1.7 0 3.3.6 4.5 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.3 0 3.3 2.7 1.3 6.5l4.1 3.1c.9-2.8 3.5-4.8 6.6-4.8Z"/>
        </svg>
        Google로 로그인
      </button>

      <div style={{ textAlign: "center", fontSize: 13, color: "#64748B", marginTop: 24 }}>
        계정이 없으신가요?{" "}
        <Link href="/auth/signup" style={{ color: "#2563EB", fontWeight: 700, textDecoration: "none" }}>
          회원가입
        </Link>
      </div>
    </main>
  );
}
