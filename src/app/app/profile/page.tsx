"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, updateUserProfile } from "@/lib/firebase/auth";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";

export default function ProfilePage() {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const { profile, loading } = useUserProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ displayName: "", photoURL: "" });
  const [isSaving, setIsSaving] = useState(false);

  if (loading) {
    return (
      <main style={{ padding: "20px", textAlign: "center", color: "#64748B" }}>
        로딩 중...
      </main>
    );
  }

  if (!profile) {
    return (
      <main style={{ padding: "20px" }}>
        <h1>프로필</h1>
        <p>프로필을 불러올 수 없습니다.</p>
      </main>
    );
  }

  async function handleLogout() {
    await signOut();
    router.push("/auth/login");
  }

  function handleEdit() {
    if (!profile) return;
    setFormData({
      displayName: profile.displayName,
      photoURL: profile.photoURL || "",
    });
    setIsEditing(true);
  }

  async function handleSave() {
    if (!firebaseUser || !formData.displayName.trim()) return;
    setIsSaving(true);
    try {
      await updateUserProfile(firebaseUser.uid, {
        displayName: formData.displayName.trim(),
        photoURL: formData.photoURL.trim() || null,
      });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancel() {
    setIsEditing(false);
  }

  function getInitial(name: string): string {
    return name.charAt(0).toUpperCase();
  }

  if (isEditing) {
    return (
      <main style={{ padding: "20px" }}>
        <h1>프로필 수정</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          style={{ marginTop: "24px" }}
        >
          <div className="form-group">
            <label className="form-label">이름</label>
            <input
              type="text"
              className="form-input"
              value={formData.displayName}
              onChange={(e) =>
                setFormData({ ...formData, displayName: e.target.value })
              }
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">프로필 사진 URL</label>
            <input
              type="url"
              className="form-input"
              value={formData.photoURL}
              onChange={(e) =>
                setFormData({ ...formData, photoURL: e.target.value })
              }
              placeholder="https://example.com/photo.jpg"
            />
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSaving}
              style={{ flex: 1 }}
            >
              {isSaving ? "저장 중..." : "저장"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleCancel}
              disabled={isSaving}
              style={{ flex: 1 }}
            >
              취소
            </button>
          </div>
        </form>
      </main>
    );
  }

  return (
    <main style={{ padding: "20px" }}>
      <h1>프로필</h1>

      <div className="profile-card" style={{ marginTop: "20px" }}>
        <div className="profile-avatar">
          {profile.photoURL ? (
            <img
              src={profile.photoURL}
              alt={profile.displayName}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          ) : (
            getInitial(profile.displayName)
          )}
        </div>
        <div className="profile-info">
          <div className="profile-name">{profile.displayName}</div>
          <div className="profile-email">{profile.email}</div>
        </div>
      </div>

      <div className="account-actions" style={{ marginTop: "20px" }}>
        <button className="account-btn" onClick={handleEdit}>
          프로필 수정
          <span className="account-btn-arrow">›</span>
        </button>
        <button className="account-btn danger" onClick={handleLogout}>
          로그아웃
          <span className="account-btn-arrow">›</span>
        </button>
      </div>
    </main>
  );
}
