"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  PRODUCTS,
  type Product,
} from "@/app/data/products";

import {
  NEW_ARRIVAL_PRODUCTS,
}from "@/app/data/newArrivals";
import{
  BEST_DEALS_PRODUCTS,
  TODAY_DEALS,
  offerProductToCartProduct,
  todayDealToCartProduct,
}from "@/app/data/offers";

import { productsApi, productImagesApi } from "@/app/api/services";
import { mapProductSummary } from "@/app/api/productmap";
import {
  isGuid,
  loadProductSnapshot,
  saveProductSnapshot,
} from "@/app/api/productcache";

export type ShoppingList = {
  id: string;
  name: string;
  productIds: string[];
};

type ShoppingListContextType = {
  lists: ShoppingList[];

  createList: (name: string) => string;

  deleteList: (listId: string) => void;

  addProductToList: (
    productId: string,
    listId: string,
    product?: Product
  ) => void;

  removeProductFromList: (
    productId: string,
    listId: string
  ) => void;

  getProductsForList: (
    listId: string
  ) => Product[];
};

const ShoppingListContext =
  createContext<ShoppingListContextType | undefined>(
    undefined
  );

const STORAGE_KEY =
  "aanzara_shopping_lists_v1";
const ALL_SHOPPING_PRODUCTS: Product[] = [
  ...PRODUCTS,
  ...NEW_ARRIVAL_PRODUCTS,
  ...BEST_DEALS_PRODUCTS.map(
    offerProductToCartProduct
  ),
  ...TODAY_DEALS.map(
    todayDealToCartProduct
  ),
];

function extractImageUrls(payload: unknown): string[] {
  const arr = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as Record<string, unknown>)?.items)
      ? ((payload as Record<string, unknown>).items as unknown[])
      : Array.isArray((payload as Record<string, unknown>)?.data)
        ? ((payload as Record<string, unknown>).data as unknown[])
        : [];

  const urls: string[] = [];

  for (const entry of arr) {
    if (typeof entry === "string" && entry.trim()) {
      urls.push(entry.trim());
      continue;
    }
    if (entry && typeof entry === "object") {
      const raw = entry as Record<string, unknown>;
      const isPrimary = raw.isPrimary === true;
      const url =
        typeof raw.imageUrl === "string" && raw.imageUrl.trim()
          ? raw.imageUrl.trim()
          : typeof raw.url === "string" && raw.url.trim()
            ? raw.url.trim()
            : "";
      if (url) {
        if (isPrimary) urls.unshift(url);
        else urls.push(url);
      }
    }
  }

  return urls;
}

function placeholderProduct(productId: string): Product {
  return {
    id: productId,
    brand: "",
    sku: productId.slice(0, 8),
    name: `Product ${productId.slice(0, 8)}`,
    pack: "",
    rating: 0,
    reviews: 0,
    discount: 0,
    mrp: 0,
    price: 0,
    bulkRate: 0,
    bulkMoq: 1,
    moq: 1,
    inStock: true,
    dispatch: "",
    swatch: "#E5E7EB",
    accent: "#CBD5E1",
  };
}

function productFromSnapshot(
  productId: string
): Product | null {
  const snapshot = loadProductSnapshot(productId);
  if (!snapshot?.name) return null;
  return { id: productId, ...snapshot };
}

async function fetchLiveProduct(
  productId: string
): Promise<Product | null> {
  if (!isGuid(productId)) return null;

  try {
    const response = await productsApi.details(productId);
    const mapped = mapProductSummary(
      (response as { data?: unknown })?.data ?? response
    );
    if (!mapped) return null;

    try {
      const imagesResponse = await productImagesApi.list(productId);
      const urls = extractImageUrls(
        (imagesResponse as { data?: unknown })?.data ?? imagesResponse
      );
      if (urls.length > 0) {
        mapped.image = urls[0];
      }
    } catch {
      // Image list is optional — keep product without image.
    }

    saveProductSnapshot(mapped);
    return mapped;
  } catch {
    return null;
  }
}

