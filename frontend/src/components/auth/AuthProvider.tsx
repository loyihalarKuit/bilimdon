"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { api, tokenStorage } from "@/lib/api";
import type { TokenResponse, User } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  /** Foydalanuvchi o'zi chiqib ketganmi (sessiya tugashidan farqlash uchun) */
  loggedOut: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (full_name: string, email: string, password: string) => Promise<User>;
  logout: () => void;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggedOut, setLoggedOut] = useState(false);

  useEffect(() => {
    const token = tokenStorage.get();
    const loadUser = token
      ? api.auth.me().catch(() => {
          tokenStorage.clear();
          return null;
        })
      : Promise.resolve(null);
    loadUser.then((u) => {
      setUser(u);
      setLoading(false);
    });

    const onExpired = () => setUser(null);
    window.addEventListener("auth:expired", onExpired);
    return () => window.removeEventListener("auth:expired", onExpired);
  }, []);

  const handleToken = useCallback((res: TokenResponse) => {
    tokenStorage.set(res.access_token);
    setLoggedOut(false);
    setUser(res.user);
    return res.user;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      loggedOut,
      login: (email, password) => api.auth.login({ email, password }).then(handleToken),
      register: (full_name, email, password) => api.auth.register({ full_name, email, password }).then(handleToken),
      logout: () => {
        // JWT stateless: tokenni o'chirish kifoya
        tokenStorage.clear();
        setLoggedOut(true);
        setUser(null);
      },
      setUser,
    }),
    [user, loading, loggedOut, handleToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth AuthProvider ichida ishlatilishi kerak");
  return ctx;
}
