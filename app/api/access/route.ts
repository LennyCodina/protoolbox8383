import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Cette route a ete remplacee par la connexion utilisateur." },
    { status: 410 },
  );
}
