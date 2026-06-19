import { NextResponse } from "next/server";
import { extractFrenchAddressesFromText } from "@/lib/addressExtractor";
import { geocodeAddresses } from "@/lib/geocoding";
import { buildGoogleMapsLink } from "@/lib/googleMapsLink";
import {
  DeliveryAddress,
  optimizeRoute,
  parseManualAddresses,
} from "@/lib/routeOptimizer";

const mockAddresses: DeliveryAddress[] = [
  {
    id: "mock-1",
    label: "12 Rue de la Republique, 69002 Lyon",
    source: "mock",
  },
  {
    id: "mock-2",
    label: "8 Avenue Jean Jaures, 69100 Villeurbanne",
    source: "mock",
  },
  {
    id: "mock-3",
    label: "45 Cours Gambetta, 69003 Lyon",
    source: "mock",
  },
  {
    id: "mock-4",
    label: "22 Rue Victor Hugo, 69200 Venissieux",
    source: "mock",
  },
  {
    id: "mock-5",
    label: "3 Place Bellecour, 69002 Lyon",
    source: "mock",
  },
];

type OcrSpaceResponse = {
  ParsedResults?: Array<{
    ParsedText?: string;
  }>;
  IsErroredOnProcessing?: boolean;
  ErrorMessage?: string | string[];
};

async function extractWithOcrSpace(file: File): Promise<DeliveryAddress[]> {
  const apiKey = process.env.OCR_SPACE_API_KEY;

  if (!apiKey) {
    return [];
  }

  const ocrFormData = new FormData();
  ocrFormData.append("apikey", apiKey);
  ocrFormData.append("language", "fre");
  ocrFormData.append("isOverlayRequired", "false");
  ocrFormData.append("scale", "true");
  ocrFormData.append("OCREngine", "2");
  ocrFormData.append("file", file, file.name);

  const response = await fetch("https://api.ocr.space/parse/image", {
    method: "POST",
    body: ocrFormData,
  });

  if (!response.ok) {
    throw new Error("OCR.space n'a pas repondu correctement.");
  }

  const payload = (await response.json()) as OcrSpaceResponse;

  if (payload.IsErroredOnProcessing) {
    const message = Array.isArray(payload.ErrorMessage)
      ? payload.ErrorMessage.join(" ")
      : payload.ErrorMessage;
    throw new Error(message || "OCR.space n'a pas pu traiter le fichier.");
  }

  const parsedText =
    payload.ParsedResults?.map((result) => result.ParsedText ?? "").join("\n") ??
    "";

  return extractFrenchAddressesFromText(parsedText);
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const manualText = String(formData.get("manualAddresses") ?? "");
    const startAddressText = String(formData.get("startAddress") ?? "").trim();
    const legacyFile = formData.get("file");
    const uploadedFiles = formData
      .getAll("files")
      .filter((file): file is File => file instanceof File);
    const files =
      legacyFile instanceof File && !uploadedFiles.length
        ? [legacyFile]
        : uploadedFiles;
    const hasApiKey = Boolean(process.env.OCR_SPACE_API_KEY);

    if (files.length > 12) {
      return NextResponse.json(
        { error: "Limite MVP : 12 documents par analyse." },
        { status: 400 },
      );
    }

    for (const file of files) {
      const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          {
            error:
              "Format non supporte. Importez une image JPG, PNG, WebP ou un PDF.",
          },
          { status: 400 },
        );
      }

      if (hasApiKey && file.size > 1024 * 1024) {
        return NextResponse.json(
          {
            error:
              "Le fichier depasse 1 Mo. Les images sont compressees automatiquement, mais les PDF doivent etre reduits avant import.",
          },
          { status: 400 },
        );
      }
    }

    const manualAddresses = parseManualAddresses(manualText);
    let extractedAddresses: DeliveryAddress[] = [];
    let mode: "mock" | "ocr-space" = "mock";

    if (hasApiKey && files.length) {
      mode = "ocr-space";
      for (const file of files) {
        try {
          const fileAddresses = await extractWithOcrSpace(file);
          extractedAddresses.push(...fileAddresses);
        } catch {
          // Continue with the next document. A bad photo should not block the batch.
        }
      }
    }

    const uniqueExtractedAddresses = Array.from(
      new Map(extractedAddresses.map((address) => [address.label, address])).values(),
    ).map((address, index) => ({
      ...address,
      id: `ocr-${index + 1}`,
    }));

    if (!extractedAddresses.length) {
      extractedAddresses = mockAddresses;
      mode = "mock";
    } else {
      extractedAddresses = uniqueExtractedAddresses;
    }

    const startAddresses = startAddressText
      ? await geocodeAddresses([
          {
            id: "start-address",
            label: startAddressText,
            source: "start",
          },
        ])
      : [];
    const startAddress = startAddresses[0];
    const addresses = await geocodeAddresses([
      ...manualAddresses,
      ...extractedAddresses,
    ]);
    const optimizedRoute = optimizeRoute(addresses, startAddress);
    const mapsUrl = buildGoogleMapsLink(
      startAddress
        ? [startAddress, ...optimizedRoute.addresses]
        : optimizedRoute.addresses,
    );

    return NextResponse.json({
      mode,
      addresses,
      route: optimizedRoute.addresses,
      startAddress: optimizedRoute.startAddress,
      optimizationStrategy: optimizedRoute.strategy,
      mapsUrl,
      message:
        mode === "mock"
          ? "Mode MOCK actif : ajoutez OCR_SPACE_API_KEY dans .env.local pour brancher OCR.space."
          : "OCR.space actif. Si peu d'adresses sortent, prenez une photo plus nette ou ajoutez les adresses manuellement.",
    });
  } catch {
    return NextResponse.json(
      { error: "Impossible d'analyser le document pour le moment." },
      { status: 500 },
    );
  }
}
