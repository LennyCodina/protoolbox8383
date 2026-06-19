"use client";

import { useEffect, useRef, useState } from "react";

type AddressSuggestion = {
  label: string;
};

type StartAddressAutocompleteProps = {
  value: string;
  onChange: (value: string) => void;
};

export function StartAddressAutocomplete({
  value,
  onChange,
}: StartAddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLLabelElement>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  useEffect(() => {
    const query = value.trim();

    if (query.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsLoading(true);

      try {
        const response = await fetch(
          `/api/geocode/search?q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );
        const payload = (await response.json()) as {
          suggestions?: AddressSuggestion[];
        };

        setSuggestions(payload.suggestions ?? []);
        setIsOpen(Boolean(payload.suggestions?.length));
      } catch {
        if (!controller.signal.aborted) {
          setSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [value]);

  return (
    <label ref={wrapperRef} className="relative mt-5 block">
      <span className="text-sm font-semibold text-ink">Depart</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setIsOpen(Boolean(suggestions.length))}
        placeholder="Adresse entrepot ou entreprise"
        autoComplete="off"
        className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-3 text-sm text-ink shadow-sm placeholder:text-slate-400 focus:border-route"
      />
      {isLoading ? (
        <span className="absolute right-3 top-11 text-xs font-semibold text-slate-500">
          Recherche...
        </span>
      ) : null}
      {isOpen ? (
        <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-md border border-slate-200 bg-white shadow-soft">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.label}
              type="button"
              onClick={() => {
                onChange(suggestion.label);
                setIsOpen(false);
              }}
              className="block w-full border-b border-slate-100 px-3 py-3 text-left text-sm font-medium text-ink last:border-b-0 hover:bg-slatecard"
            >
              {suggestion.label}
            </button>
          ))}
        </div>
      ) : null}
    </label>
  );
}
