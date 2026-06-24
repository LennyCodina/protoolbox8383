export function LogoutButton() {
  return (
    <form action="/api/auth/logout" method="post">
      <button
        type="submit"
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-ink transition hover:border-slate-400"
      >
        Deconnexion
      </button>
    </form>
  );
}
