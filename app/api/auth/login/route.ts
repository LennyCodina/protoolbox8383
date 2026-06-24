import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth/users";
import { createSessionToken, sessionCookie } from "@/lib/auth/session";

const attempts = new Map<string, { count: number; resetAt: number }>();
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

function getClientKey(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

function isRateLimited(clientKey: string) {
  const now = Date.now();
  const current = attempts.get(clientKey);

  if (!current || current.resetAt <= now) {
    attempts.set(clientKey, { count: 0, resetAt: now + ATTEMPT_WINDOW_MS });
    return false;
  }

  return current.count >= MAX_ATTEMPTS;
}

function recordFailure(clientKey: string) {
  const current = attempts.get(clientKey);
  const now = Date.now();

  if (!current || current.resetAt <= now) {
    attempts.set(clientKey, { count: 1, resetAt: now + ATTEMPT_WINDOW_MS });
    return;
  }

  current.count += 1;
}

export async function POST(request: Request) {
  const clientKey = getClientKey(request);

  if (isRateLimited(clientKey)) {
    return NextResponse.json(
      { error: "Trop de tentatives. Reessayez dans quelques minutes." },
      { status: 429 },
    );
  }

  const payload = (await request.json().catch(() => ({}))) as {
    password?: unknown;
    username?: unknown;
  };
  const username = typeof payload.username === "string" ? payload.username : "";
  const password = typeof payload.password === "string" ? payload.password : "";

  if (!username || !password || username.length > 100 || password.length > 500) {
    recordFailure(clientKey);
    return NextResponse.json(
      { error: "Identifiants invalides." },
      { status: 401 },
    );
  }

  try {
    const subject = await authenticateUser(username, password);

    if (!subject) {
      recordFailure(clientKey);
      await new Promise((resolve) => setTimeout(resolve, 350));
      return NextResponse.json(
        { error: "Identifiants invalides." },
        { status: 401 },
      );
    }

    attempts.delete(clientKey);
    const token = await createSessionToken(subject);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(sessionCookie.name, token, sessionCookie.options);

    return response;
  } catch (error) {
    console.error(
      "Configuration d'authentification invalide:",
      error instanceof Error ? error.message : "erreur inconnue",
    );
    return NextResponse.json(
      { error: "Connexion temporairement indisponible." },
      { status: 503 },
    );
  }
}
