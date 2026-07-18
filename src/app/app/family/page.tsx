"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useUserFamily } from "@/hooks/useUserFamily";
import { useFamilyGroup } from "@/hooks/useFamilyGroup";
import { createFamilyGroup, resolveInviteCode, addMemberToGroup, removeMemberFromGroup, updateFamilyGroupName, deleteFamilyGroup } from "@/lib/firebase/family";
import { getUserProfile } from "@/lib/firebase/user";
import type { FamilyGroup } from "@/types/familyGroup";
import type { User } from "@/types/user";

export default function FamilyPage() {
  const { firebaseUser } = useAuth();
  const { familyGroupId, loading: familyLoading } = useUserFamily();
  const router = useRouter();
  const { group, loading: groupLoading } = useFamilyGroup(familyGroupId);
  const loading = familyLoading || groupLoading;
  const [groupName, setGroupName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [memberProfiles, setMemberProfiles] = useState<Record<string, User | null>>({});
  const [activeTab, setActiveTab] = useState<"create" | "join">("create");
  const [inviteCode, setInviteCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const memberIdsKey = (group?.members ?? []).join(",");

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

  const handleUpdateGroupName = async () => {
    if (!group || editedName.trim() === "") return;
    try {
      await updateFamilyGroupName(group.id, editedName.trim());
      setIsEditingName(false);
    } catch (err) {
      console.error("Failed to update group name:", err);
      alert("그룹명 수정 실패: " + (err instanceof Error ? err.message : ""));
    }
  };

  const handleRemoveMember = async (uid: string) => {
    if (!group || !confirm("이 멤버를 제거하시겠습니까?")) return;
    try {
      await removeMemberFromGroup(group.id, uid);
      alert("멤버가 제거되었습니다.");
    } catch (err) {
      console.error("Failed to remove member:", err);
      alert("멤버 제거 실패: " + (err instanceof Error ? err.message : ""));
    }
  };

  const handleDeleteGroup = async () => {
    if (!group || !confirm("그룹을 삭제하시겠습니까? 모든 음식 데이터도 삭제됩니다.")) return;
    try {
      setIsDeleting(true);
      await deleteFamilyGroup(group.id);
      router.push("/app/dashboard");
    } catch (err) {
      console.error("Failed to delete group:", err);
      alert("그룹 삭제 실패: " + (err instanceof Error ? err.message : ""));
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("invite");
      if (code) {
        setInviteCode(code.toUpperCase());
        setActiveTab("join");
      }
    }
  }, []);

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
              {isEditingName ? (
                <div style={{ display: "flex", gap: "8px", marginTop: "5px", alignItems: "center" }}>
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    autoFocus
                    style={{
                      flex: 1,
                      padding: "7px 10px",
                      fontSize: "16px",
                      fontWeight: "700",
                      background: "rgba(255,255,255,.16)",
                      border: "1px solid rgba(255,255,255,.4)",
                      borderRadius: "6px",
                      boxSizing: "border-box",
                      color: "white",
                      outline: "none",
                    }}
                  />
                  <button
                    onClick={handleUpdateGroupName}
                    style={{
                      padding: "7px 12px",
                      backgroundColor: "white",
                      color: "#2563EB",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "700",
                      fontSize: "13px",
                    }}
                  >
                    저장
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginTop: "3px", minWidth: 0 }}>
                  <div style={{ fontSize: "18px", fontWeight: "700", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0, color: "white" }}>{group.name}</div>
                  {firebaseUser?.uid === group.createdBy && (
                    <button
                      onClick={() => {
                        setEditedName(group.name);
                        setIsEditingName(true);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "2px",
                        display: "flex",
                        flex: "none",
                        color: "rgba(255,255,255,.75)",
                      }}
                      title="그룹명 수정"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 20h9"></path>
                        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
                      </svg>
                    </button>
                  )}
                </div>
              )}
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
                const isAdmin = firebaseUser?.uid === group.createdBy;

                return (
                  <div key={memberId} style={{
                    position: "relative",
                    marginBottom: "2px",
                  }}>
                    <div className="member-card">
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
                    {isAdmin && memberId !== firebaseUser?.uid && (
                      <button
                        onClick={() => handleRemoveMember(memberId)}
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
                        title="멤버 제거"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {firebaseUser?.uid === group.createdBy && (
              <button
                onClick={handleDeleteGroup}
                disabled={isDeleting}
                style={{
                  width: "100%",
                  padding: "8px",
                  marginTop: "12px",
                  backgroundColor: "#DC2626",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: isDeleting ? "not-allowed" : "pointer",
                  opacity: isDeleting ? 0.6 : 1,
                }}
              >
                {isDeleting ? "삭제 중..." : "그룹 삭제"}
              </button>
            )}
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
