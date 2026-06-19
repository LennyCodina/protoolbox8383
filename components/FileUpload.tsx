"use client";

import { useRef, useState } from "react";

type FileUploadProps = {
  files: File[];
  isCompressing?: boolean;
  onFileAdd: (file: File | null) => Promise<boolean>;
  onFileRemove: (index: number) => void;
  onDone: () => void;
};

export function FileUpload({
  files,
  isCompressing = false,
  onFileAdd,
  onFileRemove,
  onDone,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showContinueDialog, setShowContinueDialog] = useState(false);

  function openCamera() {
    inputRef.current?.click();
  }

  async function handleInputChange(file: File | null) {
    const wasAdded = await onFileAdd(file);

    if (wasAdded) {
      setShowContinueDialog(true);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        capture="environment"
        className="sr-only"
        onChange={(event) => {
          void handleInputChange(event.target.files?.[0] ?? null);
          event.currentTarget.value = "";
        }}
      />

      <button
        type="button"
        onClick={openCamera}
        disabled={isCompressing}
        className="w-full rounded-md bg-route px-5 py-5 text-lg font-bold text-white shadow-soft transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isCompressing ? "Preparation..." : "Scanner un bon"}
      </button>

      {files.length ? (
        <div className="mt-4">
          <div className="rounded-md bg-green-50 px-3 py-2 text-sm font-semibold text-mint">
            {files.length} bon{files.length > 1 ? "s" : ""} ajoute
            {files.length > 1 ? "s" : ""}
          </div>
          <ul className="mt-3 space-y-2">
            {files.map((file, index) => (
              <li
                key={`${file.name}-${file.lastModified}-${index}`}
                className="flex items-center justify-between gap-3 rounded-md bg-slatecard px-3 py-2 text-sm text-slate-700"
              >
                <span className="font-semibold text-ink">Bon {index + 1}</span>
                <button
                  type="button"
                  onClick={() => onFileRemove(index)}
                  className="shrink-0 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-ink"
                >
                  Retirer
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {showContinueDialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-soft">
            <h2 className="text-2xl font-bold text-ink">Bon ajoute</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Vous pouvez scanner un autre bon ou terminer la saisie.
            </p>
            <div className="mt-5 grid gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowContinueDialog(false);
                  window.setTimeout(openCamera, 120);
                }}
                className="rounded-md bg-route px-5 py-4 text-base font-bold text-white"
              >
                Continuer
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowContinueDialog(false);
                  onDone();
                }}
                className="rounded-md border border-slate-300 bg-white px-5 py-4 text-base font-bold text-ink"
              >
                Fini
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
