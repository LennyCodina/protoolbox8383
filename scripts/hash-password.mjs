import { randomBytes, scryptSync } from "node:crypto";
import { createInterface } from "node:readline";

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 32;

function ask(question) {
  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    readline.question(question, (answer) => {
      readline.close();
      resolve(answer);
    });
  });
}

function askSecret(question) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    return ask(question);
  }

  return new Promise((resolve) => {
    let value = "";
    process.stdout.write(question);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");

    function finish() {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener("data", onData);
      process.stdout.write("\n");
      resolve(value);
    }

    function onData(character) {
      if (character === "\u0003") {
        process.stdout.write("\n");
        process.exit(130);
      }

      if (character === "\r" || character === "\n") {
        finish();
        return;
      }

      if (character === "\u007f" || character === "\b") {
        value = value.slice(0, -1);
        return;
      }

      value += character;
    }

    process.stdin.on("data", onData);
  });
}

if (
  (!process.stdin.isTTY || !process.stdout.isTTY) &&
  (!process.env.AUTH_USERNAME || !process.env.AUTH_PASSWORD)
) {
  console.error(
    "Terminal interactif requis, ou definir AUTH_USERNAME et AUTH_PASSWORD temporairement.",
  );
  process.exit(1);
}

const username = (
  process.env.AUTH_USERNAME || (await ask("Identifiant : "))
).trim();
const password =
  process.env.AUTH_PASSWORD || (await askSecret("Mot de passe (masque) : "));

if (!username || password.length < 12) {
  console.error(
    "Identifiant requis et mot de passe de 12 caracteres minimum.",
  );
  process.exit(1);
}

const salt = randomBytes(16);
const hash = scryptSync(password, salt, KEY_LENGTH, {
  N: SCRYPT_N,
  p: SCRYPT_P,
  r: SCRYPT_R,
});
const passwordHash = [
  "scrypt",
  SCRYPT_N,
  SCRYPT_R,
  SCRYPT_P,
  salt.toString("base64url"),
  hash.toString("base64url"),
].join("$");

console.log("\nEntree a ajouter dans AUTH_USERS_JSON :");
console.log(JSON.stringify({ username, passwordHash }));
