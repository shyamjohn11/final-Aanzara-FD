"use client";

import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const useApi = () => {
  const authContext = useContext(AuthContext);

  /**
   * Get the latest authentication token.
   *
   * Access tokens live in sessionStorage (session-only); never localStorage.
   */
  const getToken = (): string => {
    if (typeof window === "undefined") {
      return authContext?.accessToken ?? "";
    }

    return (
      window.sessionStorage.getItem("accessToken") ??
      authContext?.accessToken ??
      ""
    );
  };

  /**
   * Create request headers.
   *
   * Handles all valid HeadersInit types safely.
   */
  const setHeaders = (
    headers?: HeadersInit
  ): Headers => {
    const finalHeaders = new Headers(headers);

    const token = getToken();

    if (token) {
      finalHeaders.set(
        "Authorization",
        `Bearer ${token}`
      );
    }

    return finalHeaders;
  };

  /**
   * POST API request.
   *
   * Supports:
   * - JSON body
   * - FormData
   * - Authorization
   * - Custom headers
   * - RequestInit options
   */
  const post = async (
    url: string,
    body?: unknown,
    options?: RequestInit
  ): Promise<Response> => {
    const isFormData =
      typeof FormData !== "undefined" &&
      body instanceof FormData;

    const headers = setHeaders(
      options?.headers
    );

    /**
     * FormData:
     * Do NOT manually set Content-Type.
     *
     * The browser automatically sets:
     * multipart/form-data; boundary=...
     */
    if (!isFormData) {
      headers.set(
        "Content-Type",
        "application/json"
      );
    }

    const config: RequestInit = {
      ...options,
      method: "POST",
      headers,
      body: isFormData
        ? (body as FormData)
        : body === undefined
        ? undefined
        : JSON.stringify(body),
    };

    return fetch(url, config);
  };

  return {
    post,
  };
};

export default useApi;