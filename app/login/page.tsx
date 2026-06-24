import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slatecard px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-soft sm:p-8">
        <p className="text-sm font-bold uppercase text-route">
          Assistant Livraison IA
        </p>
        <h1 className="mt-3 text-3xl font-bold leading-tight text-ink">
          Connexion
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Utilisez les identifiants fournis par l'administrateur.
        </p>
        <LoginForm />
      </section>
    </main>
  );
}
