import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";

const steps = [
  "Prenez une photo ou importez un PDF",
  "L'IA extrait les adresses utiles",
  "La tournée s'ouvre dans Google Maps",
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slatecard">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-5 sm:px-8">
        <nav className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <span className="text-sm font-bold uppercase tracking-wide text-ink">
            Assistant Livraison IA
          </span>
          <div className="flex items-center gap-2">
            <Link
              href="/demo"
              className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Tester
            </Link>
            <LogoutButton />
          </div>
        </nav>

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex rounded-md border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-route">
              MVP mobile pour livreurs et exploitants
            </p>
            <h1 className="text-4xl font-bold leading-tight text-ink sm:text-5xl lg:text-6xl">
              Préparez vos tournées en 30 secondes
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
              Importez vos bons de livraison, l'IA extrait les adresses et
              génère l'ordre de passage.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/demo"
                className="inline-flex items-center justify-center rounded-md bg-route px-6 py-3 text-base font-semibold text-white shadow-soft transition hover:bg-blue-700"
              >
                Tester maintenant
              </Link>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
            <div className="rounded-lg bg-ink p-4 text-white">
              <div className="flex items-center justify-between border-b border-white/15 pb-3">
                <span className="text-sm font-semibold">Tournée du matin</span>
                <span className="rounded-md bg-mint px-2 py-1 text-xs font-bold">
                  Optimisée
                </span>
              </div>
              <ol className="mt-4 space-y-3">
                {[
                  "12 Rue de la République, Lyon",
                  "8 Avenue Jean Jaurès, Villeurbanne",
                  "45 Cours Gambetta, Lyon",
                ].map((address, index) => (
                  <li key={address} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white text-sm font-bold text-ink">
                      {index + 1}
                    </span>
                    <span className="text-sm leading-6 text-slate-100">
                      {address}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        <div
          id="fonctionnement"
          className="grid gap-3 pb-8 sm:grid-cols-3"
          aria-label="Fonctionnement"
        >
          {steps.map((step, index) => (
            <div
              key={step}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
            >
              <span className="text-sm font-bold text-route">
                Étape {index + 1}
              </span>
              <p className="mt-2 text-sm font-medium leading-6 text-ink">
                {step}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
