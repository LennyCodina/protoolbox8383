export type DeliveryAddress = {
  id: string;
  label: string;
  source?: "mock" | "manual" | "ocr" | "start";
  formattedLabel?: string;
  score?: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
};

export type OptimizedRoute = {
  addresses: DeliveryAddress[];
  startAddress?: DeliveryAddress;
  strategy: "nearest-neighbor" | "alphabetical-city";
};

function getCity(address: string) {
  const parts = address.split(",");
  return parts[parts.length - 1]?.trim().toLocaleLowerCase("fr-FR") ?? "";
}

export function optimizeRoute(
  addresses: DeliveryAddress[],
  startAddress?: DeliveryAddress,
): OptimizedRoute {
  const geocodedAddresses = addresses.filter((address) => address.coordinates);
  const ungeocodedAddresses = addresses.filter((address) => !address.coordinates);

  if (geocodedAddresses.length >= 2) {
    const orderedAddresses = optimizeByNearestNeighbor(
      geocodedAddresses,
      startAddress,
    );

    return {
      addresses: [...orderedAddresses, ...sortAlphabetically(ungeocodedAddresses)],
      startAddress,
      strategy: "nearest-neighbor",
    };
  }

  return {
    addresses: sortAlphabetically(addresses),
    startAddress,
    strategy: "alphabetical-city",
  };
}

function sortAlphabetically(addresses: DeliveryAddress[]) {
  const sortedAddresses = [...addresses].sort((first, second) => {
    const firstCity = getCity(first.label);
    const secondCity = getCity(second.label);

    if (firstCity !== secondCity) {
      return firstCity.localeCompare(secondCity, "fr");
    }

    return first.label.localeCompare(second.label, "fr", {
      numeric: true,
      sensitivity: "base",
    });
  });

  return sortedAddresses;
}

function getDistanceMeters(first: DeliveryAddress, second: DeliveryAddress) {
  if (!first.coordinates || !second.coordinates) {
    return Number.POSITIVE_INFINITY;
  }

  const earthRadiusMeters = 6371000;
  const firstLatitude = toRadians(first.coordinates.latitude);
  const secondLatitude = toRadians(second.coordinates.latitude);
  const latitudeDelta = toRadians(
    second.coordinates.latitude - first.coordinates.latitude,
  );
  const longitudeDelta = toRadians(
    second.coordinates.longitude - first.coordinates.longitude,
  );
  const haversine =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2);

  return (
    earthRadiusMeters *
    2 *
    Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  );
}

function optimizeByNearestNeighbor(
  addresses: DeliveryAddress[],
  startAddress?: DeliveryAddress,
) {
  const remaining = [...addresses];
  const route: DeliveryAddress[] = [];
  let currentAddress: DeliveryAddress;

  if (startAddress?.coordinates) {
    currentAddress = startAddress;
  } else {
    const firstAddress = remaining.shift();

    if (!firstAddress) {
      return route;
    }

    route.push(firstAddress);
    currentAddress = firstAddress;
  }

  while (remaining.length) {
    let nearestIndex = 0;
    let nearestDistance = getDistanceMeters(currentAddress, remaining[0]);

    for (let index = 1; index < remaining.length; index += 1) {
      const distance = getDistanceMeters(currentAddress, remaining[index]);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    }

    const [nearestAddress] = remaining.splice(nearestIndex, 1);
    route.push(nearestAddress);
    currentAddress = nearestAddress;
  }

  return route;
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function parseManualAddresses(input: string): DeliveryAddress[] {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((label, index) => ({
      id: `manual-${index + 1}`,
      label,
      source: "manual" as const,
    }));
}
