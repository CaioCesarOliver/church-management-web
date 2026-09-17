"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  apiGet,
  apiPost,
  clearSession,
  getStoredToken,
  getStoredUser,
  storeSession,
  UNAUTHORIZED_EVENT,
} from "@/lib/api-client";
import type { AuthUser, LoginResponse } from "@/types/api";

interface AuthContextValue {
  user: AuthUser | null;
  /** True until the stored session has been read and revalidated. */
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  /** Re-reads `/auth/me` into the context and the cached session. */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    router.replace("/login");
  }, [router]);

  // Restore the session on boot. The cached user paints the shell immediately;
  // `/auth/me` then confirms the token is still good (it may have expired while
  // the tab was closed) and refreshes stale name/role values.
  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }

    setUser(getStoredUser<AuthUser>());

    let cancelled = false;
    apiGet<AuthUser>("/api/auth/me")
      .then((fresh) => {
        if (cancelled) return;
        setUser(fresh);
        storeSession(token, fresh);
      })
      .catch(() => {
        if (cancelled) return;
        clearSession();
        setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Any 401 from anywhere in the app tears the session down exactly once.
  useEffect(() => {
    const handler = () => {
      clearSession();
      setUser(null);
    };
    window.addEventListener(UNAUTHORIZED_EVENT, handler);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handler);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await apiPost<LoginResponse>("/api/auth/login", { email, password });
      storeSession(result.token, result.user);
      setUser(result.user);
      router.replace("/");
    },
    [router],
  );

  // Used after the signed-in user renames themselves, so the sidebar stops
  // showing the old name without a full reload.
  const refreshUser = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;
    const fresh = await apiGet<AuthUser>("/api/auth/me");
    setUser(fresh);
    storeSession(token, fresh);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, login, logout, refreshUser }),
    [user, loading, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an <AuthProvider>.");
  }
  return context;
}
