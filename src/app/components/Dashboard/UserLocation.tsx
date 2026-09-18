// File: app/components/Dashboard/UserLocation.tsx
"use client";

import { useEffect, useState } from "react";
import { MapPin, LocateFixed, AlertCircle } from "lucide-react";

/* ============================================================
   TYPES
============================================================ */

type LocationState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; label: string }
  | { status: "error"; message: string };

/* ============================================================
   REVERSE GEOCODING
   No Google/Mapbox key is configured in this project, so this uses
   OpenStreetMap's free Nominatim endpoint (no API key required).
   If the project later adds a paid geocoding provider, swap the
   fetch below for that provider's reverse-geocode call — the rest
   of the component (state machine, UI) does not need to change.

   zoom=18 asks Nominatim for building/street-level detail (zoom=10,
   used previously, only resolves down to city — which is why only
   the state showed when even the city was missing at that zoom).
============================================================ */

function buildFullAddress(address: Record<string, string | undefined>): string {
  const houseAndRoad = [
    address.house_number,
    address.road || address.pedestrian || address.footway,
  ]
    .filter(Boolean)
    .join(" ");

  const area =
    address.neighbourhood ||
    address.quarter ||
    address.suburb ||
    address.hamlet ||
    address.locality ||
    address.isolated_dwelling;

  const cityLevel =
    address.city || address.town || address.village || address.suburb;

  // city_district (e.g. a taluk/zone) is often a near-duplicate of the
  // area or district — only include it when it adds new information.
  const district =
    address.state_district ||
    address.county ||
    (address.city_district !== area ? address.city_district : undefined);

  const parts = [
    houseAndRoad || undefined,
    area,
    cityLevel,
    district,
    address.state,
    address.postcode,
  ].filter((part): part is string => Boolean(part && part.trim().length > 0));

  // Drop consecutive duplicates (e.g. suburb === city in small towns).
  const deduped = parts.filter((part, index) => parts[index - 1] !== part);

  return deduped.join(", ");
}

async function reverseGeocode(
  latitude: number,
  longitude: number,
  signal: AbortSignal
): Promise<string> {
  const url =
    `https://nominatim.openstreetmap.org/reverse` +
    `?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1` +
    // Force English field values. Without this, Nominatim returns names in
    // whatever language the underlying OSM data (or the request's own
    // Accept-Language) resolves to — which is what produced Tamil-script
    // area/district names previously; it is not a sign of missing data.
    `&accept-language=en`;

  const response = await fetch(url, {
    signal,
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error("Reverse geocoding request failed.");
  }

  const data = await response.json();
  const address = data?.address ?? {};

  const fullAddress = buildFullAddress(address);
  if (fullAddress) return fullAddress;

  if (typeof data?.display_name === "string" && data.display_name.trim()) {
    return data.display_name;
  }

  return `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
}

/* ============================================================
   COMPONENT
============================================================ */

export default function UserLocation() {
  const [state, setState] = useState<LocationState>({ status: "idle" });

  useEffect(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setState({
        status: "error",
        message: "Location is not supported on this device.",
      });
      return;
    }

    const controller = new AbortController();
    setState({ status: "loading" });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const label = await reverseGeocode(
            position.coords.latitude,
            position.coords.longitude,
            controller.signal
          );
          setState({ status: "success", label });
        } catch {
          // Coordinates came through fine even if the address lookup
          // failed — still show something useful instead of an error.
          setState({
            status: "success",
            label: `${position.coords.latitude.toFixed(3)}, ${position.coords.longitude.toFixed(3)}`,
          });
        }
      },
      (error) => {
        const message =
          error.code === error.PERMISSION_DENIED
            ? "Location access denied. Enable it in your browser to see delivery availability near you."
            : "Couldn't detect your location.";
        setState({ status: "error", message });
      },
      // High accuracy asks for GPS-grade coordinates where the device
      // supports it (most phones; laptops fall back to Wi-Fi/IP anyway),
      // which is what makes street-level reverse geocoding possible.
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5 * 60 * 1000 }
    );

    return () => controller.abort();
  }, []);

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <section
      aria-label="Delivery location"
      className="bg-white border-b border-line"
    >
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-3">
        <div
          className="
            flex
            items-start
            gap-3
            border
            border-line
            rounded-lg
            px-4
            py-2.5
          "
        >
          <span
            aria-hidden="true"
            className="
              w-9
              h-9
              rounded-lg
              bg-blue/10
              text-blue
              flex
              items-center
              justify-center
              shrink-0
            "
          >
            {state.status === "loading" ? (
              <LocateFixed size={16} className="animate-pulse" />
            ) : state.status === "error" ? (
              <AlertCircle size={16} />
            ) : (
              <MapPin size={16} />
            )}
          </span>

          <div className="min-w-0">
            <div className="text-[12px] font-bold text-ink leading-tight">
              {state.status === "success" ? "Delivering to" : "Your location"}
            </div>

            <div className="text-[10.5px] text-ink-soft leading-snug mt-0.5">
              {state.status === "loading" && "Detecting your location…"}
              {state.status === "idle" && "Detecting your location…"}
              {state.status === "success" && state.label}
              {state.status === "error" && state.message}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
