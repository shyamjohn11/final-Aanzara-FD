"use client";

import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

import { clearSession, hasSession, getSessionRole, saveSession, type AuthResponse } from "@/app/api/api";

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
      // Remember Me authentication
      const savedAccessToken = localStorage.getItem("accessToken");

      const savedRefreshToken = localStorage.getItem("refreshToken");

      const savedUserName = localStorage.getItem("userName");

      // Session authentication
      const sessionAccessToken = sessionStorage.getItem("accessToken");

      const sessionRefreshToken = sessionStorage.getItem("refreshToken");

      const sessionUserName = sessionStorage.getItem("userName");

      // Set the access token state
      setAccessTokenState(
        savedAccessToken || sessionAccessToken || null
      );

      setRefreshTokenState(
        savedRefreshToken || sessionRefreshToken || null
      );

      setUserNameState(
        savedUserName || sessionUserName || null
      );

      // Resolve role from saved session
      if (savedAccessToken || sessionAccessToken) {
        // We need to resolve the role; do a lightweight check
        // The role will be refined when the user actually logs in or
        // when the session is established from the API.
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

  const setAccessToken = (
    newToken: string | null,
    rememberMe: boolean
  ) => {
    if (typeof window !== "undefined") {
      // Remove old values first
      localStorage.removeItem("accessToken");
      sessionStorage.removeItem("accessToken");

      if (newToken) {
        if (rememberMe) {
          localStorage.setItem("accessToken", newToken);
        } else {
          sessionStorage.setItem("accessToken", newToken);
        }
      }
    }

    setAccessTokenState(newToken);
  };

  // ==========================================
  // SET REFRESH TOKEN
  // ==========================================

  const setRefreshToken = (
    newRefreshToken: string | null,
    rememberMe: boolean
  ) => {
    if (typeof window !== "undefined") {
      // Remove old values first
      localStorage.removeItem("refreshToken");
      sessionStorage.removeItem("refreshToken");

      if (newRefreshToken) {
        if (rememberMe) {
          localStorage.setItem("refreshToken", newRefreshToken);
        } else {
          sessionStorage.setItem("refreshToken", newRefreshToken);
        }
      }
    }

    setRefreshTokenState(newRefreshToken);
  };

  // ==========================================
  // SET USER NAME
  // ==========================================

  const setUserName = (name: string | null, rememberMe: boolean) => {
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
  };

  // ==========================================
  // SET ROLE
  // ==========================================

  const setRole = (newRole: string | null) => {
    setRoleState(newRole);
    // Also update the guard cookie so the edge middleware stays in sync
    if (typeof window !== "undefined") {
      // Remove old role cookie first
      document.cookie = "aanzara_role=; path=/; max-age=0; SameSite=Lax";
      if (newRole) {
        const maxAge = 60 * 60 * 24 * 30; // 30 days
        document.cookie = `aanzara_role=${encodeURIComponent(newRole)}; path=/; max-age=${maxAge}; SameSite=Lax`;
      }
    }
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const logout = () => {
    if (typeof window !== "undefined") {
      // Local storage
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userName");

      // Session storage
      sessionStorage.removeItem("accessToken");
      sessionStorage.removeItem("refreshToken");
      sessionStorage.removeItem("userName");

      // Clear auth state from session storage
      sessionStorage.removeItem("aanzara_logged_in");
      sessionStorage.removeItem("aanzara_user_id");
      sessionStorage.removeItem("aanzara_user_data");
      sessionStorage.removeItem("aanzara_user_role");

      // Clear guard cookies for the edge middleware
      document.cookie = "aanzara_session=; path=/; max-age=0; SameSite=Lax";
      document.cookie = "aanzara_role=; path=/; max-age=0; SameSite=Lax";
    }

    clearSession();
    setAccessTokenState(null);
    setRefreshTokenState(null);
    setUserNameState(null);
    setRoleState(null);
    setIsLoading(false);
  };

  // ==========================================
  // PROVIDER
  // ==========================================

  return (
    <AuthContext.Provider
      value={{
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};