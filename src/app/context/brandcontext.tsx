"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Brand = {
  id: string;
  name: string;
  category: string;
  logo: string;
};

type BrandContextType = {
  brands: Brand[];
  addBrand: (brand: Brand) => void;
  deleteBrand: (id: string) => void;
  updateBrand: (id: string, brand: Brand) => void;
};

const BrandContext = createContext<BrandContextType | undefined>(
  undefined
);

const STORAGE_KEY = "aanzara-brands";

export function BrandProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loaded, setLoaded] = useState(false);

  // ==========================================
  // LOAD BRANDS FROM LOCAL STORAGE
  // ==========================================

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (!saved) {
        setLoaded(true);
        return;
      }

      const parsed: unknown = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        const validBrands = parsed.filter(isValidBrand);

        setBrands(validBrands);
      }
    } catch (error) {
      console.error(
        "Error loading brands:",
        error
      );
    } finally {
      setLoaded(true);
    }
  }, []);

  // ==========================================
  // SAVE BRANDS TO LOCAL STORAGE
  // ==========================================

  useEffect(() => {
    if (!loaded) return;

    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(brands)
      );
    } catch (error) {
      console.error(
        "Error saving brands:",
        error
      );
    }
  }, [brands, loaded]);

  // ==========================================
  // ADD BRAND
  // ==========================================

  const addBrand = (brand: Brand) => {
    const cleanBrand: Brand = {
      id: brand.id.trim(),
      name: brand.name.trim(),
      category: brand.category.trim(),
      logo: brand.logo.trim(),
    };

    if (!cleanBrand.name) {
      alert("Brand name is required.");
      return;
    }

    if (!cleanBrand.category) {
      alert("Brand category is required.");
      return;
    }

    setBrands((current) => {
      const exists = current.some(
        (item) =>
          item.name.trim().toLowerCase() ===
          cleanBrand.name.toLowerCase()
      );

      if (exists) {
        alert("This brand already exists.");
        return current;
      }

      return [...current, cleanBrand];
    });
  };

  // ==========================================
  // DELETE BRAND
  // ==========================================

  const deleteBrand = (id: string) => {
    if (!id) return;

    setBrands((current) =>
      current.filter(
        (brand) => brand.id !== id
      )
    );
  };

  // ==========================================
  // UPDATE BRAND
  // ==========================================

  const updateBrand = (
    id: string,
    updatedBrand: Brand
  ) => {
    if (!id) return;

    const cleanBrand: Brand = {
      id: updatedBrand.id.trim() || id,
      name: updatedBrand.name.trim(),
      category: updatedBrand.category.trim(),
      logo: updatedBrand.logo.trim(),
    };

    if (!cleanBrand.name) {
      alert("Brand name is required.");
      return;
    }

    if (!cleanBrand.category) {
      alert("Brand category is required.");
      return;
    }

    setBrands((current) => {
      const duplicate = current.some(
        (brand) =>
          brand.id !== id &&
          brand.name.trim().toLowerCase() ===
            cleanBrand.name.toLowerCase()
      );

      if (duplicate) {
        alert("Another brand with this name already exists.");
        return current;
      }

      return current.map((brand) =>
        brand.id === id
          ? {
              ...cleanBrand,
              id,
            }
          : brand
      );
    });
  };

  // ==========================================
  // PROVIDER
  // ==========================================

  return (
    <BrandContext.Provider
      value={{
        brands,
        addBrand,
        deleteBrand,
        updateBrand,
      }}
    >
      {children}
    </BrandContext.Provider>
  );
}

// ==========================================
// VALIDATE BRAND DATA
// ==========================================

function isValidBrand(
  value: unknown
): value is Brand {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const brand = value as Record<
    string,
    unknown
  >;

  return (
    typeof brand.id === "string" &&
    typeof brand.name === "string" &&
    typeof brand.category === "string" &&
    typeof brand.logo === "string"
  );
}

// ==========================================
// USE BRANDS HOOK
// ==========================================

export function useBrands() {
  const context = useContext(BrandContext);

  if (!context) {
    throw new Error(
      "useBrands must be used inside BrandProvider"
    );
  }

  return context;
}