export function ShoppingListProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [lists, setLists] = useState<
    ShoppingList[]
  >([]);

  const [loaded, setLoaded] =
    useState(false);

  // Live/snapshot products keyed by productId so the UI can re-render
  // once async hydration finishes (static demo IDs resolve instantly).
  const [resolved, setResolved] = useState<
    Record<string, Product>
  >({});

  const hydratingRef = useRef<Set<string>>(
    new Set()
  );

  /* ==========================================
     LOAD SHOPPING LISTS FROM LOCAL STORAGE
  ========================================== */

  useEffect(() => {
    try {
      const savedLists =
        localStorage.getItem(STORAGE_KEY);

      if (savedLists) {
        const parsedLists =
          JSON.parse(savedLists);

        if (Array.isArray(parsedLists)) {
          setLists(parsedLists);
        }
      }
    } catch (error) {
      console.error(
        "Failed to load shopping lists:",
        error
      );
    } finally {
      setLoaded(true);
    }
  }, []);

  /* ==========================================
     SAVE SHOPPING LISTS TO LOCAL STORAGE
  ========================================== */

  useEffect(() => {
    if (!loaded) {
      return;
    }

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(lists)
      );
    } catch (error) {
      console.error(
        "Failed to save shopping lists:",
        error
      );
    }
  }, [lists, loaded]);

  /* ==========================================
     HYDRATE PRODUCTS (snapshot → API)
  ========================================== */

  const hydrateProduct = useCallback(
    async (productId: string) => {
      const id = String(productId || "").trim();
      if (!id) return;

      if (
        ALL_SHOPPING_PRODUCTS.some(
          (product) => product.id === id
        )
      ) {
        return;
      }

      const snapshot = productFromSnapshot(id);
      if (snapshot) {
        setResolved((prev) =>
          prev[id] ? prev : { ...prev, [id]: snapshot }
        );
        // Still refresh from API when possible so price/image stay current.
      }

      if (hydratingRef.current.has(id)) return;
      hydratingRef.current.add(id);

      try {
        const live = await fetchLiveProduct(id);
        if (live) {
          setResolved((prev) => ({
            ...prev,
            [id]: live,
          }));
        } else if (snapshot) {
          setResolved((prev) => ({
            ...prev,
            [id]: snapshot,
          }));
        }
      } finally {
        hydratingRef.current.delete(id);
      }
    },
    []
  );

  useEffect(() => {
    if (!loaded) return;

    const ids = new Set<string>();
    for (const list of lists) {
      for (const productId of list.productIds ?? []) {
        const id = String(productId || "").trim();
        if (id) ids.add(id);
      }
    }

    for (const id of ids) {
      void hydrateProduct(id);
    }
  }, [lists, loaded, hydrateProduct]);

  /* ==========================================
     CREATE SHOPPING LIST
  ========================================== */

  const createList = (
    name: string
  ): string => {
    const trimmedName =
      name.trim();

    if (!trimmedName) {
      return "";
    }

    const newList: ShoppingList = {
      id: `shopping-list-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`,
      name: trimmedName,
      productIds: [],
    };

    setLists((prev) => [
      ...prev,
      newList,
    ]);

    return newList.id;
  };

  /* ==========================================
     DELETE SHOPPING LIST
  ========================================== */

  const deleteList = (
    listId: string
  ) => {
    setLists((prev) =>
      prev.filter(
        (list) => list.id !== listId
      )
    );
  };

  /* ==========================================
     ADD PRODUCT TO SHOPPING LIST
  ========================================== */

  const addProductToList = (
    productId: string,
    listId: string,
    product?: Product
  ) => {
    const id = String(productId || "").trim();
    if (!id) return;

    if (product?.id) {
      saveProductSnapshot(product);
      setResolved((prev) => ({
        ...prev,
        [id]: product,
      }));
    } else {
      void hydrateProduct(id);
    }

    setLists((prev) =>
      prev.map((list) => {
        if (list.id !== listId) {
          return list;
        }

        if (
          list.productIds.includes(id)
        ) {
          return list;
        }

        return {
          ...list,
          productIds: [
            ...list.productIds,
            id,
          ],
        };
      })
    );
  };

  /* ==========================================
     REMOVE PRODUCT FROM SHOPPING LIST
  ========================================== */

  const removeProductFromList = (
    productId: string,
    listId: string
  ) => {
    const id = String(productId || "").trim();

    setLists((prev) =>
      prev.map((list) => {
        if (list.id !== listId) {
          return list;
        }

        return {
          ...list,
          productIds:
            list.productIds.filter(
              (listProductId) =>
                String(listProductId).trim() !== id
            ),
        };
      })
    );
  };

  /* ==========================================
     GET ACTUAL PRODUCTS FOR A SHOPPING LIST
  ========================================== */

  const getProductsForList = (listId: string): Product[] => {
    const list = lists.find((item) => item.id === listId);
    if (!list) return [];

    return (list.productIds ?? []).map((rawId) => {
      const productId = String(rawId || "").trim();
      if (!productId) return placeholderProduct("unknown");

      const staticMatch = ALL_SHOPPING_PRODUCTS.find(
        (product) => product.id === productId
      );
      if (staticMatch) return staticMatch;

      const fromResolved = resolved[productId];
      if (fromResolved) return fromResolved;

      const fromSnapshot = productFromSnapshot(productId);
      if (fromSnapshot) return fromSnapshot;

      return placeholderProduct(productId);
    });
  };

  const value = useMemo(
    () => ({
      lists,
      createList,
      deleteList,
      addProductToList,
      removeProductFromList,
      getProductsForList,
    }),
    // resolved is intentionally included so consumers re-render after hydration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lists, resolved]
  );

  return (
    <ShoppingListContext.Provider
      value={value}
    >
      {children}
    </ShoppingListContext.Provider>
  );
}

/* ==========================================
   SHOPPING LIST HOOK
========================================== */

export function useShoppingLists() {
  const context = useContext(
    ShoppingListContext
  );

  if (!context) {
    throw new Error(
      "useShoppingLists must be used inside ShoppingListProvider"
    );
  }

  return context;
}
