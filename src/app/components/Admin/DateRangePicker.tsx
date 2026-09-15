"use client";

import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

/* ============================================================
   TYPES
============================================================ */

export type DateRangeValue = {
  from: Date | null;
  to: Date | null;
};

type DateRangePickerProps = {
  value?: DateRangeValue;
  onChange?: (range: DateRangeValue) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
};

/* ============================================================
   MONTH NAMES
============================================================ */

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/* ============================================================
   WEEK DAYS
============================================================ */

const WEEK_DAYS = [
  "Su",
  "Mo",
  "Tu",
  "We",
  "Th",
  "Fr",
  "Sa",
];

/* ============================================================
   HELPERS
============================================================ */

function isValidDate(date: unknown): date is Date {
  return date instanceof Date && !Number.isNaN(date.getTime());
}

function startOfDay(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
}

function isSameDay(
  first: Date | null,
  second: Date | null
): boolean {
  if (!first || !second) {
    return false;
  }

  if (!isValidDate(first) || !isValidDate(second)) {
    return false;
  }

  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function isBefore(first: Date, second: Date): boolean {
  return (
    startOfDay(first).getTime() <
    startOfDay(second).getTime()
  );
}

function isAfter(first: Date, second: Date): boolean {
  return (
    startOfDay(first).getTime() >
    startOfDay(second).getTime()
  );
}

function formatDate(date: Date | null): string {
  if (!date || !isValidDate(date)) {
    return "";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getMonthDays(
  year: number,
  month: number
): Array<Date | null> {
  const firstDay = new Date(
    year,
    month,
    1
  ).getDay();

  const daysInMonth = new Date(
    year,
    month + 1,
    0
  ).getDate();

  const days: Array<Date | null> = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    days.push(
      new Date(
        year,
        month,
        day
      )
    );
  }

  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
}

function normalizeRange(
  value: DateRangeValue
): DateRangeValue {
  const from =
    isValidDate(value.from)
      ? startOfDay(value.from)
      : null;

  const to =
    isValidDate(value.to)
      ? startOfDay(value.to)
      : null;

  if (!from || !to) {
    return {
      from,
      to,
    };
  }

  if (isAfter(from, to)) {
    return {
      from: to,
      to: from,
    };
  }

  return {
    from,
    to,
  };
}

/* ============================================================
   COMPONENT
============================================================ */

export default function DateRangePicker({
  value = {
    from: null,
    to: null,
  },
  onChange,
  placeholder = "Select date range",
  className = "",
  disabled = false,
  minDate,
  maxDate,
}: DateRangePickerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  /* ==========================================================
     VALIDATE MIN / MAX
  ========================================================== */

  const validMinDate = isValidDate(minDate)
    ? startOfDay(minDate)
    : null;

  const validMaxDate = isValidDate(maxDate)
    ? startOfDay(maxDate)
    : null;

  const invalidDateLimits =
    !!validMinDate &&
    !!validMaxDate &&
    isAfter(validMinDate, validMaxDate);

  /* ==========================================================
     SAFE VALUE
  ========================================================== */

  const safeValue = normalizeRange({
    from: value?.from ?? null,
    to: value?.to ?? null,
  });

  const today = startOfDay(new Date());

  const initialDate =
    safeValue.from ??
    safeValue.to ??
    today;

  /* ==========================================================
     STATE
  ========================================================== */

  const [open, setOpen] = useState(false);

  const [currentMonth, setCurrentMonth] =
    useState(
      new Date(
        initialDate.getFullYear(),
        initialDate.getMonth(),
        1
      )
    );

  const [selecting, setSelecting] =
    useState<"from" | "to">(
      safeValue.from && !safeValue.to
        ? "to"
        : "from"
    );

  /* ==========================================================
     OUTSIDE CLICK
  ========================================================== */

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleOutsideClick = (
      event: MouseEvent
    ) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(
          event.target as Node
        )
      ) {
        setOpen(false);
        setSelecting("from");
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, [open]);

  /* ==========================================================
     ESC KEY
  ========================================================== */

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (
      event: globalThis.KeyboardEvent
    ) => {
      if (event.key === "Escape") {
        setOpen(false);
        setSelecting("from");
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [open]);

  /* ==========================================================
     DATE DISABLED
  ========================================================== */

  const isDisabledDate = (
    date: Date
  ): boolean => {
    if (
      disabled ||
      invalidDateLimits ||
      !isValidDate(date)
    ) {
      return true;
    }

    const target = startOfDay(date);

    if (
      validMinDate &&
      isBefore(target, validMinDate)
    ) {
      return true;
    }

    if (
      validMaxDate &&
      isAfter(target, validMaxDate)
    ) {
      return true;
    }

    /*
     * When selecting the end date,
     * do not allow an end date before
     * the selected start date.
     */
    if (
      selecting === "to" &&
      safeValue.from &&
      isBefore(target, safeValue.from)
    ) {
      return true;
    }

    return false;
  };

  /* ==========================================================
     DATE CLICK
  ========================================================== */

  const handleDateClick = (
    date: Date
  ) => {
    if (isDisabledDate(date)) {
      return;
    }

    const selectedDate =
      startOfDay(date);

    /* --------------------------------------------------------
       FIRST DATE
    -------------------------------------------------------- */

    if (
      selecting === "from" ||
      !safeValue.from ||
      safeValue.to
    ) {
      onChange?.({
        from: selectedDate,
        to: null,
      });

      setSelecting("to");

      return;
    }

    /* --------------------------------------------------------
       SECOND DATE
    -------------------------------------------------------- */

    if (
      safeValue.from &&
      !safeValue.to
    ) {
      const from = startOfDay(
        safeValue.from
      );

      const to = startOfDay(
        selectedDate
      );

      if (isBefore(to, from)) {
        onChange?.({
          from: to,
          to: from,
        });
      } else {
        onChange?.({
          from,
          to,
        });
      }

      setSelecting("from");
    }
  };

  /* ==========================================================
     PREVIOUS MONTH
  ========================================================== */

  const previousMonth = () => {
    if (disabled) {
      return;
    }

    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() - 1,
        1
      )
    );
  };

  /* ==========================================================
     NEXT MONTH
  ========================================================== */

  const nextMonth = () => {
    if (disabled) {
      return;
    }

    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        1
      )
    );
  };

  /* ==========================================================
     TODAY
  ========================================================== */

  const selectToday = () => {
    if (
      disabled ||
      isDisabledDate(today)
    ) {
      return;
    }

    onChange?.({
      from: today,
      to: today,
    });

    setCurrentMonth(
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      )
    );

    setSelecting("from");
    setOpen(false);
  };

  /* ==========================================================
     CLEAR
  ========================================================== */

  const clearRange = () => {
    if (disabled) {
      return;
    }

    onChange?.({
      from: null,
      to: null,
    });

    setSelecting("from");
  };

  /* ==========================================================
     APPLY
  ========================================================== */

  const applyRange = () => {
    if (
      disabled ||
      !safeValue.from
    ) {
      return;
    }

    const from = startOfDay(
      safeValue.from
    );

    const to = safeValue.to
      ? startOfDay(safeValue.to)
      : from;

    if (
      isDisabledDate(from) ||
      isDisabledDate(to)
    ) {
      return;
    }

    onChange?.({
      from,
      to,
    });

    setSelecting("from");
    setOpen(false);
  };

  /* ==========================================================
     RANGE DISPLAY
  ========================================================== */

  const displayValue =
    safeValue.from &&
    safeValue.to
      ? `${formatDate(
          safeValue.from
        )} - ${formatDate(
          safeValue.to
        )}`
      : safeValue.from
        ? `${formatDate(
            safeValue.from
          )} - Select end date`
        : placeholder;

  /* ==========================================================
     DAYS
  ========================================================== */

  const days = getMonthDays(
    currentMonth.getFullYear(),
    currentMonth.getMonth()
  );

  /* ==========================================================
     RANGE CHECK
  ========================================================== */

  const isInRange = (
    date: Date
  ): boolean => {
    if (
      !safeValue.from ||
      !safeValue.to
    ) {
      return false;
    }

    const target = startOfDay(date);
    const from = startOfDay(
      safeValue.from
    );
    const to = startOfDay(
      safeValue.to
    );

    return (
      !isBefore(target, from) &&
      !isAfter(target, to)
    );
  };

  /* ==========================================================
     KEYBOARD DATE HANDLER
  ========================================================== */

  const handleDateKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    date: Date
  ) => {
    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();
      handleDateClick(date);
    }
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div
      ref={wrapperRef}
      className={`relative w-full ${className}`}
    >
      {/* ======================================================
          TRIGGER
      ====================================================== */}

      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled || invalidDateLimits) {
            return;
          }

          setOpen((current) => !current);
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="
          flex
          h-10
          w-full
          items-center
          justify-between
          rounded-lg
          border
          border-[#DCE2EA]
          bg-white
          px-3
          text-left
          transition
          hover:border-[#B9C5D5]
          focus:outline-none
          focus:ring-2
          focus:ring-[#1769F5]/15
          disabled:cursor-not-allowed
          disabled:bg-[#F5F7FA]
          disabled:opacity-60
        "
      >
        <div className="flex min-w-0 items-center gap-2">
          <CalendarDays
            size={15}
            className="shrink-0 text-[#647287]"
          />

          <span
            className={`
              truncate
              text-[10px]
              ${
                safeValue.from
                  ? "font-medium text-[#33415A]"
                  : "text-[#9AA5B4]"
              }
            `}
          >
            {displayValue}
          </span>
        </div>

        {(safeValue.from ||
          safeValue.to) && (
          <span
            role="button"
            tabIndex={0}
            aria-label="Clear date range"
            onClick={(event) => {
              event.stopPropagation();
              clearRange();
            }}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" ||
                event.key === " "
              ) {
                event.preventDefault();
                event.stopPropagation();
                clearRange();
              }
            }}
            className="
              ml-2
              flex
              h-6
              w-6
              shrink-0
              items-center
              justify-center
              rounded-md
              text-[#8995A5]
              hover:bg-[#F1F4F8]
              hover:text-[#52627A]
            "
          >
            <X size={13} />
          </span>
        )}
      </button>

      {/* ======================================================
          INVALID DATE LIMITS
      ====================================================== */}

      {invalidDateLimits && (
        <p className="mt-1.5 text-[10px] text-red-500">
          Invalid date range: minimum date cannot be after
          maximum date.
        </p>
      )}

      {/* ======================================================
          CALENDAR
      ====================================================== */}

      {open && !invalidDateLimits && (
        <div
          role="dialog"
          aria-label="Date range picker"
          className="
            absolute
            left-0
            top-[calc(100%+8px)]
            z-[100]
            w-[320px]
            max-w-[calc(100vw-32px)]
            overflow-hidden
            rounded-xl
            border
            border-[#E1E6ED]
            bg-white
            shadow-xl
          "
        >
          {/* ==================================================
              HEADER
          ================================================== */}

          <div
            className="
              flex
              items-center
              justify-between
              border-b
              border-[#EDF0F4]
              px-4
              py-3
            "
          >
            <button
              type="button"
              onClick={previousMonth}
              aria-label="Previous month"
              className="
                flex
                h-7
                w-7
                items-center
                justify-center
                rounded-md
                text-[#647287]
                hover:bg-[#F2F5F8]
              "
            >
              <ChevronLeft size={15} />
            </button>

            <p className="
              text-[11px]
              font-bold
              text-[#263650]
            ">
              {MONTHS[
                currentMonth.getMonth()
              ]}{" "}
              {currentMonth.getFullYear()}
            </p>

            <button
              type="button"
              onClick={nextMonth}
              aria-label="Next month"
              className="
                flex
                h-7
                w-7
                items-center
                justify-center
                rounded-md
                text-[#647287]
                hover:bg-[#F2F5F8]
              "
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {/* ==================================================
              SELECTION INFO
          ================================================== */}

          <div
            className="
              grid
              grid-cols-2
              gap-2
              border-b
              border-[#EDF0F4]
              p-3
            "
          >
            <div className="
              rounded-lg
              bg-[#F5F8FC]
              px-3
              py-2
            ">
              <p className="
                text-[7px]
                font-semibold
                uppercase
                tracking-wide
                text-[#9AA5B4]
              ">
                Start Date
              </p>

              <p className="
                mt-1
                truncate
                text-[9px]
                font-semibold
                text-[#33415A]
              ">
                {safeValue.from
                  ? formatDate(
                      safeValue.from
                    )
                  : "Select date"}
              </p>
            </div>

            <div className="
              rounded-lg
              bg-[#F5F8FC]
              px-3
              py-2
            ">
              <p className="
                text-[7px]
                font-semibold
                uppercase
                tracking-wide
                text-[#9AA5B4]
              ">
                End Date
              </p>

              <p className="
                mt-1
                truncate
                text-[9px]
                font-semibold
                text-[#33415A]
              ">
                {safeValue.to
                  ? formatDate(
                      safeValue.to
                    )
                  : "Select date"}
              </p>
            </div>
          </div>

          {/* ==================================================
              CALENDAR
          ================================================== */}

          <div className="p-3">
            {/* WEEK DAYS */}

            <div
              className="
                mb-1
                grid
                grid-cols-7
              "
            >
              {WEEK_DAYS.map((day) => (
                <div
                  key={day}
                  className="
                    flex
                    h-7
                    items-center
                    justify-center
                    text-[8px]
                    font-semibold
                    text-[#9AA5B4]
                  "
                >
                  {day}
                </div>
              ))}
            </div>

            {/* DAYS */}

            <div
              className="
                grid
                grid-cols-7
                gap-y-1
              "
            >
              {days.map(
                (date, index) => {
                  if (!date) {
                    return (
                      <div
                        key={`empty-${index}`}
                        className="h-8"
                        aria-hidden="true"
                      />
                    );
                  }

                  const disabledDate =
                    isDisabledDate(date);

                  const start =
                    isSameDay(
                      date,
                      safeValue.from
                    );

                  const end =
                    isSameDay(
                      date,
                      safeValue.to
                    );

                  const inRange =
                    isInRange(date);

                  const todayDate =
                    isSameDay(
                      date,
                      today
                    );

                  return (
                    <div
                      key={date.toISOString()}
                      className="
                        relative
                        flex
                        h-8
                        items-center
                        justify-center
                      "
                    >
                      {/* RANGE BACKGROUND */}

                      {inRange && (
                        <div
                          className="
                            absolute
                            inset-y-0.5
                            left-0
                            right-0
                            bg-[#EEF4FF]
                          "
                          aria-hidden="true"
                        />
                      )}

                      <button
                        type="button"
                        disabled={disabledDate}
                        onClick={() =>
                          handleDateClick(
                            date
                          )
                        }
                        onKeyDown={(event) =>
                          handleDateKeyDown(
                            event,
                            date
                          )
                        }
                        aria-label={formatDate(
                          date
                        )}
                        aria-pressed={
                          start || end
                        }
                        className={`
                          relative
                          z-10
                          flex
                          h-7
                          w-7
                          items-center
                          justify-center
                          rounded-full
                          text-[9px]
                          font-medium
                          transition
                          ${
                            start || end
                              ? "bg-[#1769F5] font-bold text-white"
                              : todayDate
                                ? "border border-[#1769F5] text-[#1769F5]"
                                : inRange
                                  ? "text-[#1769F5]"
                                  : "text-[#52627A] hover:bg-[#F1F4F8]"
                          }
                          ${
                            disabledDate
                              ? "cursor-not-allowed opacity-30 hover:bg-transparent"
                              : ""
                          }
                        `}
                      >
                        {date.getDate()}
                      </button>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* ==================================================
              FOOTER
          ================================================== */}

          <div
            className="
              flex
              items-center
              justify-between
              border-t
              border-[#EDF0F4]
              px-3
              py-3
            "
          >
            <button
              type="button"
              onClick={selectToday}
              disabled={isDisabledDate(today)}
              className="
                text-[9px]
                font-semibold
                text-[#1769F5]
                hover:underline
                disabled:cursor-not-allowed
                disabled:opacity-40
              "
            >
              Today
            </button>

            <div className="
              flex
              items-center
              gap-2
            ">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setSelecting("from");
                }}
                className="
                  h-8
                  rounded-lg
                  border
                  border-[#DCE2EA]
                  px-3
                  text-[9px]
                  font-semibold
                  text-[#647287]
                  hover:bg-[#F5F7FA]
                "
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={applyRange}
                disabled={!safeValue.from}
                className="
                  h-8
                  rounded-lg
                  bg-[#1769F5]
                  px-3
                  text-[9px]
                  font-semibold
                  text-white
                  hover:bg-[#0F5BDE]
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}