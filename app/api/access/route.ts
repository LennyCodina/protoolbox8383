import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const expectedAccessCode = process.env.DEMO_ACCESS_CODE;
  const payload = (await request.json().catch(() => ({}))) as {
    demoAccessCode?: string;
  };
  const submittedAccessCode = String(payload.demoAccessCode ?? "").trim();

  if (!expectedAccessCode) {
    return NextResponse.json({ ok: true });
  }

  if (submittedAccessCode !== expectedAccessCode.trim()) {
    return NextResponse.json(
      { error: "Code d'acces invalide." },
      { status: 401 },
    );
  }

  return NextResponse.json({ ok: true });
}
