"use client";

import { useMemo, useState } from "react";
import { buildGoogleMapsLink } from "@/lib/googleMapsLink";
import type { DeliveryAddress } from "@/lib/routeOptimizer";

type RouteResultProps = {
  initialRoute: DeliveryAddress[];
  startAddress?: DeliveryAddress;
  includeReturnToStart?: boolean;
  onRouteChange?: (route: DeliveryAddress[]) => void;
};

function relabelAddressIds(route: DeliveryAddress[]) {
  return route.map((address, index) => ({
    ...address,
    id: address.id || `address-${index + 1}`,
  }));
}

export function RouteResult({
  initialRoute,
  startAddress,
  includeReturnToStart = true,
  onRouteChange,
}: RouteResultProps) {
  const [optimizedRoute] = useState(() => relabelAddressIds(initialRoute));
  const [route, setRoute] = useState(() => optimizedRoute);
  const [copyLabel, setCopyLabel] = useState("Copier");
  const mapsUrl = useMemo(
    () =>
      buildGoogleMapsLink(
        startAddress
          ? [
              startAddress,
              ...route,
              ...(includeReturnToStart ? [startAddress] : []),
            ]
          : route,
      ),
    [route, startAddress, includeReturnToStart],
  );

  function updateRoute(nextRoute: DeliveryAddress[]) {
    setRoute(nextRoute);
    onRouteChange?.(nextRoute);
  }

  function updateAddress(indexToUpdate: number, label: string) {
    updateRoute(
      route.map((address, index) =>
        index === indexToUpdate ? { ...address, label, formattedLabel: label } : address,
      ),
    );
  }

  function moveAddress(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= route.length) {
      return;
    }

    const nextRoute = [...route];
    const [address] = nextRoute.splice(index, 1);
    nextRoute.splice(nextIndex, 0, address);
    updateRoute(nextRoute);
  }

  function removeAddress(indexToRemove: number) {
    updateRoute(route.filter((_, index) => index !== indexToRemove));
  }

  async function copyRoute() {
    const routeText = route
      .map((address, index) => `${index + 1}. ${address.formattedLabel ?? address.label}`)
      .join("\n");
    const startText = startAddress
      ? `Depart: ${startAddress.formattedLabel ?? startAddress.label}\n`
      : "";
    const returnText = startAddress
      ? includeReturnToStart
        ? `\nRetour: ${startAddress.formattedLabel ?? startAddress.label}`
        : ""
      : "";

    await navigator.clipboard.writeText(
      `${startText}${routeText}${returnText}\n\n${mapsUrl}`,
    );
    setCopyLabel("Copie");
    window.setTimeout(() => setCopyLabel("Copier"), 1600);
  }

  if (!route.length) {
    return null;
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-ink">Votre tournee</h2>
          <p className="mt-1 text-sm text-slate-500">
            Modifiez l'ordre ou corrigez une adresse avant d'ouvrir Maps.
          </p>
        </div>
        <button
          type="button"
          onClick={() => updateRoute(optimizedRoute)}
          className="rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-ink"
        >
          Optimiser
        </button>
      </div>

      <ol className="mt-4 space-y-3">
        {startAddress ? (
          <li className="rounded-md border border-blue-200 bg-blue-50 p-3">
            <span className="text-xs font-bold uppercase tracking-wide text-route">
              Depart
            </span>
            <p className="mt-1 text-sm font-semibold text-ink">
              {startAddress.formattedLabel ?? startAddress.label}
            </p>
          </li>
        ) : null}

        {route.map((address, index) => (
          <li key={`${address.id}-${index}`} className="rounded-md bg-slatecard p-3">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-route text-sm font-bold text-white">
                {index + 1}
              </span>
              <textarea
                value={address.formattedLabel ?? address.label}
                onChange={(event) => updateAddress(index, event.target.value)}
                rows={2}
                className="min-h-16 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium leading-6 text-ink"
              />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => moveAddress(index, -1)}
                disabled={index === 0}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-ink disabled:opacity-40"
              >
                Monter
              </button>
              <button
                type="button"
                onClick={() => moveAddress(index, 1)}
                disabled={index === route.length - 1}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-ink disabled:opacity-40"
              >
                Baisser
              </button>
              <button
                type="button"
                onClick={() => removeAddress(index)}
                className="rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-bold text-red-700"
              >
                Retirer
              </button>
            </div>
          </li>
        ))}
        {startAddress ? (
          <li className="rounded-md border border-blue-200 bg-blue-50 p-3">
            <span className="text-xs font-bold uppercase tracking-wide text-route">
              Retour
            </span>
            <p className="mt-1 text-sm font-semibold text-ink">
              {startAddress.formattedLabel ?? startAddress.label}
            </p>
          </li>
        ) : null}
      </ol>

      <div className="sticky bottom-3 mt-5 grid gap-3 rounded-lg border border-slate-200 bg-white/95 p-3 shadow-soft backdrop-blur sm:grid-cols-2">
        <a
          href={mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center rounded-md bg-route px-4 py-4 text-base font-bold text-white"
        >
          Ouvrir Google Maps
        </a>
        <button
          type="button"
          onClick={copyRoute}
          className="rounded-md border border-slate-300 bg-white px-4 py-4 text-base font-bold text-ink"
        >
          {copyLabel}
        </button>
      </div>
    </section>
  );
}
