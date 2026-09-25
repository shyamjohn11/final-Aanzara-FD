"use client";

import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";

import { clearSession, getSessionRole } from "@/app/api/api";

interface AuthContextProps {
  accessToken: string | null;
  refreshToken: string | null;
  userName: string | null;
  role: string | null;
  isLoading: boolean;

  setAccessToken: (token: string | null, rememberMe: boolean) => void;

  setRefreshToken: (
    refreshToken: string | null,
    rememberMe: boolean
  ) => void;

  setUserName: (name: string | null, rememberMe: boolean) => void;

  setRole: (role: string | null) => void;

  logout: () => void;
}

export const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [refreshToken, setRefreshTokenState] = useState<string | null>(null);
  const [userName, setUserNameState] = useState<string | null>(null);
  const [role, setRoleState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ==========================================
  // LOAD SAVED AUTHENTICATION
  // ==========================================

  useEffect(() => {
    if (typeof window === "undefined") {
      setIsLoading(false);
      return;
    }

    try {
      // One-time migration: clear any legacy access tokens from localStorage.
      // Access tokens live only in sessionStorage; refresh is HttpOnly cookie.
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      sessionStorage.removeItem("refreshToken");

      const sessionAccessToken = sessionStorage.getItem("accessToken");
      const sessionUserName =
        sessionStorage.getItem("userName") || localStorage.getItem("userName");

      // Drop legacy userName from localStorage after reading once.
      localStorage.removeItem("userName");

      setAccessTokenState(sessionAccessToken);
      setRefreshTokenState(null);
      setUserNameState(sessionUserName);

      if (sessionAccessToken) {
        const resolvedRole = getSessionRole();
        setRoleState(resolvedRole);
      } else {
        setRoleState(null);
      }
    } catch (error) {
      console.error("Unable to load authentication:", error);
      setAccessTokenState(null);
      setRefreshTokenState(null);
      setUserNameState(null);
      setRoleState(null);
    } finally {
      // Always set loading to false after the initial check
      setIsLoading(false);
    }
  }, []);

  // ==========================================
  // SET ACCESS TOKEN
  // ==========================================

  const setAccessToken = useCallback(
    (newToken: string | null, _rememberMe: boolean) => {
      if (typeof window !== "undefined") {
        // Remove old values first
        localStorage.removeItem("accessToken");
        sessionStorage.removeItem("accessToken");

        if (newToken) {
          // Session only — never persist access tokens in localStorage.
          sessionStorage.setItem("accessToken", newToken);
        }
      }

      setAccessTokenState(newToken);
    },
    []
  );

  // ==========================================
  // SET REFRESH TOKEN
  // ==========================================

  const setRefreshToken = useCallback(
    (newRefreshToken: string | null, _rememberMe: boolean) => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("refreshToken");
        sessionStorage.removeItem("refreshToken");
      }
      // Refresh token lives only in the HttpOnly cookie set by the backend.
      setRefreshTokenState(null);
      void newRefreshToken;
    },
    []
  );

  // ==========================================
  // SET USER NAME
  // ==========================================

  const setUserName = useCallback(
    (name: string | null, rememberMe: boolean) => {
      if (typeof window !== "undefined") {
        // Remove old values first
        localStorage.removeItem("userName");
        sessionStorage.removeItem("userName");

        if (name) {
          if (rememberMe) {
            localStorage.setItem("userName", name);
          } else {
            sessionStorage.setItem("userName", name);
          }
        }
      }

      setUserNameState(name);
    },
    []
  );

  // ==========================================
  // SET ROLE
  // ==========================================

  const setRole = useCallback((newRole: string | null) => {
    setRoleState(newRole);
    if (typeof window !== "undefined" && newRole) {
      sessionStorage.setItem("aanzara_user_role", newRole);
    }
    // Role cookie is HttpOnly and set only by the backend on login/refresh.
    // Do not write aanzara_role from JS — it would be forgeable.
  }, []);

  // ==========================================
  // LOGOUT
  // ==========================================

  const logout = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userName");
      sessionStorage.removeItem("accessToken");
      sessionStorage.removeItem("refreshToken");
      sessionStorage.removeItem("userName");
      sessionStorage.removeItem("aanzara_logged_in");
      sessionStorage.removeItem("aanzara_user_id");
      sessionStorage.removeItem("aanzara_user_data");
      sessionStorage.removeItem("aanzara_user_role");
      // Legacy non-HttpOnly cookies only — HttpOnly cookies cleared by POST /logout.
      document.cookie = "aanzara_session=; path=/; max-age=0; SameSite=Lax";
      document.cookie = "aanzara_role=; path=/; max-age=0; SameSite=Lax";
    }

    clearSession();
    setAccessTokenState(null);
    setRefreshTokenState(null);
    setUserNameState(null);
    setRoleState(null);
    setIsLoading(false);
  }, []);

  // ==========================================
  // PROVIDER
  // ==========================================

  const value = useMemo(
    () => ({
      accessToken,
      refreshToken,
      userName,
      role,
      isLoading,
      setAccessToken,
      setRefreshToken,
      setUserName,
      setRole,
      logout,
    }),
    [
      accessToken,
      refreshToken,
      userName,
      role,
      isLoading,
      setAccessToken,
      setRefreshToken,
      setUserName,
      setRole,
      logout,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};