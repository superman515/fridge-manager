"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, updateUserProfile } from "@/lib/firebase/auth";
import { uploadProfileImage, deleteProfileImage } from "@/lib/firebase/storage";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useFoodList } from "@/hooks/useFoodList";
import { useUserFamily } from "@/hooks/useUserFamily";

export default function ProfilePage() {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const { profile, loading } = useUserProfile();
  const { familyGroupId } = useUserFamily();
  const { foods } = useFoodList(familyGroupId);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ displayName: "", photoURL: "" });
  const [preview, setPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifState, setNotifState] = useState({ expiry: true, today: true, shared: false });

  const getToday = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  };

  const statusFor = (expiryDate: string) => {
    const [y, m, d] = expiryDate.split("-").map(Number);
    const today = getToday();
    const days = Math.round((new Date(y, m - 1, d).getTime() - today.getTime()) / 86400000);
    if (days < 0) return { key: "경과", label: `${-days}일 지남` };
    if (days <= 3) return { key: "임박", label: days === 0 ? "오늘까지" : `${days}일 남음` };
    return { key: "안전", label: `${days}일 남음` };
  };

  if (loading) {
    return <div className="phone"><div className="scr" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ color: "#64748B" }}>로딩 중...</div></div></div>;
  }

  if (!profile) {
    return (
      <div className="phone">
        <div className="scr">
          <div style={{ padding: "20px" }}>프로필 로드 실패</div>
        </div>
      </div>
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

  const userFoods = foods.filter(f => f.addedBy === firebaseUser?.uid);
  const myTotal = userFoods.length;
  const myImminent = userFoods.filter(f => statusFor(f.expiryDate).key === "임박").length;
  const myExpired = userFoods.filter(f => statusFor(f.expiryDate).key === "경과").length;

  return (
    <div className="phone">
      <div className="header">
        <div className="header-group-name">내 정보</div>
        <div className="header-title">프로필</div>
      </div>

      <div className="scr">
        <div className="profile-container">
          <div className="profile-card">
            <div className="profile-avatar" style={{ background: "#64748B" }}>
              {profile.photoURL ? (
                <img src={profile.photoURL} alt={profile.displayName} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
              ) : (
                getInitial(profile.displayName)
              )}
            </div>
            <div className="profile-info">
              <div className="profile-name">{profile.displayName}</div>
              <div className="profile-email">{profile.email}</div>
            </div>
          </div>

          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-value">{myTotal}</div>
              <div className="stat-label">내가 등록</div>
            </div>
            <div className="stat-card">
              <div className="stat-value warning">{myImminent}</div>
              <div className="stat-label">임박</div>
            </div>
            <div className="stat-card">
              <div className="stat-value error">{myExpired}</div>
              <div className="stat-label">경과</div>
            </div>
          </div>

          <div className="section-title">알림 설정</div>
          <div className="account-actions">
            {[
              { key: "expiry", label: "소비기한 임박 알림", desc: "D-3 이내 음식을 알려드려요" },
              { key: "today", label: "오늘 만료 알림", desc: "오늘까지인 음식을 알려드려요" },
              { key: "shared", label: "가족 공유 알림", desc: "가족이 음식을 추가하면 알려드려요" },
            ].map((n, i) => (
              <div key={n.key} className="notif-item" style={{ borderTopColor: i === 0 ? "transparent" : "#F1F5F9" }}>
                <div className="notif-text">
                  <div className="notif-label">{n.label}</div>
                  <div className="notif-desc">{n.desc}</div>
                </div>
                <button
                  className={`toggle-switch ${notifState[n.key as keyof typeof notifState] ? "active" : ""}`}
                  style={{ background: notifState[n.key as keyof typeof notifState] ? "#2563EB" : "#E2E8F0" }}
                  onClick={() => setNotifState({ ...notifState, [n.key]: !notifState[n.key as keyof typeof notifState] })}
                >
                  <div className="toggle-switch-thumb" style={{ left: notifState[n.key as keyof typeof notifState] ? "21px" : "3px" }}></div>
                </button>
              </div>
            ))}
          </div>

          <div className="section-title">계정</div>
          <div className="account-actions">
            <button className="account-btn" onClick={handleEdit}>
              프로필 수정
              <span className="account-btn-arrow">›</span>
            </button>
            <button className="account-btn danger" onClick={handleLogout}>
              로그아웃
              <span className="account-btn-arrow">›</span>
            </button>
          </div>
          <div style={{ height: "20px" }}></div>
        </div>
      </div>

      <div className="tabbar">
        <Link href="/app/dashboard" className="tab-button">
          <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="6" y="3" width="12" height="18" rx="2"></rect>
            <line x1="6" y1="10" x2="18" y2="10"></line>
            <line x1="9" y1="6" x2="9" y2="7.5"></line>
            <line x1="9" y1="13" x2="9" y2="15"></line>
          </svg>
          <span className="tab-label">냉장고</span>
        </Link>
        <Link href="/app/family" className="tab-button">
          <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="9" cy="8.5" r="3.2"></circle>
            <circle cx="16.5" cy="9.5" r="2.4"></circle>
            <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5"></path>
            <path d="M15 14.2c2.2.2 4 1.9 4 4.8"></path>
          </svg>
          <span className="tab-label">가족</span>
        </Link>
        <Link href="/app/profile" className="tab-button active">
          <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="8" r="3.6"></circle>
            <path d="M5 20c0-3.9 3.1-6.5 7-6.5s7 2.6 7 6.5"></path>
          </svg>
          <span className="tab-label">프로필</span>
        </Link>
      </div>

      {isEditing && (
        <div className="modal-overlay">
          <div className="modal-bg" onClick={handleCancel}></div>
          <div className="modal-sheet">
            <div className="modal-handle"></div>
            <div className="modal-title">프로필 수정</div>

            {error && <div style={{ background: "#FEE2E2", color: "#DC2626", padding: "10px", borderRadius: "6px", marginBottom: "14px", fontSize: "13px" }}>{error}</div>}

            <div className="form-group">
              <label className="form-label">이름</label>
              <input
                type="text"
                className="form-input"
                value={formData.displayName}
                onChange={e => setFormData({ ...formData, displayName: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">프로필 사진</label>
              {preview && <div style={{ textAlign: "center", marginBottom: "12px", maxHeight: "150px" }}><img src={preview} alt="미리보기" style={{ maxWidth: "100%", maxHeight: "150px", borderRadius: "8px", objectFit: "cover" }} /></div>}
              <input type="file" accept="image/*" onChange={handleFileSelect} className="form-input" style={{ padding: "8px" }} />
              <div style={{ fontSize: "12px", color: "#64748B", marginTop: "6px" }}>최대 5MB, JPG/PNG 지원</div>
            </div>

            <div className="form-actions">
              <button className="btn-secondary" onClick={handleCancel} disabled={isSaving}>
                취소
              </button>
              <button className="btn-primary" onClick={handleSave} disabled={isSaving}>
                {isSaving ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
