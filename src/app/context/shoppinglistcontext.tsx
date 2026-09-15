"use client";

import {
  createContext,
  useContext,
  useEffect,
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
    listId: string
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
    listId: string
  ) => {
    setLists((prev) =>
      prev.map((list) => {
        if (list.id !== listId) {
          return list;
        }

        if (
          list.productIds.includes(
            productId
          )
        ) {
          return list;
        }

        return {
          ...list,
          productIds: [
            ...list.productIds,
            productId,
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
    setLists((prev) =>
      prev.map((list) => {
        if (list.id !== listId) {
          return list;
        }

        return {
          ...list,
          productIds:
            list.productIds.filter(
              (id) => id !== productId
            ),
        };
      })
    );
  };

  /* ==========================================
     GET ACTUAL PRODUCTS FOR A SHOPPING LIST
  ========================================== */

  const getProductsForList = (
    listId: string
  ): Product[] => {
    const list = lists.find(
      (item) => item.id === listId
    );

    if (!list) {
      return [];
    }

    return list.productIds
      .map((productId) =>
        ALL_SHOPPING_PRODUCTS.find(
          (product) =>
            product.id === productId
        )
      )
      .filter(
        (
          product
        ): product is Product =>
          Boolean(product)
      );
  };

  return (
    <ShoppingListContext.Provider
      value={{
        lists,
        createList,
        deleteList,
        addProductToList,
        removeProductFromList,
        getProductsForList,
      }}
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