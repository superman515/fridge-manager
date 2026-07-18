"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useUserFamily } from "@/hooks/useUserFamily";
import { useFoodList } from "@/hooks/useFoodList";
import { useFamilyGroup } from "@/hooks/useFamilyGroup";
import { useUserProfile } from "@/hooks/useUserProfile";
import { addFood, deleteFood, updateFood } from "@/lib/firebase/food";
import { getUserProfile } from "@/lib/firebase/user";
import type { Food, FoodCategory, FoodLocation } from "@/types/food";
import type { FamilyGroup } from "@/types/familyGroup";
import type { User } from "@/types/user";

const getToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

function formatDateLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const memberColors: Record<string, string> = { 엄마: "#2563EB", 아빠: "#0EA5E9", 나: "#64748B" };
const statusColors: Record<string, string> = { 경과: "#DC2626", 임박: "#F59E0B", 안전: "#16A34A" };
const statusBgs: Record<string, string> = { 경과: "rgba(220,38,38,.10)", 임박: "rgba(245,158,11,.12)", 안전: "rgba(22,163,74,.10)" };

type StatusKey = keyof typeof statusColors;
type SortKey = "expiry" | "addedNewest" | "addedOldest" | "category";

const CATEGORY_ORDER: FoodCategory[] = ["채소", "과일", "육류", "유제품", "수산", "기타"];

interface FormState {
  name: string;
  product: string;
  category: string;
  location: FoodLocation;
  quantity: string;
  expiryDate: string;
}

function daysUntil(expiry: string): number {
  const [y, m, d] = expiry.split("-").map(Number);
  const today = getToday();
  return Math.round((new Date(y, m - 1, d).getTime() - today.getTime()) / 86400000);
}

function statusFor(expiry: string): { key: StatusKey; label: string } {
  const days = daysUntil(expiry);
  if (days < 0) return { key: "경과", label: `${-days}일 지남` };
  if (days <= 3) return { key: "임박", label: days === 0 ? "오늘까지" : `${days}일 남음` };
  return { key: "안전", label: `${days}일 남음` };
}

function mdOf(expiry: string): string {
  const [y, m, d] = expiry.split("-");
  return `${y.slice(2)}/${m}/${d}`;
}

function addedAtMillis(f: Food): number {
  return f.addedAt?.toMillis() ?? 0;
}

function compareFoods(a: Food, b: Food, sortBy: SortKey): number {
  switch (sortBy) {
    case "expiry":
      return a.expiryDate.localeCompare(b.expiryDate);
    case "addedNewest":
      return addedAtMillis(b) - addedAtMillis(a);
    case "addedOldest":
      return addedAtMillis(a) - addedAtMillis(b);
    case "category":
      return CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
    default:
      return 0;
  }
}

