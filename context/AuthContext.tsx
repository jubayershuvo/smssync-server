"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

interface AuthUser {
  id: string;
  name: string;
  username: string;
  email: string;
}

type AuthResult = { success: boolean; error?: string };

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signup: (data: { name: string; username: string; email: string; password: string }) => Promise<AuthResult>;
  signin: (data: { email: string; password: string }) => Promise<AuthResult>;
  signout: () => void;
  fetchMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  // true until we have checked localStorage + validated the token once
  const [isLoading, setIsLoading] = useState(true);

  const clear = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }, []);

  const load = useCallback(async () => {
    const t = localStorage.getItem("token");
    setToken(t);
    if (!t) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/auth/me", { headers: { Authorization: `Bearer ${t}` } });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else if (res.status === 401 || res.status === 404) {
        clear(); // token invalid / expired / user deleted
      }
    } catch {
      // network error: keep the token, try again next time
    } finally {
      setIsLoading(false);
    }
  }, [clear]);

  useEffect(() => {
    load();
    // keep tabs in sync (sign in / out in another tab)
    const onStorage = (e: StorageEvent) => {
      if (e.key === "token" || e.key === null) load();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [load]);

  const authenticate = useCallback(async (url: string, data: object, fallback: string): Promise<AuthResult> => {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok || !json.success) return { success: false, error: json.error || fallback };
      localStorage.setItem("token", json.token);
      setToken(json.token);
      setUser(json.user);
      return { success: true };
    } catch {
      return { success: false, error: fallback };
    }
  }, []);

  const signup = useCallback(
    (data: { name: string; username: string; email: string; password: string }) =>
      authenticate("/api/auth/signup", data, "Signup failed"),
    [authenticate]
  );
  const signin = useCallback(
    (data: { email: string; password: string }) => authenticate("/api/auth/signin", data, "Signin failed"),
    [authenticate]
  );

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, isAuthenticated: !!user, signup, signin, signout: clear, fetchMe: load }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};
