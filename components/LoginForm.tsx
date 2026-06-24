"use client";

import { FormEvent, useState } from "react";

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ password, username }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Connexion impossible.");
      }

      const nextPath =
        new URLSearchParams(window.location.search).get("next") || "/";
      window.location.assign(nextPath.startsWith("/") ? nextPath : "/");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Connexion impossible.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-7 space-y-5">
      <label className="block">
        <span className="text-sm font-semibold text-ink">Identifiant</span>
        <input
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
          autoFocus
          required
          className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-3 text-base text-ink shadow-sm focus:border-route"
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-ink">Mot de passe</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
          className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-3 text-base text-ink shadow-sm focus:border-route"
        />
      </label>

      {error ? (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-md bg-ink px-5 py-3 text-base font-bold text-white shadow-soft transition hover:bg-slate-700 disabled:cursor-wait disabled:opacity-60"
      >
        {isLoading ? "Connexion..." : "Se connecter"}
      </button>
    </form>
  );
}
