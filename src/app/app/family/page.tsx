"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUserFamily } from "@/hooks/useUserFamily";
import { getFamilyGroup } from "@/lib/firebase/family";
import type { FamilyGroup } from "@/types/familyGroup";

export default function FamilyPage() {
  const { familyGroupId } = useUserFamily();
  const [group, setGroup] = useState<FamilyGroup | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!familyGroupId) {
      setLoading(false);
      return;
    }

    getFamilyGroup(familyGroupId).then(g => {
      setGroup(g);
      setLoading(false);
    });
  }, [familyGroupId]);

  if (loading) {
    return (
      <div className="phone">
        <div className="scr" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
          <div style={{ color: "#64748B" }}>로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="phone">
      <div className="scr">
        <div className="header">
          <div className="header-group-name">함께 쓰는 사람들</div>
          <div className="header-title">가족 그룹</div>
        </div>

        {!group ? (
          <div className="family-container">
            <div style={{ textAlign: "center", color: "#94A3B8", marginTop: "40px" }}>
              <p>가족 그룹이 없습니다</p>
              <p style={{ fontSize: "12px", marginTop: "8px" }}>프로필에서 그룹을 생성해주세요</p>
            </div>
          </div>
        ) : (
          <div className="family-container">
            <div className="group-card">
              <div className="group-label">우리 그룹</div>
              <div className="group-title">{group.name}</div>
              <div className="group-code-section">
                <div>
                  <div className="group-code-info">초대 코드</div>
                  <div className="group-code">{group.inviteCode}</div>
                </div>
                <button
                  className="copy-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(group.inviteCode);
                    alert("초대 코드가 복사되었습니다");
                  }}
                >
                  코드 복사
                </button>
              </div>
            </div>

            <div className="section-title">구성원 {group.members.length}명</div>
            <div className="member-list">
              {group.members.map((memberId, i) => (
                <div key={memberId} className="member-card">
                  <div className="member-avatar" style={{ background: i === 0 ? "#2563EB" : i === 1 ? "#0EA5E9" : "#64748B" }}>
                    {i === 0 ? "엄" : i === 1 ? "아" : "민"}
                  </div>
                  <div className="member-info">
                    <div className="member-name-row">
                      <span className="member-name">{i === 0 ? "엄마" : i === 1 ? "아빠" : "민지 (나)"}</span>
                      <span
                        className="member-role"
                        style={{
                          color: i === 0 ? "#2563EB" : "#475569",
                          background: i === 0 ? "rgba(37,99,235,.10)" : "#F1F5F9",
                        }}
                      >
                        {i === 0 ? "관리자" : "구성원"}
                      </span>
                    </div>
                    <div className="member-stats">가족 구성원</div>
                  </div>
                </div>
              ))}
            </div>

            <button className="invite-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              가족 초대하기
            </button>
          </div>
        )}
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
        <Link href="/app/family" className="tab-button active">
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
    </div>
  );
}
