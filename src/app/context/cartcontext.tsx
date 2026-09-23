// File: app/context/CartContext.tsx
//
// Dual-mode cart:
//  - Guest (no session): persisted to localStorage (`aanzara_cart_v1`).
//  - Logged in: synced to the backend cart (api/v1/cart) with optimistic
//    updates; flat backend rows are re-enriched into the full Product
//    shape using the product snapshot cache. On login any guest lines
//    whose product ids are real backend ids are merged into the backend
//    cart and the guest copy is cleared.
//
// The public interface is unchanged: addToCart/updateQty/removeFromCart/
// clearCart keyed by product.id.

"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { Product } from "@/app/data/products";
import {
  cartApi,
  type CartItemResponse,
} from "@/app/api/services";
import {
  hasSession,
  SESSION_CHANGED_EVENT,
  extractErrorMessage,
} from "@/app/api/api";
import {
  isGuid,
  loadProductSnapshot,
  saveProductSnapshot,
} from "@/app/api/productcache";
import { toast } from "react-toastify";

export type CartLine = {
  product: Product;
  qty: number;
};

type CartContextValue = {
  items: CartLine[];
  addToCart: (product: Product, qty?: number) => void;
  updateQty: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  totalUnits: number;
};

const CartContext = createContext<CartContextValue | undefined>(
  undefined
);

const STORAGE_KEY = "aanzara_cart_v1";

// ==========================================
// VALIDATE PRODUCT
// ==========================================

function isValidProduct(value: unknown): value is Product {
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
// VALIDATE CART LINE
// ==========================================

function isValidCartLine(
  value: unknown
): value is CartLine {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const line = value as Record<string, unknown>;

  return (
    isValidProduct(line.product) &&
    typeof line.qty === "number" &&
    Number.isFinite(line.qty) &&
    line.qty > 0
  );
}

// ==========================================
// LOCAL (GUEST) CART STORAGE
// ==========================================

function readLocalItems(): CartLine[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(
      STORAGE_KEY
    );

    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isValidCartLine);
  } catch (error) {
    console.error("Unable to load cart:", error);

    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors.
    }

    return [];
  }
}

function writeLocalItems(items: CartLine[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(items)
    );
  } catch (error) {
    console.error("Unable to save cart:", error);
  }
}

// ==========================================
// BACKEND ROW → CART LINE
// ==========================================

function lineFromBackend(
  item: CartItemResponse
): CartLine {
  const snapshot = loadProductSnapshot(item.productId);
  const price = item.unitPrice;
  const mrp = item.mrp > price ? item.mrp : price;

  const product: Product = {
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
    inStock: item.inStock,
    dispatch: snapshot?.dispatch ?? "",
    image: snapshot?.image,
    swatch: snapshot?.swatch ?? "#f4f4f5",
    accent: snapshot?.accent ?? "#e4e4e7",
  };

  return { product, qty: item.quantity };
}

