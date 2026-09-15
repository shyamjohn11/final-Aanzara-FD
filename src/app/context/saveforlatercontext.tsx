"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { Product } from "@/app/data/products";

export type SaveForLaterItem = {
  product: Product;
  qty: number;
};

type SaveForLaterContextValue = {
  items: SaveForLaterItem[];

  addToSaveForLater: (
    product: Product,
    qty?: number
  ) => void;

  removeFromSaveForLater: (
    id: string
  ) => void;

  moveToCart: (
    id: string
  ) => SaveForLaterItem | null;

  isSavedForLater: (
    id: string
  ) => boolean;

  clearSaveForLater: () => void;

  totalUnits: number;
};

const SaveForLaterContext =
  createContext<
    SaveForLaterContextValue | undefined
  >(undefined);

const STORAGE_KEY =
  "aanzara_save_for_later_v1";

// =========================================================
// VALIDATE PRODUCT
// =========================================================

function isValidProduct(
  value: unknown
): value is Product {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const product =
    value as Record<string, unknown>;

  return (
    typeof product.id === "string" &&
    product.id.trim().length > 0 &&
    typeof product.name === "string"
  );
}

// =========================================================
// VALIDATE SAVE FOR LATER ITEM
// =========================================================

function isValidSaveForLaterItem(
  value: unknown
): value is SaveForLaterItem {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const item =
    value as Record<string, unknown>;

  return (
    isValidProduct(item.product) &&
    typeof item.qty === "number" &&
    Number.isFinite(item.qty) &&
    item.qty > 0
  );
}

// =========================================================
// PROVIDER
// =========================================================

export function SaveForLaterProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [items, setItems] =
    useState<SaveForLaterItem[]>([]);

  const [hydrated, setHydrated] =
    useState(false);

  // =======================================================
  // LOAD FROM LOCAL STORAGE
  // =======================================================

  useEffect(() => {
    if (
      typeof window === "undefined"
    ) {
      return;
    }

    try {
      const raw =
        window.localStorage.getItem(
          STORAGE_KEY
        );

      if (!raw) {
        return;
      }

      const parsed: unknown =
        JSON.parse(raw);

      if (!Array.isArray(parsed)) {
        return;
      }

      const validItems =
        parsed.filter(
          isValidSaveForLaterItem
        );

      setItems(validItems);
    } catch (error) {
      console.error(
        "Unable to load Save for Later items:",
        error
      );

      try {
        window.localStorage.removeItem(
          STORAGE_KEY
        );
      } catch {
        // Ignore storage errors.
      }
    } finally {
      setHydrated(true);
    }
  }, []);

  // =======================================================
  // SAVE TO LOCAL STORAGE
  // =======================================================

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (
      typeof window === "undefined"
    ) {
      return;
    }

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(items)
      );
    } catch (error) {
      console.error(
        "Unable to save Save for Later items:",
        error
      );
    }
  }, [items, hydrated]);

  // =======================================================
  // ADD TO SAVE FOR LATER
  // =======================================================

  const addToSaveForLater = (
    product: Product,
    qty: number = product.moq || 1
  ) => {
    if (
      !product ||
      !product.id
    ) {
      return;
    }

    const safeQty = Number(qty);

    if (
      !Number.isFinite(safeQty) ||
      safeQty <= 0
    ) {
      return;
    }

    setItems((prev) => {
      const existing =
        prev.find(
          (item) =>
            item.product.id ===
            product.id
        );

      // Already saved.
      // Keep the existing saved item.
      if (existing) {
        return prev;
      }

      return [
        ...prev,
        {
          product,
          qty: Math.max(
            1,
            Math.floor(safeQty)
          ),
        },
      ];
    });
  };

  // =======================================================
  // REMOVE FROM SAVE FOR LATER
  // =======================================================

  const removeFromSaveForLater = (
    id: string
  ) => {
    if (!id) {
      return;
    }

    setItems((prev) =>
      prev.filter(
        (item) =>
          item.product.id !== id
      )
    );
  };

  // =======================================================
  // MOVE TO CART
  //
  // IMPORTANT:
  // This does NOT directly modify CartContext.
  // It returns the saved item to the Cart page,
  // which then uses the existing addToCart().
  // =======================================================

  const moveToCart = (
    id: string
  ): SaveForLaterItem | null => {
    if (!id) {
      return null;
    }

    const existing =
      items.find(
        (item) =>
          item.product.id === id
      );

    if (!existing) {
      return null;
    }

    setItems((prev) =>
      prev.filter(
        (item) =>
          item.product.id !== id
      )
    );

    return existing;
  };

  // =======================================================
  // CHECK SAVED STATE
  // =======================================================

  const isSavedForLater = (
    id: string
  ) => {
    return items.some(
      (item) =>
        item.product.id === id
    );
  };

  // =======================================================
  // CLEAR ALL
  // =======================================================

  const clearSaveForLater = () => {
    setItems([]);
  };

  // =======================================================
  // TOTAL UNITS
  // =======================================================

  const totalUnits = items.reduce(
    (sum, item) =>
      sum + item.qty,
    0
  );

  // =======================================================
  // PROVIDER
  // =======================================================

  return (
    <SaveForLaterContext.Provider
      value={{
        items,
        addToSaveForLater,
        removeFromSaveForLater,
        moveToCart,
        isSavedForLater,
        clearSaveForLater,
        totalUnits,
      }}
    >
      {children}
    </SaveForLaterContext.Provider>
  );
}

// =========================================================
// HOOK
// =========================================================

export function useSaveForLater() {
  const context =
    useContext(
      SaveForLaterContext
    );

  if (!context) {
    throw new Error(
      "useSaveForLater must be used within a <SaveForLaterProvider>"
    );
  }

  return context;
}