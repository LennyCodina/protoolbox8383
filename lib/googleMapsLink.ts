import type { DeliveryAddress } from "./routeOptimizer";

const GOOGLE_MAPS_DIRECTIONS_URL = "https://www.google.com/maps/dir";

export function buildGoogleMapsLink(addresses: DeliveryAddress[]) {
  const path = addresses
    .map((address) => {
      if (address.coordinates) {
        return `${address.coordinates.latitude},${address.coordinates.longitude}`;
      }

      return encodeURIComponent(address.formattedLabel ?? address.label);
    })
    .join("/");

  return path ? `${GOOGLE_MAPS_DIRECTIONS_URL}/${path}` : GOOGLE_MAPS_DIRECTIONS_URL;
}