export default function DashboardPage() {
  const { firebaseUser } = useAuth();
  const { profile } = useUserProfile();
  const { familyGroupId } = useUserFamily();
  const { foods } = useFoodList(familyGroupId);
  const { group } = useFamilyGroup(familyGroupId);
  const [locationFilter, setLocationFilter] = useState<FoodLocation | "all">("all");
  const [statusFilter, setStatusFilter] = useState<StatusKey | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("expiry");
  const [showModal, setShowModal] = useState(false);
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null);
  const [addedByProfiles, setAddedByProfiles] = useState<Record<string, User | null>>({});
  const [memberProfiles, setMemberProfiles] = useState<Record<string, User | null>>({});
  const [form, setForm] = useState<FormState>({
    name: "",
    product: "",
    category: "채소",
    location: "냉장",
    quantity: "",
    expiryDate: formatDateLocal(getToday()),
  });

  const memberIdsKey = (group?.members.slice(0, 3) ?? []).join(",");

  useEffect(() => {
    const ids = memberIdsKey ? memberIdsKey.split(",") : [];
    if (ids.length === 0) {
      setMemberProfiles({});
      return;
    }
    let cancelled = false;
    (async () => {
      const profiles: Record<string, User | null> = {};
      for (const memberId of ids) {
        try {
          const profile = await getUserProfile(memberId);
          profiles[memberId] = profile;
        } catch (err) {
          console.error(`Failed to load profile for ${memberId}:`, err);
          profiles[memberId] = null;
        }
      }
      if (!cancelled) setMemberProfiles(profiles);
    })();
    return () => { cancelled = true; };
  }, [memberIdsKey]);

  useEffect(() => {
    if (foods.length === 0) return;

    const uniqueAddedByIds = Array.from(new Set(foods.map(f => f.addedBy)));
    const loadProfiles = async () => {
      const profiles: Record<string, User | null> = {};
      for (const uid of uniqueAddedByIds) {
        if (!addedByProfiles[uid]) {
          try {
            const profile = await getUserProfile(uid);
            profiles[uid] = profile;
          } catch (err) {
            console.error(`Failed to load profile for ${uid}:`, err);
            profiles[uid] = null;
          }
        }
      }
      if (Object.keys(profiles).length > 0) {
        setAddedByProfiles(prev => ({ ...prev, ...profiles }));
      }
    };

    loadProfiles().catch(err => {
      console.error("Failed to load profiles:", err);
    });
  }, [foods, addedByProfiles]);

  const filtered = foods
    .filter(f =>
      (locationFilter === "all" || f.location === locationFilter) &&
      (statusFilter === "all" || statusFor(f.expiryDate).key === statusFilter) &&
      (searchQuery === "" || f.name.includes(searchQuery))
    )
    .sort((a, b) => compareFoods(a, b, sortBy));

  const counts: Record<StatusKey, number> = { 경과: 0, 임박: 0, 안전: 0 };
  foods.forEach(f => counts[statusFor(f.expiryDate).key]++);

  const handleSubmitFood = async () => {
    if (!form.name.trim() || !firebaseUser?.uid || !familyGroupId) return;

    try {
      const foodData = {
        name: form.name.trim(),
        product: form.product.trim() || "직접 등록",
        category: form.category as any,
        location: form.location,
        quantity: form.quantity.trim() || "1개",
        expiryDate: form.expiryDate,
      };

      if (editingFoodId) {
        await updateFood(editingFoodId, foodData);
      } else {
        await addFood(familyGroupId, firebaseUser.uid, foodData);
      }

      setForm({
        name: "",
        product: "",
        category: "채소",
        location: "냉장",
        quantity: "",
        expiryDate: formatDateLocal(getToday()),
      });
      setEditingFoodId(null);
      setShowModal(false);
    } catch (err) {
      console.error("음식 저장 실패:", err);
    }
  };

  const handleEditFood = (food: Food) => {
    setForm({
      name: food.name,
      product: food.product,
      category: food.category,
      location: food.location,
      quantity: food.quantity,
      expiryDate: food.expiryDate,
    });
    setEditingFoodId(food.id);
    setShowModal(true);
  };

  const handleDeleteFood = async (foodId: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await deleteFood(foodId);
    } catch (err) {
      console.error("음식 삭제 실패:", err);
    }
  };

  return (
    <div className="phone">
      <div className="scr">
        <div className="header">
          <div className="header-top">
            <div>
              <div className="header-group-name">그룹명</div>
              <div className="header-title">{group?.name ?? "냉장고"}</div>
            </div>
            <div className="avatar-group">
              {group?.members.slice(0, 3).map((memberId, i) => {
                const profile = memberProfiles[memberId];
                const avatarChar = profile?.displayName?.[0] ?? "?";
                const avatarBg = i === 0 ? memberColors["엄마"] : i === 1 ? memberColors["아빠"] : memberColors["나"];
                return (
                  <div
                    key={memberId}
                    className="avatar"
                    style={{
                      background: profile?.photoURL ? "transparent" : avatarBg,
                      overflow: "hidden",
                    }}
                  >
                    {profile?.photoURL ? (
                      <img src={profile.photoURL} alt={profile.displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      avatarChar
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="search-container">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7"></circle>
              <line x1="16.5" y1="16.5" x2="21" y2="21"></line>
            </svg>
            <input
              className="search-input"
              type="text"
              placeholder="음식 이름 검색"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="summary-row">
          <button
            className="summary-card"
            style={{ borderColor: statusFilter === "경과" ? statusColors["경과"] : "#E2E8F0", background: statusFilter === "경과" ? statusBgs["경과"] : "#fff" }}
            onClick={() => setStatusFilter(statusFilter === "경과" ? "all" : "경과")}
          >
            <span className="summary-label">경과</span>
            <div className="summary-count-row">
              <div className="status-dot" style={{ background: "#DC2626" }}></div>
              <span className="summary-count" style={{ color: "#DC2626" }}>{counts["경과"]}</span>
            </div>
          </button>
          <button
            className="summary-card"
            style={{ borderColor: statusFilter === "임박" ? statusColors["임박"] : "#E2E8F0", background: statusFilter === "임박" ? statusBgs["임박"] : "#fff" }}
            onClick={() => setStatusFilter(statusFilter === "임박" ? "all" : "임박")}
          >
            <span className="summary-label">임박</span>
            <div className="summary-count-row">
              <div className="status-dot" style={{ background: "#F59E0B" }}></div>
              <span className="summary-count" style={{ color: "#F59E0B" }}>{counts["임박"]}</span>
            </div>
          </button>
          <button
            className="summary-card"
            style={{ borderColor: statusFilter === "안전" ? statusColors["안전"] : "#E2E8F0", background: statusFilter === "안전" ? statusBgs["안전"] : "#fff" }}
            onClick={() => setStatusFilter(statusFilter === "안전" ? "all" : "안전")}
          >
            <span className="summary-label">안전</span>
            <div className="summary-count-row">
              <div className="status-dot" style={{ background: "#16A34A" }}></div>
              <span className="summary-count" style={{ color: "#16A34A" }}>{counts["안전"]}</span>
            </div>
          </button>
        </div>

        <div className="chiprow">
          <button className={`chip ${locationFilter === "all" ? "active" : ""}`} onClick={() => setLocationFilter("all")}>
            전체
          </button>
          <button className={`chip ${locationFilter === "냉장" ? "active" : ""}`} onClick={() => setLocationFilter("냉장")}>
            냉장
          </button>
          <button className={`chip ${locationFilter === "냉동" ? "active" : ""}`} onClick={() => setLocationFilter("냉동")}>
            냉동
          </button>
          <button className={`chip ${locationFilter === "실온" ? "active" : ""}`} onClick={() => setLocationFilter("실온")}>
            실온
          </button>
        </div>

        <div className="sort-container">
          <select
            className="sort-select"
            value={sortBy}
            onChange={e => setSortBy(e.target.value as SortKey)}
          >
            <option value="expiry">유통기한순 (임박순)</option>
            <option value="addedNewest">추가순 (최신순)</option>
            <option value="addedOldest">추가순 (오래된순)</option>
            <option value="category">카테고리별</option>
          </select>
        </div>

        <div className="food-grid">
          {filtered.map(f => {
            const status = statusFor(f.expiryDate);
            return (
              <div key={f.id} className="food-card" onDoubleClick={() => handleEditFood(f)} style={{ position: "relative" }}>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteFood(f.id); }}
                  style={{
                    position: "absolute",
                    top: "8px",
                    right: "8px",
                    width: "24px",
                    height: "24px",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "#94A3B8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 0,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#DC2626")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#94A3B8")}
                  title="소비 완료"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
                <div className="food-card-header">
                  <span className="category-badge">{f.category}</span>
                </div>
                <div className="food-name">{f.name}</div>
                <div className="food-product">{f.product}</div>
                <span className="status-badge" style={{ background: statusBgs[status.key], color: statusColors[status.key] }}>
                  <span className="status-dot" style={{ background: statusColors[status.key] }}></span>
                  {status.label}
                </span>
                <div className="food-divider">
                  <div className="food-info">
                    <span className="food-info-label">{f.location}</span>
                    <span className="info-divider">·</span>
                    <span>{f.quantity}</span>
                  </div>
                  <div className="food-info">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="4" y="5" width="16" height="16" rx="2"></rect>
                      <line x1="4" y1="9" x2="20" y2="9"></line>
                      <line x1="8" y1="3" x2="8" y2="6"></line>
                      <line x1="16" y1="3" x2="16" y2="6"></line>
                    </svg>
                    <span>소비기한 {mdOf(f.expiryDate)}</span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748B" }}>
                    등록: {addedByProfiles[f.addedBy]?.displayName ?? "로딩 중..."}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-title">해당하는 음식이 없어요</div>
            <div className="empty-state-desc">필터나 검색어를 바꿔보세요</div>
          </div>
        )}
      </div>

      <button
        className="fab"
        onClick={() => {
          if (!familyGroupId) {
            alert("가족 그룹에 속해있어야 음식을 추가할 수 있습니다.\n프로필에서 그룹을 생성해주세요.");
            return;
          }
          setShowModal(true);
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>

      <div className="tabbar">
        <Link href="/app/dashboard" className="tab-button active">
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
        <Link href="/app/profile" className="tab-button">
          <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="8" r="3.6"></circle>
            <path d="M5 20c0-3.9 3.1-6.5 7-6.5s7 2.6 7 6.5"></path>
          </svg>
          <span className="tab-label">프로필</span>
        </Link>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-bg" onClick={() => { setShowModal(false); setEditingFoodId(null); }}></div>
          <div className="modal-sheet">
            <div className="modal-handle"></div>
            <div className="modal-title">{editingFoodId ? "음식 수정" : "음식 추가"}</div>

            <div className="form-group">
              <label className="form-label">이름</label>
              <input
                className="form-input"
                type="text"
                placeholder="예: 우유"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">제품명</label>
              <input
                className="form-input"
                type="text"
                placeholder="예: 서울우유 1L"
                value={form.product}
                onChange={e => setForm({ ...form, product: e.target.value })}
              />
            </div>

            <div className="form-row">
              <div>
                <label className="form-label">카테고리</label>
                <select className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  <option>채소</option>
                  <option>과일</option>
                  <option>육류</option>
                  <option>유제품</option>
                  <option>수산</option>
                  <option>기타</option>
                </select>
              </div>
              <div>
                <label className="form-label">수량</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="예: 1팩"
                  value={form.quantity}
                  onChange={e => setForm({ ...form, quantity: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">보관 위치</label>
              <div className="form-chips">
                {["냉장", "냉동", "실온"].map(loc => (
                  <button
                    key={loc}
                    className={`form-chip ${form.location === loc ? "active" : ""}`}
                    onClick={() => setForm({ ...form, location: loc as FoodLocation })}
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">소비기한</label>
              <input
                className="form-input"
                type="date"
                value={form.expiryDate}
                onChange={e => setForm({ ...form, expiryDate: e.target.value })}
              />
            </div>

            <div className="form-actions">
              <button className="btn-secondary" onClick={() => { setShowModal(false); setEditingFoodId(null); }}>
                취소
              </button>
              <button
                className="btn-primary"
                disabled={!form.name.trim()}
                onClick={handleSubmitFood}
              >
                {editingFoodId ? "수정하기" : "추가하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
