import { NextResponse } from "next/server";

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < 3) {
    return NextResponse.json({ suggestions: [] });
  }

  const url = new URL("https://data.geopf.fr/geocodage/search");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "5");

  const response = await fetch(url, {
    headers: {
      accept: "application/json",
    },
  });

  if (!response.ok) {
    return NextResponse.json({ suggestions: [] });
  }

  const payload = (await response.json()) as GeoPfSearchResponse;
  const suggestions =
    payload.features?.map((feature) => ({
      label: feature.properties?.label ?? "",
      score: feature.properties?.score,
      coordinates: feature.geometry?.coordinates
        ? {
            longitude: feature.geometry.coordinates[0],
            latitude: feature.geometry.coordinates[1],
          }
        : undefined,
    })) ?? [];

  return NextResponse.json({
    suggestions: suggestions.filter((suggestion) => suggestion.label),
  });
}
