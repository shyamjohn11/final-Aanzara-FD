"use client";

import { useState } from "react";
import {
  ListPlus,
  Plus,
  X,
  Check,
} from "lucide-react";

import {
  useShoppingLists,
} from "@/app/context/shoppinglistcontext";

interface ShoppingListSavePopupProps {
  productId: string;
  productName?: string;
  onClose: () => void;
}

export default function ShoppingListSavePopup({
  productId,
  productName,
  onClose,
}: ShoppingListSavePopupProps) {
  const {
    lists: shoppingLists,
    addProductToList,
    removeProductFromList,
    createList,
    getProductsForList,
  } = useShoppingLists();

  const [showCreateList, setShowCreateList] =
    useState(false);

  const [newListName, setNewListName] =
    useState("");

  const [isCreating, setIsCreating] =
    useState(false);

  /*
   * Always compare IDs as strings.
   * This prevents problems when one product source
   * uses a number ID and another uses a string ID.
   */
  const normalizedProductId =
    String(productId).trim();

  /*
   * =========================================================
   * CHECK WHETHER PRODUCT EXISTS IN A LIST
   * =========================================================
   */

  const isProductInList = (
    listId: string
  ): boolean => {
    const products =
      getProductsForList(listId);

    if (!Array.isArray(products)) {
      return false;
    }

    return products.some(
      (product) =>
        String(product.id).trim() ===
        normalizedProductId
    );
  };

  /*
   * =========================================================
   * TOGGLE PRODUCT IN EXISTING LIST
   *
   * If product exists:
   *     Remove it
   *
   * If product doesn't exist:
   *     Add it
   * =========================================================
   */

  const handleListClick = (
    listId: string
  ) => {
    if (!normalizedProductId) {
      return;
    }

    const alreadyAdded =
      isProductInList(listId);

    if (alreadyAdded) {
      removeProductFromList(
        normalizedProductId,
        listId
      );
    } else {
      addProductToList(
        normalizedProductId,
        listId
      );
    }
  };

  /*
   * =========================================================
   * CREATE NEW LIST
   * =========================================================
   */

  const handleCreateList = () => {
    const trimmedName =
      newListName.trim();

    if (!trimmedName || isCreating) {
      return;
    }

    try {
      setIsCreating(true);

      const newListId =
        createList(trimmedName);

      if (!newListId) {
        return;
      }

      /*
       * Automatically add the current product
       * to the newly created shopping list.
       */
      addProductToList(
        normalizedProductId,
        newListId
      );

      /*
       * Reset form.
       */
      setNewListName("");
      setShowCreateList(false);
    } finally {
      setIsCreating(false);
    }
  };

  /*
   * =========================================================
   * ENTER KEY SUPPORT
   * =========================================================
   */

  const handleInputKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleCreateList();
    }

    if (event.key === "Escape") {
      setShowCreateList(false);
      setNewListName("");
    }
  };

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <div
      className="
        fixed
        inset-0
        z-[100]
        flex
        items-center
        justify-center
        bg-black/40
        px-4
      "
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shopping-list-popup-title"
    >
      {/* =====================================================
          POPUP
      ====================================================== */}

      <div
        className="
          w-full
          max-w-[420px]
          overflow-hidden
          rounded-2xl
          bg-white
          shadow-2xl
        "
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        {/* =====================================================
            HEADER
        ====================================================== */}

        <div
          className="
            flex
            items-start
            justify-between
            border-b
            border-line
            p-5
          "
        >
          <div className="min-w-0">

            <div className="flex items-center gap-3">

              {/* ICON */}

              <div
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-navy/5
                "
              >
                <ListPlus
                  size={19}
                  className="text-navy"
                  aria-hidden="true"
                />
              </div>

              {/* TITLE */}

              <div>
                <h2
                  id="shopping-list-popup-title"
                  className="
                    font-sora
                    text-[15px]
                    font-bold
                    text-navy
                  "
                >
                  Save to Shopping List
                </h2>

                <p
                  className="
                    mt-0.5
                    text-[10.5px]
                    text-ink-soft
                  "
                >
                  Choose a list for this product.
                </p>
              </div>
            </div>

            {/* PRODUCT NAME */}

            {productName?.trim() && (
              <p
                className="
                  mt-3
                  line-clamp-2
                  text-[11px]
                  font-semibold
                  text-ink
                "
              >
                {productName.trim()}
              </p>
            )}
          </div>

          {/* CLOSE */}

          <button
            type="button"
            onClick={onClose}
            className="
              ml-3
              flex
              h-8
              w-8
              shrink-0
              items-center
              justify-center
              rounded-full
              text-ink-soft
              transition-colors
              hover:bg-gray-100
              hover:text-ink
              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-navy
            "
            aria-label="Close shopping list popup"
          >
            <X
              size={17}
              aria-hidden="true"
            />
          </button>
        </div>

        {/* =====================================================
            CONTENT
        ====================================================== */}

        <div className="p-5">

          {/* ===================================================
              CREATE LIST FORM
          ==================================================== */}

          {showCreateList ? (
            <div>

              <p
                className="
                  mb-3
                  text-[11px]
                  font-semibold
                  text-navy
                "
              >
                Create a new shopping list
              </p>

              {/* INPUT */}

              <input
                type="text"
                value={newListName}
                onChange={(event) =>
                  setNewListName(
                    event.target.value
                  )
                }
                onKeyDown={
                  handleInputKeyDown
                }
                placeholder="Enter list name"
                autoFocus
                maxLength={60}
                className="
                  h-[42px]
                  w-full
                  rounded-lg
                  border
                  border-line
                  px-3
                  text-[11px]
                  text-ink
                  outline-none
                  transition-colors
                  placeholder:text-ink-faint
                  focus:border-navy
                  focus:ring-1
                  focus:ring-navy/20
                "
              />

              {/* CHARACTER COUNT */}

              <div className="mt-1 text-right">
                <span
                  className="
                    text-[9px]
                    text-ink-faint
                  "
                >
                  {newListName.length}/60
                </span>
              </div>

              {/* ACTIONS */}

              <div
                className="
                  mt-2
                  flex
                  gap-2
                "
              >

                {/* CANCEL */}

                <button
                  type="button"
                  onClick={() => {
                    setShowCreateList(false);
                    setNewListName("");
                  }}
                  disabled={isCreating}
                  className="
                    flex-1
                    rounded-lg
                    border
                    border-line
                    py-2.5
                    text-[10.5px]
                    font-semibold
                    text-ink-soft
                    transition-colors
                    hover:bg-gray-50
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  Cancel
                </button>

                {/* CREATE */}

                <button
                  type="button"
                  onClick={handleCreateList}
                  disabled={
                    !newListName.trim() ||
                    isCreating
                  }
                  className="
                    flex-1
                    rounded-lg
                    bg-navy
                    py-2.5
                    text-[10.5px]
                    font-bold
                    text-white
                    transition-colors
                    hover:bg-navy-deep
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  {isCreating
                    ? "Creating..."
                    : "Create List"}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* =================================================
                  EXISTING SHOPPING LISTS
              ================================================== */}

              {shoppingLists.length === 0 ? (
                <div
                  className="
                    rounded-lg
                    border
                    border-dashed
                    border-line
                    px-4
                    py-6
                    text-center
                  "
                >
                  <ListPlus
                    size={22}
                    className="
                      mx-auto
                      text-ink-faint
                    "
                    aria-hidden="true"
                  />

                  <p
                    className="
                      mt-2
                      text-[11px]
                      font-semibold
                      text-ink
                    "
                  >
                    No shopping lists yet
                  </p>

                  <p
                    className="
                      mt-1
                      text-[10px]
                      text-ink-soft
                    "
                  >
                    Create your first list to
                    save this product.
                  </p>

                  {/* CREATE */}

                  <button
                    type="button"
                    onClick={() =>
                      setShowCreateList(true)
                    }
                    className="
                      mt-3
                      inline-flex
                      items-center
                      gap-1.5
                      rounded-lg
                      bg-navy
                      px-4
                      py-2.5
                      text-[10.5px]
                      font-bold
                      text-white
                      transition-colors
                      hover:bg-navy-deep
                    "
                  >
                    <Plus
                      size={13}
                      aria-hidden="true"
                    />
                    Create New List
                  </button>
                </div>
              ) : (
                <>
                  {/* =================================================
                      LISTS
                  ================================================== */}

                  <div className="space-y-2">

                    {shoppingLists.map(
                      (list) => {
                        const alreadyAdded =
                          isProductInList(
                            list.id
                          );

                        const products =
                          getProductsForList(
                            list.id
                          );

                        const productCount =
                          Array.isArray(products)
                            ? products.length
                            : 0;

                        return (
                          <button
                            key={list.id}
                            type="button"
                            onClick={() =>
                              handleListClick(
                                list.id
                              )
                            }
                            className={`
                              flex
                              w-full
                              items-center
                              justify-between
                              gap-3
                              rounded-lg
                              border
                              px-3
                              py-3
                              text-left
                              transition-colors
                              focus:outline-none
                              focus-visible:ring-2
                              focus-visible:ring-navy
                              ${
                                alreadyAdded
                                  ? "border-green/20 bg-green/5 hover:bg-red-50"
                                  : "border-line hover:bg-gray-50"
                              }
                            `}
                          >
                            {/* LIST DETAILS */}

                            <div className="min-w-0">

                              <p
                                className="
                                  truncate
                                  text-[11px]
                                  font-semibold
                                  text-navy
                                "
                              >
                                {list.name}
                              </p>

                              <p
                                className="
                                  mt-0.5
                                  text-[9.5px]
                                  text-ink-soft
                                "
                              >
                                {productCount}{" "}
                                {productCount === 1
                                  ? "product"
                                  : "products"}
                              </p>
                            </div>

                            {/* STATUS */}

                            {alreadyAdded ? (
                              <span
                                className="
                                  flex
                                  shrink-0
                                  items-center
                                  gap-1
                                  text-[9.5px]
                                  font-bold
                                  text-green-deep
                                "
                              >
                                <Check
                                  size={13}
                                  aria-hidden="true"
                                />
                                Added
                              </span>
                            ) : (
                              <Plus
                                size={15}
                                className="
                                  shrink-0
                                  text-ink-faint
                                "
                                aria-hidden="true"
                              />
                            )}
                          </button>
                        );
                      }
                    )}

                  </div>

                  {/* =================================================
                      CREATE NEW LIST
                  ================================================== */}

                  <button
                    type="button"
                    onClick={() =>
                      setShowCreateList(true)
                    }
                    className="
                      mt-3
                      flex
                      w-full
                      items-center
                      justify-center
                      gap-2
                      rounded-lg
                      border
                      border-dashed
                      border-line
                      py-2.5
                      text-[10.5px]
                      font-bold
                      text-navy
                      transition-colors
                      hover:bg-gray-50
                      focus:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-navy
                    "
                  >
                    <Plus
                      size={13}
                      aria-hidden="true"
                    />
                    Create New List
                  </button>
                </>
              )}
            </>
          )}
        </div>

        {/* =====================================================
            FOOTER
        ====================================================== */}

        <div
          className="
            border-t
            border-line
            px-5
            py-3
          "
        >
          <button
            type="button"
            onClick={onClose}
            className="
              w-full
              rounded-lg
              border
              border-line
              py-2.5
              text-[10.5px]
              font-semibold
              text-ink-soft
              transition-colors
              hover:bg-gray-50
              focus:outline-none
              focus-visible:ring-2
              focus-visible:ring-navy
            "
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}