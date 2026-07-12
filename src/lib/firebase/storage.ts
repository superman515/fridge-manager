import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "@/lib/firebase/client";

export async function uploadProfileImage(uid: string, file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("이미지 파일만 업로드 가능합니다.");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("파일 크기는 5MB 이하여야 합니다.");
  }

  const storageRef = ref(storage, `users/${uid}/profileImage`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function deleteProfileImage(uid: string): Promise<void> {
  try {
    const storageRef = ref(storage, `users/${uid}/profileImage`);
    await deleteObject(storageRef);
  } catch (error) {
    // 파일이 없을 수 있음, 무시
  }
}
