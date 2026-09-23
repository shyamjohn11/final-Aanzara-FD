// File: app/context/WishlistContext.tsx
//
// Dual-mode wishlist:
//  - Guest (no session): persisted to localStorage (`aanzara_wishlist_v1`).
//  - Logged in: synced to the backend wishlist (api/v1/wishlist) with
//    optimistic updates; flat backend rows are re-enriched into the full
//    Product shape using the product snapshot cache. On login, guest
//    entries with real backend product ids are pushed to the backend.
//
// The public interface is unchanged: items/isInWishlist/toggleWishlist/
// removeFromWishlist/clearWishlist keyed by product.id.

"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { Product } from "@/app/data/products";
import {
  wishlistApi,
  type WishlistItemResponse,
} from "@/app/api/services";
import {
  hasSession,
  SESSION_CHANGED_EVENT,
} from "@/app/api/api";
import {
  isGuid,
  loadProductSnapshot,
  saveProductSnapshot,
} from "@/app/api/productcache";

// ==========================================
// TYPES
// ==========================================

type WishlistContextValue = {
  items: Product[];
  isInWishlist: (id: string) => boolean;
  toggleWishlist: (product: Product) => void;
  removeFromWishlist: (id: string) => void;
  clearWishlist: () => void;
  totalItems: number;
};

const WishlistContext = createContext<
  WishlistContextValue | undefined
>(undefined);

const STORAGE_KEY = "aanzara_wishlist_v1";

// ==========================================
// PRODUCT VALIDATION
// ==========================================

function isValidProduct(
  value: unknown
): value is Product {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const product = value as Record<string, unknown>;

  return (
    typeof product.id === "string" &&
    typeof product.name === "string"
  );
}

// ==========================================
// LOCAL (GUEST) WISHLIST STORAGE
// ==========================================

function readLocalItems(): Product[] {
  if (typeof window === "undefined") return [];

  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY);

    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    const validProducts = parsed.filter(
      isValidProduct
    );

    // Remove duplicate products by ID.
    return validProducts.filter(
      (product, index, array) =>
        array.findIndex(
          (item) => item.id === product.id
        ) === index
    );
  } catch (error) {
    console.error(
      "Unable to load wishlist:",
      error
    );

    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors.
    }

    return [];
  }
}

function writeLocalItems(items: Product[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(items)
    );
  } catch (error) {
    console.error(
      "Unable to save wishlist:",
      error
    );
  }
}

// ==========================================
// BACKEND ROW → PRODUCT
// ==========================================

function productFromBackend(
  item: WishlistItemResponse
): Product {
  const snapshot = loadProductSnapshot(item.productId);
  const price = item.price;
  const mrp = item.mrp > price ? item.mrp : price;

  return {
    id: item.productId,
    brand: snapshot?.brand ?? "",
    sku: item.sku,
    name: item.productName,
    pack: snapshot?.pack ?? "",
    rating: snapshot?.rating ?? 0,
    reviews: snapshot?.reviews ?? 0,
    discount:
      mrp > price
        ? Math.round(((mrp - price) / mrp) * 100)
        : (snapshot?.discount ?? 0),
    mrp,
    price,
    bulkRate: snapshot?.bulkRate ?? price,
    bulkMoq: snapshot?.bulkMoq ?? 1,
    moq: snapshot?.moq ?? 1,
    // Backend sends Product.Status ("Active"/"Inactive", casing can vary from
    // older imports) — there is no "OutOfStock" value, so compare against
    // Active case-insensitively.
    inStock: (item.status ?? "").trim().toLowerCase() === "active",
    dispatch: snapshot?.dispatch ?? "",
    image: snapshot?.image,
    swatch: snapshot?.swatch ?? "#f4f4f5",
    accent: snapshot?.accent ?? "#e4e4e7",
  };
}

// HTTP status of a sync failure, if the server answered at all.
function rejectionStatus(error: unknown): number | null {
  const status = (error as { response?: { status?: unknown } })?.response
    ?.status;
  return typeof status === "number" ? status : null;
}

// 4xx means the server authoritatively refused (inactive product,
// duplicate, unknown id): the optimistic change must be reverted.
// Network-level failures keep the optimistic state for later reconcile.
function isAuthoritativeRejection(error: unknown): boolean {
  const status = rejectionStatus(error);
  return status !== null && status >= 400 && status < 500;
}

// ==========================================
// WISHLIST PROVIDER
// ==========================================

