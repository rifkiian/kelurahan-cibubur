import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiUrl } from "@/lib/api";

type Role = "ADMIN" | "USER";

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "auth_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const fetchMe = useCallback(async (t: string) => {
    const res = await fetch(apiUrl("/api/auth/me"), {
      headers: { Authorization: `Bearer ${t}` },
    });
    if (!res.ok) throw new Error("unauthorized");
    const data = (await res.json()) as { user: AuthUser };
    setUser(data.user);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        if (!token) {
          if (!cancelled) setUser(null);
          return;
        }
        await fetchMe(token);
      } catch {
        if (!cancelled) logout();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, fetchMe, logout]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(apiUrl("/api/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      throw new Error("login_failed");
    }

    const data = (await res.json()) as { token: string; user: AuthUser };
    localStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, loading, login, logout }),
    [user, token, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
