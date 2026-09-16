"use client";

import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

import { clearSession } from "../api/api";

interface AuthContextProps {
  accessToken: string | null;
  refreshToken: string | null;
  userName: string | null;

  setAccessToken: (token: string | null, rememberMe: boolean) => void;

  setRefreshToken: (
    refreshToken: string | null,
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
  const [accessToken, setAccessTokenState] = useState<string | null>(null);

  const [refreshToken, setRefreshTokenState] =
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
      const savedAccessToken =
        localStorage.getItem("accessToken");

      const savedRefreshToken =
        localStorage.getItem("refreshToken");

      const savedUserName =
        localStorage.getItem("userName");

      // Session authentication
      const sessionAccessToken =
        sessionStorage.getItem("accessToken");

      const sessionRefreshToken =
        sessionStorage.getItem("refreshToken");

      const sessionUserName =
        sessionStorage.getItem("userName");

      setAccessTokenState(
        savedAccessToken || sessionAccessToken || null
      );

      setRefreshTokenState(
        savedRefreshToken || sessionRefreshToken || null
      );

      setUserNameState(
        savedUserName || sessionUserName || null
      );
    } catch (error) {
      console.error(
        "Unable to load authentication:",
        error
      );

      setAccessTokenState(null);
      setRefreshTokenState(null);
      setUserNameState(null);
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
          localStorage.setItem(
            "accessToken",
            newToken
          );
        } else {
          sessionStorage.setItem(
            "accessToken",
            newToken
          );
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
          localStorage.setItem(
            "refreshToken",
            newRefreshToken
          );
        } else {
          sessionStorage.setItem(
            "refreshToken",
            newRefreshToken
          );
        }
      }
    }

    setRefreshTokenState(newRefreshToken);
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
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userName");

      // Session storage
      sessionStorage.removeItem("accessToken");
      sessionStorage.removeItem("refreshToken");
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

    setAccessTokenState(null);
    setRefreshTokenState(null);
    setUserNameState(null);
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
        setAccessToken,
        setRefreshToken,
        setUserName,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};