export function WishlistProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [items, setItems] = useState<Product[]>([]);
  const [mode, setMode] = useState<"local" | "remote">(
    "local"
  );
  const [hydrated, setHydrated] = useState(false);

  // ========================================
  // REMOTE LOAD (backend rows + local-only mock products)
  // ========================================

  const loadRemote = async () => {
    if (!hasSession()) {
      setItems(readLocalItems());
      setMode("local");
      return;
    }
    try {
      const { data } = await wishlistApi.get();
      const localOnly = readLocalItems().filter(
        (product) => !isGuid(product.id)
      );
      const seen = new Set(
        (data ?? []).map((item) => item.productId)
      );
      const merged = [
        ...(data ?? []).map(productFromBackend),
        ...localOnly.filter((product) => !seen.has(product.id)),
      ];
      setItems(merged);
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        setMode("local");
        setItems(readLocalItems());
        return;
      }
      throw error;
    }
  };

  // ========================================
  // SESSION SYNC (login/logout + cross-tab)
  // ========================================

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let active = true;

    const sync = async () => {
      if (hasSession()) {
        setMode("remote");

        // Push guest entries with real backend product ids.
        const guestItems = readLocalItems().filter(
          (product) => isGuid(product.id)
        );

        if (guestItems.length > 0) {
          const results = await Promise.allSettled(
            guestItems.map((product) =>
              wishlistApi.add(product.id)
            )
          );

          if (
            active &&
            results.every(
              (result) => result.status === "fulfilled"
            )
          ) {
            // Drop only the synced GUID rows; local-only mock
            // products stay in storage.
            writeLocalItems(
              readLocalItems().filter(
                (product) => !isGuid(product.id)
              )
            );
          }
        }

        if (active) {
          try {
            await loadRemote();
          } catch (error) {
            const status = (error as { response?: { status?: number } })?.response?.status;
            if (status === 401) {
              if (active) {
                setMode("local");
                setItems(readLocalItems());
              }
              return;
            }
            console.error(
              "Unable to load wishlist:",
              error
            );
            if (active && !hasSession()) {
              setMode("local");
              setItems(readLocalItems());
            }
          }
        }
      } else {
        setMode("local");
        if (active) setItems(readLocalItems());
      }

      if (active) setHydrated(true);
    };

    void sync();

    window.addEventListener(
      SESSION_CHANGED_EVENT,
      sync
    );
    window.addEventListener("storage", sync);

    return () => {
      active = false;
      window.removeEventListener(
        SESSION_CHANGED_EVENT,
        sync
      );
      window.removeEventListener("storage", sync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ========================================
  // PERSIST GUEST WISHLIST
  // ========================================

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (mode !== "local") {
      // Remote mode: the backend owns GUID rows; only local-only
      // mock products are persisted (otherwise they vanish on reload).
      writeLocalItems(items.filter((item) => !isGuid(item.id)));
      return;
    }

    writeLocalItems(items);
  }, [items, mode, hydrated]);

  // ========================================
  // CHECK WISHLIST
  // ========================================

  const isInWishlist = (id: string) => {
    if (!id) {
      return false;
    }

    return items.some(
      (product) => product.id === id
    );
  };

  // ========================================
  // TOGGLE WISHLIST
  // ========================================

  const toggleWishlist = (product: Product) => {
    if (!isValidProduct(product)) {
      console.error(
        "Cannot add invalid product to wishlist."
      );
      return;
    }

    const exists = items.some(
      (item) => item.id === product.id
    );

    // Remember the display fields so backend rows can be
    // re-enriched on later loads.
    if (!exists) {
      saveProductSnapshot(product);
    }

    const flip = (prev: Product[]) =>
      exists
        ? prev.filter((item) => item.id !== product.id)
        : [...prev, product];

    if (mode === "remote" && isGuid(product.id)) {
      setItems(flip);

      const request = exists
        ? wishlistApi.remove(product.id)
        : wishlistApi.add(product.id);

      request.catch(async (error) => {
        console.error(
          "Unable to sync wishlist:",
          error
        );
        if (!isAuthoritativeRejection(error)) {
          // Network-level failure: keep the optimistic change so the
          // UI stays responsive; it reconciles on the next load.
          return;
        }
        // The server refused (inactive product, duplicate, unknown id):
        // revert so the UI never shows phantom items.
        try {
          await loadRemote();
        } catch {
          // Best-effort inverse of the optimistic flip.
          setItems((prev) =>
            exists
              ? prev.some((item) => item.id === product.id)
                ? prev
                : [...prev, product]
              : prev.filter((item) => item.id !== product.id)
          );
        }
      });
      return;
    }

    setItems(flip);
  };

  // ========================================
  // REMOVE FROM WISHLIST
  // ========================================

  const removeFromWishlist = (id: string) => {
    if (!id) return;

    const drop = (prev: Product[]) =>
      prev.filter((product) => product.id !== id);

    if (mode === "remote" && isGuid(id)) {
      const doomed = items.find((product) => product.id === id) ?? null;
      setItems(drop);

      wishlistApi
        .remove(id)
        .catch(async (error) => {
          console.error(
            "Unable to sync wishlist:",
            error
          );
          if (!isAuthoritativeRejection(error)) {
            // Network-level failure: keep the optimistic removal;
            // it reconciles on the next load.
            return;
          }
          try {
            await loadRemote();
          } catch {
            if (doomed) {
              setItems((prev) =>
                prev.some((product) => product.id === id)
                  ? prev
                  : [...prev, doomed]
              );
            }
          }
        });
      return;
    }

    setItems(drop);
  };

  // ========================================
  // CLEAR WISHLIST
  // ========================================

  const clearWishlist = () => {
    const previous = items;

    setItems([]);

    if (mode === "remote") {
      Promise.allSettled(
        previous
          .filter((product) => isGuid(product.id))
          .map((product) =>
            wishlistApi.remove(product.id)
          )
      ).then((results) => {
        if (
          results.some(
            (result) => result.status === "rejected"
          )
        ) {
          console.error(
            "Unable to clear wishlist completely"
          );
          // Keep the cleared state; reconcile on next load.
        }
      });
    }
  };

  // ========================================
  // PROVIDER
  // ========================================

  return (
    <WishlistContext.Provider
      value={{
        items,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
        clearWishlist,
        totalItems: items.length,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

// ==========================================
// USE WISHLIST HOOK
// ==========================================

export function useWishlist() {
  const context = useContext(
    WishlistContext
  );

  if (!context) {
    throw new Error(
      "useWishlist must be used within a <WishlistProvider>"
    );
  }

  return context;
}
