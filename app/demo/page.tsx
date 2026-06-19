"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { RouteResult } from "@/components/RouteResult";
import { StartAddressAutocomplete } from "@/components/StartAddressAutocomplete";
import { compressImageForOcr } from "@/lib/clientImageCompression";
import type { DeliveryAddress, OptimizedRoute } from "@/lib/routeOptimizer";

type ExtractResponse = {
  mode: "mock" | "ocr-space";
  addresses: DeliveryAddress[];
  route: DeliveryAddress[];
  startAddress?: DeliveryAddress;
  optimizationStrategy: OptimizedRoute["strategy"];
  mapsUrl: string;
  message: string;
  error?: string;
};

type InputMode = "scan" | "manual";

const START_ADDRESS_STORAGE_KEY = "assistant-livraison-start-address";
const LAST_ROUTE_STORAGE_KEY = "assistant-livraison-last-route";
const LAST_ROUTE_TTL_MS = 48 * 60 * 60 * 1000;

type SavedRoute = {
  savedAt: number;
  result: ExtractResponse;
};

export default function DemoPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [startAddress, setStartAddress] = useState("");
  const [manualAddresses, setManualAddresses] = useState("");
  const [activeMode, setActiveMode] = useState<InputMode>("scan");
  const [result, setResult] = useState<ExtractResponse | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [hasSavedRoute, setHasSavedRoute] = useState(false);
  const manualAddressCount = manualAddresses
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean).length;

  useEffect(() => {
    setStartAddress(localStorage.getItem(START_ADDRESS_STORAGE_KEY) ?? "");
    setHasSavedRoute(Boolean(getSavedRoute()));
  }, []);

  function updateStartAddress(value: string) {
    setStartAddress(value);
    localStorage.setItem(START_ADDRESS_STORAGE_KEY, value);
  }

  async function handleFileAdd(nextFile: File | null) {
    setError("");

    if (!nextFile) {
      return false;
    }

    if (nextFile.type === "application/pdf" && nextFile.size > 1024 * 1024) {
      setError("PDF trop lourd. Prenez une photo du bon ou reduisez le fichier.");
      return false;
    }

    if (!nextFile.type.startsWith("image/")) {
      setFiles((currentFiles) => [...currentFiles, nextFile]);
      return true;
    }

    setIsCompressing(true);
    try {
      const compressedFile = await compressImageForOcr(nextFile);

      if (compressedFile.size > 1024 * 1024) {
        setError("Photo trop lourde. Reprenez une photo plus cadree.");
      }

      setFiles((currentFiles) => [...currentFiles, compressedFile]);
      return true;
    } catch {
      setFiles((currentFiles) => [...currentFiles, nextFile]);
      setError("Photo ajoutee, mais la compression n'a pas fonctionne.");
      return true;
    } finally {
      setIsCompressing(false);
    }
  }

  function removeFile(indexToRemove: number) {
    setFiles((currentFiles) =>
      currentFiles.filter((_, index) => index !== indexToRemove),
    );
  }

  function saveRoute(nextResult: ExtractResponse) {
    const savedRoute: SavedRoute = {
      savedAt: Date.now(),
      result: nextResult,
    };

    localStorage.setItem(LAST_ROUTE_STORAGE_KEY, JSON.stringify(savedRoute));
    setHasSavedRoute(true);
  }

  function getSavedRoute() {
    const savedRoute = localStorage.getItem(LAST_ROUTE_STORAGE_KEY);

    if (!savedRoute) {
      return null;
    }

    try {
      const parsedRoute = JSON.parse(savedRoute) as SavedRoute | ExtractResponse;
      const normalizedRoute =
        "result" in parsedRoute
          ? parsedRoute
          : {
              savedAt: Date.now(),
              result: parsedRoute,
            };

      if (Date.now() - normalizedRoute.savedAt > LAST_ROUTE_TTL_MS) {
        localStorage.removeItem(LAST_ROUTE_STORAGE_KEY);
        return null;
      }

      return normalizedRoute.result;
    } catch {
      localStorage.removeItem(LAST_ROUTE_STORAGE_KEY);
      return null;
    }
  }

  function resumeRoute() {
    const savedRoute = getSavedRoute();

    if (!savedRoute) {
      setHasSavedRoute(false);
      setError("Aucune course recente sur ce telephone.");
      return;
    }

    try {
      setResult(savedRoute);
      setError("");
    } catch {
      setError("Impossible de reprendre la course sauvegardee.");
    }
  }

  async function analyzeDocument(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setError("");
    setResult(null);
    setIsLoading(true);

    try {
      const hasManualAddresses = manualAddresses.trim().length > 0;

      if (!files.length && !hasManualAddresses) {
        throw new Error("Scannez un bon ou saisissez au moins une adresse.");
      }

      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });
      formData.append("startAddress", startAddress);
      formData.append("manualAddresses", manualAddresses);

      const response = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as ExtractResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Analyse impossible.");
      }

      setResult(payload);
      saveRoute(payload);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Une erreur inattendue est survenue.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slatecard">
      <div className="mx-auto max-w-5xl px-4 py-4 sm:px-8">
        <nav className="mb-4 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <Link href="/" className="text-sm font-bold text-ink">
            Assistant Livraison IA
          </Link>
        </nav>

        {!result ? (
          <form onSubmit={analyzeDocument} className="space-y-4">
            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft sm:p-6">
              <h1 className="text-3xl font-bold leading-tight text-ink">
                Preparez votre course
              </h1>

              <StartAddressAutocomplete
                value={startAddress}
                onChange={updateStartAddress}
              />

              <div className="mt-5 grid grid-cols-2 gap-2 rounded-md bg-slatecard p-1">
                <button
                  type="button"
                  onClick={() => setActiveMode("scan")}
                  className={`rounded-md px-4 py-4 text-base font-bold ${
                    activeMode === "scan"
                      ? "bg-white text-route shadow-sm"
                      : "text-slate-600"
                  }`}
                >
                  Scanner
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMode("manual")}
                  className={`rounded-md px-4 py-4 text-base font-bold ${
                    activeMode === "manual"
                      ? "bg-white text-route shadow-sm"
                      : "text-slate-600"
                  }`}
                >
                  Saisir
                </button>
              </div>

              <div className="mt-4">
                {activeMode === "scan" ? (
                  <FileUpload
                    files={files}
                    isCompressing={isCompressing}
                    onFileAdd={handleFileAdd}
                    onFileRemove={removeFile}
                    onDone={() => void analyzeDocument()}
                  />
                ) : (
                  <label className="block">
                    <span className="text-sm font-semibold text-ink">
                      Adresses
                    </span>
                    <textarea
                      value={manualAddresses}
                      onChange={(event) => setManualAddresses(event.target.value)}
                      rows={8}
                      placeholder={"1 Rue Exemple, 75001 Paris\n24 Avenue Test, 92100 Boulogne"}
                      className="mt-2 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-3 text-sm leading-6 text-ink shadow-sm placeholder:text-slate-400 focus:border-route"
                    />
                  </label>
                )}
              </div>

              <div className="mt-4 rounded-md bg-slatecard px-3 py-2 text-sm font-semibold text-slate-700">
                Pris en compte : {files.length} bon{files.length > 1 ? "s" : ""} scanne
                {files.length > 1 ? "s" : ""} et {manualAddressCount} adresse
                {manualAddressCount > 1 ? "s" : ""} saisie
                {manualAddressCount > 1 ? "s" : ""}.
              </div>

              {error ? (
                <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isLoading || isCompressing}
                className="mt-5 w-full rounded-md bg-ink px-5 py-5 text-lg font-bold text-white shadow-soft disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isLoading ? "Preparation de la tournee..." : "Terminer"}
              </button>

              <button
                type="button"
                onClick={resumeRoute}
                disabled={!hasSavedRoute}
                className="mt-3 w-full rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-ink disabled:opacity-40"
              >
                Reprendre la derniere course
              </button>
            </section>
          </form>
        ) : (
          <div className="mt-5 space-y-4">
            <RouteResult
              initialRoute={result.route}
              startAddress={result.startAddress}
              onRouteChange={(route) => {
                const nextResult = { ...result, route };
                setResult(nextResult);
                saveRoute(nextResult);
              }}
            />
            <button
              type="button"
              onClick={() => setResult(null)}
              className="w-full rounded-md border border-slate-300 bg-white px-5 py-4 text-base font-bold text-ink"
            >
              Nouvelle course
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
