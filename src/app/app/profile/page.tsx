"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, updateUserProfile } from "@/lib/firebase/auth";
import { uploadProfileImage, deleteProfileImage } from "@/lib/firebase/storage";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";

export default function ProfilePage() {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const { profile, loading } = useUserProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ displayName: "", photoURL: "" });
  const [preview, setPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setPreview(profile.photoURL);
    setError(null);
    setIsEditing(true);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 선택할 수 있습니다.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("파일 크기는 5MB 이하여야 합니다.");
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
      setFormData({ ...formData, photoURL: "" });
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    if (!firebaseUser || !formData.displayName.trim()) return;
    setIsSaving(true);
    setError(null);

    try {
      let newPhotoURL: string | null = null;

      if (preview && preview.startsWith("data:")) {
        // 새로운 파일이 선택됨
        const file = (
          document.querySelector('input[type="file"]') as HTMLInputElement
        )?.files?.[0];
        if (file) {
          newPhotoURL = await uploadProfileImage(firebaseUser.uid, file);
        }
      } else if (formData.photoURL) {
        // URL 입력됨 (기존 동작)
        newPhotoURL = formData.photoURL.trim();
      } else if (preview && !preview.startsWith("data:")) {
        // 이미지가 있지만 새 파일이 없으면 기존 유지
        newPhotoURL = preview;
      }

      await updateUserProfile(firebaseUser.uid, {
        displayName: formData.displayName.trim(),
        photoURL: newPhotoURL,
      });
      setIsEditing(false);
    } catch (err) {
      setError((err as Error).message || "저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancel() {
    setIsEditing(false);
    setPreview(null);
    setError(null);
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
          {error && (
            <div className="auth-error" style={{ marginBottom: "16px" }}>
              {error}
            </div>
          )}

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
            <label className="form-label">프로필 사진</label>
            {preview && (
              <div
                style={{
                  marginBottom: "12px",
                  textAlign: "center",
                  maxHeight: "200px",
                }}
              >
                <img
                  src={preview}
                  alt="미리보기"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "200px",
                    borderRadius: "8px",
                    objectFit: "cover",
                  }}
                />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="form-input"
              style={{ padding: "8px" }}
            />
            <div style={{ fontSize: "12px", color: "#64748B", marginTop: "6px" }}>
              최대 5MB, JPG/PNG 지원
            </div>
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
