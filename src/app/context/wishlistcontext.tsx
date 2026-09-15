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
    inStock: item.status !== "OutOfStock",
    dispatch: snapshot?.dispatch ?? "",
    image: snapshot?.image,
    swatch: snapshot?.swatch ?? "#f4f4f5",
    accent: snapshot?.accent ?? "#e4e4e7",
  };
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
            writeLocalItems([]);
          }
        }

        if (active) {
          try {
            const { data } = await wishlistApi.get();
            if (active) {
              setItems(
                (data ?? []).map(productFromBackend)
              );
            }
          } catch (error) {
            console.error(
              "Unable to load wishlist:",
              error
            );
            // Session may have been cleared by the 401 interceptor
            // (silent refresh failure). Fall back to the guest list
            // so wishlist keeps working instead of showing empty.
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
  }, []);

  // ========================================
  // PERSIST GUEST WISHLIST
  // ========================================

  useEffect(() => {
    if (!hydrated || mode !== "local") {
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

      request.catch((error) => {
        console.error(
          "Unable to sync wishlist:",
          error
        );
        // Keep the optimistic change so the UI stays responsive;
        // it will reconcile on the next successful load.
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
      setItems(drop);

      wishlistApi
        .remove(id)
        .catch((error) => {
          console.error(
            "Unable to sync wishlist:",
            error
          );
          // Keep the optimistic removal; reconcile on next load.
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
