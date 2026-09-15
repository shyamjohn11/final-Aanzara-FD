"use client";

import { Bell } from "lucide-react";

/* =========================================================
   PROPS
========================================================= */

type AlertsEmptyStateProps = {
  message?: string;
};

/* =========================================================
   COMPONENT
========================================================= */

export default function AlertsEmptyState({
  message = "You're all caught up!",
}: AlertsEmptyStateProps) {
  const safeMessage =
    typeof message === "string" &&
    message.trim().length > 0
      ? message.trim()
      : "You're all caught up!";

  return (
    <div
      className="
        flex
        min-h-[300px]
        w-full
        flex-col
        items-center
        justify-center
        rounded-xl
        border
        border-gray-200
        bg-white
        px-6
        py-12
        text-center
      "
      role="status"
      aria-live="polite"
    >
      {/* =================================================
          ICON
      ================================================= */}

      <div
        className="
          flex
          h-16
          w-16
          items-center
          justify-center
          rounded-full
          bg-blue-50
        "
        aria-hidden="true"
      >
        <Bell
          size={28}
          strokeWidth={1.8}
          className="text-blue-600"
        />
      </div>

      {/* =================================================
          TITLE
      ================================================= */}

      <h3
        className="
          mt-4
          !text-black
          text-[16px]
          font-bold
          leading-6
        "
      >
        {safeMessage}
      </h3>

      {/* =================================================
          DESCRIPTION
      ================================================= */}

      <p
        className="
          mt-1
          max-w-[360px]
          !text-gray-500
          text-[12px]
          leading-5
        "
      >
        You don't have any alerts matching
        this filter right now. We'll notify you
        when something important happens.
      </p>
    </div>
  );
}