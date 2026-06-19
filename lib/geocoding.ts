import type { DeliveryAddress } from "./routeOptimizer";

type GeoPfFeature = {
  geometry?: {
    coordinates?: [number, number];
  };
  properties?: {
    label?: string;
    score?: number;
  };
};

type GeoPfSearchResponse = {
  features?: GeoPfFeature[];
};

export async function geocodeAddress(
  address: DeliveryAddress,
): Promise<DeliveryAddress> {
  const url = new URL("https://data.geopf.fr/geocodage/search");
  url.searchParams.set("q", address.label);
  url.searchParams.set("limit", "1");

  const response = await fetch(url, {
    headers: {
      accept: "application/json",
    },
  });

  if (!response.ok) {
    return address;
  }

  const payload = (await response.json()) as GeoPfSearchResponse;
  const feature = payload.features?.[0];
  const coordinates = feature?.geometry?.coordinates;

  if (!coordinates) {
    return address;
  }

  return {
    ...address,
    formattedLabel: feature.properties?.label ?? address.label,
    score: feature.properties?.score,
    coordinates: {
      longitude: coordinates[0],
      latitude: coordinates[1],
    },
  };
}

export async function geocodeAddresses(
  addresses: DeliveryAddress[],
): Promise<DeliveryAddress[]> {
  const geocodedAddresses: DeliveryAddress[] = [];

  for (const address of addresses) {
    geocodedAddresses.push(await geocodeAddress(address));
  }

  return geocodedAddresses;
}
