import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import type { User } from "@/types/user";

const googleProvider = new GoogleAuthProvider();

function toAppUser(firebaseUser: FirebaseUser): User {
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email ?? "",
    displayName: firebaseUser.displayName ?? firebaseUser.email?.split("@")[0] ?? "사용자",
    photoURL: firebaseUser.photoURL,
    familyGroupId: null,
  };
}

async function upsertUserDoc(firebaseUser: FirebaseUser): Promise<void> {
  const ref = doc(db, "users", firebaseUser.uid);
  const snapshot = await getDoc(ref);
  const base = toAppUser(firebaseUser);

  if (!snapshot.exists()) {
    await setDoc(ref, { ...base, createdAt: serverTimestamp() });
  } else {
    await setDoc(
      ref,
      { email: base.email, displayName: base.displayName, photoURL: base.photoURL },
      { merge: true }
    );
  }
}

export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  await upsertUserDoc(result.user);
  return toAppUser(result.user);
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, password);
  await upsertUserDoc(result.user);
  return toAppUser(result.user);
}

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(result.user, { displayName });
  await upsertUserDoc({ ...result.user, displayName } as FirebaseUser);
  return { ...toAppUser(result.user), displayName };
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export async function updateUserProfile(
  uid: string,
  updates: { displayName?: string; photoURL?: string | null }
): Promise<void> {
  const ref = doc(db, "users", uid);
  await updateDoc(ref, updates);

  const currentUser = auth.currentUser;
  if (currentUser) {
    await updateProfile(currentUser, updates);
  }
}

export function getAuthErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/invalid-email":
      return "이메일 형식이 올바르지 않습니다.";
    case "auth/user-not-found":
    case "auth/invalid-credential":
      return "존재하지 않는 계정이거나 비밀번호가 일치하지 않습니다.";
    case "auth/wrong-password":
      return "비밀번호가 일치하지 않습니다.";
    case "auth/email-already-in-use":
      return "이미 가입된 이메일입니다.";
    case "auth/weak-password":
      return "비밀번호는 6자 이상이어야 합니다.";
    case "auth/too-many-requests":
      return "너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.";
    case "auth/popup-closed-by-user":
      return "Google 로그인 창이 닫혔습니다. 다시 시도해주세요.";
    case "auth/network-request-failed":
      return "네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.";
    default:
      return "알 수 없는 오류가 발생했습니다. 다시 시도해주세요.";
  }
}
