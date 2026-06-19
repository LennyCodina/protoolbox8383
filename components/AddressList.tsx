import type { DeliveryAddress } from "@/lib/routeOptimizer";

type AddressListProps = {
  title: string;
  addresses: DeliveryAddress[];
  emptyLabel: string;
};

export function AddressList({ title, addresses, emptyLabel }: AddressListProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-bold text-ink">{title}</h2>
      {addresses.length ? (
        <ul className="mt-4 space-y-3">
          {addresses.map((address) => (
            <li key={address.id} className="rounded-md bg-slatecard p-3">
              <p className="text-sm font-medium leading-6 text-ink">
                {address.label}
              </p>
              {address.source ? (
                <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                  Source : {address.source}
                </p>
              ) : null}
              {address.coordinates ? (
                <p className="mt-1 text-xs text-slate-500">
                  GPS : {address.coordinates.latitude.toFixed(5)},{" "}
                  {address.coordinates.longitude.toFixed(5)}
                  {typeof address.score === "number"
                    ? ` - score ${Math.round(address.score * 100)}%`
                    : ""}
                </p>
              ) : (
                <p className="mt-1 text-xs text-amber-700">
                  Coordonnees non trouvees, tri de secours.
                </p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm leading-6 text-slate-500">{emptyLabel}</p>
      )}
    </section>
  );
}
