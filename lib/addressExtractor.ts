import type { DeliveryAddress } from "./routeOptimizer";

const frenchAddressLinePattern =
  /\b\d{1,4}\s+(?:bis\s+|ter\s+)?(?:rue|avenue|av\.?|boulevard|bd|route|chemin|impasse|allee|allée|place|cours|quai|passage)\s+[^,\n]+(?:,?\s+\d{5}\s+[A-Za-zÀ-ÿ' -]+)?/gi;

const postalCodeLinePattern = /\b\d{5}\s+[A-Za-zÀ-ÿ' -]{2,}\b/;

function normalizeAddress(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/\s+,/g, ",")
    .trim();
}

export function extractFrenchAddressesFromText(text: string): DeliveryAddress[] {
  const candidates = new Set<string>();
  const lines = text
    .split(/\r?\n/)
    .map(normalizeAddress)
    .filter(Boolean);

  for (const line of lines) {
    const addressMatches = line.match(frenchAddressLinePattern) ?? [];
    for (const match of addressMatches) {
      candidates.add(normalizeAddress(match));
    }

    if (/\d{1,4}/.test(line) && postalCodeLinePattern.test(line)) {
      candidates.add(normalizeAddress(line));
    }
  }

  return [...candidates].slice(0, 20).map((label, index) => ({
    id: `ocr-${index + 1}`,
    label,
    source: "ocr",
  }));
}
