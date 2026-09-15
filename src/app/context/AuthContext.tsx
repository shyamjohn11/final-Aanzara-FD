"use client";

import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

import { clearSession } from "../api/api";

interface AuthContextProps {
  token: string | null;
  refreshKey: string | null;
  userName: string | null;

  setToken: (token: string | null, rememberMe: boolean) => void;

  setRefreshKey: (
    refreshKey: string | null,
    rememberMe: boolean
  ) => void;

  setUserName: (
    name: string | null,
    rememberMe: boolean
  ) => void;

  logout: () => void;
}

export const AuthContext = createContext<
  AuthContextProps | undefined
>(undefined);

export const AuthProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [token, setTokenState] = useState<string | null>(null);

  const [refreshKey, setRefreshKeyState] =
    useState<string | null>(null);

  const [userName, setUserNameState] =
    useState<string | null>(null);

  // ==========================================
  // LOAD SAVED AUTHENTICATION
  // ==========================================

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      // Remember Me authentication
      const savedToken =
        localStorage.getItem("token");

      const savedRefreshKey =
        localStorage.getItem("refreshKey");

      const savedUserName =
        localStorage.getItem("userName");

      // Session authentication
      const sessionToken =
        sessionStorage.getItem("token");

      const sessionRefreshKey =
        sessionStorage.getItem("refreshKey");

      const sessionUserName =
        sessionStorage.getItem("userName");

      setTokenState(
        savedToken || sessionToken || null
      );

      setRefreshKeyState(
        savedRefreshKey ||
          sessionRefreshKey ||
          null
      );

      setUserNameState(
        savedUserName ||
          sessionUserName ||
          null
      );
    } catch (error) {
      console.error(
        "Unable to load authentication:",
        error
      );

      setTokenState(null);
      setRefreshKeyState(null);
      setUserNameState(null);
    }
  }, []);

  // ==========================================
  // SET TOKEN
  // ==========================================

  const setToken = (
    newToken: string | null,
    rememberMe: boolean
  ) => {
    if (typeof window !== "undefined") {
      // Remove old values first
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");

      if (newToken) {
        if (rememberMe) {
          localStorage.setItem(
            "token",
            newToken
          );
        } else {
          sessionStorage.setItem(
            "token",
            newToken
          );
        }
      }
    }

    setTokenState(newToken);
  };

  // ==========================================
  // SET REFRESH KEY
  // ==========================================

  const setRefreshKey = (
    newRefreshKey: string | null,
    rememberMe: boolean
  ) => {
    if (typeof window !== "undefined") {
      // Remove old values first
      localStorage.removeItem("refreshKey");
      sessionStorage.removeItem("refreshKey");

      if (newRefreshKey) {
        if (rememberMe) {
          localStorage.setItem(
            "refreshKey",
            newRefreshKey
          );
        } else {
          sessionStorage.setItem(
            "refreshKey",
            newRefreshKey
          );
        }
      }
    }

    setRefreshKeyState(newRefreshKey);
  };

  // ==========================================
  // SET USER NAME
  // ==========================================

  const setUserName = (
    name: string | null,
    rememberMe: boolean
  ) => {
    if (typeof window !== "undefined") {
      // Remove old values first
      localStorage.removeItem("userName");
      sessionStorage.removeItem("userName");

      if (name) {
        if (rememberMe) {
          localStorage.setItem(
            "userName",
            name
          );
        } else {
          sessionStorage.setItem(
            "userName",
            name
          );
        }
      }
    }

    setUserNameState(name);
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const logout = () => {
    if (typeof window !== "undefined") {
      // Local storage
      localStorage.removeItem("token");
      localStorage.removeItem("refreshKey");
      localStorage.removeItem("userName");

      // Session storage
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("refreshKey");
      sessionStorage.removeItem("userName");

      // Existing application auth values
      sessionStorage.removeItem(
        "aanzara_logged_in"
      );

      sessionStorage.removeItem(
        "aanzara_account_type"
      );

      localStorage.removeItem(
        "aanzara_remember_me"
      );

      // Central session clear: API tokens + the middleware guard
      // cookies. Without the cookie clear the edge guard keeps
      // treating this browser as logged in and /login never renders.
      clearSession();
    }

    setTokenState(null);
    setRefreshKeyState(null);
    setUserNameState(null);
  };

  // ==========================================
  // PROVIDER
  // ==========================================

  return (
    <AuthContext.Provider
      value={{
        token,
        refreshKey,
        userName,
        setToken,
        setRefreshKey,
        setUserName,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};