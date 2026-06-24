import {
  createHash,
  scrypt,
  timingSafeEqual,
} from "node:crypto";

type AuthUser = {
  passwordHash: string;
  username: string;
};

type ScryptHash = {
  hash: Buffer;
  n: number;
  p: number;
  r: number;
  salt: Buffer;
};

function parseUsers() {
  const serializedUsers = process.env.AUTH_USERS_JSON;

  if (!serializedUsers) {
    throw new Error("AUTH_USERS_JSON n'est pas configure.");
  }

  const users = JSON.parse(serializedUsers) as unknown;

  if (
    !Array.isArray(users) ||
    users.length === 0 ||
    users.some(
      (user) =>
        typeof user !== "object" ||
        user === null ||
        typeof (user as AuthUser).username !== "string" ||
        typeof (user as AuthUser).passwordHash !== "string",
    )
  ) {
    throw new Error("AUTH_USERS_JSON est invalide.");
  }

  return users as AuthUser[];
}

function parseScryptHash(value: string): ScryptHash | null {
  const [algorithm, n, r, p, salt, hash, extraPart] = value.split("$");

  if (
    algorithm !== "scrypt" ||
    !n ||
    !r ||
    !p ||
    !salt ||
    !hash ||
    extraPart
  ) {
    return null;
  }

  const parsed = {
    hash: Buffer.from(hash, "base64url"),
    n: Number(n),
    p: Number(p),
    r: Number(r),
    salt: Buffer.from(salt, "base64url"),
  };

  if (
    !Number.isInteger(parsed.n) ||
    !Number.isInteger(parsed.r) ||
    !Number.isInteger(parsed.p) ||
    parsed.n < 2 ||
    parsed.r < 1 ||
    parsed.p < 1 ||
    parsed.salt.length < 16 ||
    parsed.hash.length < 32
  ) {
    return null;
  }

  return parsed;
}

async function verifyPassword(password: string, encodedHash: string) {
  const parsedHash = parseScryptHash(encodedHash);

  if (!parsedHash) {
    return false;
  }

  const derivedKey = await new Promise<Buffer>((resolve, reject) => {
    scrypt(
      password,
      parsedHash.salt,
      parsedHash.hash.length,
      {
        N: parsedHash.n,
        p: parsedHash.p,
        r: parsedHash.r,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      },
    );
  });

  return timingSafeEqual(derivedKey, parsedHash.hash);
}

export async function authenticateUser(username: string, password: string) {
  const normalizedUsername = username.trim().toLocaleLowerCase("fr");
  const user = parseUsers().find(
    (candidate) =>
      candidate.username.trim().toLocaleLowerCase("fr") === normalizedUsername,
  );

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return null;
  }

  return createHash("sha256")
    .update(user.username.trim().toLocaleLowerCase("fr"))
    .digest("base64url");
}
