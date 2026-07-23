import { useState, useEffect } from "react";

const STORAGE_KEY = "fridge_remembered_email";

export function useRememberedEmail() {
  const [email, setEmail] = useState("");
  const [shouldRemember, setShouldRemember] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setEmail(saved);
      setShouldRemember(true);
    }
    setMounted(true);
  }, []);

  const saveEmail = (emailToSave: string) => {
    localStorage.setItem(STORAGE_KEY, emailToSave);
  };

  const deleteEmail = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    email,
    setEmail,
    shouldRemember,
    setShouldRemember,
    saveEmail,
    deleteEmail,
  };
}
