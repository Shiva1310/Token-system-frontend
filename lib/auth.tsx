"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  ApiError,
  getMe,
  login as apiLogin,
  register as apiRegister,
  type User,
} from "@/lib/api";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<User>;
  register: (name: string, phone: string, password: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(
    () => typeof window !== "undefined" && !!window.localStorage.getItem("token")
  );
  const router = useRouter();

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? window.localStorage.getItem("token") : null;

    if (!token) {
      return;
    }

    getMe()
      .then((u) => {
        setUser(u);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          window.localStorage.removeItem("token");
          setUser(null);
          router.replace("/login");
        }
      })
      .finally(() => {
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (phone: string, password: string) => {
    const res = await apiLogin(phone, password);
    window.localStorage.setItem("token", res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(
    async (name: string, phone: string, password: string) => {
      const res = await apiRegister(name, phone, password);
      window.localStorage.setItem("token", res.token);
      setUser(res.user);
      return res.user;
    },
    []
  );

  const logout = useCallback(() => {
    window.localStorage.removeItem("token");
    setUser(null);
    router.replace("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
