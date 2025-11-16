// src/hooks/useAuth.ts
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../firebase/config";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("[useAuth] Listening for auth changes...");
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      console.log("[useAuth] User changed:", u?.uid ?? "none", "Verified:", u?.emailVerified);
      setUser(u);
      setLoading(false);
    });

    return () => {
      console.log("[useAuth] Unsubscribed");
      unsubscribe();
    };
  }, []);

  return { user, loading };
}