"use client";

import {
  ReactNode,
  useState,
} from "react";

import {
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Inbox,
} from "lucide-react";

/* ============================================================
   COLUMN TYPE
============================================================ */

export type DataTableColumn<T> = {
  key: string;
  label: string;
  className?: string;
  headerClassName?: string;

  render?: (
    item: T,
    index: number
  ) => ReactNode;
};

/* ============================================================
   PROPS
============================================================ */

type DataTableProps<T> = {
  data: T[];

  columns: DataTableColumn<T>[];

  getRowKey?: (
    item: T,
    index: number
  ) => string | number;

  search?: string;
  onSearchChange?: (
    value: string
  ) => void;

  searchPlaceholder?: string;

  loading?: boolean;

  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: ReactNode;

  pageSize?: number;

  showPagination?: boolean;

  className?: string;

  rowClassName?: (
    item: T,
    index: number
  ) => string;

  onRowClick?: (
    item: T,
    index: number
  ) => void;

  headerActions?: ReactNode;

  mobileCard?: (
    item: T,
    index: number
  ) => ReactNode;
};

/* ============================================================
   COMPONENT
============================================================ */

export default function DataTable<
  T extends Record<string, unknown>
>({
  data,
  columns,

  getRowKey = (_, index) =>
    index,

  search,
  onSearchChange,

  searchPlaceholder = "Search...",

  loading = false,

  emptyTitle = "No data found",
  emptyDescription = "There are no records to display.",
  emptyIcon,

  pageSize = 10,

  showPagination = true,

  className = "",

  rowClassName,

  onRowClick,

  headerActions,

  mobileCard,
}: DataTableProps<T>) {

  /* ==========================================================
     LOCAL SEARCH
  ========================================================== */

  const [localSearch, setLocalSearch] =
    useState("");

  const activeSearch =
    search !== undefined
      ? search
      : localSearch;

  const handleSearchChange = (
    value: string
  ) => {
    if (onSearchChange) {
      onSearchChange(value);
    } else {
      setLocalSearch(value);
    }
  };

  /* ==========================================================
     LOCAL FILTER
  ========================================================== */

  const filteredData =
    search !== undefined ||
    onSearchChange
      ? data
      : data.filter((item) => {
          if (!localSearch.trim()) {
            return true;
          }

          const query =
            localSearch
              .trim()
              .toLowerCase();

          return Object.values(
            item
          ).some((value) =>
            String(value)
              .toLowerCase()
              .includes(query)
          );
        });

  /* ==========================================================
     PAGINATION
  ========================================================== */

  const [currentPage, setCurrentPage] =
    useState(1);

  const totalPages =
    showPagination && pageSize > 0
      ? Math.max(
          1,
          Math.ceil(
            filteredData.length /
              pageSize
          )
        )
      : 1;

  const safeCurrentPage =
    Math.min(
      currentPage,
      totalPages
    );

  const startIndex =
    (safeCurrentPage - 1) *
    pageSize;

  const endIndex =
    startIndex + pageSize;

  const paginatedData =
    showPagination && pageSize > 0
      ? filteredData.slice(
          startIndex,
          endIndex
        )
      : filteredData;

  /* ==========================================================
     RESET PAGE WHEN SEARCH CHANGES
  ========================================================== */

  const updateSearch = (
    value: string
  ) => {
    setCurrentPage(1);
    handleSearchChange(value);
  };

  /* ==========================================================
     PAGE CHANGE
  ========================================================== */

  const goToPage = (
    page: number
  ) => {
    const nextPage = Math.max(
      1,
      Math.min(page, totalPages)
    );

    setCurrentPage(nextPage);
  };

  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {
    return (
      <section
        className={`
          overflow-hidden
          rounded-2xl
          border
          border-[#E4E8EF]
          bg-white
          shadow-sm
          ${className}
        `}
      >

        <div className="flex items-center justify-center px-5 py-20">

          <div className="flex flex-col items-center">

            <div
              className="
                h-7
                w-7
                animate-spin
                rounded-full
                border-2
                border-[#DCE5F3]
                border-t-[#1769F5]
              "
            />

            <p className="mt-3 text-[10px] text-[#8995A5]">
              Loading...
            </p>

          </div>

        </div>

      </section>
    );
  }

  /* ==========================================================
     TABLE
  ========================================================== */

  return (
    <section
      className={`
        overflow-hidden
        rounded-2xl
        border
        border-[#E4E8EF]
        bg-white
        shadow-sm
        ${className}
      `}
    >

      {/* ======================================================
          TOOLBAR
      ====================================================== */}

      {(onSearchChange ||
        search !== undefined ||
        headerActions) && (

        <div className="
          flex
          flex-col
          gap-3
          border-b
          border-[#EDF0F4]
          p-4
          sm:flex-row
          sm:items-center
          sm:justify-between
          sm:p-5
        ">

          {/* SEARCH */}

          {(onSearchChange ||
            search !== undefined) && (

            <div className="
              flex
              h-10
              w-full
              items-center
              rounded-lg
              border
              border-[#DFE5ED]
              bg-[#FAFBFD]
              px-3
              sm:max-w-[420px]
            ">

              <Search
                size={16}
                className="shrink-0 text-[#8995A5]"
              />

              <input
                type="search"
                value={activeSearch}
                onChange={(event) =>
                  updateSearch(
                    event.target.value
                  )
                }
                placeholder={
                  searchPlaceholder
                }
                className="
                  h-full
                  w-full
                  bg-transparent
                  px-2.5
                  text-[11px]
                  text-[#263A59]
                  outline-none
                  placeholder:text-[#A0AAB8]
                "
              />

              {activeSearch && (
                <button
                  type="button"
                  onClick={() =>
                    updateSearch("")
                  }
                  aria-label="Clear search"
                  className="
                    flex
                    h-6
                    w-6
                    shrink-0
                    items-center
                    justify-center
                    rounded-md
                    text-[#8995A5]
                    hover:bg-[#EEF3FA]
                    hover:text-[#263A59]
                  "
                >
                  <X size={14} />
                </button>
              )}

            </div>

          )}

          {/* ACTIONS */}

          {headerActions && (
            <div className="flex items-center justify-end">
              {headerActions}
            </div>
          )}

        </div>

      )}

      {/* ======================================================
          TABLE CONTENT
      ====================================================== */}

      {filteredData.length === 0 ? (

        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          description={
            emptyDescription
          }
          hasSearch={
            Boolean(activeSearch)
          }
          onClear={() =>
            updateSearch("")
          }
        />

      ) : (

        <>

          {/* ==================================================
              DESKTOP TABLE
          ================================================== */}

          <div className="hidden overflow-x-auto md:block">

            <table className="min-w-full">

              {/* HEADER */}

              <thead>

                <tr className="
                  border-b
                  border-[#EDF0F4]
                  bg-[#FAFBFD]
                  text-left
                ">

                  {columns.map(
                    (column) => (

                      <th
                        key={
                          column.key
                        }
                        className={`
                          whitespace-nowrap
                          px-5
                          py-3
                          text-[9px]
                          font-semibold
                          uppercase
                          tracking-wide
                          text-[#98A3B2]
                          ${column.headerClassName ?? ""}
                        `}
                      >
                        {
                          column.label
                        }
                      </th>

                    )
                  )}

                </tr>

              </thead>

              {/* BODY */}

              <tbody>

                {paginatedData.map(
                  (
                    item,
                    index
                  ) => {

                    const actualIndex =
                      startIndex +
                      index;

                    return (
                      <tr
                        key={String(
                          getRowKey(
                            item,
                            actualIndex
                          )
                        )}
                        onClick={() =>
                          onRowClick?.(
                            item,
                            actualIndex
                          )
                        }
                        className={`
                          border-b
                          border-[#F0F2F5]
                          last:border-0
                          transition
                          ${
                            onRowClick
                              ? "cursor-pointer"
                              : ""
                          }
                          hover:bg-[#FCFDFE]
                          ${
                            rowClassName
                              ? rowClassName(
                                  item,
                                  actualIndex
                                )
                              : ""
                          }
                        `}
                      >

                        {columns.map(
                          (
                            column
                          ) => (

                            <td
                              key={
                                column.key
                              }
                              className={`
                                px-5
                                py-4
                                text-[10px]
                                text-[#52627A]
                                ${column.className ?? ""}
                              `}
                            >

                              {column.render
                                ? column.render(
                                    item,
                                    actualIndex
                                  )
                                : String(
                                    item[
                                      column.key
                                    ] ??
                                      ""
                                  )}

                            </td>

                          )
                        )}

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>

          {/* ==================================================
              MOBILE CARDS
          ================================================== */}

          <div className="
            divide-y
            divide-[#EDF0F4]
            md:hidden
          ">

            {paginatedData.map(
              (
                item,
                index
              ) => {

                const actualIndex =
                  startIndex +
                  index;

                return (
                  <div
                    key={String(
                      getRowKey(
                        item,
                        actualIndex
                      )
                    )}
                    onClick={() =>
                      onRowClick?.(
                        item,
                        actualIndex
                      )
                    }
                    className={`
                      ${
                        onRowClick
                          ? "cursor-pointer"
                          : ""
                      }
                      ${
                        rowClassName
                          ? rowClassName(
                              item,
                              actualIndex
                            )
                          : ""
                      }
                    `}
                  >

                    {mobileCard ? (
                      mobileCard(
                        item,
                        actualIndex
                      )
                    ) : (

                      <div className="p-4">

                        {columns.map(
                          (
                            column
                          ) => (

                            <div
                              key={
                                column.key
                              }
                              className="
                                flex
                                items-start
                                justify-between
                                gap-4
                                py-1.5
                              "
                            >

                              <span className="
                                shrink-0
                                text-[8px]
                                font-semibold
                                uppercase
                                tracking-wide
                                text-[#9AA5B4]
                              ">
                                {
                                  column.label
                                }
                              </span>

                              <div className="
                                min-w-0
                                text-right
                                text-[9px]
                                text-[#42516A]
                              ">

                                {column.render
                                  ? column.render(
                                      item,
                                      actualIndex
                                    )
                                  : String(
                                      item[
                                        column.key
                                      ] ??
                                        ""
                                    )}

                              </div>

                            </div>

                          )
                        )}

                      </div>

                    )}

                  </div>
                );
              }
            )}

          </div>

        </>

      )}

      {/* ======================================================
          PAGINATION
      ====================================================== */}

      {showPagination &&
        filteredData.length > 0 &&
        pageSize > 0 && (

          <div className="
            flex
            flex-col
            gap-3
            border-t
            border-[#EDF0F4]
            px-5
            py-4
            sm:flex-row
            sm:items-center
            sm:justify-between
          ">

            {/* RESULT COUNT */}

            <p className="
              text-[9px]
              text-[#8995A5]
            ">

              Showing{" "}

              <span className="
                font-semibold
                text-[#4D5C72]
              ">
                {Math.min(
                  startIndex + 1,
                  filteredData.length
                )}
              </span>

              {" "}to{" "}

              <span className="
                font-semibold
                text-[#4D5C72]
              ">
                {Math.min(
                  endIndex,
                  filteredData.length
                )}
              </span>

              {" "}of{" "}

              <span className="
                font-semibold
                text-[#4D5C72]
              ">
                {
                  filteredData.length
                }
              </span>

            </p>

            {/* PAGE BUTTONS */}

            <div className="
              flex
              items-center
              gap-1
            ">

              {/* PREVIOUS */}

              <button
                type="button"
                onClick={() =>
                  goToPage(
                    safeCurrentPage -
                      1
                  )
                }
                disabled={
                  safeCurrentPage ===
                  1
                }
                aria-label="Previous page"
                className="
                  flex
                  h-7
                  w-7
                  items-center
                  justify-center
                  rounded-md
                  border
                  border-[#E1E6ED]
                  text-[#64748A]
                  transition
                  hover:bg-[#F3F6FA]
                  disabled:cursor-not-allowed
                  disabled:text-[#B3BBC6]
                "
              >
                <ChevronLeft
                  size={14}
                />
              </button>

              {/* PAGE NUMBERS */}

              {getPageNumbers(
                safeCurrentPage,
                totalPages
              ).map((page, index) => {

                if (
                  page === "..."
                ) {
                  return (
                    <span
                      key={`dots-${index}`}
                      className="
                        flex
                        h-7
                        min-w-7
                        items-center
                        justify-center
                        text-[9px]
                        text-[#8995A5]
                      "
                    >
                      ...
                    </span>
                  );
                }

                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() =>
                      goToPage(
                        page as number
                      )
                    }
                    className={`
                      flex
                      h-7
                      min-w-7
                      items-center
                      justify-center
                      rounded-md
                      px-2
                      text-[9px]
                      font-semibold
                      transition
                      ${
                        safeCurrentPage ===
                        page
                          ? "bg-[#173B7A] text-white"
                          : "border border-transparent text-[#64748A] hover:bg-[#F1F4F8]"
                      }
                    `}
                  >
                    {page}
                  </button>
                );
              })}

              {/* NEXT */}

              <button
                type="button"
                onClick={() =>
                  goToPage(
                    safeCurrentPage +
                      1
                  )
                }
                disabled={
                  safeCurrentPage ===
                  totalPages
                }
                aria-label="Next page"
                className="
                  flex
                  h-7
                  w-7
                  items-center
                  justify-center
                  rounded-md
                  border
                  border-[#E1E6ED]
                  text-[#64748A]
                  transition
                  hover:bg-[#F3F6FA]
                  disabled:cursor-not-allowed
                  disabled:text-[#B3BBC6]
                "
              >
                <ChevronRight
                  size={14}
                />
              </button>

            </div>

          </div>

        )}

    </section>
  );
}

/* ============================================================
   PAGE NUMBERS
============================================================ */

function getPageNumbers(
  currentPage: number,
  totalPages: number
): Array<number | "..."> {

  if (totalPages <= 7) {
    return Array.from(
      { length: totalPages },
      (_, index) =>
        index + 1
    );
  }

  if (currentPage <= 4) {
    return [
      1,
      2,
      3,
      4,
      5,
      "...",
      totalPages,
    ];
  }

  if (
    currentPage >=
    totalPages - 3
  ) {
    return [
      1,
      "...",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "...",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "...",
    totalPages,
  ];
}

/* ============================================================
   EMPTY STATE
============================================================ */

function EmptyState({
  icon,
  title,
  description,
  hasSearch,
  onClear,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  hasSearch: boolean;
  onClear: () => void;
}) {
  return (
    <div className="
      flex
      flex-col
      items-center
      justify-center
      px-5
      py-16
      text-center
    ">

      <div className="
        flex
        h-14
        w-14
        items-center
        justify-center
        rounded-full
        bg-[#EDF3FF]
        text-[#4773C5]
      ">
        {icon ?? (
          <Inbox size={25} />
        )}
      </div>

      <h3 className="
        mt-4
        text-[13px]
        font-bold
        text-[#33415A]
      ">
        {title}
      </h3>

      <p className="
        mt-1
        max-w-[320px]
        text-[10px]
        leading-5
        text-[#8995A5]
      ">
        {description}
      </p>

      {hasSearch && (
        <button
          type="button"
          onClick={onClear}
          className="
            mt-5
            h-9
            rounded-lg
            border
            border-[#DCE2EA]
            px-4
            text-[10px]
            font-semibold
            text-[#647287]
            transition
            hover:bg-[#F5F7FA]
          "
        >
          Clear Search
        </button>
      )}

    </div>
  );
}