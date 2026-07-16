"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useUserFamily } from "@/hooks/useUserFamily";
import { getFamilyGroup, createFamilyGroup, resolveInviteCode, addMemberToGroup } from "@/lib/firebase/family";
import { getUserProfile } from "@/lib/firebase/user";
import type { FamilyGroup } from "@/types/familyGroup";
import type { User } from "@/types/user";

export default function FamilyPage() {
  const { firebaseUser } = useAuth();
  const { familyGroupId } = useUserFamily();
  const [group, setGroup] = useState<FamilyGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [groupName, setGroupName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memberProfiles, setMemberProfiles] = useState<Record<string, User | null>>({});
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");
  const [inviteCode, setInviteCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  useEffect(() => {
    if (!familyGroupId) {
      setLoading(false);
      return;
    }

    getFamilyGroup(familyGroupId).then(async g => {
      setGroup(g);

      if (g && g.members.length > 0) {
        const profiles: Record<string, User | null> = {};
        for (const memberId of g.members) {
          const profile = await getUserProfile(memberId);
          profiles[memberId] = profile;
        }
        setMemberProfiles(profiles);
      }

      setLoading(false);
    });
  }, [familyGroupId]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser || !groupName.trim()) return;

    setCreating(true);
    setError(null);

    try {
      await createFamilyGroup(firebaseUser.uid, groupName.trim());
      setGroupName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "그룹 생성에 실패했습니다");
    } finally {
      setCreating(false);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser || !inviteCode.trim()) return;

    setJoining(true);
    setJoinError(null);

    try {
      const code = inviteCode.trim().toUpperCase();

      // Validate format (XXX-XXXX)
      if (!/^[A-Z0-9]{3}-[A-Z0-9]{4}$/.test(code)) {
        setJoinError("코드 형식이 올바르지 않습니다");
        setJoining(false);
        return;
      }

      // Resolve invite code to groupId
      const groupId = await resolveInviteCode(code);
      if (!groupId) {
        setJoinError("코드를 확인하세요");
        setJoining(false);
        return;
      }

      // Add user to group
      await addMemberToGroup(groupId, firebaseUser.uid);
      setInviteCode("");

      // Page will auto-refresh via useUserFamily hook
    } catch (err) {
      console.error("Join group error:", err);
      setJoinError("이미 가입된 그룹이거나 참여할 수 없습니다");
    } finally {
      setJoining(false);
    }
  };

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
            {/* Tab Navigation */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px", borderBottom: "1px solid #E2E8F0" }}>
              <button
                onClick={() => {
                  setActiveTab("create");
                  setJoinError(null);
                }}
                style={{
                  flex: 1,
                  padding: "12px 0",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  borderBottom: activeTab === "create" ? "2px solid #2563EB" : "none",
                  color: activeTab === "create" ? "#2563EB" : "#64748B",
                  fontWeight: activeTab === "create" ? "600" : "400",
                  fontSize: "14px",
                }}
              >
                생성
              </button>
              <button
                onClick={() => {
                  setActiveTab("join");
                  setJoinError(null);
                }}
                style={{
                  flex: 1,
                  padding: "12px 0",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  borderBottom: activeTab === "join" ? "2px solid #2563EB" : "none",
                  color: activeTab === "join" ? "#2563EB" : "#64748B",
                  fontWeight: activeTab === "join" ? "600" : "400",
                  fontSize: "14px",
                }}
              >
                참여
              </button>
            </div>

            {/* Create Tab */}
            {activeTab === "create" && (
              <div className="group-card">
                <div className="group-label">새 그룹 생성</div>
                <form onSubmit={handleCreateGroup} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <input
                    type="text"
                    placeholder="그룹명 입력 (예: 우리 가족)"
                    value={groupName}
                    onChange={e => setGroupName(e.target.value)}
                    className="form-input"
                    disabled={creating}
                  />
                  {error && <div style={{ fontSize: "12px", color: "#DC2626" }}>{error}</div>}
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={!groupName.trim() || creating}
                    style={{ width: "100%" }}
                  >
                    {creating ? "생성 중..." : "그룹 생성"}
                  </button>
                </form>
              </div>
            )}

            {/* Join Tab */}
            {activeTab === "join" && (
              <div className="group-card">
                <div className="group-label">초대 코드 입력</div>
                <form onSubmit={handleJoinGroup} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <input
                    type="text"
                    placeholder="초대 코드 (예: ABC-1234)"
                    value={inviteCode}
                    onChange={e => setInviteCode(e.target.value.toUpperCase())}
                    className="form-input"
                    disabled={joining}
                    maxLength={8}
                  />
                  {joinError && <div style={{ fontSize: "12px", color: "#DC2626" }}>{joinError}</div>}
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={!inviteCode.trim() || joining}
                    style={{ width: "100%" }}
                  >
                    {joining ? "참여 중..." : "그룹 참여"}
                  </button>
                </form>
              </div>
            )}
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
              {group.members.map((memberId) => {
                const profile = memberProfiles[memberId];
                const isCreator = memberId === group.createdBy;
                const avatarChar = profile?.displayName?.[0] ?? "?";
                const avatarBg = isCreator ? "#2563EB" : "#64748B";
                const isCurrentUser = memberId === firebaseUser?.uid;

                return (
                  <div key={memberId} className="member-card">
                    <div className="member-avatar" style={{ background: profile?.photoURL ? "transparent" : avatarBg, overflow: "hidden" }}>
                      {profile?.photoURL ? (
                        <img src={profile.photoURL} alt={profile.displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        avatarChar
                      )}
                    </div>
                    <div className="member-info">
                      <div className="member-name-row">
                        <span className="member-name">
                          {profile?.displayName ?? "로딩 중..."}{isCurrentUser && " (나)"}
                        </span>
                        <span
                          className="member-role"
                          style={{
                            color: isCreator ? "#2563EB" : "#475569",
                            background: isCreator ? "rgba(37,99,235,.10)" : "#F1F5F9",
                          }}
                        >
                          {isCreator ? "관리자" : "구성원"}
                        </span>
                      </div>
                      <div className="member-stats">가족 구성원</div>
                    </div>
                  </div>
                );
              })}
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
