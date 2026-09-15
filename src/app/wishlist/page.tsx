"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Heart,
  ShoppingCart,
  Trash2,
  ArrowLeft,
  Star,
  ListPlus,
  Plus,
  X,
  Check,
  CheckSquare,
  Square,
} from "lucide-react";

import TopBar from "@/app/components/Dashboard/TopBar";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import MainNav from "@/app/MainNav";

import { useWishlist } from "@/app/context/wishlistcontext";
import { useCart } from "@/app/context/cartcontext";
import {
  useShoppingLists,
} from "@/app/context/shoppinglistcontext";

export default function WishlistPage() {
  const [navOpen, setNavOpen] = useState(false);

  /* =========================================================
     WISHLIST SELECTION
  ========================================================= */

  const [selectedProducts, setSelectedProducts] =
    useState<Set<string>>(new Set());

  /* =========================================================
     SHOPPING LIST SELECTION
  ========================================================= */

  const [selectedListProducts, setSelectedListProducts] =
    useState<Record<string, Set<string>>>({});

  /* =========================================================
     SHOPPING LIST UI
  ========================================================= */

  const [showCreateList, setShowCreateList] =
    useState(false);

  const [newListName, setNewListName] =
    useState("");

  const [selectedProduct, setSelectedProduct] =
    useState<string | null>(null);

  /* =========================================================
     WISHLIST
  ========================================================= */

  const {
    items,
    removeFromWishlist,
  } = useWishlist();

  /* =========================================================
     CART
  ========================================================= */

  const { addToCart } = useCart();

  /* =========================================================
     SHOPPING LISTS
  ========================================================= */

  const {
    lists: shoppingLists,
    createList,
    deleteList,
    addProductToList,
    removeProductFromList,
    getProductsForList,
  } = useShoppingLists();

  /* =========================================================
     ADD SINGLE WISHLIST PRODUCT TO CART
     
     IMPORTANT:
     Wishlist product is removed after adding to Cart.
  ========================================================= */

  const handleAddToCart = (
    product: (typeof items)[number]
  ) => {
    addToCart(
      product,
      product.moq || 1
    );

    removeFromWishlist(product.id);

    setSelectedProducts((prev) => {
      const next = new Set(prev);
      next.delete(product.id);
      return next;
    });
  };

  /* =========================================================
     REMOVE SINGLE WISHLIST PRODUCT
  ========================================================= */

  const handleRemoveWishlistProduct = (
    productId: string
  ) => {
    removeFromWishlist(productId);

    setSelectedProducts((prev) => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });
  };

  /* =========================================================
     SELECT / DESELECT ONE WISHLIST PRODUCT
  ========================================================= */

  const toggleProductSelection = (
    productId: string
  ) => {
    setSelectedProducts((prev) => {
      const next = new Set(prev);

      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }

      return next;
    });
  };

  /* =========================================================
     SELECT / DESELECT ALL WISHLIST PRODUCTS
  ========================================================= */

  const toggleSelectAll = () => {
    if (
      items.length > 0 &&
      selectedProducts.size === items.length
    ) {
      setSelectedProducts(new Set());
      return;
    }

    setSelectedProducts(
      new Set(
        items.map(
          (product) => product.id
        )
      )
    );
  };

  /* =========================================================
     ADD SELECTED WISHLIST PRODUCTS TO CART
     
     IMPORTANT:
     Wishlist products are removed after adding to Cart.
  ========================================================= */

  const handleAddSelectedToCart = () => {
    const selectedItems =
      items.filter((product) =>
        selectedProducts.has(product.id)
      );

    selectedItems.forEach((product) => {
      addToCart(
        product,
        product.moq || 1
      );

      removeFromWishlist(product.id);
    });

    setSelectedProducts(new Set());
  };

  /* =========================================================
     REMOVE SELECTED WISHLIST PRODUCTS
  ========================================================= */

  const handleRemoveSelected = () => {
    selectedProducts.forEach(
      (productId) => {
        removeFromWishlist(productId);
      }
    );

    setSelectedProducts(new Set());
  };

  /* =========================================================
     SELECT / DESELECT PRODUCT INSIDE SHOPPING LIST
  ========================================================= */

  const toggleListProductSelection = (
    listId: string,
    productId: string
  ) => {
    setSelectedListProducts((prev) => {
      const current = new Set(
        prev[listId] || []
      );

      if (current.has(productId)) {
        current.delete(productId);
      } else {
        current.add(productId);
      }

      return {
        ...prev,
        [listId]: current,
      };
    });
  };

  /* =========================================================
     SELECT / DESELECT ALL PRODUCTS INSIDE SHOPPING LIST
  ========================================================= */

  const toggleListSelectAll = (
    listId: string,
    products: (typeof items)[number][]
  ) => {
    setSelectedListProducts((prev) => {
      const current = new Set(
        prev[listId] || []
      );

      if (
        current.size === products.length &&
        products.length > 0
      ) {
        return {
          ...prev,
          [listId]: new Set(),
        };
      }

      return {
        ...prev,
        [listId]: new Set(
          products.map(
            (product) => product.id
          )
        ),
      };
    });
  };

  /* =========================================================
     ADD SELECTED SHOPPING LIST PRODUCTS TO CART
     
     IMPORTANT:
     Products remain inside Shopping List.
  ========================================================= */

  const handleAddSelectedListProductsToCart = (
    listId: string
  ) => {
    const selectedIds =
      selectedListProducts[listId] ||
      new Set<string>();

    const products =
      getProductsForList(listId);

    products
      .filter((product) =>
        selectedIds.has(product.id)
      )
      .forEach((product) => {
        addToCart(
          product,
          product.moq || 1
        );
      });

    setSelectedListProducts((prev) => ({
      ...prev,
      [listId]: new Set(),
    }));
  };

  /* =========================================================
     REMOVE SELECTED SHOPPING LIST PRODUCTS
  ========================================================= */

  const handleRemoveSelectedListProducts = (
    listId: string
  ) => {
    const selectedIds =
      selectedListProducts[listId] ||
      new Set<string>();

    selectedIds.forEach(
      (productId) => {
        removeProductFromList(
          productId,
          listId
        );
      }
    );

    setSelectedListProducts((prev) => ({
      ...prev,
      [listId]: new Set(),
    }));
  };

  /* =========================================================
     CLEAR SHOPPING LIST SELECTION
  ========================================================= */

  const clearListSelection = (
    listId: string
  ) => {
    setSelectedListProducts((prev) => ({
      ...prev,
      [listId]: new Set(),
    }));
  };

  /* =========================================================
     CREATE SHOPPING LIST
  ========================================================= */

  const handleCreateShoppingList = () => {
    const trimmedName =
      newListName.trim();

    if (!trimmedName) {
      return;
    }

    const newListId =
      createList(trimmedName);

    if (!newListId) {
      return;
    }

    /*
      If the Create List modal was opened
      from a Wishlist product, automatically
      add that product to the new list.
    */

    if (selectedProduct) {
      addProductToList(
        selectedProduct,
        newListId
      );
    }

    setNewListName("");
    setShowCreateList(false);
    setSelectedProduct(null);
  };

  /* =========================================================
     SCROLL TO SHOPPING LISTS
  ========================================================= */

  const scrollToShoppingLists = () => {
    const section =
      document.getElementById(
        "shopping-lists"
      );

    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">

      {/* =====================================================
          TOP BAR
      ===================================================== */}

      <TopBar />

      {/* =====================================================
          HEADER
      ===================================================== */}

      <Header
        onMenuClick={() =>
          setNavOpen(true)
        }
      />

      {/* =====================================================
          MAIN NAVIGATION
      ===================================================== */}

      <MainNav
        open={navOpen}
        onClose={() =>
          setNavOpen(false)
        }
      />

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 py-8">

        {/* ===================================================
            WISHLIST HEADER
        =================================================== */}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-7">

          {/* TITLE */}

          <div>

            <div className="flex items-center gap-2">

              <Heart
                size={22}
                className="fill-red-500 text-red-500"
              />

              <h1 className="font-sora font-bold text-[24px] text-navy">
                My Wishlist
              </h1>

            </div>

            <p className="text-[13px] text-ink-soft mt-1">
              {items.length}{" "}
              {items.length === 1
                ? "product"
                : "products"}{" "}
              saved for later
            </p>

          </div>

          {/* =================================================
              WISHLIST ACTIONS
          ================================================= */}

          <div className="flex flex-wrap items-center gap-2">

            {/* SHOPPING LISTS */}

            <button
              type="button"
              onClick={
                scrollToShoppingLists
              }
              className="flex items-center gap-2 border border-line rounded-lg px-4 py-2.5 text-[12px] font-semibold text-navy hover:bg-gray-50 transition-colors"
            >
              <ListPlus size={15} />
              Shopping Lists
            </button>

            {/* SELECT ALL */}

            {items.length > 0 && (
              <button
                type="button"
                onClick={
                  toggleSelectAll
                }
                className="flex items-center gap-2 border border-line rounded-lg px-4 py-2.5 text-[12px] font-semibold text-navy hover:bg-gray-50 transition-colors"
              >
                {selectedProducts.size ===
                items.length ? (
                  <CheckSquare size={15} />
                ) : (
                  <Square size={15} />
                )}

                {selectedProducts.size ===
                items.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            )}

          </div>

        </div>

        {/* ===================================================
            SELECTED WISHLIST ACTION BAR
        =================================================== */}

        {selectedProducts.size > 0 && (
          <div className="mb-5 bg-white border border-navy/10 rounded-lg px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">

            <div className="flex items-center gap-2">

              <div className="w-8 h-8 rounded-full bg-navy/5 flex items-center justify-center">
                <Check
                  size={15}
                  className="text-navy"
                />
              </div>

              <div>

                <p className="text-[12px] font-bold text-navy">
                  {selectedProducts.size}{" "}
                  {selectedProducts.size ===
                  1
                    ? "product"
                    : "products"}{" "}
                  selected
                </p>

                <p className="text-[10px] text-ink-soft">
                  Choose an action for the selected products.
                </p>

              </div>

            </div>

            <div className="flex flex-wrap gap-2">

              <button
                type="button"
                onClick={
                  handleAddSelectedToCart
                }
                className="flex items-center justify-center gap-2 bg-navy hover:bg-navy-deep text-white text-[11px] font-bold px-4 py-2.5 rounded-lg"
              >
                <ShoppingCart size={14} />
                Add Selected to Cart
              </button>

              <button
                type="button"
                onClick={
                  handleRemoveSelected
                }
                className="flex items-center justify-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 text-[11px] font-bold px-4 py-2.5 rounded-lg"
              >
                <Trash2 size={14} />
                Remove Selected
              </button>

              <button
                type="button"
                onClick={() =>
                  setSelectedProducts(
                    new Set()
                  )
                }
                className="flex items-center justify-center gap-2 border border-line text-ink-soft hover:bg-gray-50 text-[11px] font-semibold px-4 py-2.5 rounded-lg"
              >
                <X size={14} />
                Cancel
              </button>

            </div>

          </div>
        )}

        {/* ===================================================
            WISHLIST PRODUCTS
        =================================================== */}

        {items.length === 0 ? (

          /* =================================================
             EMPTY WISHLIST
          ================================================= */

          <div className="bg-white border border-line rounded-card py-20 px-5 text-center mb-10">

            <div className="mx-auto w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">

              <Heart
                size={28}
                className="text-red-400"
              />

            </div>

            <h2 className="font-sora font-bold text-[18px] text-navy mt-5">
              Your Wishlist is Empty
            </h2>

            <p className="text-[13px] text-ink-soft mt-2 max-w-md mx-auto">
              Save products you like by clicking the heart
              icon. Your saved products will appear here.
            </p>

            <Link
              href="/categories"
              className="inline-flex items-center gap-2 mt-6 bg-navy hover:bg-navy-deep text-white text-[12px] font-bold px-5 py-3 rounded-lg transition-colors"
            >
              <ArrowLeft size={14} />
              Continue Shopping
            </Link>

          </div>

        ) : (

          /* =================================================
             WISHLIST PRODUCT GRID
          ================================================= */

          <div className="grid grid-cols-1 min-[520px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">

            {items.map((product) => (

              <div
                key={product.id}
                className={`bg-white border rounded-card overflow-hidden flex flex-col transition-all ${
                  selectedProducts.has(
                    product.id
                  )
                    ? "border-navy ring-2 ring-navy/10 shadow-pop"
                    : "border-line hover:shadow-pop"
                }`}
              >

                {/* =========================================
                    PRODUCT IMAGE
                ========================================= */}

                <div
                  className="relative h-[160px] flex items-center justify-center"
                  style={{
                    background:
                      `linear-gradient(160deg, ${product.swatch}22, ${product.swatch}0D)`,
                  }}
                >

                  {/* DISCOUNT */}

                  <span className="absolute top-3 left-3 bg-green text-white text-[10px] font-bold px-2 py-1 rounded-md">
                    {product.discount}% OFF
                  </span>

                  {/* SELECT */}

                  <button
                    type="button"
                    onClick={() =>
                      toggleProductSelection(
                        product.id
                      )
                    }
                    aria-label={`Select ${product.name}`}
                    className={`absolute top-3 right-14 w-8 h-8 rounded-full bg-white shadow flex items-center justify-center transition-colors ${
                      selectedProducts.has(
                        product.id
                      )
                        ? "text-navy"
                        : "text-ink-soft hover:text-navy"
                    }`}
                  >
                    {selectedProducts.has(
                      product.id
                    ) ? (
                      <CheckSquare size={17} />
                    ) : (
                      <Square size={17} />
                    )}
                  </button>

                  {/* REMOVE HEART */}

                  <button
                    type="button"
                    onClick={() =>
                      handleRemoveWishlistProduct(
                        product.id
                      )
                    }
                    aria-label={`Remove ${product.name} from wishlist`}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white shadow flex items-center justify-center hover:bg-red-50 transition-colors"
                  >
                    <Heart
                      size={15}
                      className="fill-red-500 text-red-500"
                    />
                  </button>

                  {/* PRODUCT VISUAL */}

                  <div
                    className="w-14 h-20 rounded-md shadow-sm"
                    style={{
                      background:
                        `linear-gradient(160deg, ${product.swatch}, ${product.accent})`,
                    }}
                  />

                </div>

                {/* =========================================
                    PRODUCT DETAILS
                ========================================= */}

                <div className="p-4 flex flex-col flex-1">

                  {/* BRAND + SKU */}

                  <div className="flex items-center justify-between gap-2">

                    <span className="text-[10.5px] font-bold tracking-wide text-ink-soft truncate">
                      {product.brand}
                    </span>

                    {product.sku && (
                      <span className="text-[10px] text-ink-faint truncate">
                        {product.sku}
                      </span>
                    )}

                  </div>

                  {/* PRODUCT NAME */}

                  <h2 className="text-[13px] font-bold text-ink leading-snug mt-1 line-clamp-2 min-h-[36px]">
                    {product.name}
                  </h2>

                  {/* PACK */}

                  <p className="text-[11.5px] text-ink-soft mt-1">
                    {product.pack}
                  </p>

                  {/* RATING */}

                  <div className="flex items-center gap-1 mt-2">

                    <Star
                      size={12}
                      className="fill-amber text-amber"
                    />

                    <span className="text-[11.5px] font-semibold text-ink">
                      {product.rating}
                    </span>

                    <span className="text-[10.5px] text-ink-faint">
                      ({product.reviews})
                    </span>

                  </div>

                  {/* PRICE */}

                  <div className="flex items-baseline gap-2 mt-3">

                    <span className="text-[19px] font-extrabold text-navy">
                      ₹
                      {product.price.toLocaleString(
                        "en-IN"
                      )}
                    </span>

                    <span className="text-[11px] text-ink-faint line-through">
                      ₹
                      {product.mrp.toLocaleString(
                        "en-IN"
                      )}
                    </span>

                  </div>

                  {/* BULK RATE */}

                  <div className="text-[11px] font-semibold text-green-deep mt-1">
                    Bulk Rate: ₹
                    {product.bulkRate.toLocaleString(
                      "en-IN"
                    )}
                  </div>

                  {/* ADD TO SHOPPING LIST */}

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedProduct(
                        product.id
                      )
                    }
                    className="flex items-center justify-center gap-2 mt-3 border border-line text-navy hover:bg-gray-50 text-[10.5px] font-bold rounded-lg py-2.5 transition-colors"
                  >
                    <ListPlus size={13} />
                    Add to Shopping List
                  </button>

                  {/* ACTION BUTTONS */}

                  <div className="flex gap-2 mt-auto pt-4">

                    {/* REMOVE */}

                    <button
                      type="button"
                      onClick={() =>
                        handleRemoveWishlistProduct(
                          product.id
                        )
                      }
                      aria-label={`Remove ${product.name}`}
                      className="w-10 h-10 border border-line rounded-lg flex items-center justify-center text-ink-soft hover:text-red-600 hover:border-red-200 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>

                    {/* ADD TO CART */}

                    <button
                      type="button"
                      onClick={() =>
                        handleAddToCart(
                          product
                        )
                      }
                      className="flex-1 flex items-center justify-center gap-2 bg-navy hover:bg-navy-deep text-white text-[11.5px] font-bold rounded-lg transition-colors"
                    >
                      <ShoppingCart size={14} />
                      ADD TO CART
                    </button>

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

        {/* ===================================================
            SHOPPING LISTS SECTION
        =================================================== */}

        <section
          id="shopping-lists"
          className="mt-10 bg-white border border-line rounded-card p-5"
        >

          {/* SHOPPING LIST HEADER */}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">

            <div>

              <div className="flex items-center gap-2">

                <ListPlus
                  size={19}
                  className="text-navy"
                />

                <h2 className="font-sora font-bold text-[19px] text-navy">
                  My Shopping Lists
                </h2>

              </div>

              <p className="text-[11px] text-ink-soft mt-1">
                Organize your favourite products into separate shopping lists.
              </p>

            </div>

            <button
              type="button"
              onClick={() =>
                setShowCreateList(true)
              }
              className="inline-flex items-center justify-center gap-2 bg-navy hover:bg-navy-deep text-white text-[11px] font-bold px-4 py-2.5 rounded-lg"
            >
              <Plus size={14} />
              Create New List
            </button>

          </div>

          {/* =================================================
              NO SHOPPING LISTS
          ================================================= */}

          {shoppingLists.length === 0 ? (

            <div className="border border-dashed border-line rounded-lg py-10 text-center">

              <ListPlus
                size={28}
                className="mx-auto text-ink-faint"
              />

              <h3 className="text-[13px] font-bold text-navy mt-3">
                No shopping lists yet
              </h3>

              <p className="text-[11px] text-ink-soft mt-1">
                Create a list to organize your products.
              </p>

              <button
                type="button"
                onClick={() =>
                  setShowCreateList(true)
                }
                className="mt-4 inline-flex items-center gap-2 bg-navy text-white text-[11px] font-bold px-4 py-2 rounded-lg"
              >
                <Plus size={13} />
                Create Your First List
              </button>

            </div>

          ) : (

            /* ================================================
               SHOPPING LIST CARDS
            ================================================= */

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {shoppingLists.map((list) => {

                const listProducts =
                  getProductsForList(
                    list.id
                  );

                const selectedIds =
                  selectedListProducts[
                    list.id
                  ] || new Set<string>();

                return (

                  <div
                    key={list.id}
                    className="border border-line rounded-xl p-4 bg-white"
                  >

                    {/* LIST HEADER */}

                    <div className="flex items-start justify-between gap-3">

                      <div className="flex items-center gap-3">

                        <div className="w-9 h-9 rounded-lg bg-navy/5 flex items-center justify-center">
                          <ListPlus
                            size={17}
                            className="text-navy"
                          />
                        </div>

                        <div>

                          <h3 className="text-[13px] font-bold text-navy">
                            {list.name}
                          </h3>

                          <p className="text-[10px] text-ink-soft mt-0.5">
                            {listProducts.length}{" "}
                            {listProducts.length ===
                            1
                              ? "product"
                              : "products"}
                          </p>

                        </div>

                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          deleteList(
                            list.id
                          )
                        }
                        aria-label={`Delete ${list.name}`}
                        className="text-ink-faint hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>

                    </div>

                    {/* LIST SELECTION HEADER */}

                    <div className="flex items-center justify-between mt-4 mb-3">

                      <button
                        type="button"
                        onClick={() =>
                          toggleListSelectAll(
                            list.id,
                            listProducts
                          )
                        }
                        className="flex items-center gap-2 text-[10.5px] font-bold text-navy"
                      >
                        {selectedIds.size ===
                        listProducts.length &&
                        listProducts.length > 0 ? (
                          <CheckSquare
                            size={15}
                          />
                        ) : (
                          <Square size={15} />
                        )}

                        {selectedIds.size ===
                        listProducts.length &&
                        listProducts.length > 0
                          ? "Deselect All"
                          : "Select All"}
                      </button>

                      <span className="text-[10px] text-ink-soft">
                        {selectedIds.size} selected
                      </span>

                    </div>

                    {/* EMPTY LIST */}

                    {listProducts.length ===
                    0 ? (

                      <div className="border border-dashed border-line rounded-lg py-7 text-center">

                        <ListPlus
                          size={24}
                          className="mx-auto text-ink-faint"
                        />

                        <p className="text-[11px] text-ink-soft mt-2">
                          This shopping list is empty.
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            setShowCreateList(
                              true
                            )
                          }
                          className="mt-3 text-[10.5px] font-bold text-navy hover:underline"
                        >
                          Create another list
                        </button>

                      </div>

                    ) : (

                      /* ======================================
                         LIST PRODUCTS
                      ====================================== */

                      <div className="space-y-3">

                        {listProducts.map(
                          (product) => {

                            const isSelected =
                              selectedIds.has(
                                product.id
                              );

                            return (

                              <div
                                key={product.id}
                                className={`relative border rounded-lg overflow-hidden transition-all ${
                                  isSelected
                                    ? "border-navy ring-2 ring-navy/10 shadow-sm"
                                    : "border-line"
                                }`}
                              >

                                {/* PRODUCT */}

                                <div className="flex gap-3 p-3">

                                  {/* PRODUCT VISUAL */}

                                  <div
                                    className="relative w-[90px] h-[100px] shrink-0 flex items-center justify-center rounded-md"
                                    style={{
                                      background:
                                        `linear-gradient(160deg, ${product.swatch}22, ${product.swatch}0D)`,
                                    }}
                                  >

                                    {/* SELECT */}

                                    <button
                                      type="button"
                                      onClick={() =>
                                        toggleListProductSelection(
                                          list.id,
                                          product.id
                                        )
                                      }
                                      aria-label={`Select ${product.name}`}
                                      className="absolute top-2 left-2 w-7 h-7 rounded-full bg-white shadow flex items-center justify-center text-navy"
                                    >
                                      {isSelected ? (
                                        <CheckSquare
                                          size={16}
                                        />
                                      ) : (
                                        <Square
                                          size={16}
                                        />
                                      )}
                                    </button>

                                    <div
                                      className="w-10 h-14 rounded-md shadow-sm"
                                      style={{
                                        background:
                                          `linear-gradient(160deg, ${product.swatch}, ${product.accent})`,
                                      }}
                                    />

                                  </div>

                                  {/* PRODUCT DETAILS */}

                                  <div className="flex-1 min-w-0">

                                    <div className="flex items-center justify-between gap-2">

                                      <span className="text-[9px] font-bold text-ink-soft">
                                        {product.brand}
                                      </span>

                                      {product.sku && (
                                        <span className="text-[8.5px] text-ink-faint truncate">
                                          {product.sku}
                                        </span>
                                      )}

                                    </div>

                                    <h4 className="text-[11.5px] font-bold text-navy leading-snug mt-1 line-clamp-2">
                                      {product.name}
                                    </h4>

                                    <p className="text-[9.5px] text-ink-soft mt-1">
                                      {product.pack}
                                    </p>

                                    <div className="flex items-center gap-1 mt-1.5">

                                      <Star
                                        size={10}
                                        className="fill-amber text-amber"
                                      />

                                      <span className="text-[9.5px] font-semibold">
                                        {product.rating}
                                      </span>

                                      <span className="text-[9px] text-ink-faint">
                                        ({product.reviews})
                                      </span>

                                    </div>

                                    <div className="flex items-baseline gap-2 mt-1.5">

                                      <span className="text-[14px] font-extrabold text-navy">
                                        ₹
                                        {product.price.toLocaleString(
                                          "en-IN"
                                        )}
                                      </span>

                                      <span className="text-[8.5px] text-ink-faint line-through">
                                        ₹
                                        {product.mrp.toLocaleString(
                                          "en-IN"
                                        )}
                                      </span>

                                    </div>

                                    {/* PRODUCT ACTIONS */}

                                    <div className="flex gap-2 mt-2.5">

                                      {/* ADD TO CART */}

                                      <button
                                        type="button"
                                        onClick={() =>
                                          addToCart(
                                            product,
                                            product.moq ||
                                              1
                                          )
                                        }
                                        className="flex-1 flex items-center justify-center gap-1.5 bg-navy hover:bg-navy-deep text-white text-[9px] font-bold rounded-md py-2"
                                      >
                                        <ShoppingCart
                                          size={12}
                                        />
                                        ADD TO CART
                                      </button>

                                      {/* REMOVE */}

                                      <button
                                        type="button"
                                        onClick={() =>
                                          removeProductFromList(
                                            product.id,
                                            list.id
                                          )
                                        }
                                        aria-label="Remove product from shopping list"
                                        className="w-9 border border-line rounded-md flex items-center justify-center text-ink-soft hover:text-red-600 hover:border-red-200"
                                      >
                                        <Trash2
                                          size={13}
                                        />
                                      </button>

                                    </div>

                                  </div>

                                </div>

                              </div>

                            );
                          }
                        )}

                      </div>

                    )}

                    {/* =================================================
                        SELECTED LIST ACTIONS
                    ================================================= */}

                    {selectedIds.size >
                      0 && (
                      <div className="mt-4 border border-navy/10 bg-navy/[0.02] rounded-lg p-3">

                        <div className="flex flex-col gap-3">

                          <div>

                            <p className="text-[11px] font-bold text-navy">
                              {selectedIds.size}{" "}
                              {selectedIds.size ===
                              1
                                ? "product"
                                : "products"}{" "}
                              selected
                            </p>

                            <p className="text-[9.5px] text-ink-soft mt-0.5">
                              Choose what you want to do.
                            </p>

                          </div>

                          <div className="flex flex-wrap gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                handleAddSelectedListProductsToCart(
                                  list.id
                                )
                              }
                              className="flex items-center gap-1.5 bg-navy hover:bg-navy-deep text-white text-[9.5px] font-bold px-3 py-2 rounded-md"
                            >
                              <ShoppingCart
                                size={12}
                              />
                              Add Selected to Cart
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleRemoveSelectedListProducts(
                                  list.id
                                )
                              }
                              className="flex items-center gap-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-[9.5px] font-bold px-3 py-2 rounded-md"
                            >
                              <Trash2
                                size={12}
                              />
                              Remove Selected
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                clearListSelection(
                                  list.id
                                )
                              }
                              className="flex items-center gap-1.5 border border-line text-ink-soft hover:bg-gray-50 text-[9.5px] font-semibold px-3 py-2 rounded-md"
                            >
                              <X size={12} />
                              Cancel
                            </button>

                          </div>

                        </div>

                      </div>
                    )}

                  </div>

                );
              })}

            </div>

          )}

        </section>

      </main>

      {/* =====================================================
          CREATE SHOPPING LIST MODAL
      ===================================================== */}

      {showCreateList && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">

          <div className="w-full max-w-[420px] bg-white rounded-xl shadow-xl p-5">

            <div className="flex items-center justify-between">

              <div>

                <h2 className="font-sora font-bold text-[17px] text-navy">
                  Create Shopping List
                </h2>

                <p className="text-[11px] text-ink-soft mt-1">
                  Give your list a name.
                </p>

              </div>

              <button
                type="button"
                onClick={() => {
                  setShowCreateList(
                    false
                  );
                  setNewListName("");
                  setSelectedProduct(null);
                }}
                className="text-ink-faint hover:text-ink"
                aria-label="Close"
              >
                <X size={18} />
              </button>

            </div>

            <input
              type="text"
              value={newListName}
              onChange={(event) =>
                setNewListName(
                  event.target.value
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key === "Enter"
                ) {
                  handleCreateShoppingList();
                }
              }}
              placeholder="Example: Monthly Grocery"
              className="w-full mt-5 border border-line rounded-lg px-3 py-2.5 text-[12px] outline-none focus:border-navy"
              autoFocus
            />

            <div className="flex justify-end gap-2 mt-4">

              <button
                type="button"
                onClick={() => {
                  setShowCreateList(
                    false
                  );
                  setNewListName("");
                  setSelectedProduct(null);
                }}
                className="border border-line rounded-lg px-4 py-2.5 text-[11px] font-semibold text-ink-soft"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  handleCreateShoppingList
                }
                disabled={
                  !newListName.trim()
                }
                className="bg-navy hover:bg-navy-deep disabled:opacity-40 text-white rounded-lg px-4 py-2.5 text-[11px] font-bold"
              >
                Create List
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =====================================================
          ADD TO SHOPPING LIST MODAL
      ===================================================== */}

      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">

          <div className="w-full max-w-[440px] bg-white rounded-xl shadow-xl p-5">

            <div className="flex items-center justify-between">

              <div>

                <h2 className="font-sora font-bold text-[17px] text-navy">
                  Add to Shopping List
                </h2>

                <p className="text-[11px] text-ink-soft mt-1">
                  Select a list for this product.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedProduct(
                    null
                  )
                }
                className="text-ink-faint hover:text-ink"
                aria-label="Close"
              >
                <X size={18} />
              </button>

            </div>

            {shoppingLists.length ===
            0 ? (

              <div className="py-8 text-center">

                <ListPlus
                  size={27}
                  className="mx-auto text-ink-faint"
                />

                <p className="text-[12px] font-semibold text-navy mt-3">
                  You don't have any shopping lists.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setShowCreateList(
                      true
                    );
                  }}
                  className="mt-4 inline-flex items-center gap-2 bg-navy text-white text-[11px] font-bold px-4 py-2.5 rounded-lg"
                >
                  <Plus size={13} />
                  Create New List
                </button>

              </div>

            ) : (

              <div className="mt-5 space-y-2">

                {shoppingLists.map(
                  (list) => {

                    const alreadyAdded =
                      getProductsForList(list.id).some(
                        (product) =>
                          product.id === selectedProduct
                      );

                    return (
                    <button
                      key={list.id}
                      type="button"
                      onClick={() => {
                        if (alreadyAdded) {
                          removeProductFromList(
                            selectedProduct,
                            list.id
                          );
                        } else {
                          addProductToList(
                            selectedProduct,
                            list.id
                          );
                        }
                      }}
                      className={`w-full flex items-center justify-between gap-3 border rounded-lg px-3 py-3 text-left transition-colors ${
                        alreadyAdded
                        ? "border-green/20 bg-green/5 hover:bg-red-50"
                        : "border-line hover:bg-gray-50"
                      }`} 
                      >

                        <div className="flex items-center gap-3">

                          <div className="w-8 h-8 rounded-md bg-navy/5 flex items-center justify-center">

                            <ListPlus
                              size={14}
                              className="text-navy"
                            />

                          </div>

                          <div>

                            <p className="text-[11.5px] font-bold text-navy">
                              {list.name}
                            </p>

                            <p className="text-[9.5px] text-ink-soft">
                              {getProductsForList(list.id).length}{" "}
                              {getProductsForList(list.id).length === 1
                                ? "product"
                                : "products"}
                            </p>

                          </div>

                        </div>

                      {alreadyAdded ? (
                        <span className="flex items-center gap-1 text-[9.5px] font-bold text-green-deep">
                          <Check size={13} />
                          Added
                        </span>
                        ) : (
                        <Plus
                          size={15}
                          className="text-ink-faint"
                        />
                      )}

                      </button>

                    );
                  }
                )}

                {/* CREATE NEW LIST */}
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateList(true);
                  }}
                  className="w-full mt-3 flex items-center justify-center gap-2 border border-dashed border-line rounded-lg py-2.5 text-[10.5px] font-bold text-navy hover:bg-gray-50"
                >
                  <Plus size={13} />
                  Create New List
                </button>

              </div>

            )}

          </div>

        </div>
      )}

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <Footer />

    </div>
  );
}