// ==========================================
// CART PROVIDER
// ==========================================

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [mode, setMode] = useState<"local" | "remote">(
    "local"
  );
  const [hydrated, setHydrated] = useState(false);

  // productId → cartItemId, populated from backend loads.
  const cartItemIdsRef = useRef<
    Record<string, string>
  >({});

  const applyBackendCart = useCallback(
    (rows: CartItemResponse[]) => {
      cartItemIdsRef.current = Object.fromEntries(
        rows.map((row) => [row.productId, row.cartItemId])
      );

      setItems(rows.map(lineFromBackend));
    },
    []
  );

  // Re-fetch the backend cart (source of truth after mutations).
  const reloadRemote = useCallback(async () => {
    if (!hasSession()) {
      setMode("local");
      cartItemIdsRef.current = {};
      setItems(readLocalItems());
      return;
    }
    try {
      const { data } = await cartApi.get();
      applyBackendCart(data?.items ?? []);
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      const isUnauthorized = status === 401;
      // 401 for guest or expired session is expected — silently fall back to local
      // so the public storefront (/dashboard) doesn't spam console errors.
      if (isUnauthorized) {
        setMode("local");
        cartItemIdsRef.current = {};
        if (!hasSession()) setItems(readLocalItems());
        return;
      }
      console.error("Unable to load cart:", error);
      if (!hasSession()) {
        setMode("local");
        cartItemIdsRef.current = {};
        setItems(readLocalItems());
      }
    }
  }, [applyBackendCart]);

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

        // Merge any guest lines with real backend product ids.
        // Lines the server rejects (unknown/inactive/out-of-stock product)
        // stay local so they are not lost; only synced lines are dropped.
        const allLocal = readLocalItems();
        const guestItems = allLocal.filter(
          (line) => isGuid(line.product.id)
        );
        const unsyncable = allLocal.filter(
          (line) => !isGuid(line.product.id)
        );

        if (guestItems.length > 0) {
          const results = await Promise.allSettled(
            guestItems.map((line) =>
              cartApi.addItem(line.product.id, line.qty)
            )
          );

          if (active) {
            const failed = guestItems.filter(
              (_, index) =>
                results[index]?.status === "rejected"
            );

            writeLocalItems([...unsyncable, ...failed]);

            const firstFailure = results.find(
              (result) => result.status === "rejected"
            );

            if (firstFailure) {
              toast.error(
                extractErrorMessage(
                  (firstFailure as PromiseRejectedResult).reason,
                  "Some cart items could not be synced."
                )
              );
            }
          }
        }

        if (active) await reloadRemote();
      } else {
        setMode("local");
        cartItemIdsRef.current = {};
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
  }, [reloadRemote]);

  // ========================================
  // PERSIST GUEST CART
  // ========================================

  useEffect(() => {
    if (!hydrated || mode !== "local") {
      return;
    }

    writeLocalItems(items);
  }, [items, mode, hydrated]);

  // ========================================
  // ADD TO CART
  // ========================================

  const addToCart = (
    product: Product,
    qty: number = product.moq || 1
  ) => {
    if (!product?.id) {
      console.error(
        "Cannot add product without an ID."
      );
      return;
    }

    const safeQty = Number(qty);

    if (
      !Number.isFinite(safeQty) ||
      safeQty <= 0
    ) {
      return;
    }

    // Remember the display fields so backend rows can be
    // re-enriched on later loads.
    saveProductSnapshot(product);

    // The backend rejects inactive/out-of-stock products with 400, so
    // block them before the optimistic update instead of syncing a
    // phantom line that the server will never accept.
    if (product.inStock === false) {
      toast.error(
        `${product.name} is currently unavailable.`
      );
      return;
    }

    const mergeLine = (
      prev: CartLine[]
    ): CartLine[] => {
      const existing = prev.find(
        (line) => line.product.id === product.id
      );

      if (existing) {
        return prev.map((line) =>
          line.product.id === product.id
            ? { ...line, qty: line.qty + safeQty }
            : line
        );
      }

      return [
        ...prev,
        { product, qty: safeQty },
      ];
    };

    if (mode === "remote" && isGuid(product.id)) {
      setItems(mergeLine);

      cartApi
        .addItem(product.id, safeQty)
        .then(reloadRemote)
        .catch((error) => {
          // Roll back the optimistic line so the cart matches the
          // server, and show the real reason (e.g. insufficient stock)
          // instead of a generic sync warning.
          console.error("Unable to sync cart:", error);
          toast.error(
            extractErrorMessage(
              error,
              "Unable to sync cart. Please try again."
            )
          );
          void reloadRemote();
        });
      return;
    }

    setItems(mergeLine);
  };

  // ========================================
  // UPDATE QUANTITY
  // ========================================

  const updateQty = (id: string, qty: number) => {
    if (!id) return;

    const safeQty = Number(qty);

    if (
      !Number.isFinite(safeQty) ||
      safeQty <= 0
    ) {
      return;
    }

    const clampedQty = Math.max(
      1,
      Math.floor(safeQty)
    );

    const bumpLine = (prev: CartLine[]) =>
      prev.map((line) =>
        line.product.id === id
          ? { ...line, qty: clampedQty }
          : line
      );

    if (mode === "remote" && isGuid(id)) {
      setItems(bumpLine);

      const cartItemId =
        cartItemIdsRef.current[id];

      if (cartItemId) {
        cartApi
          .updateItem(cartItemId, clampedQty)
          .then(reloadRemote)
          .catch((error) => {
            console.error("Unable to sync cart:", error);
            toast.error(
              extractErrorMessage(
                error,
                "Unable to sync cart. Please try again."
              )
            );
            void reloadRemote();
          });
      }
      return;
    }

    setItems(bumpLine);
  };

  // ========================================
  // REMOVE FROM CART
  // ========================================

  const removeFromCart = (id: string) => {
    if (!id) return;

    const dropLine = (prev: CartLine[]) =>
      prev.filter((line) => line.product.id !== id);

    if (mode === "remote" && isGuid(id)) {
      setItems(dropLine);

      const cartItemId =
        cartItemIdsRef.current[id];

      if (cartItemId) {
        cartApi
          .removeItem(cartItemId)
          .then(reloadRemote)
          .catch((error) => {
            console.error("Unable to sync cart:", error);
            toast.error(
              extractErrorMessage(
                error,
                "Unable to sync cart. Please try again."
              )
            );
            void reloadRemote();
          });
      }
      return;
    }

    setItems(dropLine);
  };

  // ========================================
  // CLEAR CART
  // ========================================

  const clearCart = () => {
    setItems([]);

    if (mode === "remote") {
      cartApi
        .clear()
        .then(reloadRemote)
        .catch((error) =>
          console.error("Unable to clear cart:", error)
        );
    }
  };

  // ========================================
  // TOTAL UNITS
  // ========================================

  const totalUnits = items.reduce(
    (sum, line) => sum + line.qty,
    0
  );

  // ========================================
  // PROVIDER
  // ========================================

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQty,
        removeFromCart,
        clearCart,
        totalUnits,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// ==========================================
// USE CART HOOK
// ==========================================

export function useCart() {
  const ctx = useContext(CartContext);

  if (!ctx) {
    throw new Error(
      "useCart must be used within a <CartProvider>"
    );
  }

  return ctx;
}
